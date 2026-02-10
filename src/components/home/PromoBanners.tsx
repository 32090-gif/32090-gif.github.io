import { Zap, Gift, Percent, Crown, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/services/authService";

const PromoBanners = () => {
  const navigate = useNavigate();

  const handleTopupClick = () => {
    if (isAuthenticated()) {
      navigate('/topup');
    } else {
      navigate('/login');
    }
  };

  const promos = [
    {
      icon: Zap,
      title: "Flash Sale",
      description: "ลดสูงสุด 50%",
      bgClass: "from-primary to-purple-600",
      onClick: () => navigate('/promotions')
    },
    {
      icon: Gift,
      title: "สมาชิกใหม่",
      description: "รับส่วนลด 10%",
      bgClass: "from-accent to-pink-600",
      onClick: () => navigate('/register')
    },
    {
      icon: Wallet,
      title: "เติมเงินง่าย",
      description: "ด้วยอังเปา TrueMoney",
      bgClass: "from-gaming-cyan to-blue-600",
      onClick: handleTopupClick
    },
    {
      icon: Crown,
      title: "VIP Member",
      description: "สิทธิพิเศษเพียบ",
      bgClass: "from-amber-500 to-orange-600",
      onClick: () => navigate('/promotions')
    },
  ];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {promos.map((promo, index) => (
            <div
              key={index}
              onClick={promo.onClick}
              className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${promo.bgClass} cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20" />
                <div className="absolute -left-4 -bottom-4 w-32 h-32 rounded-full bg-white/10" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <promo.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{promo.title}</h3>
                <p className="text-white/80 text-sm">{promo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
