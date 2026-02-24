-- @name Kunlun Premium Script
-- @description Advanced Roblox script with ESP, Aimbot, and more
-- @version 1.0.0
-- @author Kunlun Team

-- ╔══════════════════════════════════════════════════════════╗
-- ║           Kunlun  —  Dark Style License UI               ║
-- ║   Draggable · Resizable · Clean · Dark Theme            ║
-- ╚══════════════════════════════════════════════════════════╝

local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local Players      = game:GetService("Players")
local Lighting     = game:GetService("Lighting")
local UIS          = game:GetService("UserInputService")
local player       = Players.LocalPlayer

local API_URL = "https://sheetdb.io/api/v1/ooda1y4uurhpp"

-- ─── Colors (Dark Theme) ──────────────────────────────────
local C = {
    win        = Color3.fromRGB(13,  13,  15),
    titlebar   = Color3.fromRGB(18,  18,  21),
    divider    = Color3.fromRGB(35,  35,  42),
    label      = Color3.fromRGB(220, 220, 230),
    secondary  = Color3.fromRGB(100, 100, 115),
    placeholder= Color3.fromRGB(70,  70,  85),
    inputBg    = Color3.fromRGB(22,  22,  26),
    inputBdr   = Color3.fromRGB(45,  45,  55),
    inputFocus = Color3.fromRGB(48,  255, 106),
    btnBlue    = Color3.fromRGB(48,  255, 106),
    btnHov     = Color3.fromRGB(30,  210, 80),
    btnTxt     = Color3.fromRGB(10,  10,  12),
    red        = Color3.fromRGB(255,  59,  48),
    yellow     = Color3.fromRGB(255, 189,  46),
    green      = Color3.fromRGB( 40, 205,  65),
    shadow     = Color3.fromRGB(  0,   0,   0),
    success    = Color3.fromRGB(48,  255, 106),
    error      = Color3.fromRGB(255,  59,  48),
    link       = Color3.fromRGB(48,  255, 106),
    linkHov    = Color3.fromRGB(30,  210, 80),
}

-- ─── Helpers ──────────────────────────────────────────────
local function tw(obj, t, props, style)
    return TweenService:Create(
        obj,
        TweenInfo.new(t, style or Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
        props
    )
end
local function later(t, fn) task.delay(t, fn) end
local function newCorner(parent, r)
    local c = Instance.new("UICorner", parent)
    c.CornerRadius = UDim.new(0, r or 8)
end
local function newStroke(parent, color, thick, trans)
    local s = Instance.new("UIStroke", parent)
    s.Color        = color
    s.Thickness    = thick or 1
    s.Transparency = trans or 0
    return s
end

-- ─── ScreenGui ────────────────────────────────────────────
local gui = Instance.new("ScreenGui")
gui.Name            = "Kunlun_Dark"
gui.IgnoreGuiInset  = true
gui.ResetOnSpawn    = false
gui.ZIndexBehavior  = Enum.ZIndexBehavior.Sibling
if gethui then
    gui.Parent = gethui()
else
    gui.Parent = player:WaitForChild("PlayerGui")
end

-- ─── Blur ─────────────────────────────────────────────────
local blur = Instance.new("BlurEffect")
blur.Size   = 0
blur.Parent = Lighting
tw(blur, 0.8, { Size = 12 }):Play()

-- ─── Window dimensions & position ─────────────────────────
local MIN_W, MIN_H = 340, 240
local cardW, cardH = MIN_W, MIN_H
local cam   = workspace.CurrentCamera
local vp    = cam.ViewportSize
local cardX = math.floor(vp.X / 2 - cardW / 2)
local cardY = math.floor(vp.Y / 2 - cardH / 2)

-- ─── Window Frame ─────────────────────────────────────────
local win = Instance.new("Frame")
win.Name                   = "Window"
win.Size                   = UDim2.new(0, cardW, 0, cardH)
win.Position               = UDim2.new(0, cardX, 0, cardY + 20)
win.BackgroundColor3       = C.win
win.BackgroundTransparency = 1
win.BorderSizePixel        = 0
win.ZIndex                 = 10
win.Active                 = true
win.ClipsDescendants       = false
win.Parent                 = gui
newCorner(win, 12)

-- Drop shadow
for i = 1, 4 do
    local sh = Instance.new("Frame", win)
    sh.Size                  = UDim2.new(1, i*4, 1, i*4)
    sh.Position              = UDim2.new(0, -i*2, 0, -i*2 + 2)
    sh.BackgroundColor3      = C.shadow
    sh.BackgroundTransparency = 1 - (0.035 / i)
    sh.BorderSizePixel       = 0
    sh.ZIndex                = 9 - i
    newCorner(sh, 14)
end

-- Window border (subtle green glow tint)
local winStroke = newStroke(win, C.divider, 1, 1)

-- ─── Title Bar ────────────────────────────────────────────
local TITLEBAR_H = 36
local titleBar = Instance.new("Frame", win)
titleBar.Name                  = "TitleBar"
titleBar.Size                  = UDim2.new(1, 0, 0, TITLEBAR_H)
titleBar.BackgroundColor3      = C.titlebar
titleBar.BackgroundTransparency = 1
titleBar.BorderSizePixel       = 0
titleBar.ZIndex                = 12
titleBar.Active                = true
newCorner(titleBar, 12)

local tbFix = Instance.new("Frame", titleBar)
tbFix.Size                   = UDim2.new(1, 0, 0.5, 0)
tbFix.Position               = UDim2.new(0, 0, 0.5, 0)
tbFix.BackgroundColor3       = C.titlebar
tbFix.BackgroundTransparency = 1
tbFix.BorderSizePixel        = 0
tbFix.ZIndex                 = 12

local tbDivider = Instance.new("Frame", win)
tbDivider.Size               = UDim2.new(1, 0, 0, 1)
tbDivider.Position           = UDim2.new(0, 0, 0, TITLEBAR_H)
tbDivider.BackgroundColor3   = C.divider
tbDivider.BackgroundTransparency = 1
tbDivider.BorderSizePixel    = 0
tbDivider.ZIndex             = 12

local titleTxt = Instance.new("TextLabel", titleBar)
titleTxt.Size                = UDim2.new(1, 0, 1, 0)
titleTxt.Text                = "Kunlun"
titleTxt.TextColor3          = C.label
titleTxt.TextTransparency    = 1
titleTxt.Font                = Enum.Font.GothamMedium
titleTxt.TextSize            = 13
titleTxt.BackgroundTransparency = 1
titleTxt.ZIndex              = 13

-- ─── Traffic Lights ───────────────────────────────────────
local DOT_R = 6
local DOTS  = {
    { col=C.red,    hov=Color3.fromRGB(220,45,35),  sym="×", x=16 },
    { col=C.yellow, hov=Color3.fromRGB(215,150,0),  sym="–", x=36 },
    { col=C.green,  hov=Color3.fromRGB(25,180,45),  sym="+", x=56 },
}
local dotRefs = {}
for i, d in ipairs(DOTS) do
    local dot = Instance.new("TextButton", titleBar)
    dot.Size                   = UDim2.new(0, DOT_R*2, 0, DOT_R*2)
    dot.Position               = UDim2.new(0, d.x - DOT_R, 0.5, -DOT_R)
    dot.BackgroundColor3       = d.col
    dot.BackgroundTransparency = 1
    dot.Text                   = ""
    dot.AutoButtonColor        = false
    dot.ZIndex                 = 15
    newCorner(dot, DOT_R)

    local sym = Instance.new("TextLabel", dot)
    sym.Size                 = UDim2.new(1, 0, 1, 0)
    sym.Text                 = d.sym
    sym.TextColor3           = Color3.fromRGB(80, 25, 15)
    sym.Font                 = Enum.Font.GothamBold
    sym.TextSize             = 9
    sym.BackgroundTransparency = 1
    sym.TextTransparency     = 1
    sym.ZIndex               = 16
    table.insert(dotRefs, dot)   -- ✅ แค่นี้พอ ลบบรรทัด _sym ออก

    later(0.6 + (i-1)*0.07, function()
        tw(dot, 0.3, { BackgroundTransparency = 0 }):Play()
    end)

    dot.MouseEnter:Connect(function()
        tw(dot, 0.1, { BackgroundColor3 = d.hov }):Play()
        tw(sym, 0.1, { TextTransparency  = 0 }):Play()
    end)
    dot.MouseLeave:Connect(function()
        tw(dot, 0.1, { BackgroundColor3 = d.col }):Play()
        tw(sym, 0.1, { TextTransparency  = 1 }):Play()
    end)
end

-- ─── Content Area ─────────────────────────────────────────
local content = Instance.new("Frame", win)
content.Size                 = UDim2.new(1, 0, 1, -TITLEBAR_H)
content.Position             = UDim2.new(0, 0, 0, TITLEBAR_H)
content.BackgroundTransparency = 1
content.BorderSizePixel      = 0
content.ZIndex               = 11
content.ClipsDescendants     = true

-- ─── Label ────────────────────────────────────────────────
local keyLabel = Instance.new("TextLabel", content)
keyLabel.Size                = UDim2.new(1, -40, 0, 18)
keyLabel.Position            = UDim2.new(0, 20, 0, 20)
keyLabel.Text                = "License Key"
keyLabel.TextColor3          = C.label
keyLabel.TextTransparency    = 1
keyLabel.Font                = Enum.Font.GothamMedium
keyLabel.TextSize            = 13
keyLabel.TextXAlignment      = Enum.TextXAlignment.Left
keyLabel.BackgroundTransparency = 1
keyLabel.ZIndex              = 12

-- ─── Input ────────────────────────────────────────────────
local inputWrap = Instance.new("Frame", content)
inputWrap.Size                 = UDim2.new(1, -40, 0, 36)
inputWrap.Position             = UDim2.new(0, 20, 0, 44)
inputWrap.BackgroundColor3     = C.inputBg
inputWrap.BackgroundTransparency = 1
inputWrap.BorderSizePixel      = 0
inputWrap.ZIndex               = 12
newCorner(inputWrap, 8)
local inputStroke = newStroke(inputWrap, C.inputBdr, 1, 1)

local inputBox = Instance.new("TextBox", inputWrap)
inputBox.Size                = UDim2.new(1, -24, 1, 0)
inputBox.Position            = UDim2.new(0, 12, 0, 0)
inputBox.PlaceholderText     = "Enter your license key"
inputBox.PlaceholderColor3   = C.placeholder
inputBox.Text                = ""
inputBox.BackgroundTransparency = 1
inputBox.TextColor3          = C.label
inputBox.TextTransparency    = 1
inputBox.Font                = Enum.Font.Gotham
inputBox.TextSize            = 14
inputBox.TextXAlignment      = Enum.TextXAlignment.Left
inputBox.ClearTextOnFocus    = false
inputBox.ZIndex              = 13

-- ─── Helper text ──────────────────────────────────────────
local helperTxt = Instance.new("TextLabel", content)
helperTxt.Size                = UDim2.new(1, -40, 0, 14)
helperTxt.Position            = UDim2.new(0, 22, 0, 84)
helperTxt.Text                = "Your key is kept private and secure"
helperTxt.TextColor3          = C.secondary
helperTxt.TextTransparency    = 1
helperTxt.Font                = Enum.Font.Gotham
helperTxt.TextSize            = 11
helperTxt.TextXAlignment      = Enum.TextXAlignment.Left
helperTxt.BackgroundTransparency = 1
helperTxt.ZIndex              = 12

-- ─── Button ───────────────────────────────────────────────
local btn = Instance.new("TextButton", content)
btn.Size                 = UDim2.new(1, -40, 0, 36)
btn.Position             = UDim2.new(0, 20, 0, 110)
btn.BackgroundColor3     = C.btnBlue
btn.BackgroundTransparency = 1
btn.Text                 = "Continue"
btn.TextColor3           = C.btnTxt
btn.TextTransparency     = 1
btn.Font                 = Enum.Font.GothamMedium
btn.TextSize             = 14
btn.AutoButtonColor      = false
btn.ZIndex               = 12
newCorner(btn, 8)

local btnShim = Instance.new("Frame", btn)
btnShim.Size                 = UDim2.new(1, 0, 0.5, 0)
btnShim.BackgroundColor3     = Color3.fromRGB(255, 255, 255)
btnShim.BackgroundTransparency = 1
btnShim.BorderSizePixel      = 0
btnShim.ZIndex               = 13
newCorner(btnShim, 8)

-- ─── Footer  ("Need a key? " + clickable "getkunlun.me") ──
local footer = Instance.new("TextLabel", content)
footer.Size                  = UDim2.new(0, 80, 0, 20)
footer.Position              = UDim2.new(0, 20, 0, 160)
footer.Text                  = "Need a key? "
footer.TextColor3            = C.secondary
footer.TextTransparency      = 1
footer.Font                  = Enum.Font.Gotham
footer.TextSize              = 11
footer.TextXAlignment        = Enum.TextXAlignment.Left
footer.BackgroundTransparency = 1
footer.ZIndex                = 12

local footerLink = Instance.new("TextButton", content)
footerLink.Size                  = UDim2.new(0, 90, 0, 20)
footerLink.Position              = UDim2.new(0, 93, 0, 160)
footerLink.Text                  = "getkunlun.me"
footerLink.TextColor3            = C.link
footerLink.TextTransparency      = 1
footerLink.Font                  = Enum.Font.GothamMedium
footerLink.TextSize              = 11
footerLink.TextXAlignment        = Enum.TextXAlignment.Left
footerLink.BackgroundTransparency = 1
footerLink.AutoButtonColor       = false
footerLink.ZIndex                = 12

-- underline bar
local underline = Instance.new("Frame", footerLink)
underline.Size                   = UDim2.new(1, 0, 0, 1)
underline.Position               = UDim2.new(0, 0, 1, -3)
underline.BackgroundColor3       = C.link
underline.BackgroundTransparency = 1
underline.BorderSizePixel        = 0
underline.ZIndex                 = 13

footerLink.MouseEnter:Connect(function()
    tw(footerLink, 0.12, { TextColor3 = C.linkHov }):Play()
    tw(underline,  0.12, { BackgroundTransparency = 0 }):Play()
end)
footerLink.MouseLeave:Connect(function()
    tw(footerLink, 0.12, { TextColor3 = C.link }):Play()
    tw(underline,  0.12, { BackgroundTransparency = 1 }):Play()
end)

footerLink.MouseButton1Click:Connect(function()
    local url = "https://getkunlun.me"
    pcall(function() setclipboard(url) end)
    local prev = footerLink.Text
    footerLink.Text = "✓ copied!"
    tw(footerLink, 0.1, { TextColor3 = C.success }):Play()
    later(2, function()
        footerLink.Text = prev
        tw(footerLink, 0.1, { TextColor3 = C.link }):Play()
    end)
end)

-- ─── Resize handles ───────────────────────────────────────
local HANDLE = 10
local hDefs  = {
    { ax=Vector2.new(0,0),   sz=Vector2.new(HANDLE,HANDLE),   dir="NW" },
    { ax=Vector2.new(1,0),   sz=Vector2.new(HANDLE,HANDLE),   dir="NE" },
    { ax=Vector2.new(0,1),   sz=Vector2.new(HANDLE,HANDLE),   dir="SW" },
    { ax=Vector2.new(1,1),   sz=Vector2.new(HANDLE,HANDLE),   dir="SE" },
    { ax=Vector2.new(0.5,0), sz=Vector2.new(HANDLE*6,HANDLE), dir="N"  },
    { ax=Vector2.new(0.5,1), sz=Vector2.new(HANDLE*6,HANDLE), dir="S"  },
    { ax=Vector2.new(0,0.5), sz=Vector2.new(HANDLE,HANDLE*6), dir="W"  },
    { ax=Vector2.new(1,0.5), sz=Vector2.new(HANDLE,HANDLE*6), dir="E"  },
}
local hRefs = {}
for _, hd in ipairs(hDefs) do
    local h = Instance.new("TextButton", win)
    h.Size                   = UDim2.new(0, hd.sz.X, 0, hd.sz.Y)
    h.AnchorPoint            = hd.ax
    h.Position               = UDim2.new(hd.ax.X, 0, hd.ax.Y, 0)
    h.BackgroundTransparency = 1
    h.Text                   = ""
    h.AutoButtonColor        = false
    h.ZIndex                 = 20
    h.Active                 = true
    table.insert(hRefs, { frame=h, dir=hd.dir })
end

-- corner accent dots
local cDots = {
    { ax=Vector2.new(0,1), px=5,  py=-5 },
    { ax=Vector2.new(1,1), px=-9, py=-5 },
}
for _, cd in ipairs(cDots) do
    local d = Instance.new("Frame", win)
    d.Size                   = UDim2.new(0, 4, 0, 4)
    d.AnchorPoint            = cd.ax
    d.Position               = UDim2.new(cd.ax.X, cd.px, cd.ax.Y, cd.py)
    d.BackgroundColor3       = C.secondary
    d.BackgroundTransparency = 0.7
    d.BorderSizePixel        = 0
    d.ZIndex                 = 20
    newCorner(d, 2)
end

-- ─── Shimmer line ─────────────────────────────────────────
local shimmer = Instance.new("Frame", win)
shimmer.Name                 = "Shimmer"
shimmer.Size                 = UDim2.new(1, -2, 0, 1)
shimmer.Position             = UDim2.new(0, 1, 0, 1)
shimmer.BackgroundColor3     = Color3.fromRGB(255, 255, 255)
shimmer.BackgroundTransparency = 1
shimmer.BorderSizePixel      = 0
shimmer.ZIndex               = 15

-- ─── Drag ─────────────────────────────────────────────────
local dragging     = false
local dragStartM   = Vector2.new()
local dragStartPos = Vector2.new()

titleBar.InputBegan:Connect(function(inp)
    if inp.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging     = true
        dragStartM   = Vector2.new(inp.Position.X, inp.Position.Y)
        dragStartPos = Vector2.new(cardX, cardY)
    end
end)

-- ─── Resize ───────────────────────────────────────────────
local resizing    = false
local resDir      = ""
local resStartM   = Vector2.new()
local resStartX, resStartY = 0, 0
local resStartW, resStartH = 0, 0

for _, h in ipairs(hRefs) do
    h.frame.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1 then
            resizing  = true
            resDir    = h.dir
            resStartM = Vector2.new(inp.Position.X, inp.Position.Y)
            resStartX = cardX ; resStartY = cardY
            resStartW = cardW ; resStartH = cardH
        end
    end)
end

UIS.InputChanged:Connect(function(inp)
    if inp.UserInputType ~= Enum.UserInputType.MouseMovement then return end
    local mx, my = inp.Position.X, inp.Position.Y

    if dragging then
        cardX = dragStartPos.X + (mx - dragStartM.X)
        cardY = dragStartPos.Y + (my - dragStartM.Y)
        win.Position = UDim2.new(0, cardX, 0, cardY)

    elseif resizing then
        local dx = mx - resStartM.X
        local dy = my - resStartM.Y
        local nx, ny, nw, nh = resStartX, resStartY, resStartW, resStartH

        if resDir:find("W") then nw = math.max(MIN_W, resStartW-dx); nx = resStartX+(resStartW-nw) end
        if resDir:find("E") then nw = math.max(MIN_W, resStartW+dx) end
        if resDir:find("N") then nh = math.max(MIN_H, resStartH-dy); ny = resStartY+(resStartH-nh) end
        if resDir:find("S") then nh = math.max(MIN_H, resStartH+dy) end

        cardX,cardY,cardW,cardH = nx,ny,nw,nh
        win.Position = UDim2.new(0,cardX,0,cardY)
        win.Size     = UDim2.new(0,cardW,0,cardH)
    end
end)

UIS.InputEnded:Connect(function(inp)
    if inp.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = false ; resizing = false
    end
end)

-- ─── Auto-resize window to key length ─────────────────────
local PX_PER_CHAR = 8.6
local SIDE_PAD    = 40
local lastW       = cardW

local function getKeyWidth(txt)
    if #txt == 0 then return MIN_W end
    local needed = math.ceil(#txt * PX_PER_CHAR) + 24 + SIDE_PAD * 2
    return math.max(MIN_W, needed)
end

local function autoResize(targetW)
    if math.abs(targetW - lastW) < 2 then return end
    lastW = targetW
    local centerX = cardX + cardW / 2
    cardW  = targetW
    cardX  = math.floor(centerX - cardW / 2)
    TweenService:Create(win, TweenInfo.new(0.14, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), {
        Size     = UDim2.new(0, cardW, 0, cardH),
        Position = UDim2.new(0, cardX, 0, cardY),
    }):Play()
end

inputBox:GetPropertyChangedSignal("Text"):Connect(function()
    autoResize(getKeyWidth(inputBox.Text))
end)

-- ─── Input focus glow ─────────────────────────────────────
inputBox.Focused:Connect(function()
    tw(inputStroke, 0.18, { Color=C.inputFocus, Transparency=0 }):Play()
    TweenService:Create(inputStroke, TweenInfo.new(0.18), { Thickness=1.5 }):Play()
end)
inputBox.FocusLost:Connect(function()
    tw(inputStroke, 0.18, { Color=C.inputBdr, Transparency=0 }):Play()
    TweenService:Create(inputStroke, TweenInfo.new(0.18), { Thickness=1 }):Play()
end)

-- ─── Button hover ─────────────────────────────────────────
btn.MouseEnter:Connect(function()
    tw(btn, 0.15, { BackgroundColor3=C.btnHov }):Play()
end)
btn.MouseLeave:Connect(function()
    tw(btn, 0.15, { BackgroundColor3=C.btnBlue }):Play()
end)
btn.MouseButton1Down:Connect(function()
    tw(btn, 0.08, { BackgroundColor3=Color3.fromRGB(20,170,60) }):Play()
end)
btn.MouseButton1Up:Connect(function()
    tw(btn, 0.08, { BackgroundColor3=C.btnHov }):Play()
end)

-- ─── Fade In ──────────────────────────────────────────────
local function fadeInAll()
    later(0.04, function()
        tw(win, 0.5, {
            BackgroundTransparency = 0,
            Position = UDim2.new(0, cardX, 0, cardY),
        }):Play()
        tw(winStroke,  0.5, { Transparency = 0 }):Play()
        tw(titleBar,   0.5, { BackgroundTransparency = 0 }):Play()
        tw(tbFix,      0.5, { BackgroundTransparency = 0 }):Play()
        tw(tbDivider,  0.5, { BackgroundTransparency = 0 }):Play()
        tw(shimmer,    0.5, { BackgroundTransparency = 0.85 }):Play()
    end)
    later(0.3, function()
        tw(titleTxt, 0.4, { TextTransparency = 0 }):Play()
    end)
    later(0.55, function()
        tw(keyLabel, 0.35, { TextTransparency = 0 }):Play()
    end)
    later(0.65, function()
        tw(inputWrap,   0.35, { BackgroundTransparency = 0 }):Play()
        tw(inputStroke, 0.35, { Transparency = 0 }):Play()
        tw(inputBox,    0.35, { TextTransparency = 0 }):Play()
    end)
    later(0.78, function()
        tw(helperTxt, 0.3, { TextTransparency = 0 }):Play()
    end)
    later(0.88, function()
        tw(btn,     0.35, { BackgroundTransparency = 0 }):Play()
        tw(btn,     0.35, { TextTransparency = 0 }):Play()
        tw(btnShim, 0.35, { BackgroundTransparency = 0.92 }):Play()
    end)
    later(1.05, function()
        tw(footer,     0.35, { TextTransparency = 0 }):Play()
        tw(footerLink, 0.35, { TextTransparency = 0 }):Play()
    end)
end
fadeInAll()

-- ─── Fade Out ─────────────────────────────────────────────
local function fadeOutAll(cb)
    tw(footer,     0.18, { TextTransparency = 1 }):Play()
    tw(footerLink, 0.18, { TextTransparency = 1 }):Play()
    later(0.04, function()
        tw(helperTxt, 0.18, { TextTransparency = 1 }):Play()
        tw(btn, 0.2, { BackgroundTransparency = 1, TextTransparency = 1 }):Play()
    end)
    later(0.10, function()
        tw(inputWrap,   0.2, { BackgroundTransparency = 1 }):Play()
        tw(inputStroke, 0.2, { Transparency = 1 }):Play()
        tw(inputBox,    0.2, { TextTransparency = 1 }):Play()
        tw(keyLabel,    0.2, { TextTransparency = 1 }):Play()
    end)
    later(0.22, function()
        tw(titleTxt,  0.2, { TextTransparency = 1 }):Play()
        tw(tbDivider, 0.2, { BackgroundTransparency = 1 }):Play()
        for i, dr in ipairs(dotRefs) do
            later(0.03*i, function()
                tw(dr, 0.15, { BackgroundTransparency = 1 }):Play()
            end)
        end
    end)
    later(0.38, function()
        tw(win, 0.4, {
            BackgroundTransparency = 1,
            Position = UDim2.new(0, cardX, 0, cardY - 22),
        }):Play()
        tw(winStroke, 0.4, { Transparency = 1 }):Play()
        tw(titleBar,  0.4, { BackgroundTransparency = 1 }):Play()
        tw(tbFix,     0.4, { BackgroundTransparency = 1 }):Play()
    end)
    later(0.55, function()
        tw(blur, 0.5, { Size = 0 }):Play()
    end)
    later(1.0, function() if cb then cb() end end)
end

-- ─── Close (red dot) ──────────────────────────────────────
dotRefs[1].MouseButton1Click:Connect(function()
    fadeOutAll(function() gui:Destroy() end)
end)

-- ─── Shake ────────────────────────────────────────────────
local function shake()
    for _, ox in ipairs({-7,7,-5,5,-2,2,0}) do
        win.Position = UDim2.new(0, cardX+ox, 0, cardY)
        task.wait(0.04)
    end
    win.Position = UDim2.new(0, cardX, 0, cardY)
end

-- ─── Button helpers ───────────────────────────────────────
local function setBtn(txt, col)
    btn.Text             = txt
    btn.BackgroundColor3 = col
end
local function resetBtn()
    setBtn("Continue", C.btnBlue)
end

-- ─── Auth ─────────────────────────────────────────────────
btn.MouseButton1Click:Connect(function()
    local key = inputBox.Text:gsub("%s+", "")
    if key == "" then
        shake()
        tw(inputStroke, 0.1, { Color=C.error, Transparency=0 }):Play()
        tw(inputWrap,   0.1, { BackgroundColor3=Color3.fromRGB(40,15,15) }):Play()
        later(1.0, function()
            tw(inputStroke, 0.2, { Color=C.inputBdr, Transparency=0 }):Play()
            tw(inputWrap,   0.2, { BackgroundColor3=C.inputBg }):Play()
        end)
        return
    end

    setBtn("Verifying…", Color3.fromRGB(60, 60, 70))
    btn.TextTransparency = 0

    local ok, res = pcall(function()
        return game:HttpGet(API_URL.."/search?Key="..HttpService:UrlEncode(key))
    end)
    task.wait(0.5)

    if ok then
        local data = HttpService:JSONDecode(res)
        if #data > 0 then
            setBtn("✓  Access Granted", C.success)
            later(0.85, function()
                fadeOutAll(function()
                    gui:Destroy()
                    -- loadstring(game:HttpGet("YOUR_SCRIPT_URL"))()
                end)
            end)
        else
            setBtn("Invalid Key", C.error)
            shake()
            tw(inputStroke, 0.1, { Color=C.error }):Play()
            tw(inputWrap,   0.1, { BackgroundColor3=Color3.fromRGB(40,15,15) }):Play()
            later(1.3, function()
                resetBtn()
                tw(inputStroke, 0.2, { Color=C.inputBdr }):Play()
                tw(inputWrap,   0.2, { BackgroundColor3=C.inputBg }):Play()
            end)
        end
    else
        setBtn("Connection Error", C.error)
        later(1.5, resetBtn)
    end
end)