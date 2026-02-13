import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getToken } from '@/services/authService';
import { toast } from 'sonner';
import { Package, Calendar, CreditCard, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  totalPrice: number;
  status: string;
  purchaseDate: string;
  deliveredCode?: string;
  deliveredData?: any;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบ');
      navigate('/login');
      return;
    }
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const token = getToken();
      const response = await fetch('https://getkunlun.me/api/orders/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } else {
        toast.error('ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { color: 'bg-green-500', text: 'สำเร็จ' },
      'pending': { color: 'bg-yellow-500', text: 'กำลังดำเนินการ' },
      'failed': { color: 'bg-red-500', text: 'ล้มเหลว' },
      'delivered': { color: 'bg-blue-500', text: 'จัดส่งแล้ว' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewCode = (order: OrderItem) => {
    if (order.deliveredCode) {
      toast.success(`รหัสสินค้า: ${order.deliveredCode}`, {
        duration: 10000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">กำลังโหลด...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            ประวัติการสั่งซื้อ
          </h1>
          <p className="text-muted-foreground">
            รายการสินค้าที่คุณได้สั่งซื้อทั้งหมด
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">ยังไม่มีประวัติการสั่งซื้อ</h3>
            <p className="text-muted-foreground mb-4">
              เริ่มต้นการช้อปปิ้งและสั่งซื้อสินค้าเลย!
            </p>
            <Button 
              onClick={() => navigate('/products')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              เลือกซื้อสินค้า
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      คำสั่งซื้อ #{order.orderId.slice(-8)}
                    </CardTitle>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.purchaseDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {order.totalPrice.toLocaleString()} พอยต์
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4">
                    <img 
                      src={order.productImage} 
                      alt={order.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{order.productName}</h3>
                      <p className="text-muted-foreground">
                        จำนวน: {order.quantity} ชิ้น × {order.price.toLocaleString()} พอยต์
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {order.status === 'completed' && order.deliveredCode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCode(order)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          ดูรหัสสินค้า
                        </Button>
                      )}
                      
                      {order.status === 'completed' && (
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-primary to-accent"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          ดาวน์โหลด
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderHistory;