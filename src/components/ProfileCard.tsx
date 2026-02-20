import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Package, Star, Trophy } from 'lucide-react';

interface ProfileCardProps {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    pin: string;
    points: number;
    createdAt: string;
    updatedAt?: string;
  };
  isOwnProfile: boolean;
  onEdit?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, isOwnProfile, onEdit }) => {
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

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 mx-auto mb-4">
            <AvatarImage src={getAvatarUrl(user.avatar || '')} alt={user.username} />
            <AvatarFallback className="text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isOwnProfile && (
            <div className="absolute bottom-2 right-2">
              <button
                onClick={onEdit}
                className="bg-primary text-white rounded-full p-2 hover:bg-primary/80 transition-colors"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <CardTitle className="text-2xl font-bold">
          {user.firstName} {user.lastName}
        </CardTitle>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            {getUserTitle(user.points)}
          </Badge>
          <Badge variant="outline" className="ml-2">
            {user.points.toLocaleString()} พอยต์
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user.username}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                สมัครสมาชิก: {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                ยอดขั้น: {user.points.toLocaleString()}
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
        
        {user.updatedAt && (
          <div className="text-center text-sm text-muted-foreground">
            อัปเดตล่าสุด: {formatDate(user.updatedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
