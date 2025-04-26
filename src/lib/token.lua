-- Initialize state
local properties = {}
local shares = {}
local transactions = {}

-- Token configuration
local name = "Land Token"
local ticker = "LAND"
local denomination = 6

-- Create tables
local sqlite3 = require('lsqlite3')
local db = sqlite3.open_memory()

db:exec[[
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    description TEXT,
    price REAL,
    total_shares INTEGER,
    available_shares INTEGER,
    image_url TEXT,
    owner TEXT
  );

  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    owner TEXT,
    quantity INTEGER,
    purchase_date TEXT,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    buyer TEXT,
    seller TEXT,
    quantity INTEGER,
    price_per_share REAL,
    timestamp TEXT,
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );
]]

-- List property
Handlers.add(
  "list-property",
  { Action = "ListProperty" },
  function(msg)
    local stmt = db:prepare[[
      INSERT INTO properties 
      (id, name, location, description, price, total_shares, available_shares, image_url, owner)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]]
    
    stmt:bind_values(
      msg.Tags.id,
      msg.Tags.name,
      msg.Tags.location,
      msg.Tags.description,
      tonumber(msg.Tags.price),
      tonumber(msg.Tags.total_shares),
      tonumber(msg.Tags.total_shares),
      msg.Tags.image_url,
      msg.From
    )
    
    stmt:step()
    stmt:finalize()
    
    msg.reply({
      Data = "Property listed successfully",
      Tags = { Status = "Success" }
    })
  end
)

-- Purchase shares
Handlers.add(
  "purchase-shares",
  { Action = "PurchaseShares" },
  function(msg)
    local property_id = msg.Tags.PropertyId
    local quantity = tonumber(msg.Tags.Quantity)
    
    -- Get property details
    local stmt = db:prepare"SELECT available_shares, price FROM properties WHERE id = ?"
    stmt:bind_values(property_id)
    local row = stmt:first_row()
    
    if not row or row[1] < quantity then
      msg.reply({
        Data = "Insufficient shares available",
        Tags = { Status = "Error" }
      })
      return
    end
    
    -- Update available shares
    stmt = db:prepare"UPDATE properties SET available_shares = available_shares - ? WHERE id = ?"
    stmt:bind_values(quantity, property_id)
    stmt:step()
    
    -- Record share purchase
    local share_id = ao.id .. "-" .. os.time()
    stmt = db:prepare[[
      INSERT INTO shares (id, property_id, owner, quantity, purchase_date)
      VALUES (?, ?, ?, ?, ?)
    ]]
    stmt:bind_values(share_id, property_id, msg.From, quantity, os.date())
    stmt:step()
    
    -- Record transaction
    local tx_id = ao.id .. "-tx-" .. os.time()
    stmt = db:prepare[[
      INSERT INTO transactions 
      (id, property_id, buyer, seller, quantity, price_per_share, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    ]]
    stmt:bind_values(
      tx_id,
      property_id,
      msg.From,
      nil,
      quantity,
      row[2],
      os.date()
    )
    stmt:step()
    
    msg.reply({
      Data = "Shares purchased successfully",
      Tags = { 
        Status = "Success",
        ShareId = share_id,
        TransactionId = tx_id
      }
    })
  end
)

-- Get property details
Handlers.add(
  "get-property",
  { Action = "GetProperty" },
  function(msg)
    local stmt = db:prepare"SELECT * FROM properties WHERE id = ?"
    stmt:bind_values(msg.Tags.PropertyId)
    local row = stmt:first_row()
    
    if row then
      msg.reply({
        Data = json.encode({
          id = row[1],
          name = row[2],
          location = row[3],
          description = row[4],
          price = row[5],
          total_shares = row[6],
          available_shares = row[7],
          image_url = row[8],
          owner = row[9]
        }),
        Tags = { Status = "Success" }
      })
    else
      msg.reply({
        Data = "Property not found",
        Tags = { Status = "Error" }
      })
    end
  end
)

-- Get all properties
Handlers.add(
  "get-properties",
  { Action = "GetProperties" },
  function(msg)
    local properties = {}
    local stmt = db:prepare"SELECT * FROM properties"
    
    for row in stmt:nrows() do
      table.insert(properties, {
        id = row.id,
        name = row.name,
        location = row.location,
        description = row.description,
        price = row.price,
        total_shares = row.total_shares,
        available_shares = row.available_shares,
        image_url = row.image_url,
        owner = row.owner
      })
    end
    
    msg.reply({
      Data = json.encode(properties),
      Tags = { Status = "Success" }
    })
  end
)

-- Get user's shares
Handlers.add(
  "get-user-shares",
  { Action = "GetUserShares" },
  function(msg)
    local shares = {}
    local stmt = db:prepare[[
      SELECT s.*, p.* FROM shares s
      JOIN properties p ON s.property_id = p.id
      WHERE s.owner = ?
    ]]
    stmt:bind_values(msg.From)
    
    for row in stmt:nrows() do
      table.insert(shares, {
        share_id = row.id,
        property_id = row.property_id,
        quantity = row.quantity,
        purchase_date = row.purchase_date,
        property = {
          name = row.name,
          location = row.location,
          price = row.price,
          total_shares = row.total_shares
        }
      })
    end
    
    msg.reply({
      Data = json.encode(shares),
      Tags = { Status = "Success" }
    })
  end
)