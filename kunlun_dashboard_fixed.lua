-- ============================================
-- 🚀 Kunlun Dashboard (Optimized Visual Sync)
-- ============================================

getgenv().Kunlun_Settings = {
    dashboard_key = "KD_1c6d0c1d-6e85-457c-9fd0-de871b7818f9_UNIVERSAL_1772186538625_b36fc0b0",
    game_name = "Bloxfruit"
}

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local http_req = (request or http_request or (syn and syn.request))

-- [ ฟังก์ชันดึงรูปภาพ Avatar ]
local function getAvatarUrl()
    local userId = LocalPlayer.UserId
    local apiUrl = "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" .. userId .. "&size=420x420&format=Png&isCircular=false"
    local success, result = pcall(function() return game:HttpGet(apiUrl) end)
    if success then
        local decoded = HttpService:JSONDecode(result)
        if decoded and decoded.data and decoded.data[1] then
            return decoded.data[1].imageUrl
        end
    end
    return "rbxthumb://type=AvatarHeadShot&id=" .. userId .. "&w=420&h=420"
end

-- [ ฟังก์ชันดึงข้อมูล Visual ]
local function getVisualData(tool)
    if not tool then return nil end
    local imageAsset = tool:GetAttribute("OriginalImage")
    if not imageAsset then
        local handle = tool:FindFirstChild("Handle")
        if handle then
            imageAsset = handle:IsA("MeshPart") and handle.TextureID or (handle:FindFirstChildOfClass("SpecialMesh") and handle:FindFirstChildOfClass("SpecialMesh").TextureId)
        end
    end

    local imageUrl = ""
    if imageAsset then
        local id = string.match(tostring(imageAsset), "%d+")
        imageUrl = id and "rbxassetid://" .. id or ""
    end

    local sprite = nil
    local rectOffset = tool:GetAttribute("ImageRectOffset")
    local rectSize = tool:GetAttribute("ImageRectSize")
    if rectOffset and rectSize then
        sprite = { x = rectOffset.X, y = rectOffset.Y, w = rectSize.X, h = rectSize.Y }
    end

    return {
        name = tool.Name,
        image = imageUrl,
        sprite = sprite
    }
end

-- [ ฟังก์ชันสแกนไอเทม (แก้ไขให้ไม่ซ้ำและถูกต้อง) ]
local function scanItems(weaponType)
    local items = {}
    local uniqueCheck = {} -- ป้องกันไอเทมชื่อซ้ำในหมวดเดียวกัน
    local containers = {LocalPlayer.Backpack, LocalPlayer.Character}
    
    for _, container in ipairs(containers) do
        for _, tool in ipairs(container:GetChildren()) do
            if tool:IsA("Tool") and not uniqueCheck[tool.Name] then
                local toolWType = tool:GetAttribute("WeaponType")
                local isAcc = tool:FindFirstChild("Rarity") and not toolWType
                
                local match = false
                if weaponType == nil then
                    if isAcc then match = true end
                elseif toolWType == weaponType then
                    match = true
                end

                if match then
                    table.insert(items, getVisualData(tool))
                    uniqueCheck[tool.Name] = true
                end
            end
        end
    end
    return items
end

-- [ ฟังก์ชันส่งข้อมูล ]
local function syncToDashboard()
    if not http_req then return end
    
    local data = LocalPlayer:FindFirstChild("Data")
    local leaderstats = LocalPlayer:FindFirstChild("leaderstats")
    local lv = data and data.Level.Value or 0

    -- จัดโครงสร้าง Payload ใหม่ให้กระชับ (แก้ไขไม่ให้ซ้ำ)
    local payload = {
        key = getgenv().Kunlun_Settings.dashboard_key,
        data = {
            [LocalPlayer.Name] = {
                avatar_url = getAvatarUrl(),
                level = tostring(lv),
                money = data and data.Beli.Value or 0,
                fragment = data and data.Fragments.Value or 0,
                bounty = leaderstats and leaderstats["Bounty/Honor"].Value or 0,
                race = data and data.Race.Value or "-",
                world = lv < 700 and 1 or (lv < 1500 and 2 or 3),
                updated_at = os.date("!%Y-%m-%dT%H:%M:%S.000Z"),
                type = "PRO-VISUAL",
                -- ✅ ส่งแค่ devil_fruit ไม่ซ้ำกับ fruit_inventory
                melee = scanItems("Melee"),
                sword = scanItems("Sword"),
                gun = scanItems("Gun"),
                devil_fruit = scanItems("Demon Fruit"), -- ✅ ใช้ชื่อที่ถูกต้อง
                accessories = scanItems(nil)
            }
        }
    }

    pcall(function()
        http_req({
            Url = "http://localhost:3001/api/dashboard/update",
            Method = "POST",
            Headers = { ["Content-Type"] = "application/json" },
            Body = HttpService:JSONEncode(payload)
        })
    end)
end

-- Loop
task.spawn(function()
    while true do
        syncToDashboard()
        task.wait(15) -- 15 วินาที
    end
end)

print("🚀 Kunlun Clean-Sync Loaded!")
