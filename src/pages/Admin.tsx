import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Package, 
  Settings, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Coins,
  Search,
  RefreshCw,
  TrendingUp,
  Activity,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Save,
  LogOut,
  Code,
  Webhook
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/services/apiClient";
import { isAuthenticated } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import ProductManager from "@/components/admin/ProductManager";
import OrderManager from "@/components/admin/OrderManager";
import ScriptEditor from "@/components/admin/ScriptEditor";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Admin Key constant
const ADMIN_KEY_CONSTANT = "kunlun2026";

interface User {
  id: string;
  username: string;
  points: number;
  createdAt: string;
  lastLogin?: string;
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sold?: number;
  status: 'active' | 'inactive';
  image?: string;
  description?: string;
  whatYouGet?: string;
  discount?: number;
  tags?: string[];
  rewards?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [chartData, setChartData] = useState({
    categoryStats: [] as Array<{category: string, sales: number, orders: number}>,
    userGrowth: [] as Array<{month: string, users: number}>,
    categoryDistribution: [] as Array<{name: string, value: number, fill: string}>
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    points: 0
  });

  useEffect(() => {
    // Check admin key first
    const savedAdminKey = sessionStorage.getItem('adminKeyVerified');
    console.log('[DEBUG] Admin.tsx - Checking admin key:', savedAdminKey ? 'EXISTS' : 'NOT FOUND');
    
    if (savedAdminKey !== ADMIN_KEY_CONSTANT) {
      console.log('[DEBUG] Admin key not verified, redirecting to /admin-login');
      navigate("/admin-login");
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      console.log('[DEBUG] User not authenticated, redirecting to /login');
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนเข้าใช้งาน Admin Panel",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    // All checks passed - load data
    console.log('[DEBUG] All checks passed, loading admin data');
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users data
      const usersResponse = await apiClient.getAllUsers();
      if (usersResponse.success && usersResponse.users) {
        setUsers(usersResponse.users);
        setStats(prev => ({ ...prev, totalUsers: usersResponse.users.length }));
      }

      // Load stock data from API
      const stockResponse = await apiClient.getAllStock();
      if (stockResponse.success && (stockResponse as any).stock) {
        const stockData = (stockResponse as any).stock;
        setStockItems(stockData);
        
        const totalRevenue = stockData.reduce((sum: number, item: any) => sum + (item.price * (item.sold || 0)), 0);
        const totalOrders = stockData.reduce((sum: number, item: any) => sum + (item.sold || 0), 0);
        
        setStats(prev => ({ 
          ...prev, 
          totalProducts: stockData.length,
          totalRevenue,
          totalOrders
        }));

        // Generate chart data from real stock data
        generateChartData(stockData, usersResponse.users || []);
      }

      // Load announcements
      await loadAnnouncements();

    } catch (error) {
      console.error('[ERROR] Failed to load admin data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (stockData: any[], usersData: any[]) => {
    // Generate category stats from real data
    const categoryMap = new Map();
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28'];
    
    stockData.forEach(item => {
      const category = item.category || 'อื่น ๆ';
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category);
        categoryMap.set(category, {
          category,
          sales: existing.sales + (item.price * (item.sold || 0)),
          orders: existing.orders + (item.sold || 0),
          count: existing.count + 1
        });
      } else {
        categoryMap.set(category, {
          category,
          sales: item.price * (item.sold || 0),
          orders: item.sold || 0,
          count: 1
        });
      }
    });

    const categoryStats = Array.from(categoryMap.values()).sort((a, b) => b.sales - a.sales);

    // Generate category distribution for pie chart
    const totalProducts = stockData.length;
    const categoryDistribution = categoryStats.map((item, index) => ({
      name: item.category,
      value: Math.round((item.count / totalProducts) * 100),
      fill: colors[index % colors.length]
    }));

    // Generate user growth data (mock data based on current users)
    const currentMonth = new Date().getMonth();
    const userGrowth = [];
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const userCount = Math.max(1, Math.floor(usersData.length * (0.3 + (i * 0.12))));
      userGrowth.push({
        month: monthNames[monthIndex],
        users: userCount
      });
    }

    setChartData({
      categoryStats: categoryStats.slice(0, 5), // Top 5 categories
      userGrowth,
      categoryDistribution: categoryDistribution.slice(0, 5) // Top 5 for pie chart
    });
  };

  const loadAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.announcements) {
          setAnnouncements(data.announcements);
          setAnnouncementText(data.announcements.join('\n'));
        }
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const saveAnnouncements = async () => {
    try {
      const messages = announcementText.split('\n').filter(line => line.trim());
      
      // Get fresh token
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "กรุณาเข้าสู่ระบบใหม่",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      const response = await fetch('/api/announcements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAnnouncements(messages);
        toast({
          title: "สำเร็จ",
          description: "บันทึกประกาศแล้ว"
        });
      } else {
        throw new Error(data.message || 'Failed to save announcements');
      }
    } catch (error) {
      console.error('Save announcements error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "ไม่สามารถบันทึกประกาศได้",
        variant: "destructive"
      });
    }
  };

  const updateUserPoints = async (userId: string, newPoints: number) => {
    try {
      const response = await apiClient.updateUserPoints(userId, newPoints);
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, points: newPoints } : user
        ));
        
        toast({
          title: "สำเร็จ",
          description: "อัพเดทพอยต์แล้ว"
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "ไม่สามารถอัพเดทพอยต์ได้",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`ยืนยันการลบผู้ใช้ "${username}"?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteUser(userId);
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        
        toast({
          title: "สำเร็จ",
          description: `ลบผู้ใช้ ${username} แล้ว`
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive"
      });
    }
  };

  const addUser = async () => {
    try {
      // Validate input
      if (!newUser.username.trim() || !newUser.password.trim()) {
        toast({
          title: "Error",
          description: "กรุณากรอกข้อมูลให้ครบถ้วน",
          variant: "destructive"
        });
        return;
      }

      // Check if username already exists
      const existingUser = users.find(u => u.username === newUser.username);
      
      if (existingUser) {
        toast({
          title: "Error",
          description: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว",
          variant: "destructive"
        });
        return;
      }

      // Create new user via API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add user to local state
        const createdUser = {
          id: data.user.id,
          username: newUser.username,
          points: newUser.points,
          createdAt: new Date().toISOString()
        };
        
        setUsers(prev => [...prev, createdUser]);
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        
        // Reset form and close modal
        setNewUser({
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          points: 0
        });
        setShowAddUserModal(false);
        
        toast({
          title: "สำเร็จ",
          description: "เพิ่มผู้ใช้ใหม่แล้ว"
        });
      } else {
        throw new Error(data.message || 'Failed to create user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "ไม่สามารถเพิ่มผู้ใช้ได้",
        variant: "destructive"
      });
    }
  };

  const handleProductUpdate = async (product: StockItem) => {
    try {
      const response = await apiClient.updateProduct(product.id, product);
      if (response.success) {
        await loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleProductAdd = async (product: StockItem) => {
    try {
      const response = await apiClient.createProduct(product);
      if (response.success) {
        await loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleProductDelete = async (productId: string) => {
    try {
      const response = await apiClient.deleteProduct(productId);
      if (response.success) {
        await loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบ Admin หรือไม่?')) {
      sessionStorage.removeItem('adminKeyVerified');
      localStorage.removeItem('token');
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "คุณได้ออกจากระบบ Admin แล้ว"
      });
      navigate('/');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">จัดการระบบ Kunlun</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                รีเฟรช
              </Button>
              <Button onClick={() => navigate("/")} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                ดูเว็บไซต์
              </Button>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ฿{stats.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">คำสั่งซื้อ</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหา..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              แดชบอร์ด
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              จัดการผู้ใช้
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              จัดการสินค้า
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              จัดการ Scripts
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              ประกาศ
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              ตั้งค่า
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab with Charts */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    ยอดขายตามหมวดหมู่
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'sales' ? `฿${value.toLocaleString()}` : value,
                            name === 'sales' ? 'ยอดขาย' : 'ออร์เดอร์'
                          ]}
                        />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    การเติบโตของผู้ใช้
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} คน`, 'จำนวนผู้ใช้']} />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pie Chart for Product Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  สัดส่วนสินค้าตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'สัดส่วน']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    จัดการผู้ใช้
                  </CardTitle>
                  <Button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    เพิ่มผู้ใช้ใหม่
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.username}</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{user.points || 0} พอยต์</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            สมัคร: {new Date(user.createdAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newPoints = prompt("กรอกพอยต์ใหม่:", user.points?.toString() || "0");
                              if (newPoints !== null && !isNaN(Number(newPoints))) {
                                updateUserPoints(user.id, Number(newPoints));
                              }
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.id, user.username)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      ไม่พบผู้ใช้
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Management */}
          <TabsContent value="products" className="space-y-4">
            <ProductManager
              products={stockItems}
              onProductUpdate={handleProductUpdate}
              onProductAdd={handleProductAdd}
              onProductDelete={handleProductDelete}
            />
          </TabsContent>

          {/* Scripts Management */}
          <TabsContent value="scripts" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">🎮 Roblox Scripts Manager</h3>
                <p className="text-sm text-muted-foreground">จัดการ scripts สำหรับ Roblox executor</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/webhook-logs')}
                className="flex items-center gap-2"
              >
                <Webhook className="w-4 h-4" />
                Webhook Logs
              </Button>
            </div>
            <ScriptEditor />
          </TabsContent>

          {/* Announcements Management */}
          <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  จัดการประกาศ
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  แก้ไขประกาศที่จะแสดงใน banner ของเว็บไซต์ (แต่ละบรรทัดจะเป็นข้อความแยก)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    ข้อความประกาศ
                  </label>
                  <Textarea
                    placeholder="ใส่ข้อความประกาศแต่ละบรรทัด&#10;🎉 ยินดีต้อนรับสู่ Kunlun!&#10;⚡ โปรโมชั่นพิเศษ! ลดราคาสินค้าทุกชิ้น 20%&#10;🔥 สินค้าใหม่มาแล้ว!"
                    rows={8}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    {announcements.length} ข้อความประกาศ
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={loadAnnouncements}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      รีเฟรช
                    </Button>
                    <Button onClick={saveAnnouncements}>
                      <Save className="w-4 h-4 mr-2" />
                      บันทึก
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">ตัวอย่าง</h4>
                  <div className="w-full bg-gradient-to-r from-primary/80 via-accent/70 to-primary/80 py-3 overflow-hidden relative border-y border-border/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-pulse flex items-center whitespace-nowrap px-4">
                        {announcementText.split('\n').filter(line => line.trim()).map((message, index) => (
                          <span key={index} className="text-primary-foreground font-semibold text-sm px-4">
                            {message}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  ตั้งค่าระบบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    ฟีเจอร์ตั้งค่าจะเปิดให้ใช้งานเร็วๆ นี้
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>เพิ่มผู้ใช้ใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="กรอกชื่อผู้ใช้"
                />
              </div>
              <div>
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="กรอกรหัสผ่าน"
                />
              </div>
              <div>
                <Label htmlFor="firstName">ชื่อจริง</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  placeholder="กรอกชื่อจริง"
                />
              </div>
              <div>
                <Label htmlFor="lastName">นามสกุล</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  placeholder="กรอกนามสกุล"
                />
              </div>
              <div>
                <Label htmlFor="points">พอยต์เริ่มต้น</Label>
                <Input
                  id="points"
                  type="number"
                  value={newUser.points}
                  onChange={(e) => setNewUser({ ...newUser, points: Number(e.target.value) })}
                  placeholder="กรอกพอยต์เริ่มต้น"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                ยกเลิก
              </Button>
              <Button onClick={addUser}>
                เพิ่มผู้ใช้
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Admin;