import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken } from "@/services/authService";

const HeroBanner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const checkAuthStatus = () => {
    const token = getToken();
    setIsAuthenticated(!!token);
  };
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 gaming-pattern" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              ยินดีต้อนรับสู่ร้านค้าสินค้าดิจิทัล
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Kunlun</span>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Shop{" "}
            </span>
            <br />
            <span className="text-foreground">And</span>
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {" "}Services
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            ไอดีเกม บัตรเติมเงิน ไอเทมในเกม และสินค้าดิจิทัลหลากหลาย
            พร้อมบริการรวดเร็ว ปลอดภัย ไว้วางใจได้
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="gradient-primary glow-primary text-lg px-8 py-6 hover:opacity-90 transition-all">
                ดูสินค้าทั้งหมด
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                  สมัครสมาชิก
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/order-history">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-accent/50 hover:bg-accent/10">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  ประวัติการซื้อ
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
