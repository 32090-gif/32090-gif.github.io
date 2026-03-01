import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Wifi, 
  WifiOff, 
  Copy, 
  Download, 
  Gamepad2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Package,
  RefreshCw,
  Settings,
  Play,
  Code,
  Square,
  Key,
  Info,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { fetchDashboardKeys, generateDashboardKey } from '@/services/dashboardService';

interface ItemData {
  name: string;
  image?: string;
  category: string;
  count: number;
  owners: string[];
  sprite?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { game } = useParams();
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [gameData, setGameData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [scriptCopied, setScriptCopied] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dashboardKeys, setDashboardKeys] = useState<Record<string, any>>({});
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<any>(null);
  const [isLoadingKeyStatus, setIsLoadingKeyStatus] = useState<boolean>(false);

  const discordId = currentUser?.id || null;

  const games = [
    { value: 'Blockspin', label: 'Blockspin', icon: '🎮', image: 'https://tr.rbxcdn.com/180DAY-d355874c76be250cf5d4fab75b215f67/500/280/Image/Jpeg/noFilter' },
    { value: 'Bloxfruit', label: 'Blox Fruits', icon: '🏴‍☠️', image: 'https://tr.rbxcdn.com/180DAY-9562aea76052b8e6690596750b666b26/768/432/Image/Webp/noFilter' },
    { value: 'PetSimulator99', label: 'Pet Simulator 99', icon: '🐾', image: 'https://bigblog-storage.s3.us-east-1.amazonaws.com/thumbnail_PS_99_mining_f4cddad48d.png' },
  ];

  useEffect(() => {
    checkAuthentication();
    
    // Check for game parameter in URL
    if (game) {
      setSelectedGame(game);
      // Check key status when game is selected
      checkKeyStatus(game);
    } else {
      setSelectedGame('');
      setKeyStatus(null);
    }
  }, [game]);

  const checkKeyStatus = async (gameName: string) => {
    try {
      setIsLoadingKeyStatus(true);
      const token = localStorage.getItem('token');
      
      // Get unified dashboard key (same for all games)
      const userKey = dashboardKeys[Object.keys(dashboardKeys)[0]]?.key;
      
      if (!userKey) {
        setKeyStatus({
          success: false,
          status: 'no_key',
          message: 'ไม่มี dashboard key สำหรับบัญชีนี้'
        });
        return;
      }

      const response = await fetch(`/api/dashboard/logs?hey=${userKey}${gameName ? `&game=${gameName}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (gameName) {
        // Specific game status
        setKeyStatus(data);
      } else {
        // All games status
        setKeyStatus({
          success: true,
          status: 'all_games',
          message: 'สถานะ dashboard keys สำหรับทุกเกม',
          data: data.data
        });
      }
    } catch (error) {
      console.error('Error checking key status:', error);
      setKeyStatus({
        success: false,
        status: 'error',
        message: 'ไม่สามารถตรวจสอบสถานะได้'
      });
    } finally {
      setIsLoadingKeyStatus(false);
    }
  };

  const checkAuthentication = async () => {
    try {
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        navigate('/login');
        return;
      }
      
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      // Fetch dashboard keys
      const keys = await fetchDashboardKeys();
      setDashboardKeys(keys);
      
      // If no game is selected, don't connect WebSocket
      if (!selectedGame) {
        return;
      }
      
      // Check if we have a key for the selected game
      if (keys[selectedGame]) {
        connectWebSocket();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      navigate('/login');
    }
  };

  const connectWebSocket = () => {
    if (wsConnection) {
      wsConnection.close();
    }

    const userKey = dashboardKeys[Object.keys(dashboardKeys)[0]]?.key;
    if (!userKey) {
      console.error('No dashboard key found for game:', selectedGame);
      return;
    }

    const ws = new WebSocket(`ws://localhost:8081/ws?game=${selectedGame}&key=${userKey}`);
    setWsConnection(ws);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setIsLoading(false);
      toast.success('เชื่อมต่อ Dashboard สำเร็จ!');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'dashboard_update') {
          console.log('Dashboard update received:', data.payload);
          setGameData(data.payload);
          
          // Extract items from accounts
          if (data.payload && data.payload.accounts) {
            extractItems(data.payload.accounts);
          }
          
          // Set items from payload if available
          if (data.payload && data.payload.items) {
            console.log('Setting items from payload:', data.payload.items);
            setItems(data.payload.items);
          }
        } else if (data.type === 'item_update') {
          console.log('Item update received:', data.payload);
          setItems(data.payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setWsConnection(null);
      toast.error('การเชื่อมต่อ Dashboard ถูกตัด');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (currentUser && selectedGame && dashboardKeys[selectedGame]) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    };
  };

  const extractItems = (accounts: Record<string, any>) => {
    const itemCounts: Record<string, ItemData> = {};
    
    console.log('Extracting items from accounts:', accounts);
    
    Object.values(accounts).forEach((account: any) => {
      // Extract from items array if available (from new Roblox script)
      if (Array.isArray(account.items)) {
        console.log('Processing items array:', account.items);
        account.items.forEach((item: any) => {
          const key = item.name;
          if (!itemCounts[key]) {
            itemCounts[key] = {
              name: item.name,
              image: item.image,
              category: item.category || 'Unknown',
              count: 0,
              owners: [],
              sprite: item.sprite
            };
          }
          itemCounts[key].count++;
          if (!itemCounts[key].owners.includes(account.username)) {
            itemCounts[key].owners.push(account.username);
          }
        });
      }
      
      // Extract from individual categories (backward compatibility)
      ['melee', 'sword', 'gun', 'fruit', 'accessory'].forEach(category => {
        if (Array.isArray(account[category])) {
          account[category].forEach((item: any) => {
            const key = item.name;
            if (!itemCounts[key]) {
              itemCounts[key] = {
                name: item.name,
                image: item.image,
                category: category,
                count: 0,
                owners: [],
                sprite: item.sprite
              };
            }
            itemCounts[key].count++;
            if (!itemCounts[key].owners.includes(account.username)) {
              itemCounts[key].owners.push(account.username);
            }
          });
        }
      });
    });
    
    setItems(Object.values(itemCounts));
  };

  const copyScript = () => {
    const currentKey = dashboardKeys[Object.keys(dashboardKeys)[0]]?.key;
    
    if (!currentKey) {
      toast.error('ไม่มี dashboard key สำหรับเกมนี้');
      return;
    }

    const script = `-- Slumzick Dashboard Script
-- Generated: ${new Date().toLocaleString()}
-- Game: ${selectedGame}
-- Key: ${currentKey}

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Dashboard Configuration
local DASHBOARD_KEY = "${currentKey}"
local DASHBOARD_URL = "http://localhost:8081/api/dashboard/update"
local UPDATE_INTERVAL = 5 -- seconds

-- Game Configuration
local GAME_NAME = "${selectedGame}"
local DISCORD_ID = "${currentUser?.id || 'unknown'}"

-- Function to send data to dashboard
local function sendDashboardData()
    local playerData = {
        id = LocalPlayer.UserId,
        username = LocalPlayer.Name,
        displayName = LocalPlayer.DisplayName,
        game = GAME_NAME,
        discordId = DISCORD_ID,
        timestamp = os.time(),
        status = "online",
        level = LocalPlayer.Data and LocalPlayer.Data.Level.Value or 0,
        money = LocalPlayer.Data and LocalPlayer.Data.Money.Value or 0,
        backpackMoney = LocalPlayer.Backpack and LocalPlayer.Backpack:FindFirstChild("Money") and LocalPlayer.Backpack.Money.Value or 0,
        bankMoney = LocalPlayer.Data and LocalPlayer.Data.BankMoney.Value or 0,
        sessionProfit = 0, -- Calculate based on initial money
        items = {},
        stats = {
            totalMoney = (LocalPlayer.Data and LocalPlayer.Data.Money.Value or 0) + (LocalPlayer.Data and LocalPlayer.Data.BankMoney.Value or 0),
            level = LocalPlayer.Data and LocalPlayer.Data.Level.Value or 0,
            onlineTime = os.time()
        }
    }
    
    -- Collect items based on game
    if GAME_NAME == "Blockspin" then
        -- Blockspin specific items
        if LocalPlayer.Backpack then
            for _, item in pairs(LocalPlayer.Backpack:GetChildren()) do
                if item:IsA("Tool") then
                    table.insert(playerData.items, {
                        name = item.Name,
                        category = "Tool",
                        image = ""
                    })
                end
            end
        end
    elseif GAME_NAME == "Bloxfruit" then
        -- Bloxfruit specific items
        if LocalPlayer.Backpack then
            for _, item in pairs(LocalPlayer.Backpack:GetChildren()) do
                if item:IsA("Tool") then
                    table.insert(playerData.items, {
                        name = item.Name,
                        category = "Fruit" or "Tool",
                        image = ""
                    })
                end
            end
        end
    elseif GAME_NAME == "PetSimulator99" then
        -- Pet Simulator 99 specific items
        if LocalPlayer.Backpack then
            for _, item in pairs(LocalPlayer.Backpack:GetChildren()) do
                if item:IsA("Tool") then
                    table.insert(playerData.items, {
                        name = item.Name,
                        category = "Pet" or "Tool",
                        image = ""
                    })
                end
            end
        end
    end
    
    -- Send data to dashboard
    local success, response = pcall(function()
        return HttpService:PostAsync(DASHBOARD_URL, HttpService:JSONEncode({
            key = DASHBOARD_KEY,
            accounts = {
                [LocalPlayer.UserId] = playerData
            },
            stats = playerData.stats
        }), Enum.HttpContentType.ApplicationJson)
    end)
    
    if success then
        print("Dashboard data sent successfully")
    else
        print("Failed to send dashboard data:", response)
    end
end

-- Start dashboard updates
local initialMoney = LocalPlayer.Data and LocalPlayer.Data.Money.Value or 0

-- Update dashboard every interval
while wait(UPDATE_INTERVAL) do
    sendDashboardData()
end

print("Slumzick Dashboard Script loaded for " .. GAME_NAME)`;

    navigator.clipboard.writeText(script).then(() => {
      setScriptCopied(true);
      toast.success('คัดลอกสคริปต์แล้ว!');
      setTimeout(() => setScriptCopied(false), 2000);
    }).catch(() => {
      toast.error('ไม่สามารถคัดลอกสคริปต์ได้');
    });
  };

  const downloadScript = () => {
    const currentKey = dashboardKeys[Object.keys(dashboardKeys)[0]]?.key;
    if (!currentKey) {
      toast.error('ไม่พบ Dashboard Key สำหรับเกมนี้');
      return;
    }

    const script = `-- ============================================
-- Kunlun Dashboard Script (Real-time WebSocket Version)
-- ============================================
-- Game: ${selectedGame}
-- Dashboard Key: ${currentKey}
-- Generated: ${new Date().toISOString()}

getgenv().Kunlun_Settings = {
    dashboard_key = "${currentKey}",
    game_name = "${selectedGame}"
}

-- คัดลอกสคริปต์นี้และวางใน Roblox Executor
-- รันสคริปต์เพื่อเชื่อมต่อกับ Dashboard แบบ Real-time
-- ============================================

-- ดาวน์โหลดไฟล์ roblox_script_websocket.lua จากเว็บ Kunlun Dashboard
-- และรันใน Executor ของคุณ`;

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kunlun-${selectedGame.toLowerCase()}-${currentKey.slice(-8)}.lua`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('ดาวน์โหลดสคริปต์สำเร็จ!');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('$', '฿');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Main Navbar */}
      <Navbar />
      
      {/* Dashboard Header */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-500/20 text-red-600 border-red-500/30">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!selectedGame ? (
          // Game Selection Screen
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">เลือกเกมที่ต้องการดู Dashboard</h2>
              <p className="text-muted-foreground">เลือกเกมเพื่อดูข้อมูลและสถิติต่างๆ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card 
                  key={game.value}
                  className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50"
                  onClick={() => navigate(`/dashboard/${game.value}`)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <img 
                          src={game.image} 
                          alt={game.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <Gamepad2 className="w-16 h-16 text-muted-foreground hidden" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{game.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dashboardKeys[game.value] ? 'มี Dashboard Key' : 'ยังไม่มี Dashboard Key'}
                        </p>
                      </div>
                      
                      <Button className="w-full">
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        เปิด Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Game Dashboard Screen
          <div className="space-y-6">
            {/* Key Status Card */}
            {keyStatus && (
              <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    สถานะ Dashboard Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingKeyStatus ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">กำลังตรวจสอบสถานะ...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={keyStatus.status === 'connected' ? 'default' : keyStatus.status === 'disconnected' ? 'secondary' : 'destructive'}
                          className="flex items-center gap-1"
                        >
                          {keyStatus.status === 'connected' && <CheckCircle className="w-3 h-3" />}
                          {keyStatus.status === 'disconnected' && <XCircle className="w-3 h-3" />}
                          {keyStatus.status === 'no_key' && <Key className="w-3 h-3" />}
                          {keyStatus.status === 'error' && <XCircle className="w-3 h-3" />}
                          {keyStatus.status === 'connected' ? 'Connected' : 
                           keyStatus.status === 'disconnected' ? 'Disconnected' :
                           keyStatus.status === 'no_key' ? 'No Key' : 'Error'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{keyStatus.message}</span>
                      </div>
                      
                      {keyStatus.data && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-primary/5 rounded-lg">
                            <div className="text-lg font-bold text-primary">{keyStatus.data.accounts}</div>
                            <div className="text-xs text-muted-foreground">Accounts</div>
                          </div>
                          <div className="text-center p-3 bg-secondary/50 rounded-lg">
                            <div className="text-lg font-bold">{keyStatus.data.items}</div>
                            <div className="text-xs text-muted-foreground">Items</div>
                          </div>
                          <div className="text-center p-3 bg-accent/20 rounded-lg">
                            <div className="text-lg font-bold text-accent-foreground">
                              {keyStatus.data.stats ? '✓' : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">Stats</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-lg font-bold text-muted-foreground">
                              {keyStatus.data.hasData ? '✓' : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">Data</div>
                          </div>
                        </div>
                      )}
                      
                      {keyStatus.data?.lastUpdated && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Last updated: {new Date(keyStatus.data.lastUpdated).toLocaleString('th-TH')}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game Header */}
            <Card className="mb-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Dashboard {selectedGame}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedGame('');
                      navigate('/dashboard');
                    }}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    กลับเลือกเกม
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Script Actions */}
            <Card className="mb-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  สคริปต์ Roblox
                </CardTitle>
                <CardDescription>
                  คัดลอกหรือดาวน์โหลดสคริปต์สำหรับเชื่อมต่อกับ Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={copyScript}
                    disabled={scriptCopied}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {scriptCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        คัดลอกสคริปต์
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={downloadScript}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลดสคริปต์
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Stats */}
            {gameData && (
              <Card className="mb-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    สถิติ Dashboard {selectedGame}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {gameData.stats?.activeAccounts || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Online</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/50 rounded-lg">
                      <div className="text-lg font-bold">
                        {formatNumber(gameData.stats?.totalMoney || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Money</div>
                    </div>
                    <div className="text-center p-3 bg-accent/20 rounded-lg">
                      <div className="text-lg font-bold text-accent-foreground">
                        {gameData.stats?.totalAccounts || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Accounts</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-muted-foreground">
                        {items.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Items</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accounts Table */}
            <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  บัญชีทั้งหมด {selectedGame}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gameData && gameData.accounts && Object.keys(gameData.accounts).length > 0 ? (
                  <div className="space-y-4">
                    {Object.values(gameData.accounts).map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${account.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="font-medium">{account.username}</p>
                            <p className="text-sm text-muted-foreground">Level {account.level || 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatMoney(account.money || 0)}</p>
                          <p className="text-sm text-muted-foreground">{account.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">ไม่มีข้อมูลบัญชี</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
