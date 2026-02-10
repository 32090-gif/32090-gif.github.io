import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ticket, Copy, Clock, Users, Percent, CheckCircle, Gift } from "lucide-react";
import apiClient from '@/services/apiClient';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount: number;
  type: 'amount' | 'percent' | 'shipping';
  minAmount: number;
  maxUsage: number;
  used: number;
  expiry: string;
  active: boolean;
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const response = await apiClient.makeRequest('/vouchers');
      if (response.success && (response as any).vouchers) {
        setVouchers((response as any).vouchers);
      }
    } catch (error) {
      console.error('Error loading vouchers:', error);
      setError('ไม่สามารถโหลดโค้ดส่วนลดได้');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`คัดลอกโค้ด ${text} แล้ว!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const useVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!voucherCode || !amount) {
      setError("กรุณากรอกโค้ดส่วนลดและจำนวนเงิน");
      return;
    }

    try {
      const response = await apiClient.makeRequest('/vouchers/use', {
        method: 'POST',
        body: JSON.stringify({
          code: voucherCode,
          amount: parseFloat(amount)
        })
      });

      if (response.success) {
        const result = response as any;
        setSuccess(`ใช้โค้ดสำเร็จ! ส่วนลด ${result.discount} บาท (${result.originalAmount} → ${result.finalAmount} บาท)`);
        setVoucherCode("");
        setAmount("");
        loadVouchers(); // Refresh vouchers
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการใช้โค้ดส่วนลด");
    }
  };

  const formatExpiry = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVoucherIcon = (type: string) => {
    switch (type) {
      case 'percent':
        return <Percent className="w-5 h-5" />;
      case 'shipping':
        return <Gift className="w-5 h-5" />;
      default:
        return <Ticket className="w-5 h-5" />;
    }
  };

  const getDiscountText = (voucher: Voucher) => {
    switch (voucher.type) {
      case 'percent':
        return `${voucher.discount}% ส่วนลด`;
      case 'shipping':
        return 'ฟรีค่าส่ง';
      default:
        return `฿${voucher.discount} ส่วนลด`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            🎫 โค้ดส่วนลด
          </h1>
          <p className="text-muted-foreground">
            รวบรวมโค้ดส่วนลดสุดคุ้ม ประหยัดได้ทุกการซื้อ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Use Voucher Form */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ใช้โค้ดส่วนลด
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 bg-red-500/20 border-red-500/50">
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 bg-green-500/20 border-green-500/50">
                    <AlertDescription className="text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={useVoucher} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="โค้ดส่วนลด"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="จำนวนเงิน (บาท)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ใช้โค้ดส่วนลด
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Vouchers List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-white mx-auto mb-4 animate-spin" />
                <p className="text-white">กำลังโหลดโค้ดส่วนลด...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {vouchers.map((voucher) => (
                  <Card
                    key={voucher.id}
                    className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-gradient-to-r from-pink-500 to-violet-500 p-2 rounded-lg">
                              {getVoucherIcon(voucher.type)}
                            </div>
                            <div>
                              <h3 className="text-white font-semibold text-lg">
                                {voucher.description}
                              </h3>
                              <p className="text-pink-300 font-bold">
                                {getDiscountText(voucher)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge 
                              className="bg-blue-500/20 text-blue-200 border-blue-500/50"
                            >
                              ยอดขั้นต่ำ ฿{voucher.minAmount}
                            </Badge>
                            <Badge 
                              className="bg-green-500/20 text-green-200 border-green-500/50"
                            >
                              {voucher.maxUsage - voucher.used} ครั้งเหลือ
                            </Badge>
                            <Badge 
                              className="bg-orange-500/20 text-orange-200 border-orange-500/50"
                            >
                              หมดอายุ {formatExpiry(voucher.expiry)}
                            </Badge>
                          </div>

                          <div className="bg-gray-800/50 p-3 rounded-lg flex items-center justify-between">
                            <code className="text-yellow-300 font-mono text-lg font-bold">
                              {voucher.code}
                            </code>
                            <Button
                              onClick={() => copyToClipboard(voucher.code)}
                              className="bg-white/10 hover:bg-white/20 text-white p-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}