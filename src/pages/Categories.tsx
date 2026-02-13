import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, CreditCard, Gift, Smartphone, Music, Film } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollingBanner from "@/components/ScrollingBanner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Array<{
    name: string;
    count: number;
    icon: any;
    color: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://getkunlun.me/api/products');
      const data = await response.json();
      
      if (data.success && data.products) {
        // Group products by category (only products with stock > 0)
        const categoryMap = new Map();
        
        data.products.forEach((product: Product) => {
          // Only count products that have stock available
          if (product.stock > 0) {
            const categoryName = product.category;
            if (categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, categoryMap.get(categoryName) + 1);
            } else {
              categoryMap.set(categoryName, 1);
            }
          }
        });

        // Convert to array with icons (filter out empty categories)
        const categoriesArray = Array.from(categoryMap.entries())
          .filter(([name, count]) => count > 0) // Only show categories with products in stock
          .map(([name, count], index) => {
            const icons = [Gamepad2, CreditCard, Gift, Smartphone, Music, Film];
            const colors = [
              "from-primary to-purple-400",
              "from-accent to-pink-400", 
              "from-gaming-cyan to-blue-400",
              "from-green-500 to-emerald-400",
              "from-amber-500 to-orange-400",
              "from-red-500 to-rose-400"
            ];
            
            return {
              name,
              count,
              icon: icons[index % icons.length],
              color: colors[index % colors.length]
            };
          });

        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ScrollingBanner />
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12" data-aos="fade-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            หมวดหมู่สินค้า
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            เลือกหมวดหมู่สินค้าที่คุณสนใจ เพื่อพบกับสินค้าที่หลากหลาย
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-aos="fade-up" data-aos-delay="100">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="p-0">
                  <div className="h-32 bg-gray-300 rounded-t-lg"></div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="pt-4">
                      <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={index}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50 overflow-hidden" data-aos="fade-up" data-aos-delay={200 + index * 100}>
                    <CardHeader className="p-0">
                      <div className={`relative h-32 bg-gradient-to-br ${category.color} overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconComponent className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/20 text-white border-white/30">
                            {category.count} สินค้า
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {category.name}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          หมวดหมู่สินค้า {category.name} มี {category.count} รายการพร้อมขาย
                        </p>
                        <div className="pt-4">
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${category.color} rounded-full transition-all duration-500 group-hover:w-full`}
                              style={{ width: '60%' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        {/* Popular Categories */}
        {!loading && categories.length > 0 && (
          <div className="mt-16" data-aos="fade-up" data-aos-delay="500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">หมวดหมู่ยอดนิยม</h2>
              <p className="text-muted-foreground">หมวดหมู่ที่ลูกค้าเลือกซื้อมากที่สุด</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-aos="fade-up" data-aos-delay="600">
              {categories.slice(0, 4).map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={`popular-${index}`}
                    to={`/products?category=${encodeURIComponent(category.name)}`}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {category.count} สินค้า
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Categories;