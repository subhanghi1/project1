-- Initialize state
local balances = {}
local properties = {}
local transactions = {}

-- Token configuration
local name = "Land Token"
local ticker = "LAND"
local denomination = 6

-- Property token management
Handlers.add(
  "create-property-token",
  { Action = "CreatePropertyToken" },
  function(msg)
    assert(type(msg.Tags.property_id) == 'string', 'Property ID required')
    assert(type(msg.Tags.total_shares) == 'string', 'Total shares required')
    assert(type(msg.Tags.price_per_share) == 'string', 'Price per share required')
    
    local property = {
      id = msg.Tags.property_id,
      owner = msg.From,
      total_shares = tonumber(msg.Tags.total_shares),
      price_per_share = tonumber(msg.Tags.price_per_share),
      available_shares = tonumber(msg.Tags.total_shares),
      details = {
        location = msg.Tags.location,
        area = msg.Tags.area,
        description = msg.Tags.description
      }
    }
    
    properties[property.id] = property
    balances[property.id] = {}
    balances[property.id][msg.From] = property.total_shares
    
    msg.reply({
      Data = "Property token created successfully",
      Tags = {
        Status = "Success",
        PropertyId = property.id
      }
    })
  end
)

-- Buy property shares
Handlers.add(
  "buy-shares",
  { Action = "BuyShares" },
  function(msg)
    local property_id = msg.Tags.property_id
    local quantity = tonumber(msg.Tags.quantity)
    local property = properties[property_id]
    
    assert(property, 'Property not found')
    assert(quantity <= property.available_shares, 'Insufficient shares available')
    
    -- Calculate cost
    local total_cost = quantity * property.price_per_share
    
    -- Update balances
    if not balances[property_id][msg.From] then
      balances[property_id][msg.From] = 0
    end
    
    balances[property_id][msg.From] = balances[property_id][msg.From] + quantity
    property.available_shares = property.available_shares - quantity
    
    -- Record transaction
    local tx = {
      id = ao.id .. '-' .. os.time(),
      property_id = property_id,
      buyer = msg.From,
      quantity = quantity,
      price_per_share = property.price_per_share,
      total_cost = total_cost,
      timestamp = os.time()
    }
    table.insert(transactions, tx)
    
    msg.reply({
      Data = "Shares purchased successfully",
      Tags = {
        Status = "Success",
        TransactionId = tx.id
      }
    })
  end
)

-- Transfer shares
Handlers.add(
  "transfer-shares",
  { Action = "TransferShares" },
  function(msg)
    local property_id = msg.Tags.property_id
    local to = msg.Tags.to
    local quantity = tonumber(msg.Tags.quantity)
    
    assert(balances[property_id], 'Property not found')
    assert(balances[property_id][msg.From] >= quantity, 'Insufficient shares')
    
    -- Update balances
    if not balances[property_id][to] then
      balances[property_id][to] = 0
    end
    
    balances[property_id][msg.From] = balances[property_id][msg.From] - quantity
    balances[property_id][to] = balances[property_id][to] + quantity
    
    msg.reply({
      Data = "Shares transferred successfully",
      Tags = { Status = "Success" }
    })
  end
)

-- Get property details
Handlers.add(
  "get-property",
  { Action = "GetProperty" },
  function(msg)
    local property = properties[msg.Tags.property_id]
    
    if property then
      msg.reply({
        Data = json.encode(property),
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

-- Get user's shares
Handlers.add(
  "get-user-shares",
  { Action = "GetUserShares" },
  function(msg)
    local user_shares = {}
    
    for property_id, property_balances in pairs(balances) do
      if property_balances[msg.From] and property_balances[msg.From] > 0 then
        table.insert(user_shares, {
          property_id = property_id,
          shares = property_balances[msg.From],
          property_details = properties[property_id]
        })
      end
    end
    
    msg.reply({
      Data = json.encode(user_shares),
      Tags = { Status = "Success" }
    })
  end
)

-- Distribute dividends
Handlers.add(
  "distribute-dividends",
  { Action = "DistributeDividends" },
  function(msg)
    local property_id = msg.Tags.property_id
    local amount = tonumber(msg.Tags.amount)
    local property = properties[property_id]
    
    assert(property, 'Property not found')
    assert(msg.From == property.owner, 'Only property owner can distribute dividends')
    
    -- Calculate total shares
    local total_shares = property.total_shares
    
    -- Distribute to shareholders
    for holder, shares in pairs(balances[property_id]) do
      if shares > 0 then
        local dividend = (shares / total_shares) * amount
        ao.send({
          Target = holder,
          Tags = {
            Action = "DividendPayment",
            Amount = tostring(dividend),
            PropertyId = property_id
          }
        })
      end
    end
    
    msg.reply({
      Data = "Dividends distributed successfully",
      Tags = { Status = "Success" }
    })
  end
)