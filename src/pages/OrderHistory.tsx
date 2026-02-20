import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getToken } from '@/services/authService';
import { toast } from 'sonner';
import { Package, Calendar, Coins, PackageOpen, Copy, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface OrderItem {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  totalPrice: number;
  status: string;
  purchaseDate: string;
  deliveredCode?: string;
  deliveredData?: any;
  whatYouGet?: string;
  rewards?: string[];
  selectedReward?: string;
}

/* ── Status config ── */
const STATUS_CONFIG = {
  completed: { label: 'สำเร็จ',           color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  pending:   { label: 'กำลังดำเนินการ',   color: 'bg-amber-500/15   text-amber-400   border-amber-500/25'   },
  failed:    { label: 'ล้มเหลว',          color: 'bg-red-500/15     text-red-400     border-red-500/25'     },
  delivered: { label: 'จัดส่งแล้ว',       color: 'bg-sky-500/15     text-sky-400     border-sky-500/25'     },
} as const;

const getStatusBadge = (status: string) => {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ════════════════════════════════════════════ */
const OrderHistory = () => {
  const [orders, setOrders]               = useState<OrderItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) { toast.error('กรุณาเข้าสู่ระบบ'); navigate('/login'); return; }
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const res = await fetch('/api/orders/history', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setOrders(data.orders ?? []);
      } else {
        toast.error('ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          {[1, 2, 3].map(i => (
            <div key={i} className="shimmer h-28 rounded-xl mb-4 bg-card border border-border" />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  /* ── Empty state ── */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--layer-2))] border border-[hsl(var(--border-mid))] flex items-center justify-center mb-5">
        <Package className="w-7 h-7 text-[hsl(var(--text-400))]" />
      </div>
      <h3 className="text-xl font-bold text-[hsl(var(--text-100))] mb-2 font-['Sora',sans-serif]">
        ยังไม่มีประวัติการสั่งซื้อ
      </h3>
      <p className="text-[hsl(var(--text-400))] text-sm mb-7 max-w-xs leading-relaxed">
        เริ่มต้นช้อปปิ้งและค้นพบสินค้าดิจิทัลที่คุณต้องการ
      </p>
      <button
        onClick={() => navigate('/products')}
        className="gaming-btn text-sm"
      >
        เลือกซื้อสินค้า
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  /* ── Order row card ── */
  const OrderCard = ({ order }: { order: OrderItem }) => (
    <div className="gaming-card group p-0">
      <div className="flex items-center gap-4 p-5">

        {/* Thumbnail */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[hsl(var(--border-mid))]">
          <img
            src={order.productImage}
            alt={order.productName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[hsl(var(--text-400))] font-mono">
              #{order.orderId.slice(-8).toUpperCase()}
            </span>
            {getStatusBadge(order.status)}
          </div>
          <p className="font-semibold text-[hsl(var(--text-100))] text-sm truncate mb-1
                        font-['Sora',sans-serif] group-hover:text-[hsl(var(--accent-light))]
                        transition-colors duration-200">
            {order.productName}
          </p>
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--text-400))]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(order.purchaseDate)}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" />
              <span className="text-[hsl(var(--accent-light))] font-semibold">
                {order.totalPrice.toLocaleString()}
              </span> พอยต์
            </span>
          </div>
        </div>

        {/* Action */}
        {order.status === 'completed' && (
          <button
            onClick={() => setSelectedOrder(order)}
            className="gaming-btn-ghost text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
          >
            <PackageOpen className="w-3.5 h-3.5" />
            ดูสินค้า
          </button>
        )}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* ── Page header ── */}
        <div className="mb-10">
          <div className="eyebrow">บัญชีของฉัน</div>
          <h1 className="text-3xl font-extrabold text-[hsl(var(--text-100))] font-['Sora',sans-serif]
                         tracking-tight mb-2">
            ประวัติการสั่งซื้อ
          </h1>
          <p className="text-[hsl(var(--text-400))] text-sm">
            รายการสินค้าที่คุณสั่งซื้อทั้งหมด {orders.length > 0 && `(${orders.length} รายการ)`}
          </p>
        </div>

        {/* ── Order list / empty ── */}
        {orders.length === 0
          ? <EmptyState />
          : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )
        }
      </div>

      {/* ══ Detail Dialog ══════════════════════════════════════════ */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto
                                   bg-[hsl(var(--layer-2))] border-[hsl(var(--border-mid))]
                                   backdrop-blur-xl rounded-2xl p-0">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[hsl(var(--border-subtle))]">
            <DialogTitle className="text-base font-bold text-[hsl(var(--text-100))]
                                    font-['Sora',sans-serif] flex items-center gap-2 mb-0.5">
              <PackageOpen className="w-4 h-4 text-[hsl(var(--accent-light))]" />
              สินค้าที่ได้รับ
            </DialogTitle>
            <DialogDescription className="text-xs text-[hsl(var(--text-400))]">
              รายละเอียดคำสั่งซื้อ #{selectedOrder?.orderId.slice(-8).toUpperCase()}
            </DialogDescription>
          </div>

          {selectedOrder && (
            <div className="px-6 py-5 space-y-5">

              {/* ── Product row ── */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-[hsl(var(--border-mid))] flex-shrink-0">
                  <img
                    src={selectedOrder.productImage}
                    alt={selectedOrder.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[hsl(var(--text-100))] truncate
                                font-['Sora',sans-serif]">
                    {selectedOrder.productName}
                  </p>
                  <p className="text-xs text-[hsl(var(--text-400))] mt-0.5">
                    {selectedOrder.quantity} ชิ้น × {selectedOrder.price.toLocaleString()} พอยต์
                  </p>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* ── Meta row ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[hsl(var(--layer-3))] rounded-xl p-3 border border-[hsl(var(--border-subtle))]">
                  <p className="text-[10px] text-[hsl(var(--text-400))] uppercase tracking-wider mb-1">วันที่</p>
                  <p className="text-xs font-medium text-[hsl(var(--text-200))]">
                    {formatDate(selectedOrder.purchaseDate)}
                  </p>
                </div>
                <div className="bg-[hsl(var(--layer-3))] rounded-xl p-3 border border-[hsl(var(--border-subtle))]">
                  <p className="text-[10px] text-[hsl(var(--text-400))] uppercase tracking-wider mb-1">ยอดชำระ</p>
                  <p className="text-sm font-bold text-[hsl(var(--accent-light))]">
                    {selectedOrder.totalPrice.toLocaleString()} พอยต์
                  </p>
                </div>
              </div>

              {/* ── What you get ── */}
              {(selectedOrder.whatYouGet || selectedOrder.deliveredCode) && (
                <div className="bg-[hsl(var(--layer-3))] rounded-xl p-4 border border-[hsl(var(--border-subtle))]">
                  <p className="text-[10px] text-[hsl(var(--text-400))] uppercase tracking-wider mb-3">
                    สิ่งที่คุณได้รับ
                  </p>
                  {selectedOrder.whatYouGet && (
                    <p className="text-sm text-[hsl(var(--text-200))] whitespace-pre-line leading-relaxed">
                      {selectedOrder.whatYouGet}
                    </p>
                  )}
                </div>
              )}

              {/* ── Reward ── */}
              {selectedOrder.selectedReward && (
                <div className="bg-[hsl(var(--layer-3))] rounded-xl p-4 border border-[hsl(var(--border-subtle))]">
                  <p className="text-[10px] text-[hsl(var(--accent-light))] uppercase tracking-wider mb-2">
                    รางวัลที่ได้รับ
                  </p>
                  <p className="text-sm font-bold text-[hsl(var(--text-100))] text-center py-1">
                    {selectedOrder.selectedReward}
                  </p>
                </div>
              )}

              {/* Reward pool */}
              {!selectedOrder.selectedReward && selectedOrder.rewards && selectedOrder.rewards.length > 0 && (
                <div className="bg-[hsl(var(--layer-3))] rounded-xl p-4 border border-[hsl(var(--border-subtle))]">
                  <p className="text-[10px] text-[hsl(var(--text-400))] uppercase tracking-wider mb-3">
                    รางวัลที่เป็นไปได้
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.rewards.map((r, i) => (
                      <span key={i} className="badge badge-accent text-xs">🎁 {r}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Delivered code ── */}
              {selectedOrder.deliveredCode && (
                <div className="bg-[hsl(var(--layer-3))] rounded-xl p-4 border border-[hsl(var(--border-subtle))]">
                  <p className="text-[10px] text-[hsl(var(--text-400))] uppercase tracking-wider mb-3">
                    รหัสสินค้า
                  </p>
                  <div className="font-mono text-sm text-[hsl(var(--accent-light))] font-bold
                                  bg-[hsl(var(--layer-2))] border border-[hsl(var(--border-mid))]
                                  rounded-lg px-4 py-3 text-center tracking-widest mb-3 select-all">
                    {selectedOrder.deliveredCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.deliveredCode!);
                      toast.success('คัดลอกรหัสแล้ว');
                    }}
                    className="gaming-btn-ghost w-full text-xs flex items-center justify-center gap-2 py-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    คัดลอกรหัส
                  </button>
                </div>
              )}

              {/* ── Tips ── */}
              <div className="text-xs text-[hsl(var(--text-400))] space-y-1 pt-1">
                <p>• กรุณาเก็บรหัสสินค้าไว้ให้ปลอดภัย</p>
                <p>• หากพบปัญหาสามารถติดต่อผู้ดูแลระบบได้</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="gaming-btn-ghost w-full text-sm flex items-center justify-center gap-2 py-2.5"
            >
              <X className="w-4 h-4" />
              ปิด
            </button>
          </div>

        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OrderHistory;