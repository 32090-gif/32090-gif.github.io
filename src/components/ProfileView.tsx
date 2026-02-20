import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getToken, getCurrentUser } from '@/services/authService';
import { toast } from 'sonner';
import { User, Calendar, Package, Star, Trophy, Camera, Edit2, Save, X } from 'lucide-react';

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

interface ProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userId, isOwnProfile }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        toast.error('ไม่พบข้อมูลการยืนยันตัวตน');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
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
          points: data.user.points || 0,
          level: 'แฟนตัวยง',
          badges: []
        };
        
        setUserProfile(userProfile);
        setEditUsername(userProfile.username);
        setEditFirstName(userProfile.firstName);
        setEditLastName(userProfile.lastName);
        setEditEmail(userProfile.email);
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

  const saveUserProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        toast.error('ไม่พบข้อมูลการยืนยันตัวตน');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('username', editUsername);
      formData.append('firstName', editFirstName);
      formData.append('lastName', editLastName);
      formData.append('email', editEmail);
      
      // Append avatar file only if it's a file (not base64)
      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
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
        setEditFirstName(updatedProfile.firstName);
        setEditLastName(updatedProfile.lastName);
        setEditEmail(updatedProfile.email);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ใหญ่เกิน 5MB');
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUsername(userProfile?.username || '');
    setEditFirstName(userProfile?.firstName || '');
    setEditLastName(userProfile?.lastName || '');
    setEditEmail(userProfile?.email || '');
    setAvatarPreview(getAvatarUrl(userProfile?.avatar || ''));
    setSelectedAvatar(null);
  };

  const getUserTitle = (points: number) => {
    if (points >= 1000) return 'ตำนาน';
    if (points >= 500) return 'นักสะสมพอยต์';
    if (points >= 100) return 'ลูกค้าประจำ';
    if (points >= 50) return 'นักสะสม';
    if (points >= 10) return 'VIP';
    return 'แฟนตัวยง';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-32 h-32 mx-auto mb-4">
              <AvatarImage src={getAvatarUrl(avatarPreview)} alt={userProfile.username} />
              <AvatarFallback className="text-2xl">
                {userProfile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {isOwnProfile && (
              <div className="absolute bottom-2 right-2 flex gap-2">
                {isEditing ? (
                  <>
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
                    <button
                      onClick={saveUserProfile}
                      className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-white rounded-full p-2 hover:bg-primary/80 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {userProfile.firstName} {userProfile.lastName}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {getUserTitle(userProfile.points)}
            </Badge>
            <Badge variant="outline" className="ml-2">
              {userProfile.points.toLocaleString()} พอยต์
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="username">ชื่อผู้ใช้</Label>
                    <Input
                      id="username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">ชื่อจริง</Label>
                    <Input
                      id="firstName"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="lastName">นามสกุล</Label>
                    <Input
                      id="lastName"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">อีเมล</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {userProfile.username}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    สมัครสมาชิก: {formatDate(userProfile.joinDate)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    ยอดขั้น: {userProfile.points.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    ระดับ: 5/5
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileView;
