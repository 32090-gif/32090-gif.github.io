import { ShoppingCart, User, Menu, Search, Gamepad2, Star, LogOut, Package, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken, logout, getCurrentUser, isAuthenticated as checkAuthentication } from "@/services/authService";
import apiClient from "@/services/apiClient";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const navLinks = [
    { href: "/", label: "หน้าแรก" },
    { href: "/products", label: "สินค้าทั้งหมด" },
    { href: "/categories", label: "หมวดหมู่" },
    { href: "/topup", label: "เติมเงิน" },
  ];

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth events
    const handleAuthChange = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = checkAuthentication();
    console.log('Navbar checking auth, isAuthenticated:', authenticated);
    
    if (authenticated) {
      setIsAuthenticated(true);
      const user = getCurrentUser();
      console.log('Current user from storage:', user);
      
      if (user) {
        setCurrentUser(user);
        await fetchUserPoints();
      }
    } else {
      console.log('User not authenticated, clearing state');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserPoints(0);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/user/points', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserPoints(0);
    
    // Trigger auth change event
    window.dispatchEvent(new CustomEvent('authChange'));
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="https://cdn.discordapp.com/attachments/1432548491921723443/1449752911038120087/Gemini_Generated_Image_a0khsaa0khsaa0kh_1.png?ex=698c821d&is=698b309d&hm=c201525a9c957efa86eddd2d10a384997a8cddeaf87d5eee4088bf3482dd797c&" alt="Kunlun Logo" className="w-9 h-9 object-cover rounded transition-all group-hover:scale-105" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Kunlun Shop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสินค้า..."
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Points Display (when logged in) */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">
                  {userPoints.toLocaleString()}
                </span>
              </div>
            )}

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-[10px] font-bold flex items-center justify-center text-white">
                  0
                </span>
              </Button>
            </Link>

            {/* User Profile or Login */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentUser?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      โปรไฟล์
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/topup" className="flex items-center gap-2 cursor-pointer">
                      <Star className="w-4 h-4" />
                      เติมพอยต์ ({userPoints.toLocaleString()})
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/order-history" className="flex items-center gap-2 cursor-pointer">
                      <Package className="w-4 h-4" />
                      ประวัติการสั่งซื้อ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="hidden sm:block">
                <Button className="gradient-primary glow-primary hover:opacity-90 transition-opacity">
                  <User className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background border-border">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาสินค้า..."
                      className="pl-10 bg-secondary/50"
                    />
                  </div>

                  {/* Mobile Nav Links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Mobile Login/Profile */}
                  {isAuthenticated ? (
                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">
                          {userPoints.toLocaleString()} points
                        </span>
                      </div>
                      <Link to="/profile">
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="w-4 h-4 mr-2" />
                          โปรไฟล์
                        </Button>
                      </Link>
                      <Link to="/topup">
                        <Button variant="ghost" className="w-full justify-start">
                          <Star className="w-4 h-4 mr-2" />
                          เติมพอยต์
                        </Button>
                      </Link>
                      <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        ออกจากระบบ
                      </Button>
                    </div>
                  ) : (
                    <Link to="/login">
                      <Button className="w-full gradient-primary">
                        <User className="w-4 h-4 mr-2" />
                        เข้าสู่ระบบ
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
