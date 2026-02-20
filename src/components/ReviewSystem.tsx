import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, ThumbsUp, MessageSquare, Calendar, User, X } from 'lucide-react';
import { toast } from 'sonner';

// Environment variable for API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''  // Production: use relative path
  : ''; // Development: use relative path (proxy will handle it)

interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

const ReviewSystem = ({ productId, productName }: { productId: string; productName: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userReview, setUserReview] = useState({
    rating: 5,
    comment: ''
  });
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    fetchReviews();
    checkUserReviewStatus();
    fetchUserPoints();
  }, [productId]);

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/user/points', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.points || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Request headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('ไม่สามารถดึงข้อมูลรีวิวได้');
    } finally {
      setLoading(false);
    }
  };

  const checkUserReviewStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}/user-review`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHasReviewed(data.hasReviewed);
        }
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบก่อนรีวิวสินค้า');
      return;
    }

    if (userReview.comment.trim().length < 10) {
      toast.error('กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: userReview.rating,
          comment: userReview.comment
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews([data.review, ...reviews]);
          setHasReviewed(true);
          setIsDialogOpen(false);
          setUserReview({ rating: 5, comment: '' });
          toast.success('รีวิวสินค้าสำเร็จ');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'ไม่สามารถรีวิวสินค้าได้');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('เกิดข้อผิดพลาดในการรีวิวสินค้า');
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(reviews.map(review =>
            review.id === reviewId
              ? { ...review, helpful: data.helpful }
              : review
          ));
          toast.success('ขอบคุณที่บอกว่ารีวิวนี้มีประโยชน์');
        }
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && setUserReview({ ...userReview, rating: star })}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">กำลังโหลดรีวิว...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">รีวิวจากผู้ซื้อ</h3>
          <p className="text-sm text-muted-foreground">
            แชร์ประสบการณ์ของคุณกับผู้คนอื่น
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={hasReviewed}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {hasReviewed ? 'คุณรีวิวแล้ว' : 'เขียนรีวิว'}
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{review.userName}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {renderStars(review.rating)}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  ซื้อแล้ว
                </Badge>
              </div>

              <p className="text-sm leading-relaxed mb-4">{review.comment}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleHelpful(review.id)}
                    className="gap-1"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    มีประโยชน์ ({review.helpful})
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  ยืนยันว่าซื้อสินค้านี้จริง
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เขียนรีวิว {productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">คะแนน</label>
              <div className="flex items-center gap-2">
                {renderStars(userReview.rating, true)}
                <span className="text-sm text-muted-foreground">
                  ({userReview.rating}/5)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">รีวิวของคุณ</label>
              <Textarea
                value={userReview.comment}
                onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                placeholder="แชร์ประสบการณ์การใช้สินค้านี้..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                รีวิวขั้นต่ำ 10 ตัวอักษร
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>ขอบคุณที่รีวิว!</strong> ความคิดเห็นของคุณช่วยให้ผู้คนอื่นตัดสินใจซื้อสินค้านี้
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setUserReview({ rating: 5, comment: '' });
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={userReview.comment.trim().length < 10}
                className="flex-1"
              >
                ส่งรีวิว
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSystem;
