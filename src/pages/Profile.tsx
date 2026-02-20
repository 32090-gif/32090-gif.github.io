import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getToken, getCurrentUser, isAuthenticated as checkAuthentication } from '@/services/authService';
import { toast } from 'sonner';
import { User, Calendar, Package, Star, Trophy, Camera, Edit2, Save, X } from 'lucide-react';
import { useNavigate, useSearchParams } from "react-router-dom";

// Environment variable for API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''  // Production: use relative path
  : ''; // Development: use relative path (proxy will handle it)

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  points: number;
  title?: string;
  level: string;
  badges: string[];
}

const USER_TITLES = [
  { name: 'แฟนตัวยง', minOrders: 1, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'ลูกค้าประจำ', minOrders: 5, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'นักสะสม', minOrders: 10, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'VIP', minOrders: 25, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { name: 'ตำนาน', minOrders: 50, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const Profile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isViewingOtherUser, setIsViewingOtherUser] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const targetUsername = searchParams.get('user');
    
    if (targetUsername) {
      // Viewing another user's profile
      fetchOtherUserProfile(targetUsername);
    } else {
      // Viewing own profile
      if (!checkAuthentication()) {
        navigate('/login');
        return;
      }
      fetchUserProfile();
    }
  }, [navigate, searchParams]);

  const fetchOtherUserProfile = async (username: string) => {
    try {
      setLoading(true);
      setIsViewingOtherUser(true);
      
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Get all users and find the target user
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const targetUser = data.users.find((u: any) => u.username === username);
        
        if (targetUser) {
          // Mock profile data for other users
          const profileData: UserProfile = {
            id: targetUser.id,
            username: targetUser.username,
            email: targetUser.email,
            firstName: targetUser.firstName || '',
            lastName: targetUser.lastName || '',
            avatar: targetUser.avatar || '',
            joinDate: targetUser.createdAt,
            totalOrders: 0, // Would need separate API to get this
            totalSpent: 0,
            points: targetUser.points || 0,
            title: 'สมาชิก',
            level: 'Member',
            badges: targetUser.points >= 1000 ? ['นักสะสมพอยต์'] : []
          };
          setUserProfile(profileData);
          setAvatarPreview(getAvatarUrl(profileData.avatar || ''));
        } else {
          toast.error('ไม่พบผู้ใช้ที่ค้นหา');
          navigate('/profile');
        }
      }
    } catch (error) {
      console.error('Error fetching other user profile:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = getToken();
      const currentUser = getCurrentUser();
      
      if (!token || !currentUser) {
        navigate('/login');
        return;
      }

      // Fetch real profile data from API
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      
      if (data.success) {
        // Map API response to UserProfile interface
        const userProfile: UserProfile = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          avatar: data.user.avatar,
          joinDate: data.user.createdAt,
          totalOrders: 0, // Default values since API doesn't provide them
          totalSpent: 0,
          points: 0,
          level: 'แฟนตัวยง',
          badges: []
        };
        
        setUserProfile(userProfile);
        setEditUsername(userProfile.username);
        setAvatarPreview(getAvatarUrl(userProfile.avatar || ''));
      } else {
        throw new Error(data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  };

  const getUserTitle = (orderCount: number) => {
    const title = USER_TITLES.reverse().find(t => orderCount >= t.minOrders);
    return title || USER_TITLES[0];
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const token = getToken();
      if (!token) {
        toast.error('ไม่พบข้อมูลการยืนยันตัวตน');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('username', editUsername);
      formData.append('firstName', userProfile?.firstName || '');
      formData.append('lastName', userProfile?.lastName || '');
      formData.append('email', userProfile?.email || '');
      
      // Append avatar file only if it's a file (not base64)
      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - FormData will set it automatically with boundary
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state with response data
        const updatedProfile = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          avatar: data.user.avatar,
          joinDate: data.user.createdAt,
          totalOrders: userProfile?.totalOrders || 0,
          totalSpent: userProfile?.totalSpent || 0,
          points: userProfile?.points || 0,
          level: userProfile?.level || 'แฟนตัวยง',
          badges: userProfile?.badges || []
        };
        
        setUserProfile(updatedProfile);
        setEditUsername(updatedProfile.username);
        setAvatarPreview(getAvatarUrl(updatedProfile.avatar || ''));
        
        // Update current user in storage
        const currentUser = getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            username: updatedProfile.username,
            avatar: updatedProfile.avatar
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          
          // Trigger custom event to notify navbar of user update
          window.dispatchEvent(new CustomEvent('authChange'));
        }
        
        setIsEditing(false);
        setSelectedAvatar(null);
        toast.success('อัปเดตโปรไฟล์สำเร็จ');
        
        // Refresh profile data to ensure consistency
        await fetchUserProfile();
        
        // Force re-render by updating avatar preview
        setAvatarPreview(getAvatarUrl(updatedProfile.avatar || ''));
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatar: string) => {
    if (!avatar) return '';
    // If it's already a full URL or starts with /uploads/, return as is
    if (avatar.startsWith('http') || avatar.startsWith('/uploads/')) {
      // Add timestamp to prevent caching and force refresh
      const separator = avatar.includes('?') ? '&' : '?';
      return `${avatar}${separator}t=${Date.now()}`;
    }
    // Otherwise, assume it's a relative path
    // Add timestamp to prevent caching
    return `${avatar}?t=${Date.now()}`;
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUsername(userProfile?.username || '');
    setAvatarPreview(getAvatarUrl(userProfile?.avatar || ''));
    setSelectedAvatar(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDaysSinceJoin = (joinDate: string) => {
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">ไม่พบข้อมูลผู้ใช้</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const userTitle = getUserTitle(userProfile.totalOrders);
  const daysSinceJoin = calculateDaysSinceJoin(userProfile.joinDate);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarImage src={getAvatarUrl(avatarPreview)} alt={userProfile.username} />
                  <AvatarFallback className="text-2xl">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {!isViewingOtherUser && (
                <>
                  {isEditing ? (
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="bg-primary rounded-full p-2 hover:bg-primary/80 transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="rounded-full"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
              </div>
              
              <CardTitle className="text-2xl font-bold">
                {isEditing && !isViewingOtherUser ? (
                  <div className="flex items-center gap-2 justify-center">
                    <Input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="text-center max-w-xs"
                    />
                  </div>
                ) : (
                  userProfile.username
                )}
              </CardTitle>
              
              <CardDescription>{userProfile.email}</CardDescription>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={userTitle.color}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {userTitle.name}
                </Badge>
                <Badge variant="outline">
                  <Star className="w-3 h-3 mr-1" />
                  {userProfile.level}
                </Badge>
              </div>
              
              {!isViewingOtherUser && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        บันทึก
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-2" />
                        ยกเลิก
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit2 className="w-4 h-4 mr-2" />
                      แก้ไขโปรไฟล์
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{daysSinceJoin}</div>
                <div className="text-sm text-muted-foreground">วันที่อยู่กับเรา</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{userProfile.totalOrders}</div>
                <div className="text-sm text-muted-foreground">สินค้าที่ซื้อ</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl font-bold">{userProfile.points.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">พอยต์สะสม</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{userProfile.badges.length}</div>
                <div className="text-sm text-muted-foreground">เครื่องราง</div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                ข้อมูลบัญชี
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">ชื่อผู้ใช้</Label>
                  <div className="font-medium">{userProfile.username}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">อีเมล</Label>
                  <div className="font-medium">{userProfile.email}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">วันที่สมัคร</Label>
                  <div className="font-medium">{formatDate(userProfile.joinDate)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">ระดับสมาชิก</Label>
                  <div className="font-medium">{userProfile.level}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                เครื่องราง & ฉายา
              </CardTitle>
              <CardDescription>
                ความสำเร็จและตำแหน่งที่คุณได้รับจากการเป็นส่วนหนึ่งของเรา
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userProfile.badges.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {badge}
                  </Badge>
                ))}
                {userProfile.badges.length === 0 && (
                  <p className="text-muted-foreground">ยังไม่มีเครื่องราง - ซื้อสินค้าเพื่อรับเครื่องราง!</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                สรุปกิจกรรม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">ยอดซื้อรวม</span>
                  <span className="font-semibold">฿{userProfile.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">ค่าเฉลี่ยต่อออเดอร์</span>
                  <span className="font-semibold">
                    ฿{Math.round(userProfile.totalSpent / userProfile.totalOrders).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
