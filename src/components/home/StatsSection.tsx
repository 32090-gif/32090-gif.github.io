import { useState, useEffect } from "react";
import { Users, ShoppingBag, Package, TrendingUp } from "lucide-react";
import apiClient from "@/services/apiClient";
import { mockStats } from "@/services/mockData";

interface Stats {
  totalUsers: number;
  totalTopupAmount: number;
  totalTopups: number;
}

const StatsSection = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTopupAmount: 0,
    totalTopups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.makeRequest('/topups/stats');
      if (response.success && (response as any).stats) {
        setStats((response as any).stats);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use mock data as fallback
      console.log('Using mock stats data');
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M+`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M+`;
    } else if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(1)}K+`;
    }
    return `฿${amount}`;
  };

  const statsData = [
    {
      icon: Users,
      value: loading ? "..." : formatNumber(stats.totalUsers),
      label: "สมาชิกทั้งหมด",
      color: "from-primary to-purple-400",
    },
    {
      icon: ShoppingBag,
      value: loading ? "..." : formatCurrency(stats.totalTopupAmount),
      label: "ยอดเติมสะสม",
      color: "from-accent to-pink-400",
    },
    {
      icon: Package,
      value: "1,000+",
      label: "สินค้าพร้อมขาย",
      color: "from-gaming-cyan to-blue-400",
    },
    {
      icon: TrendingUp,
      value: loading ? "..." : formatNumber(stats.totalTopups),
      label: "ครั้งที่เติมเงิน",
      color: "from-green-500 to-emerald-400",
    },
  ];

  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="stats-card group hover:border-primary/50 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
