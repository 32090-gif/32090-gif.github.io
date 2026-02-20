import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Grid, List } from 'lucide-react';
import CategoriesManager from '@/components/admin/CategoriesManager';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  status: 'active' | 'inactive';
}

const CategoryView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
          const uniqueCategories = [...new Set(data.products.map((p: Product) => p.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('ไม่สามารถดึงข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (category: string) => {
    if (category === '') {
      return products;
    }
    return products.filter(product => product.category === category);
  };

  const getCategoryStats = (category: string) => {
    const categoryProducts = getProductsByCategory(category);
    const totalStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0);
    const activeProducts = categoryProducts.filter(p => p.status === 'active').length;
    const outOfStock = categoryProducts.filter(p => p.stock === 0).length;
    
    return {
      total: categoryProducts.length,
      active: activeProducts,
      outOfStock: outOfStock,
      totalStock: totalStock
    };
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'บัตรเติมเงิน': '#3B82F6',
      'ไอดีเกม': '#10B981',
      'ไอเทมในเกม': '#F59E0B',
      'แอปพลิเคชัน': '#8B5CF6',
      'บริการพิเศษ': '#EF4444'
    };
    return colors[category] || '#6B7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'บัตรเติมเงิน': '💳',
      'ไอดีเกม': '🎮',
      'ไอเทมในเกม': '⚔️',
      'แอปพลิเคชัน': '📱',
      'บริการพิเศษ': '⭐'
    };
    return icons[category] || '📦';
  };

  if (showCategoriesManager) {
    return <CategoriesManager />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">ดูสินค้าตามหมวดหมู่</h1>
            <p className="text-muted-foreground">
              จัดการและดูสินค้าแยกตามหมวดหมู่
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setShowCategoriesManager(true)}
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              จัดการหมวดหมู่
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('')}
              size="sm"
            >
              ทั้งหมด ({products.length})
            </Button>
            {categories.map((category) => {
              const stats = getCategoryStats(category);
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className="gap-2"
                >
                  <span>{getCategoryIcon(category)}</span>
                  {category} ({stats.total})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Category Stats */}
        {selectedCategory && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{getCategoryIcon(selectedCategory)}</span>
                  {selectedCategory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {getCategoryStats(selectedCategory).total}
                    </div>
                    <div className="text-sm text-muted-foreground">สินค้าทั้งหมด</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {getCategoryStats(selectedCategory).active}
                    </div>
                    <div className="text-sm text-muted-foreground">เปิดขาย</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {getCategoryStats(selectedCategory).outOfStock}
                    </div>
                    <div className="text-sm text-muted-foreground">หมดสต็อก</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getCategoryStats(selectedCategory).totalStock}
                    </div>
                    <div className="text-sm text-muted-foreground">สต็อกทั้งหมด</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Display */}
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }>
          {getProductsByCategory(selectedCategory).map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <div className={`relative w-full h-full ${product.stock === 0 ? 'opacity-60' : ''}`}>
                  <img
                    src={product.image || 'https://via.placeholder.com/300x200'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    style={product.stock === 0 ? { filter: 'grayscale(100%)' } : {}}
                  />
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-lg font-bold bg-red-600 px-3 py-1 rounded-lg">
                        สินค้าหมด
                      </div>
                    </div>
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

                <div className="absolute top-3 left-3">
                  <Badge 
                    variant="secondary" 
                    className="border-0"
                    style={{ 
                      backgroundColor: getCategoryColor(product.category) + '20',
                      borderColor: getCategoryColor(product.category),
                      color: getCategoryColor(product.category)
                    }}
                  >
                    {getCategoryIcon(product.category)} {product.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary">
                      ฿{product.price.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={product.status === 'active' ? 'default' : 'destructive'}
                    >
                      {product.status === 'active' ? 'เปิดขาย' : 'หยุดขาย'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {getProductsByCategory(selectedCategory).length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">
              {selectedCategory ? `ไม่มีสินค้าในหมวดหมู่ "${selectedCategory}"` : 'ไม่มีสินค้าในระบบ'}
            </h3>
            <p className="text-muted-foreground">
              {selectedCategory 
                ? 'ลองเลือกหมวดหมู่อื่นหรือเพิ่มสินค้าในหมวดหมู่นี้'
                : 'เริ่มต้นด้วยการเพิ่มสินค้าใหม่'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryView;
