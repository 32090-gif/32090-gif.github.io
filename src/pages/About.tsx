import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Award, Clock, Globe } from "lucide-react";

const About = () => {
  const stats = [
    {
      icon: Users,
      number: "50,000+",
      label: "ลูกค้าที่ไว้วางใจ",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Award,
      number: "5",
      label: "ปีของประสบการณ์",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: Clock,
      number: "24/7",
      label: "บริการลูกค้า",
      color: "from-red-500 to-pink-600"
    },
    {
      icon: Globe,
      number: "100%",
      label: "สินค้าของแท้",
      color: "from-yellow-500 to-orange-600"
    }
  ];

  const team = [
    {
      name: "สมชาย ใจดี",
      position: "CEO & Founder",
      description: "ผู้ก่อตั้งด้วยความรักในเกมและเทคโนโลยี",
      image: "/placeholder.svg"
    },
    {
      name: "สมหญิง ใสใส",
      position: "Product Manager",
      description: "ผู้เชี่ยวชาญด้านการคัดสรรสินค้าคุณภาพ",
      image: "/placeholder.svg"
    },
    {
      name: "นายแก้ว เก่งมาก",
      position: "Technical Lead",
      description: "ผู้เชี่ยวชาญด้านเทคโนโลยีและการพัฒนา",
      image: "/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            เกี่ยวกับเรา
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            เรามุ่งมั่นที่จะเป็นผู้นำด้านการจำหน่ายผลิตภัณฑ์เกมและเทคโนโลยี 
            พร้อมมอบประสบการณ์ที่ดีที่สุดให้กับลูกค้าทุกท่าน
          </p>
        </div>

        {/* Company Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16" data-aos="fade-up" data-aos-delay="100">
          <div>
            <Card className="h-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">เรื่องราวของเรา</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    GameStore ก่อตั้งขึ้นในปี 2019 ด้วยความมุ่งมั่นที่จะนำเสนอสินค้าเกมและเทคโนโลยี
                    คุณภาพสูงให้กับนักเล่นเกมและผู้ที่หลงใหลในเทคโนโลジีทั่วประเทศไทย
                  </p>
                  <p>
                    ด้วยประสบการณ์กว่า 5 ปี เราได้สร้างชื่อเสียงในด้านการให้บริการที่ยอดเยี่ยม
                    และการคัดสรรสินค้าคุณภาพจากแบรนด์ชั้นนำทั่วโลก
                  </p>
                  <p>
                    วันนี้ เรามีลูกค้าที่ไว้วางใจมากกว่า 50,000 ราย และยังคงเติบโตอย่างต่อเนื่อง
                    เพื่อมอบบริการที่ดีที่สุดให้กับชุมชนเกมเมอร์ไทย
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">วิสัยทัศน์และพันธกิจ</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-primary mb-2">วิสัยทัศน์</h3>
                    <p className="text-muted-foreground">
                      เป็นผู้นำด้านการจำหน่ายสินค้าเกมและเทคโนโลยีในภูมิภาคเอเชียตะวันออกเฉียงใต้
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">พันธกิจ</h3>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• มอบสินค้าคุณภาพสูงในราคาที่เหมาะสม</li>
                      <li>• ให้บริการลูกค้าอย่างเป็นเลิศ</li>
                      <li>• สนับสนุนชุมชนเกมเมอร์ไทย</li>
                      <li>• นำเสนอเทคโนโลยีล่าสุด</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">ความสำเร็จของเรา</h2>
            <p className="text-muted-foreground">ตัวเลขที่แสดงถึงความไว้วางใจจากลูกค้า</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">ทีมงานของเรา</h2>
            <p className="text-muted-foreground">บุคลากรผู้เชี่ยวชาญที่พร้อมให้บริการ</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                  <Badge className="mb-3">{member.position}</Badge>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <Card className="bg-muted/50">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">ค่านิยมองค์กร</h2>
              <p className="text-muted-foreground">หลักการที่เราใช้ในการดำเนินธุรกิจ</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">คุณภาพ</h3>
                <p className="text-sm text-muted-foreground">
                  เลือกสรรสินค้าคุณภาพสูงเท่านั้น
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">บริการ</h3>
                <p className="text-sm text-muted-foreground">
                  ให้บริการด้วยใจและความเป็นมืออาชีพ
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">นวัตกรรม</h3>
                <p className="text-sm text-muted-foreground">
                  นำเสนอเทคโนโลยีและสินค้าใหม่ล่าสุด
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">ชุมชน</h3>
                <p className="text-sm text-muted-foreground">
                  สร้างและสนับสนุนชุมชนเกมเมอร์
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default About;