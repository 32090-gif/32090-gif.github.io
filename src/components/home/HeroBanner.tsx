import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken } from "@/services/authService";

const HeroBanner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Create particle effect
    createParticles();
    
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

  const createParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      container.appendChild(particle);
    }
  };
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 gaming-pattern" />
      <div className="particles" id="particles-container"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse-slow" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border border-border/30 mb-8 shimmer">
            <Sparkles className="w-5 h-5 text-accent animate-pulse-slow" />
            <span className="text-sm font-semibold text-foreground">
              ยินดีต้อนรับสู่ร้านค้าสินค้าดิจิทัล
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="text-foreground block mb-2">Kunlun</span>
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse-slow neon-text">
              Shop & Services
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            ไอเทมเกม บัตรเติมเงิน ไอเทมในเกม และสินค้าดิจิทัลหลากหลาย
            <br />
            พร้อมบริการรวดเร็ว ปลอดภัย ไว้วางใจได้
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/products">
              <Button size="lg" className="gaming-btn text-xl px-10 py-8 shimmer group">
                ดูสินค้าทั้งหมด
                <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button size="lg" variant="outline" className="text-xl px-10 py-8 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-300 rounded-2xl">
                  สมัครสมาชิก
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/order-history">
                <Button size="lg" variant="outline" className="text-xl px-10 py-8 border-2 border-accent/50 hover:bg-accent/10 hover:border-accent hover:scale-105 transition-all duration-300 rounded-2xl">
                  <ShoppingCart className="w-6 h-6 mr-3" />
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
