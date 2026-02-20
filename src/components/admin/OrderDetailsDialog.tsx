import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Hash, 
  ExternalLink,
  Copy,
  User,
  Shield,
  ShoppingCart
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OrderDetails {
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

interface OrderDetailsDialogProps {
  order: OrderDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ order, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "คัดลอกแล้ว",
        description: "คัดลอกข้อมูลไปยังคลิปบอร์ดแล้ว",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            รายละเอียดสินค้าที่ได้รับ
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                ข้อมูลการสั่งซื้อ
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">รหัสคำสั่งซื้อ:</span>
                  <p className="font-mono font-semibold">{order.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">วันที่สั่งซื้อ:</span>
                  <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">สถานะ:</span>
                  <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                    {order.status === 'completed' ? 'สำเร็จ' : order.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">จำนวน:</span>
                  <p className="font-semibold">{order.quantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                ข้อมูลสินค้า
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ชื่อสินค้า:</span>
                  <p className="font-semibold">{order.productName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ราคา:</span>
                  <p className="font-semibold">{order.price} บาท</p>
                </div>
                <div>
                  <span className="text-muted-foreground">พอยต์ที่ใช้:</span>
                  <p className="font-semibold">{order.points} พอยต์</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                ข้อมูลผู้ซื้อ
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ชื่อผู้ใช้:</span>
                  <p className="font-semibold">{order.user.username}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">อีเมล:</span>
                  <p className="font-semibold">{order.user.email}</p>
                </div>
                {order.user.mobile && (
                  <div>
                    <span className="text-muted-foreground">เบอร์โทรศัพท์:</span>
                    <p className="font-semibold">{order.user.mobile}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Details (if available) */}
          {order.productDetails && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ข้อมูลสินค้าที่ได้รับ
                </h3>
                
                <div className="space-y-4">
                  {order.productDetails.email && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <span className="text-sm text-muted-foreground">อีเมล:</span>
                        <p className="font-mono font-semibold">{order.productDetails.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(order.productDetails.email)}
                        className="min-w-[80px]"
                      >
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </Button>
                    </div>
                  )}
                  
                  {order.productDetails.password && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <span className="text-sm text-muted-foreground">รหัสผ่าน:</span>
                        <p className="font-mono font-semibold">{order.productDetails.password}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(order.productDetails.password)}
                        className="min-w-[80px]"
                      >
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </Button>
                    </div>
                  )}
                  
                  {order.productDetails.password2 && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <span className="text-sm text-muted-foreground">รหัสผ่าน 2:</span>
                        <p className="font-mono font-semibold">{order.productDetails.password2}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(order.productDetails.password2)}
                        className="min-w-[80px]"
                      >
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </Button>
                    </div>
                  )}
                  
                  {order.productDetails.webmail && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <span className="text-sm text-muted-foreground">เว็บเมล:</span>
                        <p className="font-mono font-semibold">{order.productDetails.webmail}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(order.productDetails.webmail)}
                        className="min-w-[80px]"
                      >
                        {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
