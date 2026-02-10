import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { getToken, getCurrentUser } from "@/services/authService";
import { toast } from "sonner";
import PurchaseConfirmDialog from "@/components/PurchaseConfirmDialog";
import PurchaseSuccessDialog from "@/components/PurchaseSuccessDialog";

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = getToken();
    if (token) {
      const user = getCurrentUser();
      setCurrentUser(user);
      await fetchUserPoints();
    }
  };

  const fetchUserPoints = async () => {
    try {
      const token = getToken();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products.slice(0, 6));
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    const token = getToken();
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบก่อนซื้อสินค้า');
      return;
    }
    if (product.stock <= 0) {
      toast.error('สินค้าหมดสต็อก');
      return;
    }
    if (userPoints < product.price) {
      toast.error(`พอยต์ไม่เพียงพอ (ต้องการ ${product.price} พอยต์)`);
      return;
    }

    setSelectedProduct(product);
    setConfirmDialogOpen(true);
  };

  const handleConfirmPurchase = async (quantity: number = 1) => {
    if (!selectedProduct) return;

    const token = getToken();
    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOrderResult({
          orderId: data.orderId || 'unknown',
          productName: selectedProduct.name,
          deliveredCode: data.deliveredCode,
          quantity: quantity
        });
        
        setConfirmDialogOpen(false);
        setSuccessDialogOpen(true);
        
        fetchProducts();
        fetchUserPoints();
      } else {
        toast.error(data.message || 'การซื้อสินค้าล้มเหลว');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('เกิดข้อผิดพลาดในการซื้อสินค้า');
    }
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">กำลังโหลดสินค้า...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              สินค้าแนะนำ
            </h2>
            <p className="text-muted-foreground">
              สินค้าคุณภาพดีพร้อมส่วนลดพิเศษ
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" className="group">
              ดูทั้งหมด
              <Eye className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {product.discount && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-3 py-1">
                      -{product.discount}%
                    </Badge>
                  </div>
                )}

                {/* HOT Badge สำหรับสินค้าขายดี (stock <= 5) */}
                {product.stock > 0 && product.stock <= 5 && !product.discount && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 font-bold animate-pulse">
                      🔥 HOT
                    </Badge>
                  </div>
                )}

                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-black/70 text-white border-0">
                    คงเหลือ {product.stock} ชิ้น
                  </Badge>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    ซื้อเลย
                  </Button>
                  <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white text-black">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    {product.category}
                  </Badge>
                </div>
                
                <h3 className="font-bold text-lg text-card-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {product.discount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">
                          {product.price.toLocaleString()} พอยต์
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice?.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {product.price.toLocaleString()} พอยต์
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-muted-foreground">4.8</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/products">
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-8 py-3 text-lg">
              ดูสินค้าทั้งหมด
            </Button>
          </Link>
        </div>
      </div>
      
      <PurchaseConfirmDialog
        isOpen={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmPurchase}
        product={selectedProduct}
        userPoints={userPoints}
      />

      <PurchaseSuccessDialog
        isOpen={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        orderData={orderResult}
      />
    </section>
  );
};

export default FeaturedProducts;