-- Kunlun Dashboard Script
-- Real-time data synchronization for Kunlun Dashboard
-- Compatible with multiple games

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Configuration
local KUNLUN_SETTINGS = getgenv().Kunlun_Settings or {}
local DASHBOARD_KEY = KUNLUN_SETTINGS.dashboard_key
local DASHBOARD_API_URL = "https://getkunlun.me/api/dashboard/update"
local UPDATE_INTERVAL = 5 -- seconds

-- Validate configuration
if not DASHBOARD_KEY then
    warn("❌ Kunlun Dashboard: Dashboard Key not found in Kunlun_Settings")
    return
end

-- Game-specific data extraction functions
local GameData = {}

-- Blockspin data extraction
GameData.Blockspin = function()
    local accounts = {}
    local stats = {
        totalPocketMoney = 0,
        totalATMMoney = 0,
        totalMoney = 0,
        totalSessionProfit = 0,
        activeAccounts = 0,
        totalAccounts = 0,
        avgLevel = 0,
        connectedAPIs = 0
    }
    
    -- Get player data
    local player = LocalPlayer
    if player then
        local accountId = tostring(player.UserId)
        local level = player.Level or 0
        local pocketMoney = player.Money or 0
        local atmMoney = player.ATMMoney or 0
        local totalMoney = pocketMoney + atmMoney
        
        accounts[accountId] = {
            id = accountId,
            username = player.Name,
            displayName = player.DisplayName,
            level = level,
            pocketMoney = pocketMoney,
            atmMoney = atmMoney,
            totalMoney = totalMoney,
            sessionProfit = 0, -- Calculate based on initial money
            status = "online",
            lastUpdate = os.time(),
            gameName = "Blockspin",
            -- Job levels
            swiperLevel = player.SwiperLevel or 0,
            shelfStockerLevel = player.ShelfStockerLevel or 0,
            janitorLevel = player.JanitorLevel or 0,
            fishingLevel = player.FishingLevel or 0,
            plantFarmingLevel = player.PlantFarmingLevel or 0,
            steakLevel = player.SteakLevel or 0,
            -- Items (empty for now, can be extended)
            melee = {},
            sword = {},
            gun = {},
            fruit = {},
            accessory = {}
        }
        
        -- Update stats
        stats.totalPocketMoney = pocketMoney
        stats.totalATMMoney = atmMoney
        stats.totalMoney = totalMoney
        stats.activeAccounts = 1
        stats.totalAccounts = 1
        stats.avgLevel = level
        stats.connectedAPIs = 1
    end
    
    return accounts, stats
end

-- Blox Fruits data extraction
GameData.Bloxfruit = function()
    local accounts = {}
    local stats = {
        totalPocketMoney = 0,
        totalATMMoney = 0,
        totalMoney = 0,
        totalSessionProfit = 0,
        activeAccounts = 0,
        totalAccounts = 0,
        avgLevel = 0,
        connectedAPIs = 0
    }
    
    local player = LocalPlayer
    if player then
        local accountId = tostring(player.UserId)
        local level = player.Data and player.Data.Level and player.Data.Level.Value or 0
        local bounty = player.Data and player.Data.Bounty and player.Data.Bounty.Value or 0
        local money = player.Data and player.Data.Beli and player.Data.Beli.Value or 0
        local fragments = player.Data and player.Data.Fragments and player.Data.Fragments.Value or 0
        
        -- Get inventory items
        local inventory = player.Backpack or player.Character and player.Character:FindFirstChild("Backpack")
        local melee = {}
        local sword = {}
        local gun = {}
        local fruit = {}
        local accessory = {}
        
        if inventory then
            for _, item in pairs(inventory:GetChildren()) do
                if item:IsA("Tool") then
                    local itemData = {
                        name = item.Name,
                        image = "", -- Could be fetched from Roblox API
                        rarity = "Common"
                    }
                    
                    -- Categorize items (simplified)
                    if string.find(item.Name:lower(), "sword") or string.find(item.Name:lower(), "blade") then
                        table.insert(sword, itemData)
                    elseif string.find(item.Name:lower(), "gun") or string.find(item.Name:lower(), "pistol") then
                        table.insert(gun, itemData)
                    elseif string.find(item.Name:lower(), "fruit") then
                        table.insert(fruit, itemData)
                    else
                        table.insert(melee, itemData)
                    end
                end
            end
        end
        
        accounts[accountId] = {
            id = accountId,
            username = player.Name,
            displayName = player.DisplayName,
            level = level,
            bounty = bounty,
            bountyFormatted = tostring(bounty),
            money = money,
            fragments = fragments,
            totalMoney = money,
            sessionProfit = 0,
            status = "online",
            lastUpdate = os.time(),
            gameName = "Bloxfruit",
            race = "Human", -- Could be detected
            world = "First Sea", -- Could be detected
            melee = melee,
            sword = sword,
            gun = gun,
            fruit = fruit,
            accessory = accessory
        }
        
        -- Update stats
        stats.totalMoney = money
        stats.activeAccounts = 1
        stats.totalAccounts = 1
        stats.avgLevel = level
        stats.connectedAPIs = 1
    end
    
    return accounts, stats
end

-- Pet Simulator 99 data extraction
GameData.PetSimulator99 = function()
    local accounts = {}
    local stats = {
        totalPocketMoney = 0,
        totalATMMoney = 0,
        totalMoney = 0,
        totalSessionProfit = 0,
        activeAccounts = 0,
        totalAccounts = 0,
        avgLevel = 0,
        connectedAPIs = 0
    }
    
    local player = LocalPlayer
    if player then
        local accountId = tostring(player.UserId)
        local leaderstats = player:FindFirstChild("leaderstats")
        
        local diamonds = 0
        local coins = 0
        local level = 1
        
        if leaderstats then
            for _, stat in pairs(leaderstats:GetChildren()) do
                if stat.Name == "💎 Diamonds" or stat.Name == "Diamonds" then
                    diamonds = stat.Value or 0
                elseif stat.Name == "🪙 Coins" or stat.Name == "Coins" then
                    coins = stat.Value or 0
                end
            end
        end
        
        -- Try to get level from various sources
        local levelStat = player:FindFirstChild("Level") or player:FindFirstChild("PlayerLevel")
        if levelStat then
            level = levelStat.Value or 1
        end
        
        accounts[accountId] = {
            id = accountId,
            username = player.Name,
            displayName = player.DisplayName,
            level = level,
            diamonds = diamonds,
            coins = coins,
            totalMoney = diamonds + coins,
            sessionProfit = 0,
            status = "online",
            lastUpdate = os.time(),
            gameName = "PetSimulator99",
            pets = {}, -- Could extract from inventory
            areas = {} -- Could track unlocked areas
        }
        
        -- Update stats
        stats.totalMoney = diamonds + coins
        stats.activeAccounts = 1
        stats.totalAccounts = 1
        stats.avgLevel = level
        stats.connectedAPIs = 1
    end
    
    return accounts, stats
end

-- Default data extraction for unknown games
GameData.Default = function()
    local accounts = {}
    local stats = {
        totalPocketMoney = 0,
        totalATMMoney = 0,
        totalMoney = 0,
        totalSessionProfit = 0,
        activeAccounts = 0,
        totalAccounts = 0,
        avgLevel = 0,
        connectedAPIs = 0
    }
    
    local player = LocalPlayer
    if player then
        local accountId = tostring(player.UserId)
        
        accounts[accountId] = {
            id = accountId,
            username = player.Name,
            displayName = player.DisplayName,
            level = 0,
            totalMoney = 0,
            sessionProfit = 0,
            status = "online",
            lastUpdate = os.time(),
            gameName = "Unknown"
        }
        
        stats.activeAccounts = 1
        stats.totalAccounts = 1
        stats.connectedAPIs = 1
    end
    
    return accounts, stats
end

-- Get the appropriate data extraction function
local getDataFunction = GameData["Blockspin"] or GameData.Default

-- Store initial money for profit calculation
local initialMoney = {}

-- Function to send data to dashboard
local function sendDashboardData()
    local success, accounts, stats = pcall(getDataFunction)
    
    if not success then
        warn("❌ Kunlun Dashboard: Error extracting game data -", accounts)
        return
    end
    
    -- Calculate session profit
    for accountId, account in pairs(accounts) do
        if not initialMoney[accountId] then
            initialMoney[accountId] = account.totalMoney
        end
        account.sessionProfit = account.totalMoney - initialMoney[accountId]
    end
    
    -- Prepare payload with dashboard key
    local payload = {
        key = DASHBOARD_KEY,
        accounts = accounts,
        stats = stats
    }
    
    -- Send data
    local success, response = pcall(function()
        return HttpService:PostAsync(DASHBOARD_API_URL, HttpService:JSONEncode(payload), Enum.HttpContentType.ApplicationJson, false)
    end)
    
    if success then
        local responseData = pcall(HttpService:JSONDecode, response)
        if responseData then
            print("✅ Kunlun Dashboard: Data sent successfully")
        else
            warn("⚠️ Kunlun Dashboard: Invalid response format")
        end
    else
        warn("❌ Kunlun Dashboard: Failed to send data -", response)
    end
end

-- Initialize
print("🚀 Kunlun Dashboard Script Started")
print("📊 Dashboard Key:", DASHBOARD_KEY)
print("🔄 Update Interval:", UPDATE_INTERVAL, "seconds")

-- Send initial data
sendDashboardData()

-- Set up periodic updates
local connection
connection = game:GetService("RunService").Heartbeat:Connect(function()
    -- This runs every frame, but we'll throttle updates
    if not connection then return end
    
    -- Disconnect after first run and set up proper interval
    connection:Disconnect()
    connection = nil
    
    -- Set up periodic updates
    while true do
        wait(UPDATE_INTERVAL)
        sendDashboardData()
    end
end)

-- Cleanup on script removal
if script.Parent then
    script.Parent.AncestryChanged:Connect(function()
        if not script.Parent then
            print("🛑 Kunlun Dashboard Script Stopped")
        end
    end)
end
