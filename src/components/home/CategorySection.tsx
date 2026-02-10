import { Gamepad2, CreditCard, Gift, Smartphone, Music, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const CategorySection = () => {
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
      const response = await fetch('/api/products');
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
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              หมวดหมู่สินค้า
            </h2>
            <p className="text-muted-foreground">เลือกหมวดหมู่ที่คุณสนใจ</p>
          </div>
          <Link
            to="/categories"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="gaming-card p-6 text-center animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-gray-300 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))
          ) : (
            categories.map((category, index) => (
              <Link
                key={index}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="gaming-card p-6 text-center group hover:border-primary/50"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                >
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count} รายการ</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
