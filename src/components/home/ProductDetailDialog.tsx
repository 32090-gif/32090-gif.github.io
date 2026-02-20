import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Package, Clock } from "lucide-react";
import { toast } from "sonner";

interface ProductDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  userPoints: number;
  onPurchase: (product: any) => void;
}

const ProductDetailDialog = ({ 
  isOpen, 
  onOpenChange, 
  product, 
  userPoints,
  onPurchase 
}: ProductDetailDialogProps) => {
  if (!product) return null;

  const handlePurchaseClick = () => {
    onPurchase(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <Package className="w-5 h-5 text-primary" />
            รายละเอียดสินค้า
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full md:w-64 h-64 object-cover rounded-xl border border-border shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              {product.discount && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-3 py-1">
                    -{product.discount}%
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{product.name}</h3>
                <Badge variant="outline" className="text-sm">
                  {product.category}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">4.8 (125 รีวิว)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">จัดส่งทันทีหลังการชำระเงิน</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {product.discount ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {product.price.toLocaleString()} พอยต์
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      {product.originalPrice?.toLocaleString()} พอยต์
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {product.price.toLocaleString()} พอยต์
                  </span>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">คงเหลือ:</span>
                  <Badge variant={product.stock <= 5 ? "destructive" : "secondary"}>
                    {product.stock} ชิ้น
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">พอยต์คุณมี:</span>
                  <span className="font-semibold text-primary">{userPoints.toLocaleString()} พอยต์</span>
                </div>
                {userPoints < product.price && (
                  <div className="text-sm text-red-500">
                    พอยต์ไม่เพียงพอ! ต้องการอีก {(product.price - userPoints).toLocaleString()} พอยต์
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4">
            <h4 className="font-bold text-primary mb-2">คำอธิบายสินค้า</h4>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || 'สินค้าคุณภาพดีพร้อมบริการรวดเร็วทันใจ จัดส่งทันทีหลังการชำระเงิน'}
            </p>
          </div>

          {/* What You Get */}
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-4">
            <h4 className="font-bold text-accent mb-2">สิ่งที่คุณได้รับ</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• {product.name} จำนวน 1 ชิ้น</li>
              <li>• รหัสสินค้าสำหรับใช้งาน</li>
              <li>• คู่มือการใช้งาน (ถ้ามี)</li>
              <li>• การรับประกันสินค้า</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handlePurchaseClick}
              disabled={product.stock <= 0 || userPoints < product.price}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.stock <= 0 ? 'สินค้าหมด' : userPoints < product.price ? 'พอยต์ไม่พอ' : 'ซื้อเลย'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
