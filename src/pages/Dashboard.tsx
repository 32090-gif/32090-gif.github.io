import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Gamepad2, 
  Code, 
  Copy, 
  Download, 
  CheckCircle, 
  Key, 
  Search, 
  Trash2, 
  Inbox, 
  Settings,
  Activity,
  TrendingUp,
  DollarSign,
  Package,
  BarChart3,
  Wifi,
  WifiOff,
  Sheet,
  Send,
  X,
  Clipboard
} from 'lucide-react';
import { toast } from 'sonner';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Chart from 'chart.js/auto';

interface ItemData {
  name: string;
  image: string;
  category: string;
  count: number;
  owners: string[];
  sprite?: { 
    x: number; 
    y: number; 
    w: number; 
    h: number; 
  };
}

// ---- Parse any timestamp format → milliseconds ----
const parseTimestamp = (value: any): number | null => {
  if (!value) return null;
  if (typeof value === 'number') {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const ms = new Date(value).getTime();
    if (!isNaN(ms)) return ms;
  }
  return null;
};

// ---- Pick best timestamp field from account ----
const getLastUpdateMs = (account: any): number | null => {
  for (const field of ['updated_at', 'lastUpdate', 'timestamp', 'last_update', 'updatedAt', 'time']) {
    const ms = parseTimestamp(account[field]);
    if (ms !== null) return ms;
  }
  return null;
};

// ---- Format last update for display ----
const formatLastUpdate = (account: any): string => {
  const ms = getLastUpdateMs(account);
  if (ms === null) return 'Never';
  const diffMs = Date.now() - ms;
  if (diffMs < 0) return 'Just now';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  if (diffSec < 10)  return 'Just now';
  if (diffSec < 60)  return `${diffSec}s ago`;
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  return new Date(ms).toLocaleString('th-TH');
};

// ---- Online/Offline based on timestamp ----
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

const getAccountStatus = (account: any): 'online' | 'offline' => {
  const ms = getLastUpdateMs(account);
  if (ms !== null) return (Date.now() - ms) <= ONLINE_THRESHOLD_MS ? 'online' : 'offline';
  return account.status === 'online' ? 'online' : 'offline';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { game } = useParams();
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [gameData, setGameData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scriptCopied, setScriptCopied] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dashboardKeys, setDashboardKeys] = useState<Record<string, any>>({});
  const [universalKey, setUniversalKey] = useState<string>('');
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<any>(null);
  const [isLoadingKeyStatus, setIsLoadingKeyStatus] = useState<boolean>(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [sheetApiUrl, setSheetApiUrl] = useState<string>('');
  const [isSendingSheet, setIsSendingSheet] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);
  
  // Chart refs
  const moneyChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const moneyChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);

  // ---- Session profit: persist initial money in localStorage so refresh keeps history ----
  const initialMoneyRef = useRef<Record<string, number>>({});

  const discordId = currentUser?.id || null;

  const games = [
    { 
      id: 'Blockspin', 
      name: 'Blockspin', 
      icon: '🎮',
      image: 'https://tr.rbxcdn.com/180DAY-08e944e04baecad1610beed14f3cd7ba/768/432/Image/Webp/noFilter'
    }, 
    { 
      id: 'PetSimulator99', 
      name: 'Pet Simulator 99', 
      icon: '🐾',
      image: 'https://tr.rbxcdn.com/180DAY-25b77b4cb49ae9390a08b111a6bff20c/768/432/Image/Webp/noFilter'
    },
    { 
      id: 'Bloxfruit', 
      name: 'Bloxfruit', 
      icon: '🍉',
      image: 'https://tr.rbxcdn.com/180DAY-e929d11772d6ceec3f3963ad94a06a6e/512/512/Image/Webp/noFilter'
    }
  ];

  // ---- Load persisted session profit snapshots when game changes ----
  useEffect(() => {
    if (!selectedGame) return;
    const key = `session_profit_${selectedGame}`;
    try {
      const stored = localStorage.getItem(key);
      initialMoneyRef.current = stored ? JSON.parse(stored) : {};
    } catch {
      initialMoneyRef.current = {};
    }
  }, [selectedGame]);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (game) {
      setSelectedGame(game);
      checkKeyStatus(game);
    } else {
      setSelectedGame('');
      setKeyStatus(null);
      setGameData(null);
    }
  }, [game, universalKey, currentUser]);

  useEffect(() => {
    if (!selectedGame || !currentUser || !universalKey) {
      return;
    }

    checkKeyStatus(selectedGame);

    const interval = setInterval(() => {
      checkKeyStatus(selectedGame);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedGame, currentUser, universalKey]);

  const checkKeyStatus = async (gameName: string) => {
    try {
      setIsLoadingKeyStatus(true);
      const token = localStorage.getItem('token');
      
      if (!universalKey) {
        setKeyStatus({
          success: false,
          status: 'no_key',
          message: 'ไม่มี Universal Key สำหรับบัญชีนี้'
        });
        setIsLoadingKeyStatus(false);
        return;
      }

      const response = await fetch('/api/dashboard/universal-key', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.hasData) {
          setKeyStatus({
            success: false,
            status: data.universalKey ? 'no_data' : 'no_key',
            message: data.message || 'ไม่มีข้อมูล Dashboard'
          });
          setGameData(null);
          setIsLoadingKeyStatus(false);
          return;
        }

        // Extract game data from response
        const gameData = data.data[gameName];
        if (gameData) {
          // Convert API structure to Dashboard expected structure
          const adaptedGameData = {
            accounts: gameData.players || {},
            stats: gameData.stats || {}
          };
          setGameData(adaptedGameData);
          
          // Extract items from accounts
          if (adaptedGameData.accounts) {
            extractItems(adaptedGameData.accounts);
          }
          
          setKeyStatus({
            success: true,
            status: 'connected',
            message: 'เชื่อมต่อ Dashboard สำเร็จ'
          });
        } else {
          setGameData(null);
          setItems([]);
          setKeyStatus({
            success: false,
            status: 'no_data',
            message: `ไม่มีข้อมูลสำหรับเกม ${gameName}`
          });
        }
      } else {
        const errorData = await response.json();
        setKeyStatus({
          success: false,
          status: 'error',
          message: errorData.message || 'ไม่สามารถเชื่อมต่อ Dashboard ได้'
        });
        setGameData(null);
      }
    } catch (error) {
      console.error('Error checking key status:', error);
      setKeyStatus({
        success: false,
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
      });
    } finally {
      setIsLoadingKeyStatus(false);
    }
  };

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    navigate(`/dashboard/${gameId}`);
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
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/universal-key', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.universalKey) {
            setUniversalKey(data.universalKey);
          }
        }
      } catch (error) {
        console.error('Error fetching universal key:', error);
      }
      
      if (!selectedGame) {
        return;
      }
      
      if (universalKey) {
        checkKeyStatus(selectedGame);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      navigate('/login');
    }
  };

  const getRobloxImageUrl = (assetId: string) => {
    if (!assetId) return '';
    if (assetId.startsWith('rbxassetid://')) {
      const id = assetId.replace('rbxassetid://', '');
      return `https://assetdelivery.roblox.com/v1/asset/?id=${id}`;
    }
    return assetId;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const nextElement = target.nextElementSibling as HTMLElement;
    if (nextElement) {
      nextElement.style.display = 'flex';
    }
  };

  const extractItems = (accounts: Record<string, any>) => {
    const itemCounts: Record<string, ItemData> = {};
    
    Object.values(accounts).forEach((account: any) => {
      if (Array.isArray(account.items)) {
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
      
      ['melee', 'sword', 'gun', 'devil_fruit', 'fruit_inventory', 'accessories'].forEach(category => {
        const categoryData = account[category];
        
        if (Array.isArray(categoryData)) {
          categoryData.forEach((item: any) => {
            const key = item.name;
            if (!itemCounts[key]) {
              itemCounts[key] = {
                name: item.name,
                image: getRobloxImageUrl(item.image),
                category: category.replace('_', ' '),
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
        } else if (typeof categoryData === 'string' && categoryData) {
          const key = categoryData;
          if (!itemCounts[key]) {
            itemCounts[key] = {
              name: key,
              image: '',
              category: category.replace('_', ' '),
              count: 0,
              owners: [],
              // BUG FIX 2: was `sprite: null` which doesn't match the type (should be undefined)
              sprite: undefined
            };
          }
          itemCounts[key].count++;
          if (!itemCounts[key].owners.includes(account.username)) {
            itemCounts[key].owners.push(account.username);
          }
        }
      });
    });

    const itemsArray = Object.values(itemCounts);
    setItems(itemsArray);
  };

  const updateCharts = useCallback(() => {
    if (!gameData?.stats) return;

    // Destroy existing charts first
    if (moneyChartInstance.current) {
      moneyChartInstance.current.destroy();
      moneyChartInstance.current = null;
    }
    if (statusChartInstance.current) {
      statusChartInstance.current.destroy();
      statusChartInstance.current = null;
    }

    // Money Distribution Chart
    if (moneyChartRef.current) {
      const moneyCanvas = moneyChartRef.current;
      moneyCanvas.width = moneyCanvas.offsetWidth || 300;
      moneyCanvas.height = 140;

      const ctx = moneyCanvas.getContext('2d');
      if (ctx) {
        let chartData: number[], chartLabels: string[], chartColors: string[];
        
        if (selectedGame === 'Bloxfruit') {
          const players = gameData.accounts || {};
          const totalBeli = Object.values(players).reduce((sum: number, player: any) => sum + (player.money || 0), 0) as number;
          const totalFragments = Object.values(players).reduce((sum: number, player: any) => sum + (player.fragment || 0), 0) as number;
          
          chartData = [totalBeli, totalFragments];
          chartLabels = ['Beli', 'Fragments'];
          chartColors = [
            'rgba(34, 197, 94, 0.8)',
            'rgba(147, 51, 234, 0.8)'
          ];
        } else {
          const accounts = gameData.accounts || {};
          const pocketMoney = Object.values(accounts).reduce((sum: number, acc: any) => sum + (acc.pocketMoney || acc.money || 0), 0) as number;
          const atmMoney = Object.values(accounts).reduce((sum: number, acc: any) => sum + (acc.atmMoney || acc.bankMoney || 0), 0) as number;
          
          chartData = [pocketMoney, atmMoney];
          chartLabels = ['Pocket Money', 'ATM Money'];
          chartColors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(147, 51, 234, 0.8)'
          ];
        }

        const hasData = chartData.some(v => v > 0);
        if (!hasData) {
          chartData = [1, 1];
        }
        
        const solidColors = ['rgba(59, 130, 246, 1)', 'rgba(147, 51, 234, 1)'];
        const fadeColors  = ['rgba(59, 130, 246, 0.2)', 'rgba(147, 51, 234, 0.2)'];
        if (selectedGame === 'Bloxfruit') {
          solidColors[0] = 'rgba(34, 197, 94, 1)';
          fadeColors[0]  = 'rgba(34, 197, 94, 0.2)';
        }
        const gradients = chartColors.map((_color, i) => {
          const grad = ctx.createLinearGradient(0, 0, moneyCanvas.width, 0);
          grad.addColorStop(0, solidColors[i] || solidColors[0]);
          grad.addColorStop(1, fadeColors[i]  || fadeColors[0]);
          return grad;
        });

        moneyChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartLabels,
            datasets: [{
              data: chartData,
              backgroundColor: gradients,
              borderColor: chartColors.map(c => c.replace('0.8', '1')),
              borderWidth: 0,
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutQuart' },
            layout: { padding: { right: 16 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 20, 35, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  label: (context) => {
                    if (!hasData) return ' No data yet';
                    return '  ' + formatMoney(context.parsed.x);
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: 'rgba(255,255,255,0.05)',
                  drawTicks: false,
                },
                border: { display: false },
                ticks: {
                  color: '#6b7280',
                  font: { size: 10 },
                  callback: (value) => hasData ? '฿' + Number(value).toLocaleString() : '',
                  maxTicksLimit: 4,
                }
              },
              y: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 13, weight: '600' },
                  padding: 8,
                }
              }
            }
          }
        });
      }
    }

    // Account Status Chart
    if (statusChartRef.current) {
      const statusCanvas = statusChartRef.current;
      statusCanvas.width = statusCanvas.offsetWidth || 300;
      statusCanvas.height = 160;

      const ctx = statusCanvas.getContext('2d');
      if (ctx) {
        const accountEntries = Object.entries(gameData.accounts || {});
        const barLabels = accountEntries.map(([name]) => name.length > 10 ? name.slice(0, 10) + '…' : name);
        const barColors = accountEntries.map(([, acc]: [string, any]) =>
          getAccountStatus(acc) === 'online'
            ? 'rgba(34, 197, 94, 0.85)'
            : 'rgba(239, 68, 68, 0.7)'
        );
        const barBorderColors = accountEntries.map(([, acc]: [string, any]) =>
          getAccountStatus(acc) === 'online' ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
        );
        const barValues = accountEntries.map(([, acc]: [string, any]) =>
          getAccountStatus(acc) === 'online' ? 1 : 0.4
        );

        statusChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: barLabels.length > 0 ? barLabels : ['No accounts'],
            datasets: [{
              label: 'Status',
              data: barValues.length > 0 ? barValues : [0],
              backgroundColor: barColors.length > 0 ? barColors : ['rgba(107,114,128,0.5)'],
              borderColor: barBorderColors.length > 0 ? barBorderColors : ['rgba(107,114,128,1)'],
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutBounce' },
            layout: { padding: { top: 8 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 20, 35, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  label: (context) => {
                    const entry = accountEntries[context.dataIndex];
                    if (!entry) return '';
                    const status = getAccountStatus(entry[1] as any);
                    return '  ' + (status === 'online' ? '🟢 Online' : '🔴 Offline');
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: '#9ca3af',
                  font: { size: 11 },
                  maxRotation: 30,
                }
              },
              y: {
                display: false,
                min: 0,
                max: 1.2,
                grid: { display: false },
              }
            }
          }
        });
      }
    }
  }, [gameData, selectedGame]);

  // BUG FIX 3: Chart cleanup — only destroy on unmount, not on every re-render
  useEffect(() => {
    if (!gameData) return;

    const rafId = requestAnimationFrame(() => {
      updateCharts();
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [updateCharts]);

  // Separate cleanup on unmount only
  useEffect(() => {
    return () => {
      if (moneyChartInstance.current) {
        moneyChartInstance.current.destroy();
        moneyChartInstance.current = null;
      }
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
        statusChartInstance.current = null;
      }
    };
  }, []);

  const copyScript = () => {
    if (!universalKey) {
      toast.error('ไม่มี Universal Key สำหรับบัญชีนี้');
      return;
    }

    const script = `-- Slumzick Dashboard Script
-- Generated: ${new Date().toLocaleString()}
-- Universal Key: ${universalKey}
-- Works with all games

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Dashboard Configuration
local DASHBOARD_KEY = "${universalKey}"
local DASHBOARD_URL = "http://localhost:8081/api/dashboard/update"
local UPDATE_INTERVAL = 5 -- seconds

-- Game Configuration (auto-detected)
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
        sessionProfit = 0,
        items = {},
        stats = {
            totalMoney = (LocalPlayer.Data and LocalPlayer.Data.Money.Value or 0) + (LocalPlayer.Data and LocalPlayer.Data.BankMoney.Value or 0),
            level = LocalPlayer.Data and LocalPlayer.Data.Level.Value or 0,
            onlineTime = os.time()
        }
    }
    
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

local initialMoney = LocalPlayer.Data and LocalPlayer.Data.Money.Value or 0

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
    if (!universalKey) {
      toast.error('ไม่พบ Universal Key สำหรับบัญชีนี้');
      return;
    }

    const script = `-- ============================================
-- Kunlun Dashboard Script (Universal Key Version)
-- ============================================
-- Universal Key: ${universalKey}
-- Works with all games
-- Generated: ${new Date().toISOString()}

getgenv().Kunlun_Settings = {
    dashboard_key = "${universalKey}",
    game_name = "${selectedGame}"
};`;

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kunlun-${selectedGame.toLowerCase()}-${universalKey.slice(-8)}.lua`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('ดาวน์โหลดสคริปต์สำเร็จ!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToClipboard(true);
      toast.success('คัดลอกคอลัมน์แล้ว!');
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }).catch(() => {
      toast.error('ไม่สามารถคัดลอกได้');
    });
  };

  const sendToSheet = async () => {
    if (!sheetApiUrl.trim()) {
      toast.error('กรุณาใส่ SheetDB API URL');
      return;
    }
    if (selectedAccounts.size === 0) {
      toast.error('กรุณาเลือกบัญชีที่ต้องการส่ง');
      return;
    }

    setIsSendingSheet(true);
    try {
      const accounts = gameData?.accounts || {};
      const rows = Array.from(selectedAccounts).map(key => {
        const acc = accounts[key] || {};
        return {
          Username: key,
          Game: selectedGame,
          Status: getAccountStatus(acc),
          Level: acc.level || 0,
          Money: acc.money || acc.pocketMoney || 0,
          ATM_Money: acc.atmMoney || acc.bankMoney || 0,
          Fragments: acc.fragment || 0,
          Race: acc.race || '',
          Bounty: acc.bounty || 0,
          Session_Profit: getSessionProfit(key, acc),
          Last_Update: formatLastUpdate(acc),
          Timestamp: new Date().toLocaleString('th-TH'),
        };
      });

      const url = sheetApiUrl.trim().replace(/\/+$/, '');

      let hasValidHeader = false;
      
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (getResponse.ok) {
          const data = await getResponse.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            const firstRow = data[0];
            const expectedColumns = Object.keys(rows[0]);
            
            const isHeaderRow = expectedColumns.every(col => 
              firstRow.hasOwnProperty(col) && firstRow[col] === col
            );
            
            if (isHeaderRow) {
              hasValidHeader = true;
            }
          }
        }
      } catch (error) {
        console.log('Error checking sheet:', error);
      }

      if (!hasValidHeader) {
        throw new Error('กรุณาสร้าง header row ใน Google Sheets ก่อนส่งข้อมูล โดยคัดลองคอลัมน์จาก popup แล้ววางในแถวแรก');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ data: rows }),
      });

      if (response.ok) {
        toast.success(`ส่งข้อมูล ${selectedAccounts.size} บัญชีไปยัง Google Sheet สำเร็จ!`);
        setSelectedAccounts(new Set());
        setShowSheetModal(false);
        setSheetApiUrl('');
      } else {
        const errorText = await response.text().catch(() => response.statusText);
        toast.error(`SheetDB error ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSendingSheet(false);
    }
  };

  const generateKey = async () => {
    try {
      setIsGeneratingKey(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/dashboard/generate-universal-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: currentUser?.id
        })
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        if (result.success && result.universalKey) {
          setUniversalKey(result.universalKey);
          toast.success('สร้าง Universal Key สำเร็จ!');
        } else {
          toast.error(result.message || 'ไม่สามารถสร้าง Universal Key ได้');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'ไม่สามารถสร้าง Universal Key ได้');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const allAccountKeys = gameData?.accounts ? Object.keys(gameData.accounts) : [];
  const isAllSelected = allAccountKeys.length > 0 && allAccountKeys.every(k => selectedAccounts.has(k));
  const isIndeterminate = allAccountKeys.some(k => selectedAccounts.has(k)) && !isAllSelected;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(allAccountKeys));
    }
  };

  const deleteSelected = () => {
    if (selectedAccounts.size === 0) return;
    setShowDeleteDialog(true);
  };

  // BUG FIX 4: confirmDelete — snapshot the count before clearing state
  const confirmDelete = async () => {
    const accountsToDelete = Array.from(selectedAccounts);
    const deleteCount = accountsToDelete.length;
    setShowDeleteDialog(false);
    
    const token = localStorage.getItem('token');
    
    try {
      await Promise.all(accountsToDelete.map(accountKey =>
        fetch(`/api/dashboard/account?key=${universalKey}&game=${selectedGame}&account=${accountKey}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      setSelectedAccounts(new Set());
      checkKeyStatus(selectedGame);
      toast.success(`ลบ ${deleteCount} บัญชีแล้ว`);
    } catch {
      toast.error('ไม่สามารถลบบัญชีได้');
    }
  };

  const toggleAccount = (key: string) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

  // ---- Session profit: current money minus initial snapshot ----
  const getSessionProfit = (accountKey: string, account: any): number => {
    const currentMoney = account.money || account.pocketMoney || account.beli || 0;
    const initial = initialMoneyRef.current[accountKey];
    if (initial === undefined) return 0;
    return currentMoney - initial;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex flex-col">
      {/* Navbar */}
      <Navbar />
      
      <div className="flex-1 px-4 py-6 min-h-[calc(100vh-200px)]">
        <div className="flex gap-6 h-full min-h-full max-w-full">
          {/* Game Sidebar */}
          {universalKey && universalKey.length > 0 && selectedGame && (
            <div className="w-64 bg-card border border-border/50 rounded-xl p-4 h-screen sticky top-0 flex-shrink-0">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">เกม</h3>
                <div className="space-y-2">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                        selectedGame === game.id
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 rounded overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        {game.image ? (
                          <img 
                            src={getRobloxImageUrl(game.image)} 
                            alt={game.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="text-lg">{game.icon}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{game.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {universalKey ? 'มี Universal Key' : 'ไม่มี Key'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-full">
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-full bg-gradient-to-br from-background/50 to-background/30 rounded-xl p-6">
              {!selectedGame ? (
                <div className="space-y-8 min-h-[600px]">
                  <div className="text-center space-y-4 py-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      เลือกเกมที่ต้องการดู Dashboard
                    </h2>
                    <p className="text-muted-foreground text-lg">เลือกเกมจากแถบด้านซ้ายหรือการ์ดด้านล่าง</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                      <Card 
                        key={game.id}
                        className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50"
                        onClick={() => handleGameSelect(game.id)}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                              {game.image ? (
                                <img 
                                  src={getRobloxImageUrl(game.image)} 
                                  alt={game.name}
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                />
                              ) : null}
                              <div className={`text-6xl ${game.image ? 'hidden' : ''}`}>{game.icon}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold">{game.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {dashboardKeys[game.id] ? 'มี Dashboard Key' : 'ยังไม่มี Dashboard Key'}
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
                <div className="space-y-6 min-h-[800px]">

                  {/* Script Actions */}
                  <Card className="mb-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        สคริปต์ Roblox {selectedGame}
                      </CardTitle>
                      <CardDescription>
                        คัดลอกหรือดาวน์โหลดสคริปต์สำหรับเชื่อมต่อกับ Dashboard
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button onClick={copyScript} disabled={scriptCopied}>
                          {scriptCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              คัดลอกแล้ว!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Script
                            </>
                          )}
                        </Button>
                        <Button onClick={downloadScript} variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download Script
                        </Button>
                      </div>
                      
                      {keyStatus && keyStatus.status === 'no_key' && (
                        <div className="text-center py-8 mt-4">
                          <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Dashboard Key</h3>
                          <p className="text-muted-foreground mb-4">Dashboard Key สำหรับบัญชีของคุณ:</p>
                          <div className="bg-muted/50 rounded-lg p-4 mb-4">
                            <code className="text-sm font-mono break-all">
                              {universalKey || 'ยังไม่มี Universal Key'}
                            </code>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            คัดลอง key นี้และใช้ในสคริปต์ Roblox เพื่อเชื่อมต่อกับ Dashboard
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
                    <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Active Accounts</p>
                            <p className="text-xl md:text-2xl font-bold text-green-500">
                              {gameData?.stats?.activeAccounts || 0}
                            </p>
                          </div>
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Activity className="w-4 h-4 md:w-6 md:h-6 text-green-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Total Money</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-500">
                              {formatMoney(gameData?.stats?.totalMoney || 0)}
                            </p>
                          </div>
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Avg Level</p>
                            <p className="text-xl md:text-2xl font-bold text-purple-500">
                              {Math.round(gameData?.stats?.avgLevel || 0)}
                            </p>
                          </div>
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-purple-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm text-muted-foreground">Total Accounts</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-500">
                              {gameData?.stats?.totalPlayers || 0}
                            </p>
                          </div>
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monitor Panels */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                    {/* Item Monitor */}
                    <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                          <Package className="w-4 h-4 md:w-5 md:h-5" />
                          Item Monitor
                        </CardTitle>
                        <Select>
                          <SelectTrigger className="w-[140px] md:w-[180px] h-8 text-xs md:text-sm">
                            <SelectValue placeholder="All items" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="all" value="all">All ({items.length})</SelectItem>
                            {Array.from(new Set(items.map(item => item.category))).map((category, index) => (
                              <SelectItem key={`${category}-${index}`} value={category}>
                                {category} ({items.filter(item => item.category === category).length})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {items.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 max-h-48 md:max-h-64 overflow-y-auto">
                            {items.slice(0, 12).map((item, index) => (
                              <div key={`${item.name}-${index}`} className="flex items-center gap-2 p-2 md:p-3 bg-gradient-to-r from-secondary/80 to-secondary/60 rounded-lg border border-border/50">
                                <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                  {item.image ? (
                                    item.sprite && item.category !== 'fruit' ? (
                                      (() => {
                                        const sprite = item.sprite;
                                        const scale = Math.min(24 / sprite.w, 24 / sprite.h);
                                        const translateX = -sprite.x * scale + (24 - sprite.w * scale) / 2;
                                        const translateY = -sprite.y * scale + (24 - sprite.h * scale) / 2;
                                        
                                        return (
                                          <div className="w-6 h-6 overflow-hidden relative">
                                            <img 
                                              src={getRobloxImageUrl(item.image)}
                                              alt={item.name}
                                              style={{
                                                position: 'absolute',
                                                left: '0px',
                                                top: '0px',
                                                width: 'auto',
                                                height: 'auto',
                                                maxWidth: 'none',
                                                maxHeight: 'none',
                                                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                                                transformOrigin: 'top left',
                                                objectFit: 'none',
                                                borderRadius: '0px'
                                              }}
                                            />
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <img 
                                        src={getRobloxImageUrl(item.image)} 
                                        alt={item.name} 
                                        className="w-6 h-6 object-contain" 
                                        onError={handleImageError}
                                      />
                                    )
                                  ) : (
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate text-white">{item.name}</p>
                                  <p className={`text-xs font-bold ${item.count === 0 ? 'text-red-500' : 'text-green-500'}`}>x{item.count}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No items found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Charts */}
                    <div className="space-y-4">
                      <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Money Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div style={{ position: 'relative', height: '140px' }}>
                            <canvas ref={moneyChartRef} style={{ position: 'absolute', inset: 0 }} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Account Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div style={{ position: 'relative', height: '160px' }}>
                            <canvas ref={statusChartRef} style={{ position: 'absolute', inset: 0 }} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Accounts Table */}
                  <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        บัญชีทั้งหมด {selectedGame}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search accounts..."
                              className="w-full pl-10 pr-4 py-2 border border-border/50 rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <Select>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                              <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedAccounts.size > 0 && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSheetModal(true)}
                                className="bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                              >
                                <Sheet className="w-4 h-4 mr-2" />
                                Send to Sheet ({selectedAccounts.size})
                              </Button>
                              <Button variant="destructive" size="sm" onClick={deleteSelected}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete ({selectedAccounts.size})
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-muted/80 to-muted/60 border-b border-border/50">
                                <tr>
                                  {selectedGame === 'Blockspin' ? (
                                    <>
                                      <th className="px-4 py-4 border-r border-border/30 w-10">
                                        <input
                                          type="checkbox"
                                          checked={isAllSelected}
                                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                          onChange={toggleAll}
                                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                        />
                                      </th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Status</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Username</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Game</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Level</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Pocket Money</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">ATM Money</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Total Money</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Swiper</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Shelf Stocker</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Janitor</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Fishing</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Plant Farming</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Steak</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Session Profit</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Last Update</th>
                                      <th className="px-6 py-4 text-center text-xs font-bold text-foreground/70 uppercase tracking-wider">Actions</th>
                                    </>
                                  ) : selectedGame === 'PetSimulator99' ? (
                                    <>
                                      <th className="px-4 py-4 border-r border-border/30 w-10">
                                        <input
                                          type="checkbox"
                                          checked={isAllSelected}
                                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                          onChange={toggleAll}
                                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                        />
                                      </th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Status</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Username</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Game</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Level</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Diamonds</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Rapids</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Total Value</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Pets</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Eggs</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Enchants</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Areas</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Booth</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Session Profit</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Last Update</th>
                                      <th className="px-6 py-4 text-center text-xs font-bold text-foreground/70 uppercase tracking-wider">Actions</th>
                                    </>
                                  ) : selectedGame === 'Bloxfruit' ? (
                                    <>
                                      <th className="px-4 py-4 border-r border-border/30 w-10">
                                        <input
                                          type="checkbox"
                                          checked={isAllSelected}
                                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                          onChange={toggleAll}
                                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                        />
                                      </th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Status</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Username</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Game</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Level</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Beli</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Fragments</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Fruits</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Swords</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Guns</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Accessories</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Race</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Bounty</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Fighting Style</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Session Profit</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Last Update</th>
                                      <th className="px-6 py-4 text-center text-xs font-bold text-foreground/70 uppercase tracking-wider">Actions</th>
                                    </>
                                  ) : (
                                    <>
                                      <th className="px-4 py-4 border-r border-border/30 w-10">
                                        <input
                                          type="checkbox"
                                          checked={isAllSelected}
                                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                          onChange={toggleAll}
                                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                        />
                                      </th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Status</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Username</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Game</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Level</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Money</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Items</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Stats</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Session Profit</th>
                                      <th className="px-6 py-4 text-left text-xs font-bold text-foreground/70 uppercase tracking-wider border-r border-border/30">Last Update</th>
                                      <th className="px-6 py-4 text-center text-xs font-bold text-foreground/70 uppercase tracking-wider">Actions</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 bg-background/50">
                                {gameData && gameData.accounts && Object.keys(gameData.accounts).length > 0 ? (
                                  Object.entries(gameData.accounts).map(([username, account]: [string, any], index: number) => {
                                    const realStatus = getAccountStatus(account);
                                    
                                    return (
                                      <tr key={`${username || 'account'}-${index}`} className="hover:bg-muted/40 transition-colors border-b border-border/20">
                                        {selectedGame === 'Blockspin' ? (
                                          <>
                                            <td className="px-4 py-4 border-r border-border/20">
                                              <input
                                                type="checkbox"
                                                checked={selectedAccounts.has(username)}
                                                onChange={() => toggleAccount(username)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                              />
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${realStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                <span className={`text-sm font-medium ${realStatus === 'online' ? 'text-green-500' : 'text-red-400'}`}>{realStatus}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="flex items-center gap-3">
                                                {account.avatar_url ? (
                                                  <img 
                                                    src={account.avatar_url} 
                                                    alt={username}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                                                    onError={(e) => {
                                                      e.currentTarget.src = '';
                                                      e.currentTarget.style.display = 'none';
                                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                  />
                                                ) : null}
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center ring-2 ring-primary/20 ${account.avatar_url ? 'hidden' : ''}`}>
                                                  <Users className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                  <span className="font-semibold text-foreground">{username}</span>
                                                  <div className="text-xs text-muted-foreground">{account.id || username}</div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-medium">{selectedGame}</Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-bold text-foreground">{account.level || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-semibold text-blue-500">{formatMoney(account.pocketMoney || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-semibold text-purple-500">{formatMoney(account.atmMoney || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-bold text-green-500">{formatMoney(account.money || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant={account.jobs?.swiper ? 'default' : 'secondary'} className="font-medium">
                                                {account.jobs?.swiper ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant={account.jobs?.shelfStocker ? 'default' : 'secondary'} className="font-medium">
                                                {account.jobs?.shelfStocker ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant={account.jobs?.janitor ? 'default' : 'secondary'} className="font-medium">
                                                {account.jobs?.janitor ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant={account.jobs?.fishing ? 'default' : 'secondary'}>
                                                {account.jobs?.fishing ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant={account.jobs?.plantFarming ? 'default' : 'secondary'}>
                                                {account.jobs?.plantFarming ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant={account.jobs?.steak ? 'default' : 'secondary'}>
                                                {account.jobs?.steak ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className={`text-sm font-medium ${getSessionProfit(username, account) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {getSessionProfit(username, account) >= 0 ? '+' : ''}{formatMoney(getSessionProfit(username, account))}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-xs text-muted-foreground">{formatLastUpdate(account)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                              <Button variant="outline" size="sm">
                                                <Settings className="w-4 h-4" />
                                              </Button>
                                            </td>
                                          </>
                                        ) : selectedGame === 'PetSimulator99' ? (
                                          <>
                                            <td className="px-4 py-4 border-r border-border/20">
                                              <input
                                                type="checkbox"
                                                checked={selectedAccounts.has(username)}
                                                onChange={() => toggleAccount(username)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                              />
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${realStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                <span className={`text-sm font-medium ${realStatus === 'online' ? 'text-green-500' : 'text-red-400'}`}>{realStatus}</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                                  <Users className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <span className="font-medium">{account.username || username}</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant="outline">{selectedGame}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-sm">{account.level || 0}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-sm font-medium text-blue-500">{formatNumber(account.diamonds || 0)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-sm font-medium text-purple-500">{formatNumber(account.rapids || 0)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-sm font-bold text-green-500">{formatMoney(account.totalValue || 0)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.pets?.length > 0 ? 'default' : 'secondary'}>
                                                {account.pets?.length || 0} Pets
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.eggs?.length > 0 ? 'default' : 'secondary'}>
                                                {account.eggs?.length || 0} Eggs
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.enchants?.length > 0 ? 'default' : 'secondary'}>
                                                {account.enchants?.length || 0}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.areas?.unlocked ? 'default' : 'secondary'}>
                                                {account.areas?.current || 'Unknown'}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.booth?.active ? 'default' : 'secondary'}>
                                                {account.booth?.active ? 'Active' : 'Inactive'}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className={`text-sm font-medium ${getSessionProfit(username, account) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {getSessionProfit(username, account) >= 0 ? '+' : ''}{formatMoney(getSessionProfit(username, account))}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-xs text-muted-foreground">{formatLastUpdate(account)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Button variant="outline" size="sm">
                                                <Settings className="w-4 h-4" />
                                              </Button>
                                            </td>
                                          </>
                                        ) : selectedGame === 'Bloxfruit' ? (
                                          <>
                                            <td className="px-4 py-4 border-r border-border/20">
                                              <input
                                                type="checkbox"
                                                checked={selectedAccounts.has(username)}
                                                onChange={() => toggleAccount(username)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                              />
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${realStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                <span className={`text-sm font-medium ${realStatus === 'online' ? 'text-green-500' : 'text-red-400'}`}>{realStatus}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="flex items-center gap-3">
                                                {account.avatar_url ? (
                                                  <img 
                                                    src={account.avatar_url} 
                                                    alt={username}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                                                    onError={(e) => {
                                                      e.currentTarget.src = '';
                                                      e.currentTarget.style.display = 'none';
                                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                  />
                                                ) : null}
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center ring-2 ring-primary/20 ${account.avatar_url ? 'hidden' : ''}`}>
                                                  <Users className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                  <span className="font-semibold text-foreground">{username}</span>
                                                  <div className="text-xs text-muted-foreground">{account.id || username}</div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-medium">{selectedGame}</Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-bold text-foreground">{account.level || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-semibold text-green-500">{formatMoney(account.money || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-semibold text-purple-500">{formatNumber(account.fragment || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="text-sm font-medium">
                                                {Array.isArray(account.fruit_inventory) && account.fruit_inventory.length > 0 
                                                  ? account.fruit_inventory[0]?.name || account.fruit_inventory[0] || 'None'
                                                  : Array.isArray(account.fruits) && account.fruits.length > 0
                                                  ? account.fruits[0]?.name || account.fruits[0] || 'None'
                                                  : 'None'
                                                }
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="text-sm font-medium">
                                                {Array.isArray(account.sword) && account.sword.length > 0 
                                                  ? account.sword[0]?.name || account.sword[0] || 'None'
                                                  : Array.isArray(account.swords) && account.swords.length > 0
                                                  ? account.swords[0]?.name || account.swords[0] || 'None'
                                                  : 'None'
                                                }
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="text-sm font-medium">
                                                {Array.isArray(account.gun) && account.gun.length > 0 
                                                  ? account.gun[0]?.name || account.gun[0] || 'None'
                                                  : Array.isArray(account.guns) && account.guns.length > 0
                                                  ? account.guns[0]?.name || account.guns[0] || 'None'
                                                  : 'None'
                                                }
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="text-sm font-medium">
                                                {Array.isArray(account.accessories) && account.accessories.length > 0 
                                                  ? account.accessories[0]?.name || account.accessories[0] || 'None'
                                                  : 'None'
                                                }
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-medium">{account.race || 'Unknown'}</Badge>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-sm font-bold text-yellow-400">
                                                {account.bounty != null ? formatNumber(account.bounty) : '—'}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <div className="text-sm font-medium">
                                                {Array.isArray(account.melee) && account.melee.length > 0 
                                                  ? account.melee[0]?.name || account.melee[0] || 'None'
                                                  : account.fightingStyle || 'None'
                                                }
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className={`text-sm font-bold ${getSessionProfit(username, account) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {getSessionProfit(username, account) >= 0 ? '+' : ''}{formatMoney(getSessionProfit(username, account))}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-border/20">
                                              <span className="text-xs text-muted-foreground">{formatLastUpdate(account)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                              <Button variant="outline" size="sm" className="bg-primary/10 border-primary/20 hover:bg-primary/20">
                                                <Settings className="w-4 h-4" />
                                              </Button>
                                            </td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="px-4 py-4 border-r border-border/20">
                                              <input
                                                type="checkbox"
                                                checked={selectedAccounts.has(username)}
                                                onChange={() => toggleAccount(username)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                              />
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${realStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                <span className={`text-sm font-medium ${realStatus === 'online' ? 'text-green-500' : 'text-red-400'}`}>{realStatus}</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                                  <Users className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <span className="font-medium">{account.username || username}</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant="outline">{selectedGame}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-sm">{account.level || 0}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-sm font-medium">{formatMoney(account.money || 0)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.items?.length > 0 ? 'default' : 'secondary'}>
                                                {account.items?.length || 0} Items
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Badge variant={account.stats ? 'default' : 'secondary'}>
                                                {account.stats ? 'Available' : 'None'}
                                              </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className={`text-sm font-medium ${getSessionProfit(username, account) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {getSessionProfit(username, account) >= 0 ? '+' : ''}{formatMoney(getSessionProfit(username, account))}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span className="text-xs text-muted-foreground">{formatLastUpdate(account)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <Button variant="outline" size="sm">
                                                <Settings className="w-4 h-4" />
                                              </Button>
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={selectedGame === 'Blockspin' ? 17 : selectedGame === 'PetSimulator99' ? 16 : selectedGame === 'Bloxfruit' ? 17 : 11} className="px-4 py-8">
                                      <div className="text-center">
                                        <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No Data Available</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                          Run the script in Roblox to see account data here
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/30">
                          <span>Page 1 of 1</span>
                          <span>{gameData?.accounts ? Object.keys(gameData.accounts).length : 0} accounts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tutorial Section */}
                  <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        How to Add Accounts
                      </CardTitle>
                      <Button onClick={copyScript} disabled={scriptCopied}>
                        {scriptCopied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            คัดลอกแล้ว!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Script
                          </>
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {keyStatus && keyStatus.status === 'no_key' && (
                        <div className="text-center py-8">
                          <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Universal Dashboard Key</h3>
                          <p className="text-muted-foreground mb-4">Universal Key สำหรับบัญชีของคุณ:</p>
                          <div className="bg-muted/50 rounded-lg p-4 mb-4">
                            <code className="text-sm font-mono break-all">
                              {universalKey || 'ยังไม่มี Universal Key'}
                            </code>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Universal Key นี้ใช้ได้กับทุกเกม สร้างครั้งเดียวใช้ได้ตลอด
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-primary">1</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Copy the Lua Script</h4>
                            <p className="text-sm text-muted-foreground">
                              Click the Copy Script button above. You can edit Discord ID/Game Name before running in your executor.
                            </p>
                          </div>
                        </div>
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-primary">2</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Put in Autoexec Folder</h4>
                            <p className="text-sm text-muted-foreground">
                              Move the downloaded script to your executor's autoexec folder (e.g., synapse/autoexec/)
                            </p>
                          </div>
                        </div>
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-primary">3</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Done! Start Playing</h4>
                            <p className="text-sm text-muted-foreground">
                              Join any Roblox game and your account will appear in this dashboard automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send to Sheet Modal */}
      <Dialog open={showSheetModal} onOpenChange={setShowSheetModal}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sheet className="w-5 h-5 text-green-500" />
              Send to Google Sheet
            </DialogTitle>
            <DialogDescription>
              ใส่ SheetDB API URL เพื่อส่งข้อมูล {selectedAccounts.size} บัญชีที่เลือกไปยัง Google Sheet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sheet-url" className="text-sm font-medium">
                SheetDB API URL
              </Label>
              <Input
                id="sheet-url"
                placeholder="https://sheetdb.io/api/v1/xxxxxxxxxx"
                value={sheetApiUrl}
                onChange={(e) => setSheetApiUrl(e.target.value)}
                className="font-mono text-xs bg-background/50 border-border/50 focus:border-green-500/50"
              />
              <p className="text-xs text-muted-foreground">
                ไปที่ sheetdb.io → สร้าง API จาก Google Sheet → copy URL มาวาง
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">คอลัมน์ที่ต้องสร้างใน Google Sheets</p>
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>จำเป็นต้องสร้าง header row ก่อน!</strong> คัดลอกข้อความด้านล่าง แล้ววางในแถวแรก (Row 1) ของ Google Sheets:
              </p>
              <div className="bg-background/50 rounded p-2 border border-border/30">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono text-foreground break-all flex-1">
                    {selectedGame === 'Bloxfruit' 
                      ? 'Status\tUsername\tGame\tLevel\tBeli\tFragments\tFruits\tSwords\tGuns\tAccessories\tRace\tBounty\tFighting Style\tSession Profit\tLast Update'
                      : selectedGame === 'Blockspin' 
                      ? 'Status\tUsername\tGame\tLevel\tMoney\tATM Money\tFragments\tRace\tBounty\tSession Profit\tLast Update'
                      : 'Status\tUsername\tGame\tLevel\tMoney\tATM Money\tFragments\tRace\tBounty\tSession Profit\tLast Update'
                    }
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(
                      selectedGame === 'Bloxfruit' 
                        ? 'Status\tUsername\tGame\tLevel\tBeli\tFragments\tFruits\tSwords\tGuns\tAccessories\tRace\tBounty\tFighting Style\tSession Profit\tLast Update'
                        : selectedGame === 'Blockspin' 
                        ? 'Status\tUsername\tGame\tLevel\tMoney\tATM Money\tFragments\tRace\tBounty\tSession Profit\tLast Update'
                        : 'Status\tUsername\tGame\tLevel\tMoney\tATM Money\tFragments\tRace\tBounty\tSession Profit\tLast Update'
                    )}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    {copiedToClipboard ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Clipboard className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                <p className="text-xs text-yellow-700">
                  <strong>ขั้นตอน:</strong><br/>
                  1. คัดลอกคอลัมน์ด้านบน 📋<br/>
                  2. ไปที่ Google Sheets → Cell A1<br/>
                  3. วาง (Ctrl+V) → จะแยก columns อัตโนมัติ<br/>
                  4. บันทึกไฟล์ แล้วกลับมากด "Send to Sheet"
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowSheetModal(false); setSheetApiUrl(''); }}
              disabled={isSendingSheet}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={sendToSheet}
              disabled={isSendingSheet || !sheetApiUrl.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSendingSheet ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to Sheet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              ยืนยันการลบบัญชี
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="text-center">
                <p className="font-medium">
                  คุณต้องการลบ <span className="text-red-500 font-bold">{selectedAccounts.size}</span> บัญชี:
                </p>
                <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {Array.from(selectedAccounts).map((account, index) => (
                    <div key={account} className="text-sm font-mono">
                      {index + 1}. {account}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center text-red-500 font-medium">
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                ยกเลิก
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                ลบ {selectedAccounts.size} บัญชี
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;