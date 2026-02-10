import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loginUser } from "@/services/authService";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await loginUser({ username, password });
      
      if (result.success) {
        toast({
          title: "สำเร็จ",
          description: "เข้าสู่ระบบสำเร็จ",
        });
        navigate("/");
      } else {
        setError(result.message || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-xl bg-card/95 border shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                เข้าสู่ระบบ
              </CardTitle>
              <p className="text-muted-foreground mt-1">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="กรุณากรอกชื่อผู้ใช้"
                      className="pl-10"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="กรุณากรอกรหัสผ่าน"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium py-3 mt-6"
                  disabled={loading}
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>

                <div className="text-center text-sm pt-4">
                  <span className="text-muted-foreground">ยังไม่มีบัญชี? </span>
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    สมัครสมาชิก
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;