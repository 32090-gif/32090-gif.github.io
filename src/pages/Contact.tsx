import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink, Users, Heart, Zap } from "lucide-react";
import { useEffect } from "react";

const Contact = () => {
  useEffect(() => {
    // Auto redirect to Discord after 3 seconds
    const timer = setTimeout(() => {
      window.open('https://discord.gg/ArM9tTpR24', '_blank');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDiscordClick = () => {
    window.open('https://discord.gg/ArM9tTpR24', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12" data-aos="fade-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            ติดต่อเรา
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            เข้าร่วม Discord Server ของเราเพื่อรับความช่วยเหลือและอัปเดตข่าวสารล่าสุด
          </p>
        </div>

        <div className="max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50" />
            <CardHeader className="relative text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">เข้าร่วม Discord</CardTitle>
              <p className="text-muted-foreground">
                ช่องทางหลักในการติดต่อและรับการช่วยเหลือ
              </p>
            </CardHeader>
            
            <CardContent className="relative space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Users className="w-8 h-8 mx-auto text-primary" />
                  <h3 className="font-semibold">ชุมชนใหญ่</h3>
                  <p className="text-sm text-muted-foreground">เข้าร่วมกับสมาชิกหลายพันคน</p>
                </div>
                <div className="space-y-2">
                  <Zap className="w-8 h-8 mx-auto text-primary" />
                  <h3 className="font-semibold">ตอบกลับเร็ว</h3>
                  <p className="text-sm text-muted-foreground">ทีมงานพร้อมช่วยเหลือ 24/7</p>
                </div>
                <div className="space-y-2">
                  <Heart className="w-8 h-8 mx-auto text-primary" />
                  <h3 className="font-semibold">เป็นกันเอง</h3>
                  <p className="text-sm text-muted-foreground">บรรยากาศอบอุ่นและเป็นมิตร</p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <Button 
                  onClick={handleDiscordClick}
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg px-8 py-3"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  เข้าร่วม Discord Server
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    🟢 ออนไลน์
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    กำลังจะพาคุณไป Discord ใน 3 วินาที...
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>หรือใช้ลิงก์: <code className="bg-muted px-2 py-1 rounded text-primary">https://discord.gg/ArM9tTpR24</code></p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-aos="fade-up" data-aos-delay="200">
          <Card>
            <CardHeader className="text-center pb-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-primary" />
              <CardTitle className="text-lg">แชทสด</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                สอบถามและรับคำตอบแบบเรียลไทม์จากทีมงานและชุมชน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center pb-4">
              <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
              <CardTitle className="text-lg">ข่าวสารอัปเดต</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                รับข้อมูลสินค้าใหม่ โปรโมชัน และการอัปเดตล่าสุด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center pb-4">
              <Users className="w-12 h-12 mx-auto mb-3 text-primary" />
              <CardTitle className="text-lg">ชุมชนเกมเมอร์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                พูดคุยแลกเปลี่ยนและแบ่งปันประสบการณ์กับเกมเมอร์คนอื่นๆ
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;