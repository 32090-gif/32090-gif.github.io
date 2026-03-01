-- ============================================
-- Kunlun Dashboard Script (Real-time WebSocket Version)
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
-- 🔥 WebSocket Configuration
-- ============================================
local WS_URL = "ws://localhost:3001" -- เปลี่ยนตาม server ของคุณ
local WEBSOCKET_CONNECTION = nil
local IS_CONNECTED = false

-- ============================================
-- 📦 Web Server Configuration
-- ============================================
local WEB_SERVER_URL = "http://localhost:3001" -- Web server URL
local WEB_API_ENDPOINT = "/api/dashboard/update" -- API endpoint

-- ดึงค่าจาก getgenv()
local kunlun_settings = getgenv and getgenv().Kunlun_Settings or {}
local DASHBOARD_KEY = kunlun_settings.dashboard_key or "YOUR_DASHBOARD_KEY"
local GAME_NAME = kunlun_settings.game_name or "Bloxfruit"

-- ============================================
-- ⚙️ Settings
-- ============================================
local AUTO_UPDATE_INTERVAL = 1
local MONEY_CHECK_INTERVAL = 1
local WEBSOCKET_RECONNECT_INTERVAL = 5

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

local function getTimestamp()
    return os.time() * 1000
end

-- ============================================
-- 🔌 WebSocket Functions
-- ============================================
local function connectWebSocket()
    if IS_CONNECTED then return end
    
    local success, ws = pcall(function()
        return WebSocket.new(WS_URL)
    end)
    
    if not success then
        warn("❌ ไม่สามารถเชื่อมต่อ WebSocket ได้: " .. tostring(ws))
        return false
    end
    
    WEBSOCKET_CONNECTION = ws
    
    -- ส่ง authentication message
    local authMessage = {
        type = "auth",
        key = DASHBOARD_KEY,
        game = GAME_NAME,
        userId = tostring(LocalPlayer.UserId),
        username = LocalPlayer.Name
    }
    
    ws:Send(HttpService:JSONEncode(authMessage))
    
    -- Setup event handlers
    ws.OnMessage:Connect(function(message)
        local success, data = pcall(HttpService.JSONDecode, HttpService, message)
        if success then
            if data.type == "auth_success" then
                IS_CONNECTED = true
                print("✅ เชื่อมต่อ WebSocket สำเร็จ!")
                sendNotification("Kunlun Dashboard", "WebSocket Connected!", 2)
            elseif data.type == "auth_error" then
                warn("❌ Authentication failed: " .. (data.message or "Unknown error"))
                IS_CONNECTED = false
            end
        end
    end)
    
    ws.OnClose:Connect(function()
        IS_CONNECTED = false
        print("🔌 WebSocket ถูกตัดการเชื่อมต่อ")
        -- พยายามเชื่อมต่อใหม่
        wait(WEBSOCKET_RECONNECT_INTERVAL)
        connectWebSocket()
    end)
    
    ws.OnError:Connect(function(error)
        warn("❌ WebSocket Error: " .. tostring(error))
        IS_CONNECTED = false
    end)
    
    return true
end

local function sendWebSocketData(data)
    if not IS_CONNECTED or not WEBSOCKET_CONNECTION then return false end
    
    local message = {
        type = "dashboard_update",
        key = DASHBOARD_KEY,
        game = GAME_NAME,
        data = data,
        timestamp = getTimestamp()
    }
    
    local success, error = pcall(function()
        WEBSOCKET_CONNECTION:Send(HttpService:JSONEncode(message))
    end)
    
    return success
end

-- ============================================
-- 🌐 Web Server Functions
-- ============================================
local function sendToWebServer(data)
    local success, response = pcall(function()
        return HttpService:PostAsync(WEB_SERVER_URL .. WEB_API_ENDPOINT, HttpService:JSONEncode({
            key = DASHBOARD_KEY,
            accounts = {[data.id] = data},
            stats = {
                totalMoney = data.money,
                totalSessionProfit = data.sessionProfit,
                activeAccounts = data.status == "online" and 1 or 0,
                totalAccounts = 1,
                avgLevel = data.level,
                connectedAPIs = 1
            },
            lastUpdate = getTimestamp()
        }), {
            ["Content-Type"] = "application/json"
        })
    end)
    
    if success and response and response.Success then
        print("🌐 ส่งข้อมูลไปยัง Web Server สำเร็จ")
    else
        warn("❌ ไม่สามารถส่งข้อมูลไปยัง Web Server")
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

local function convertAssetIdToUrl(assetId)
    if not assetId or assetId == "" then return nil end
    local id = string.match(assetId, "%d+")
    if id then
        return "https://assetdelivery.roblox.com/v1/asset/?id=" .. id
    end
    return nil
end

local function getSpriteSheetData(tool)
    local spriteData = {}
    local rectOffset = tool:GetAttribute("ImageRectOffset")
    if rectOffset then
        spriteData.offsetX = rectOffset.X
        spriteData.offsetY = rectOffset.Y
    end
    local rectSize = tool:GetAttribute("ImageRectSize")
    if rectSize then
        spriteData.width = rectSize.X
        spriteData.height = rectSize.Y
    end
    if spriteData.offsetX and spriteData.offsetY and spriteData.width and spriteData.height then
        return spriteData
    end
    return nil
end

local function getToolImageData(tool)
    local imageData = {}
    local imageAsset = tool:GetAttribute("OriginalImage")
   
    if not imageAsset then
        local handle = tool:FindFirstChild("Handle")
        if handle then
            if handle:IsA("MeshPart") then
                imageAsset = handle.TextureID
            elseif handle:IsA("Part") then
                local mesh = handle:FindFirstChildOfClass("SpecialMesh")
                if mesh then imageAsset = mesh.TextureId end
            end
        end
    end
   
    local imageUrl = convertAssetIdToUrl(imageAsset)
    if imageUrl then
        imageData.url = imageUrl
    else
        imageData.url = ""
    end
   
    local spriteInfo = getSpriteSheetData(tool)
    if spriteInfo then
        imageData.sprite = spriteInfo
    end
   
    return imageData
end

local function getWeaponsByTypeWithImage(weaponType)
    return safeCall(function()
        local weapons = {}
        local seenTools = {}
       
        local function checkContainer(container)
            if not container then return end
            for _, tool in ipairs(container:GetChildren()) do
                if tool:IsA("Tool") and not seenTools[tool.Name] then
                    if tool:GetAttribute("WeaponType") == weaponType then
                        local imageData = getToolImageData(tool)
                        local info = {
                            name = tool.Name,
                            image = imageData.url,
                            id = tostring(tool:GetDebugId())
                        }
                        if imageData.sprite then
                            info.sprite = imageData.sprite
                        end
                        table.insert(weapons, info)
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

local getMelee      = function() return getWeaponsByTypeWithImage("Melee")      end
local getSword      = function() return getWeaponsByTypeWithImage("Sword")      end
local getGun        = function() return getWeaponsByTypeWithImage("Gun")        end
local getDevilFruit = function() return getWeaponsByTypeWithImage("Demon Fruit") end

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
                            local imageData = getToolImageData(tool)
                            local info = { name = tool.Name, image = imageData.url }
                            if imageData.sprite then info.sprite = imageData.sprite end
                            table.insert(accessories, info)
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
   
    -- รวมข้อมูล items ทั้งหมด
    local allItems = {}
    
    -- เพิ่ม weapons
    for _, item in ipairs(getMelee()) do table.insert(allItems, item) end
    for _, item in ipairs(getSword()) do table.insert(allItems, item) end
    for _, item in ipairs(getGun()) do table.insert(allItems, item) end
    for _, item in ipairs(getDevilFruit()) do table.insert(allItems, item) end
    for _, item in ipairs(getAccessories()) do table.insert(allItems, item) end
   
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
        lastUpdate = getTimestamp(),
        apiConnection = true,
        errors = {},
        gameName = GAME_NAME,
        items = allItems -- เพิ่ม items ทั้งหมด
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
-- 📤 Main Update Function (WebSocket + Web Server)
-- ============================================
local function sendUpdate(customData)
    local account = customData or getAccountData()
    
    -- ส่งผ่าน WebSocket (real-time)
    if IS_CONNECTED then
        sendWebSocketData(account)
    end
    
    -- ส่งผ่าน Web Server (backup)
    sendToWebServer(account)
    
    print("📊 ส่งข้อมูลผ่าน WebSocket และ Web Server")
end

-- ============================================
-- 🚀 Main
-- ============================================
if not validateDashboardKey() then return end

-- เชื่อมต่อ WebSocket
connectWebSocket()

wait(1.5)

-- ส่งข้อมูลครั้งแรก
sendUpdate()
sendNotification("Kunlun Dashboard", "Connected Successfully!", 2.5)

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
print("📊 Web Server Mode Enabled")
print("🌐 Server URL: " .. WEB_SERVER_URL)
print("🔌 Real-time updates via WebSocket")
print("🔑 Using Dashboard Key: " .. DASHBOARD_KEY:sub(-8) .. "...")
print("🎮 Game: " .. GAME_NAME)
print("👤 User: " .. LocalPlayer.Name)
print("✅ Script loaded successfully!")

-- ============================================
-- 🚨 Error Handling
-- ============================================
local function handleError(errorType, errorMessage)
    warn("❌ " .. errorType .. ": " .. errorMessage)
    sendNotification("Kunlun Dashboard", errorType .. " Error", 3)
end

-- ============================================
-- � Error Handling
-- ============================================
local function handleError(errorType, errorMessage)
    warn("❌ " .. errorType .. ": " .. errorMessage)
    sendNotification("Kunlun Dashboard", errorType .. " Error", 3)
end

-- ============================================
-- �🔄 Enhanced Update Function with Error Handling
-- ============================================
local function sendUpdate(customData)
    local success, error = pcall(function()
        local account = customData or getAccountData()
        
        -- ส่งผ่าน WebSocket (real-time)
        if IS_CONNECTED then
            local wsSuccess = sendWebSocketData(account)
            if not wsSuccess then
                handleError("WebSocket", "ไม่สามารถส่งข้อมูลผ่าน WebSocket")
            end
        end
        
        -- ส่งผ่าน Web Server (backup)
        local webSuccess = sendToWebServer(account)
        if not webSuccess then
            handleError("Web Server", "ไม่สามารถส่งข้อมูลไปยัง Web Server")
        end
        
        print("📊 ส่งข้อมูลผ่าน WebSocket และ Web Server")
    end)
    
    if not success then
        handleError("Update", "เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " .. tostring(error))
    end
end
