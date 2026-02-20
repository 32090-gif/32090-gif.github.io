import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Eye, 
  Package, 
  Calendar, 
  User, 
  Filter,
  RefreshCw
} from "lucide-react";
import OrderDetailsDialog from "./OrderDetailsDialog";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/services/apiClient";

interface Order {
  id: string;
  productName: string;
  price: number;
  points: number;
  quantity: number;
  status: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
    mobile?: string;
  };
  productDetails?: {
    email?: string;
    password?: string;
    password2?: string;
    webmail?: string;
  };
}

interface OrderManagerProps {
  onOrderUpdate?: () => void;
}

const OrderManager: React.FC<OrderManagerProps> = ({ onOrderUpdate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.makeRequest('/admin/orders');
      if (response.success && (response as any).orders) {
        setOrders((response as any).orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetProductDetails = async (orderId: string) => {
    try {
      const response = await apiClient.makeRequest(`/admin/orders/${orderId}/set-details`, {
        method: 'POST'
      });
      
      if (response.success) {
        toast({
          title: "สำเร็จ",
          description: "ตั้งค่าสินค้าที่ได้รับสำเร็จแล้ว"
        });
        if (onOrderUpdate) {
          onOrderUpdate();
        }
      } else {
        throw new Error(response.message || "ไม่สามารถตั้งค่าสินค้าได้");
      }
    } catch (error) {
      console.error('Error setting product details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "ไม่สามารถตั้งค่าสินค้าได้",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'สำเร็จ';
      case 'pending':
        return 'รอดำเนินการ';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูลคำสั่งซื้อ...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              จัดการคำสั่งซื้อ
            </div>
            <Button onClick={loadOrders} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              รีเฟรช
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาตามรหัสคำสั่งซื้อ, ชื่อสินค้า, ชื่อผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            รายการคำสั่งซื้อ ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบข้อมูลคำสั่งซื้อ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{order.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            โดย {order.user.username} ({order.user.email})
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span>ราคา:</span>
                          <p className="font-semibold text-foreground">{order.price} บาท</p>
                        </div>
                        <div>
                          <span>พอยต์:</span>
                          <p className="font-semibold text-foreground">{order.points}</p>
                        </div>
                        <div>
                          <span>วันที่:</span>
                          <p className="font-semibold text-foreground">
                            {new Date(order.createdAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        ดูข้อมูล
                      </Button>
                      
                      {!order.productDetails && (
                        <Button
                          size="sm"
                          onClick={() => handleSetProductDetails(order.id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          กำหนดสินค้า
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
};

export default OrderManager;
