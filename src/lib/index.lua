-- Initialize state tables
local properties = {}
local shares = {}
local users = {}
local transactions = {}
local dividends = {}
local votes = {}

-- SQLite setup for persistent storage
local sqlite3 = require('lsqlite3')
local db = sqlite3.open_memory()

-- Create necessary tables
db:exec[[
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    value REAL,
    total_shares INTEGER,
    available_shares INTEGER,
    maintenance_cost REAL
  );

  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    owner_id TEXT,
    quantity INTEGER,
    purchase_price REAL,
    purchase_date TEXT,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    wallet_address TEXT,
    total_investment REAL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    seller_id TEXT,
    buyer_id TEXT,
    shares_quantity INTEGER,
    price_per_share REAL,
    timestamp TEXT,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );
]]

-- Message handlers
Handlers.add(
  "list-property",
  { Action = "ListProperty" },
  function(msg)
    local property = {
      id = msg.Tags.id,
      name = msg.Tags.name,
      location = msg.Tags.location,
      value = tonumber(msg.Tags.value),
      total_shares = tonumber(msg.Tags.total_shares),
      available_shares = tonumber(msg.Tags.total_shares),
      maintenance_cost = tonumber(msg.Tags.maintenance_cost)
    }
    
    local stmt = db:prepare([[INSERT INTO properties VALUES (?,?,?,?,?,?,?)]]) 
    stmt:bind_values(property.id, property.name, property.location, property.value,
                    property.total_shares, property.available_shares, property.maintenance_cost)
    stmt:step()
    stmt:finalize()
    
    msg.reply({ Data = "Property listed successfully", Tags = { Status = "Success" }})
  end
)

Handlers.add(
  "buy-shares",
  { Action = "BuyShares" },
  function(msg)
    local property_id = msg.Tags.property_id
    local quantity = tonumber(msg.Tags.quantity)
    local buyer_id = msg.From
    
    -- Check available shares
    local stmt = db:prepare([[SELECT available_shares FROM properties WHERE id = ?]])
    stmt:bind_values(property_id)
    local row = stmt:first_row()
    
    if not row or row[1] < quantity then
      msg.reply({ Data = "Insufficient shares available", Tags = { Status = "Error" }})
      return
    end
    
    -- Update available shares
    local new_available = row[1] - quantity
    stmt = db:prepare([[UPDATE properties SET available_shares = ? WHERE id = ?]])
    stmt:bind_values(new_available, property_id)
    stmt:step()
    
    -- Record share purchase
    local share_id = ao.id .. "-" .. os.time()
    stmt = db:prepare([[INSERT INTO shares VALUES (?,?,?,?,?,?)]]) 
    stmt:bind_values(share_id, property_id, buyer_id, quantity, msg.Tags.price_per_share, os.date())
    stmt:step()
    
    msg.reply({ Data = "Shares purchased successfully", Tags = { Status = "Success" }})
  end
)

Handlers.add(
  "get-property",
  { Action = "GetProperty" },
  function(msg)
    local stmt = db:prepare([[SELECT * FROM properties WHERE id = ?]])
    stmt:bind_values(msg.Tags.property_id)
    local row = stmt:first_row()
    
    if row then
      msg.reply({
        Data = json.encode({
          id = row[1],
          name = row[2],
          location = row[3],
          value = row[4],
          total_shares = row[5],
          available_shares = row[6],
          maintenance_cost = row[7]
        }),
        Tags = { Status = "Success" }
      })
    else
      msg.reply({ Data = "Property not found", Tags = { Status = "Error" }})
    end
  end
)

Handlers.add(
  "get-user-shares",
  { Action = "GetUserShares" },
  function(msg)
    local stmt = db:prepare([[SELECT * FROM shares WHERE owner_id = ?]])
    stmt:bind_values(msg.From)
    
    local shares = {}
    for row in stmt:nrows() do
      table.insert(shares, {
        id = row.id,
        property_id = row.property_id,
        quantity = row.quantity,
        purchase_price = row.purchase_price,
        purchase_date = row.purchase_date
      })
    end
    
    msg.reply({
      Data = json.encode(shares),
      Tags = { Status = "Success" }
    })
  end
)

Handlers.add(
  "create-vote",
  { Action = "CreateVote" },
  function(msg)
    local vote = {
      id = ao.id .. "-" .. os.time(),
      property_id = msg.Tags.property_id,
      title = msg.Tags.title,
      description = msg.Tags.description,
      deadline = msg.Tags.deadline,
      options = msg.Tags.options,
      votes = {}
    }
    
    votes[vote.id] = vote
    msg.reply({
      Data = json.encode(vote),
      Tags = { Status = "Success" }
    })
  end
)

Handlers.add(
  "cast-vote",
  { Action = "CastVote" },
  function(msg)
    local vote_id = msg.Tags.vote_id
    local vote = votes[vote_id]
    
    if not vote then
      msg.reply({ Data = "Vote not found", Tags = { Status = "Error" }})
      return
    end
    
    -- Check if user owns shares in the property
    local stmt = db:prepare([[SELECT SUM(quantity) FROM shares WHERE owner_id = ? AND property_id = ?]])
    stmt:bind_values(msg.From, vote.property_id)
    local row = stmt:first_row()
    
    if not row or row[1] == 0 then
      msg.reply({ Data = "No shares owned in this property", Tags = { Status = "Error" }})
      return
    end
    
    -- Record vote weighted by shares owned
    vote.votes[msg.From] = {
      option = msg.Tags.option,
      weight = row[1]
    }
    
    msg.reply({ Data = "Vote cast successfully", Tags = { Status = "Success" }})
  end
)

Handlers.add(
  "distribute-dividends",
  { Action = "DistributeDividends" },
  function(msg)
    local property_id = msg.Tags.property_id
    local amount = tonumber(msg.Tags.amount)
    
    -- Get all shareholders
    local stmt = db:prepare([[SELECT owner_id, quantity FROM shares WHERE property_id = ?]])
    stmt:bind_values(property_id)
    
    local total_shares = 0
    local shareholders = {}
    
    for row in stmt:nrows() do
      total_shares = total_shares + row.quantity
      shareholders[row.owner_id] = row.quantity
    end
    
    -- Distribute dividends proportionally
    for owner_id, shares in pairs(shareholders) do
      local dividend = (shares / total_shares) * amount
      ao.send({
        Target = owner_id,
        Tags = {
          Action = "DividendPayment",
          Amount = tostring(dividend),
          PropertyId = property_id
        }
      })
    end
    
    msg.reply({ Data = "Dividends distributed successfully", Tags = { Status = "Success" }})
  end
)