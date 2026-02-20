import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ADMIN_KEY_CONSTANT = "kunlun2026";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      if (adminKeyInput.trim() === ADMIN_KEY_CONSTANT) {
        sessionStorage.setItem('adminKeyVerified', ADMIN_KEY_CONSTANT);
        toast({
          title: "✅ ยืนยันตัวตนสำเร็จ",
          description: "กำลังเข้าสู่ระบบ Admin...",
        });
        
        // Navigate to admin panel
        setTimeout(() => {
          navigate("/admin");
        }, 500);
      } else {
        toast({
          title: "❌ Admin Key ไม่ถูกต้อง",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
        setAdminKeyInput("");
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Access
          </CardTitle>
          <p className="text-muted-foreground text-center">
            กรุณาใส่ Admin Key เพื่อเข้าสู่ระบบจัดการ
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Admin Key
            </label>
            <Input
              type="password"
              placeholder="กรอก Admin Key"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              autoFocus
              className="h-12"
            />
          </div>
          
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={handleSubmit}
            disabled={isLoading || !adminKeyInput.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                เข้าสู่ระบบ Admin
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-12 text-base" 
            onClick={() => navigate("/")}
            disabled={isLoading}
          >
            กลับหน้าหลัก
          </Button>
          
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              🔒 หน้านี้มีการป้องกันด้วย Admin Key
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;