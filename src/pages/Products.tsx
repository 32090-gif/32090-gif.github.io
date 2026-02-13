import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollingBanner from '@/components/ScrollingBanner';
import { toast } from 'sonner';
import { getCurrentUser, getToken } from '@/services/authService';
import { ShoppingCart, Eye, Star, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PurchaseConfirmDialog from '@/components/PurchaseConfirmDialog';
import PurchaseSuccessDialog from '@/components/PurchaseSuccessDialog';

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
        const response = await fetch('https://getkunlun.me/api/user/points', {
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
      const response = await fetch('https://getkunlun.me/api/products');
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
      const response = await fetch('https://getkunlun.me/api/purchase', {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <ScrollingBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            สินค้าทั้งหมด
          </h1>
          <p className="text-muted-foreground mb-6">
            เลือกซื้อสินค้าคุณภาพดีที่คุณต้องการ
          </p>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">ไม่พบสินค้า</h3>
            <p className="text-muted-foreground">
              ยังไม่มีสินค้าในระบบ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
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
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                    {/* HOT Badge สำหรับสินค้าขายดี (stock < 5) */}
                    {product.stock > 0 && product.stock <= 5 && (
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 font-bold animate-pulse">
                        🔥 HOT
                      </Badge>
                    )}
                  </div>
                  
                  <div className="absolute top-3 right-3">
                    <Badge 
                      variant="secondary" 
                      className={`border-0 ${
                        product.stock <= 0 
                          ? 'bg-red-500/90 text-white' 
                          : 'bg-black/70 text-white'
                      }`}
                    >
                      {product.stock <= 0 ? 'หมดสต็อก' : `คงเหลือ ${product.stock} ชิ้น`}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <Button
                      onClick={() => handlePurchase(product)}
                      disabled={product.stock <= 0 || !currentUser || userPoints < product.price}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.stock <= 0 ? 'หมดสต็อก' : 'ซื้อเลย'}
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
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString()} พอยต์
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">4.8</span>
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
      
      <Footer />
    </div>
  );
};

export default Products;