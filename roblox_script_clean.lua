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
-- 📦 Firebase Configuration (Backup)
-- ============================================
local FIREBASE_PROJECT_ID = "accountmanager-7d16a"
local FIREBASE_DATABASE_URL = "https://accountmanager-7d16a-default-rtdb.asia-southeast1.firebasedatabase.app"

-- ดึงค่าจาก getgenv()
local kunlun_settings = getgenv and getgenv().Kunlun_Settings or {}
local DASHBOARD_KEY = kunlun_settings.dashboard_key or "YOUR_DASHBOARD_KEY"
local GAME_NAME = kunlun_settings.game_name or "Bloxfruit"

local function getDashboardPath()
    return "/dashboard/users/" .. DASHBOARD_KEY .. "/games/" .. GAME_NAME
end

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

local function calculateStats(accounts)
    local tm, tf, tb, tsp, tl, aa, ta, ca = 0,0,0,0,0,0,0
    for _, acc in pairs(accounts) do
        ta = ta + 1
        tm = tm + (acc.money or 0)
        tf = tf + (acc.fragments or 0)
        tb = tb + (acc.bounty or 0)
        tsp = tsp + (acc.sessionProfit or 0)
        tl = tl + (acc.level or 0)
        if acc.status == "online" then aa = aa + 1 end
        if acc.apiConnection then ca = ca + 1 end
    end
    return {
        totalMoney = tm,
        totalFragments = tf,
        totalBounty = tb,
        totalBountyFormatted = formatBounty(tb),
        totalSessionProfit = tsp,
        activeAccounts = aa,
        totalAccounts = ta,
        avgLevel = ta > 0 and math.floor(tl / ta) or 0,
        connectedAPIs = ca
    }
end

-- ============================================
-- 🔥 Firebase (Backup)
-- ============================================
local httpRequest = syn and syn.request
    or http and http.request
    or request
    or http_request
    or (fluxus and fluxus.request)

if not httpRequest then
    warn("❌ No supported HTTP request function found!")
    return
end

local function makeRequest(url, method, body)
    local req = {
        Url = url,
        Method = method or "GET",
        Headers = {
            ["Content-Type"] = "application/json",
            ["Accept"] = "application/json"
        }
    }
    if body and (method == "PUT" or method == "POST" or method == "PATCH") then
        req.Body = body
    end
   
    local success, res = pcall(httpRequest, req)
    return success and res or nil
end

local function getExistingAccounts()
    local url = FIREBASE_DATABASE_URL .. getDashboardPath() .. "/accounts.json"
    local res = makeRequest(url, "GET")
    if res and res.StatusCode == 200 and res.Body then
        local success, data = pcall(HttpService.JSONDecode, HttpService, res.Body)
        return success and data or {}
    end
    return {}
end

local function sendToFirebase(customData)
    local account = customData or getAccountData()
    local accId = account.id
   
    local existing = getExistingAccounts()
    existing[accId] = account
   
    local dashboard = {
        accounts = existing,
        stats = calculateStats(existing),
        lastUpdate = getTimestamp()
    }
   
    local url = FIREBASE_DATABASE_URL .. getDashboardPath() .. ".json"
    local json = HttpService:JSONEncode(dashboard)
   
    local res = makeRequest(url, "PUT", json)
    return res and res.StatusCode >= 200 and res.StatusCode < 300
end

local function sendOfflineStatus()
    local url = FIREBASE_DATABASE_URL .. getDashboardPath() .. "/accounts/" .. tostring(LocalPlayer.UserId) .. ".json"
    local patch = HttpService:JSONEncode({
        status = "offline",
        apiConnection = false,
        lastUpdate = getTimestamp()
    })
    makeRequest(url, "PATCH", patch)
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
-- 📤 Main Update Function (WebSocket + Firebase)
-- ============================================
local function sendUpdate(customData)
    local account = customData or getAccountData()
    
    -- ส่งผ่าน WebSocket (real-time)
    if IS_CONNECTED then
        sendWebSocketData(account)
    end
    
    -- ส่งผ่าน Firebase (backup)
    sendToFirebase(account)
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
            sendOfflineStatus()
            scriptRunning = false
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
        sendOfflineStatus()
    end
end)

print("🚀 Kunlun Dashboard Script Started!")
print("📊 Real-time updates enabled via WebSocket")
print("🔑 Using Dashboard Key: " .. DASHBOARD_KEY:sub(-8) .. "...")
print("🎮 Game: " .. GAME_NAME)
print("👤 User: " .. LocalPlayer.Name)
