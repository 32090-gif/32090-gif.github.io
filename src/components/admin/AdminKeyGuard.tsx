import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Admin key constant
const ADMIN_KEY = "kunlun2026";

export const AdminKeyGuard = ({ onVerified }: { onVerified: () => void }) => {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const navigate = useNavigate();

  const handleAdminKeySubmit = () => {
    if (adminKeyInput.trim() === ADMIN_KEY) {
      sessionStorage.setItem('adminKeyVerified', ADMIN_KEY);
      toast({
        title: "ยืนยันตัวตนสำเร็จ",
        description: "เข้าสู่ระบบ Admin สำเร็จ",
      });
      onVerified();
    } else {
      toast({
        title: "Admin Key ไม่ถูกต้อง",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
      setAdminKeyInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Admin Access</CardTitle>
          <p className="text-muted-foreground text-center mt-2">
            กรุณาใส่ Admin Key เพื่อเข้าสู่ระบบจัดการ
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="กรอก Admin Key"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAdminKeySubmit();
                }
              }}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleAdminKeySubmit}
          >
            <Shield className="w-4 h-4 mr-2" />
            เข้าสู่ระบบ Admin
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate("/")}
          >
            กลับหน้าหลัก
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
