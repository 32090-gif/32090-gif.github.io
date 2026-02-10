import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, CreditCard, Gift, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import apiClient from '@/services/apiClient';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface OwnerProfile {
  fullName?: string;
  mobile?: string;
}

interface TopupRecord {
  id: string;
  amount: number;
  points: number;
  angpaoLink: string;
  giftCode?: string;
  status: string;
  ownerProfile?: OwnerProfile;
  createdAt: string;
  completedAt?: string;
}

export default function Topup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [angpaoLink, setAngpaoLink] = useState("");
  const [topupHistory, setTopupHistory] = useState<TopupRecord[]>([]);

  useEffect(() => {
    loadTopupHistory();
  }, []);

  const loadTopupHistory = async () => {
    try {
      const response = await apiClient.makeRequest('/topups');
      if (response.success && (response as any).topups) {
        setTopupHistory((response as any).topups);
      }
    } catch (error) {
      console.error('Error loading topup history:', error);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!angpaoLink.trim()) {
        setError("กรุณาใส่ลิ้งก์อังเปา");
        return;
      }

      const response = await apiClient.makeRequest('/topup', {
        method: 'POST',
        body: JSON.stringify({ angpaoLink })
      });

      if (response.success) {
        const result = response as any;
        setSuccess(result.message || `เติมเงินสำเร็จ! ได้รับ ${result.topup?.points || 0} พอยต์`);
        setAngpaoLink("");
        loadTopupHistory(); // Refresh history
      } else {
        // Show detailed error message from server
        setError(response.message || "เกิดข้อผิดพลาดในการเติมเงิน");
      }
    } catch (error: any) {
      console.error('Topup error:', error);
      
      // Check if it's a network error or server error
      if (error.message) {
        setError(error.message);
      } else if (error.response) {
        // Server responded with error status
        setError(error.response.message || "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง");
      } else {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate(-1)}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <h1 className="text-3xl font-bold text-foreground">เติมเงิน</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Topup Form */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-pink-500 to-violet-500 p-4 rounded-full">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl">เติมเงินด้วยอังเปา TrueMoney</CardTitle>
              <p className="text-gray-300 mt-2">
                วางลิ้งก์อังเปา TrueMoney เพื่อเติมเงินเข้าบัญชี
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 bg-red-500/30 border-red-500/70 border-2">
                  <AlertDescription className="text-red-100 font-medium text-sm">
                    ⚠️ {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-500/30 border-green-500/70 border-2">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription className="text-green-100 font-medium text-sm">
                    ✅ {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleTopup} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    ลิ้งก์อังเปา TrueMoney
                  </Label>
                  <Input
                    type="url"
                    value={angpaoLink}
                    onChange={(e) => {
                      setAngpaoLink(e.target.value);
                      // Clear error/success when user starts typing
                      if (error) setError("");
                      if (success) setSuccess("");
                    }}
                    placeholder="https://gift.truemoney.com/campaign/?c=..."
                    className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    รองรับลิ้งก์จาก gift.truemoney.com และ tmn.app
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 text-white font-semibold py-3"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      เติมเงินเลย
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
                <h3 className="text-white font-semibold mb-2">💡 วิธีการใช้งาน</h3>
                <ol className="text-sm text-blue-200 space-y-1">
                  <li>1. คัดลอกลิ้งก์อังเปา TrueMoney</li>
                  <li>2. วางลิ้งก์ในช่องด้านบน</li>
                  <li>3. กดปุ่ม "เติมเงินเลย"</li>
                  <li>4. ระบบจะตรวจสอบและเติมพอยต์ให้อัตโนมัติ</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Topup History */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ประวัติการเติมเงิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topupHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีประวัติการเติมเงิน</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {topupHistory.map((topup) => (
                    <div
                      key={topup.id}
                      className="bg-white/5 p-4 rounded-lg border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white font-semibold">
                            +{topup.points} พอยต์
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatDate(topup.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        จำนวน: {topup.amount} บาท
                      </p>
                      {topup.ownerProfile && topup.ownerProfile.fullName && (
                        <p className="text-gray-300 text-sm">
                          จาก: {topup.ownerProfile.fullName}
                        </p>
                      )}
                      {topup.giftCode && (
                        <p className="text-gray-400 text-xs">
                          รหัส: {topup.giftCode}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs truncate">
                        ลิ้งก์: {topup.angpaoLink}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}