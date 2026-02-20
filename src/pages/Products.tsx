import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollingBanner from '@/components/ScrollingBanner';
import { toast } from 'sonner';
import { getCurrentUser, getToken } from '@/services/authService';
import { ShoppingCart, Eye, Star, Filter, Search, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PurchaseConfirmDialog from '@/components/PurchaseConfirmDialog';
import PurchaseSuccessDialog from '@/components/PurchaseSuccessDialog';
import ReviewSystem from "@/components/ReviewSystem";
import { Link } from "react-router-dom";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    // Get category from URL parameter
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    fetchUser();
    fetchProducts();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      fetchUser();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [searchParams]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchUser = async () => {
    try {
      const token = getToken();
      if (token) {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          fetchUserPoints();
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.products) {
          setProducts(data.products);
          const uniqueCategories = [...new Set(data.products.map((product: any) => product.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
        } else {
          toast.error('ไม่สามารถดึงข้อมูลสินค้าได้');
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter((product: any) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((product: any) => product.category === selectedCategory);
    }
    setFilteredProducts(filtered);
  };

  const handlePurchase = (product: any) => {
    const token = getToken();
    if (!token || !currentUser) {
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

  const handleReview = (product: any) => {
    setSelectedProduct(product);
    setReviewDialogOpen(true);
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-background gaming-pattern">
      <Navbar />
      <ScrollingBanner />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 neon-text">
            สินค้าทั้งหมด
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            เลือกซื้อสินค้าคุณภาพดีที่คุณต้องการ พร้อมบริการรวดเร็วทันใจ
          </p>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-4 text-lg rounded-2xl border-2 border-border/50 focus:border-primary transition-all glass"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-4 border-2 border-border/50 rounded-2xl bg-background text-foreground font-medium focus:border-primary transition-all glass cursor-pointer"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6 animate-float">🛒</div>
            <h3 className="text-3xl font-bold mb-4 text-foreground">ไม่พบสินค้า</h3>
            <p className="text-xl text-muted-foreground">
              ยังไม่มีสินค้าในระบบ หรือลองค้นหาด้วยคำอื่น
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product: any) => (
              <div
                key={product.id}
                className="product-card group"
              >
                <div className="relative h-56 overflow-hidden">
                  <div className={`relative w-full h-full ${product.stock === 0 ? 'opacity-60' : ''}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      style={product.stock === 0 ? { filter: 'grayscale(100%)' } : {}}
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-2xl font-bold bg-red-600 px-4 py-2 rounded-lg">
                          สินค้าหมด
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 left-4 flex gap-2">
                    {/* HOT Badge สำหรับสินค้าขายดี (stock < 5) */}
                    {product.stock > 0 && product.stock <= 5 && (
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 font-bold text-sm px-3 py-1 animate-pulse-glow">
                        🔥 HOT
                      </Badge>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <Badge 
                      variant="secondary" 
                      className={`border-0 text-sm font-bold px-3 py-1 ${
                        product.stock <= 0 
                          ? 'bg-red-500/90 text-white' 
                          : 'glass text-white'
                      }`}
                    >
                      {product.stock <= 0 ? 'หมดสต็อก' : `คงเหลือ ${product.stock} ชิ้น`}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    <Button
                      onClick={() => handlePurchase(product)}
                      disabled={product.stock <= 0 || !currentUser || userPoints < product.price}
                      className="flex-1 gaming-btn text-base py-3 shimmer"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {product.stock <= 0 ? 'หมดสต็อก' : 'ซื้อเลย'}
                    </Button>
                    <Button variant="secondary" size="icon" className="glass hover:scale-110 transition-transform" onClick={() => handleReview(product)}>
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1 border-primary/30">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-xl text-card-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-primary">฿{product.price.toLocaleString()}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ฿{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        product.stock === 0 
                          ? 'text-red-500' 
                          : product.stock < 10 
                            ? 'text-orange-500' 
                            : 'text-green-500'
                      }`}>
                        {product.stock === 0 
                          ? 'สินค้าหมด' 
                          : `คงเหลือ: ${product.stock} ชิ้น`
                        }
                      </div>
                      {product.stock === 0 && (
                        <div className="text-xs text-red-400 font-medium">
                          กดซื้อไม่ได้
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-primary">
                      {product.price.toLocaleString()} <span className="text-sm font-normal">พอยต์</span>
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-muted-foreground">4.8</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
      
      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รีวิวสินค้า</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ReviewSystem productId={selectedProduct.id} productName={selectedProduct.name} />
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Products;