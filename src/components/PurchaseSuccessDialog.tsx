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
import { CheckCircle, Package, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PurchaseSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: {
    orderId: string;
    productName: string;
    deliveredCode?: string;
    quantity?: number;
  } | null;
}

const PurchaseSuccessDialog = ({ 
  isOpen, 
  onOpenChange, 
  orderData 
}: PurchaseSuccessDialogProps) => {
  const navigate = useNavigate();

  if (!orderData) return null;

  const handleViewHistory = () => {
    onOpenChange(false);
    navigate('/order-history');
  };

  const handleContinueShopping = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            สั่งซื้อสำเร็จ!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-green-800 mb-1">
                  การสั่งซื้อเสร็จสิ้น
                </h3>
                <p className="text-sm text-green-600">
                  {orderData.productName}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>รหัสคำสั่งซื้อ:</span>
                  <span className="font-mono font-medium">#{orderData.orderId.slice(-8)}</span>
                </div>
                {orderData.deliveredCode && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">รหัสสินค้าของคุณ:</span>
                    </div>
                    <code className="text-sm font-mono bg-white px-2 py-1 rounded border text-blue-800">
                      {orderData.deliveredCode}
                    </code>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground text-center">
                คุณต้องการไปดูประวัติการสั่งซื้อหรือไม่?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={handleContinueShopping}>
            ช้อปปิ้งต่อ
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleViewHistory}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Package className="w-4 h-4 mr-2" />
            ดูประวัติการสั่งซื้อ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PurchaseSuccessDialog;