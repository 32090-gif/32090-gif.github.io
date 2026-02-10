import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, CreditCard, Plus, Minus, Shield } from "lucide-react";
import { useState } from "react";

interface PurchaseConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (quantity: number) => void;
  product: {
    name: string;
    price: number;
    image: string;
    stock?: number;
  } | null;
  userPoints: number;
}

const PurchaseConfirmDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  product, 
  userPoints 
}: PurchaseConfirmDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  if (!product) return null;

  const totalPrice = product.price * quantity;
  const remainingPoints = userPoints - totalPrice;
  const maxQuantity = Math.min(product.stock || 999, Math.floor(userPoints / product.price));

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleConfirm = () => {
    onConfirm(quantity);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            ยืนยันการสั่งซื้อ
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    สต็อกคงเหลือ: {product.stock || 'ไม่จำกัด'}
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  จำนวน
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                    min={1}
                    max={maxQuantity}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground ml-2">
                    สูงสุด: {maxQuantity}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ราคาต่อชิ้น:</span>
                  <span className="font-medium">{product.price.toLocaleString()} พอยต์</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวน:</span>
                  <span className="font-medium">{quantity} ชิ้น</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>รวมทั้งหมด:</span>
                  <span className="text-primary">{totalPrice.toLocaleString()} พอยต์</span>
                </div>
                <div className="flex justify-between">
                  <span>พอยต์ปัจจุบัน:</span>
                  <span>{userPoints.toLocaleString()} พอยต์</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>พอยต์คงเหลือ:</span>
                  <span className={`font-medium ${remainingPoints < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {remainingPoints.toLocaleString()} พอยต์
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>การสั่งซื้อจะถูกหักพอยต์จากบัญชีของคุณทันที</span>
              </div>

              {/* Privacy Policy */}
              <div className="border-t pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPrivacy(!showPrivacy)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>นโยบายความเป็นส่วนตัว</span>
                </button>
                
                {showPrivacy && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                    <p>• ข้อมูลการซื้อของคุณจะถูกเก็บรักษาอย่างปลอดภัย</p>
                    <p>• เราไม่แบ่งปันข้อมูลส่วนบุคคลกับบุคคลที่สาม</p>
                    <p>• การทำรายการจะได้รับการเข้ารหัสและปลอดภัย</p>
                    <p>• คุณสามารถขอลบข้อมูลได้ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล</p>
                    <p>• ติดต่อสอบถาม: support@slumzick.com</p>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={remainingPoints < 0 || quantity < 1}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            ยืนยันการสั่งซื้อ ({totalPrice.toLocaleString()} พอยต์)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PurchaseConfirmDialog;