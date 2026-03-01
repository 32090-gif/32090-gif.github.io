-- ============================================
-- Kunlun Dashboard Script (Database Update Version)
-- ============================================

-- 🎮 ตั้งค่า Dashboard Key และ Game Name
-- คัดลอก Key จาก Web Dashboard: http://localhost:8081/dashboard
getgenv().Kunlun_Settings = {
    dashboard_key = "KD_1c6d0c1d-6e85-457c-9fd0-de871b7818f9_Bloxfruit_1772032064219_scfk74ikjr",
    game_name = "Bloxfruit"
}

-- ============================================
-- 📦 Services
-- ============================================
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- ============================================
-- 📦 Web Server Configuration
-- ============================================
local WEB_SERVER_URL = "http://localhost:3001"
local WEB_API_ENDPOINT = "/api/dashboard/update"

-- ดึงค่าจาก getgenv()
local kunlun_settings = getgenv and getgenv().Kunlun_Settings or {}
local DASHBOARD_KEY = kunlun_settings.dashboard_key or "YOUR_DASHBOARD_KEY"
local GAME_NAME = kunlun_settings.game_name or "Bloxfruit"

-- ============================================
-- ⚙️ Settings
-- ============================================
local AUTO_UPDATE_INTERVAL = 2
local MONEY_CHECK_INTERVAL = 2

-- ============================================
-- 🛠️ Helper Functions
-- ============================================
local function validateDashboardKey()
    if DASHBOARD_KEY == "YOUR_DASHBOARD_KEY" or DASHBOARD_KEY == "" then
        warn("═════════════════════════════════")
        warn("❌ ERROR: กรุณาใส่ Dashboard Key ของคุณ!")
        warn("📝 แก้ไขค่าใน getgenv().Kunlun_Settings")
        warn("🌐 ดู Dashboard Key ได้จากเว็บ Kunlun Dashboard")
        warn("═════════════════════════════════")
        return false
    end
   
    if not DASHBOARD_KEY or #DASHBOARD_KEY < 10 then
        warn("❌ Dashboard Key ไม่ถูกต้อง!")
        return false
    end
   
    return true
end

local function formatNumber(num)
    if num == nil then return "0" end
    local n = tonumber(num) or 0
    local formatted = tostring(math.floor(n))
    local k
    while true do
        formatted, k = string.gsub(formatted, "^(-?%d+)(%d%d%d)", '%1,%2')
        if k == 0 then break end
    end
    return formatted
end

local function formatBounty(n)
    if n >= 1e9 then
        return string.format("%.1fb", n/1e9):gsub("%.0b$", "b")
    elseif n >= 1e6 then
        return string.format("%.1fm", n/1e6):gsub("%.0m$", "m")
    elseif n >= 1e3 then
        return string.format("%.1fk", n/1e3):gsub("%.0k$", "k")
    else
        return tostring(n)
    end
end

local function safeCall(func)
    local success, result = pcall(func)
    if success then return result end
    return nil
end

-- ============================================
-- 🌐 Web Server Functions
-- ============================================
local function sendToWebServer(data)
    local success, response = pcall(function()
        return HttpService:PostAsync(WEB_SERVER_URL .. WEB_API_ENDPOINT, HttpService:JSONEncode({
            key = DASHBOARD_KEY,
            data = {
                [data.username] = {
                    accessories = table.concat(data.accessory, ","),
                    bounty = data.bounty or 0,
                    dark_fragment = 0,
                    devil_fruit = #data.fruit > 0 and data.fruit[1].name or "None",
                    fragment = data.fragments or 0,
                    fruit_inventory = #data.fruit > 0 and table.concat(data.fruit, ",") or "None",
                    gun = #data.gun > 0 and table.concat(data.gun, ",") or "None",
                    level = tostring(data.level),
                    lever = true,
                    leviathan_heart = 0,
                    material = "None",
                    melee = #data.melee > 0 and table.concat(data.melee, ",") or "None",
                    mirror = true,
                    money = data.money or 0,
                    pc = "kuy",
                    race = data.race,
                    sword = #data.sword > 0 and table.concat(data.sword, ",") or "None",
                    type = "GOD | MIR-VAL-LV",
                    updated_at = os.date("%Y-%m-%dT%H:%M:%S"),
                    valkyrie = true,
                    world = data.world == "First Sea" and 1 or (data.world == "Second Sea" and 2 or 3)
                }
            }
        }), {
            ["Content-Type"] = "application/json"
        })
    end)
    
    if success and response then
        print("🌐 ส่งข้อมูลไปยัง Web Server สำเร็จ")
        print("📊 Server Response:", response)
        
        -- พยายาแปล JSON response
        local successDecode, responseData = pcall(function()
            return HttpService.JSONDecode(HttpService, response)
        end)
        
        if successDecode and responseData then
            print("✅ Response Status:", responseData.success and "SUCCESS" or "FAILED")
            print("📝 Response Message:", responseData.message or "No message")
            if responseData.success then
                print("🎯 Database Updated Successfully!")
                if responseData.data and responseData.data.stats then
                    print("📈 Total Players:", responseData.data.stats.totalPlayers)
                    print("💰 Total Money:", formatNumber(responseData.data.stats.totalMoney))
                    print("📊 Last Update:", responseData.data.stats.lastUpdate)
                end
            else
                print("❌ Error:", responseData.message or "Unknown error")
            end
        else
            print("⚠️  Cannot parse response as JSON")
            print("📄 Raw Response:", response)
        end
    else
        warn("❌ ไม่สามารถส่งข้อมูลไปยัง Web Server")
        if response then
            warn("🔍 Error Details:", response)
        end
    end
    
    return success
end

-- ============================================
-- 🎮 Blox Fruit Data Functions
-- ============================================
local function getWorld(level)
    level = tonumber(level) or 0
    if level < 700 then return "First Sea" end
    if level < 1500 then return "Second Sea" end
    return "Third Sea"
end

local function getWeaponsByType(weaponType)
    return safeCall(function()
        local weapons = {}
        local seenTools = {}
       
        local function checkContainer(container)
            if not container then return end
            for _, tool in ipairs(container:GetChildren()) do
                if tool:IsA("Tool") and not seenTools[tool.Name] then
                    if tool:GetAttribute("WeaponType") == weaponType then
                        table.insert(weapons, tool.Name)
                        seenTools[tool.Name] = true
                    end
                end
            end
        end
       
        checkContainer(LocalPlayer:FindFirstChild("Backpack"))
        checkContainer(LocalPlayer.Character)
       
        return weapons
    end) or {}
end

local getMelee = function() return getWeaponsByType("Melee") end
local getSword = function() return getWeaponsByType("Sword") end
local getGun = function() return getWeaponsByType("Gun") end
local getDevilFruit = function() return getWeaponsByType("Demon Fruit") end

local function getAccessories()
    return safeCall(function()
        local accessories = {}
        local seen = {}
       
        local function checkContainer(container)
            if not container then return end
            for _, tool in ipairs(container:GetChildren()) do
                if tool:IsA("Tool") then
                    if not tool:GetAttribute("WeaponType") then
                        local rarity = tool:FindFirstChild("Rarity")
                        if rarity and rarity:IsA("IntValue") and not seen[tool.Name] then
                            table.insert(accessories, tool.Name)
                            seen[tool.Name] = true
                        end
                    end
                end
            end
        end
       
        checkContainer(LocalPlayer:FindFirstChild("Backpack"))
        checkContainer(LocalPlayer.Character)
       
        return accessories
    end) or {}
end

local function getRace()
    return safeCall(function()
        local data = LocalPlayer:FindFirstChild("Data")
        if not data then return "-" end
        local race = data:FindFirstChild("Race")
        return race and race.Value or "-"
    end) or "-"
end

-- ============================================
-- 📊 Account Data
-- ============================================
local initialMoney = 0
local isFirstRun = true
local scriptRunning = true

local function checkPlayerInGame()
    return safeCall(function()
        return LocalPlayer and LocalPlayer.Parent ~= nil
    end) or false
end

local function getAccountData()
    local data = LocalPlayer:FindFirstChild("Data")
    local leaderstats = LocalPlayer:FindFirstChild("leaderstats")
   
    local level = data and data:FindFirstChild("Level") and data.Level.Value or 0
    local money = data and data:FindFirstChild("Beli") and data.Beli.Value or 0
    local fragments = data and data:FindFirstChild("Fragments") and data.Fragments.Value or 0
    local bounty = leaderstats and leaderstats:FindFirstChild("Bounty/Honor") and leaderstats["Bounty/Honor"].Value or 0
   
    if isFirstRun then
        initialMoney = money
        isFirstRun = false
    end
   
    return {
        id = tostring(LocalPlayer.UserId),
        username = LocalPlayer.Name,
        status = checkPlayerInGame() and "online" or "offline",
        level = level,
        world = getWorld(level),
        melee = getMelee(),
        sword = getSword(),
        gun = getGun(),
        fruit = getDevilFruit(),
        accessory = getAccessories(),
        race = getRace(),
        money = money,
        fragments = fragments,
        bounty = bounty,
        bountyFormatted = formatBounty(bounty),
        sessionProfit = money - initialMoney,
        lastUpdate = os.time(),
        apiConnection = true,
        errors = {},
        gameName = GAME_NAME
    }
end

-- ============================================
-- 🔔 Notification
-- ============================================
local function sendNotification(title, text, duration)
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = title or "Kunlun Dashboard",
            Text = text or "System updated!",
            Icon = "rbxassetid://121136649812616",
            Duration = duration or 2.5
        })
    end)
end

-- ============================================
-- 📤 Main Update Function
-- ============================================
local function sendUpdate(customData)
    local account = customData or getAccountData()
    
    -- ส่งผ่าน Web Server API
    sendToWebServer(account)
    
    print("📊 ส่งข้อมูลไปยัง Database สำเร็จ")
end

-- ============================================
-- 🚀 Main
-- ============================================
if not validateDashboardKey() then return end

-- ส่งข้อมูลครั้งแรก
sendUpdate()
sendNotification("Kunlun Dashboard", "Database Connected!", 2.5)

-- ============================================
-- 🔄 Auto Update
-- ============================================
spawn(function()
    while scriptRunning do
        wait(AUTO_UPDATE_INTERVAL)
        if not checkPlayerInGame() then
            scriptRunning = false
            sendNotification("Kunlun Dashboard", "Script Stopped", 2)
            break
        end
        sendUpdate()
    end
end)

spawn(function()
    local lastMoney = 0
    while scriptRunning do
        wait(MONEY_CHECK_INTERVAL)
        if not checkPlayerInGame() then break end
       
        local data = LocalPlayer:FindFirstChild("Data")
        local money = data and data:FindFirstChild("Beli") and data.Beli.Value or 0
       
        if lastMoney > 0 and math.abs(money - lastMoney) > 1000 then
            sendUpdate()
        end
        lastMoney = money
    end
end)

LocalPlayer.AncestryChanged:Connect(function(_, parent)
    if not parent then
        scriptRunning = false
        sendNotification("Kunlun Dashboard", "Script Stopped", 2)
    end
end)

print("🚀 Kunlun Dashboard Script Started!")
print("📊 Database Mode - Updating database in real-time")
print("🔑 Using Dashboard Key: " .. DASHBOARD_KEY:sub(-8) .. "...")
print("🎮 Game: " .. GAME_NAME)
print("👤 User: " .. LocalPlayer.Name)
print("✅ Script loaded successfully!")
print("")
print("📝 วิธีการใช้งาน:")
print("1. คัดลอก Dashboard Key จาก: http://localhost:8081/dashboard")
print("2. แทนที่ YOUR_DASHBOARD_KEY_HERE ด้วย key จริง")
print("3. ใส่ script ใน Roblox Executor")
print("4. Script จะส่งข้อมูลไปยัง Database ทันที")
print("5. ข้อมูลจะปรากฏใน Dashboard ทันที")
print("")
print("🔍 Debug Info:")
print("🌐 Web Server URL: " .. WEB_SERVER_URL)
print("📡 API Endpoint: " .. WEB_API_ENDPOINT)
print("🔑 Dashboard Key: " .. DASHBOARD_KEY)
print("🎮 Game Name: " .. GAME_NAME)
print("👤 User ID: " .. tostring(LocalPlayer.UserId))
print("👤 Username: " .. LocalPlayer.Name)
