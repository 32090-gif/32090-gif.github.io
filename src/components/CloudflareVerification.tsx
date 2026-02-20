import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Wifi, WifiOff, Shield, AlertTriangle } from 'lucide-react';

interface CloudflareStatus {
  status: 'checking' | 'connected' | 'disconnected' | 'error';
  message: string;
  url?: string;
  cfRay?: string;
  cfCountry?: string;
}

const CloudflareVerification = () => {
  const [cloudflareStatus, setCloudflareStatus] = useState<CloudflareStatus>({
    status: 'checking',
    message: 'กำลังตรวจสอบสถานะการเชื่อมต่อ...'
  });
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    const checkCloudflareStatus = async () => {
      try {
        // ตรวจสอบว่าอยู่บน localhost หรือไม่
        const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('192.168.') ||
                          window.location.hostname.includes('169.254.');

        if (isLocalhost) {
          setCloudflareStatus({
            status: 'disconnected',
            message: 'กำลังใช้งาน Localhost - โหมดพัฒนา'
          });
          setCanProceed(true); // อนุญาตให้ผ่านได้ใน localhost
          return;
        }

        // ตรวจสอบสถานะ Cloudflare Tunnel
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/api/cloudflare-status', {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.status === 'connected') {
            setCloudflareStatus({
              status: 'connected',
              message: 'เชื่อมต่อ Cloudflare Tunnel สำเร็จ - ปลอดภัย',
              url: data.tunnelUrl,
              cfRay: data.cfRay,
              cfCountry: data.cfCountry
            });
            setCanProceed(true);
          } else {
            setCloudflareStatus({
              status: 'disconnected',
              message: 'ไม่ได้เชื่อมต่อผ่าน Cloudflare Tunnel - อาจไม่ปลอดภัย'
            });
            setCanProceed(false);
          }
        } else {
          throw new Error('Cloudflare Tunnel ไม่พร้อมใช้งาน');
        }
      } catch (error) {
        setCloudflareStatus({
          status: 'error',
          message: 'ไม่สามารถตรวจสอบสถานะการเชื่อมต่อได้'
        });
        setCanProceed(false);
      }
    };

    checkCloudflareStatus();
  }, []);

  const getStatusIcon = () => {
    switch (cloudflareStatus.status) {
      case 'checking':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
    }
  };

  const getStatusColor = () => {
    switch (cloudflareStatus.status) {
      case 'checking':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'disconnected':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'error':
        return 'bg-orange-50 border-orange-200 text-orange-700';
    }
  };

  const handleProceedAnyway = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ แม้จะไม่ได้เชื่อมต่อผ่าน Cloudflare Tunnel?')) {
      setCanProceed(true);
    }
  };

  if (canProceed) {
    return null; // ซ่อน verification หากผ่านแล้ว
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="flex justify-center">
            <Shield className="w-16 h-16 text-blue-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            ตรวจสอบสถานะการเชื่อมต่อ
          </h1>
          
          {/* Status Display */}
          <div className={`p-6 rounded-xl border-2 ${getStatusColor()} transition-all duration-300`}>
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold text-lg">
                {cloudflareStatus.message}
              </p>
              
              {cloudflareStatus.url && (
                <p className="text-sm opacity-75">
                  {cloudflareStatus.url}
                </p>
              )}
              
              {cloudflareStatus.cfRay && (
                <p className="text-xs opacity-60">
                  CF-Ray: {cloudflareStatus.cfRay}
                  {cloudflareStatus.cfCountry && ` • ${cloudflareStatus.cfCountry}`}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {cloudflareStatus.status === 'checking' && (
              <p className="text-sm text-gray-600">
                กรุณารอสักครู่...
              </p>
            )}
            
            {cloudflareStatus.status === 'connected' && (
              <button
                onClick={() => setCanProceed(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                เข้าสู่เว็บไซต์
              </button>
            )}
            
            {(cloudflareStatus.status === 'disconnected' || cloudflareStatus.status === 'error') && (
              <>
                <button
                  onClick={handleProceedAnyway}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  ดำเนินการต่อ (ไม่แนะนำ)
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  ลองใหม่
                </button>
              </>
            )}
          </div>

          {/* Warning Message */}
          {(cloudflareStatus.status === 'disconnected' || cloudflareStatus.status === 'error') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-yellow-800">
                    คำเตือนด้านความปลอดภัย
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    การเชื่อมต่อโดยตรงอาจไม่ปลอดภัย แนะนำให้ใช้ Cloudflare Tunnel
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudflareVerification;
