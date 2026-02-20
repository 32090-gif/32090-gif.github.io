import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Wifi, WifiOff } from 'lucide-react';

interface CloudflareStatus {
  status: 'checking' | 'connected' | 'disconnected';
  message: string;
  url?: string;
}

const CloudflareStatus = () => {
  const [cloudflareStatus, setCloudflareStatus] = useState<CloudflareStatus>({
    status: 'checking',
    message: 'กำลังตรวจสอบสถานะ Cloudflare Tunnel...'
  });

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
            message: 'กำลังใช้งาน Localhost - ไม่ได้เชื่อมต่อ Cloudflare Tunnel'
          });
          return;
        }

        // ตรวจสอบสถานะ Cloudflare Tunnel
        const response = await fetch('/api/cloudflare-status', {
          method: 'GET',
          timeout: 5000
        });

        if (response.ok) {
          const data = await response.json();
          setCloudflareStatus({
            status: 'connected',
            message: 'เชื่อมต่อ Cloudflare Tunnel สำเร็จ',
            url: data.tunnelUrl
          });
        } else {
          throw new Error('Cloudflare Tunnel ไม่พร้อมใช้งาน');
        }
      } catch (error) {
        setCloudflareStatus({
          status: 'disconnected',
          message: 'ไม่สามารถเชื่อมต่อ Cloudflare Tunnel ได้'
        });
      }
    };

    // ตรวจสอบทันทีที่โหลด
    checkCloudflareStatus();

    // ตรวจสอบทุก 30 วินาที
    const interval = setInterval(checkCloudflareStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (cloudflareStatus.status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
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
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg border ${getStatusColor()} backdrop-blur-sm flex items-center gap-2 shadow-lg transition-all duration-300`}>
      {getStatusIcon()}
      <div className="flex items-center gap-2">
        {cloudflareStatus.status === 'connected' ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {cloudflareStatus.message}
        </span>
      </div>
      {cloudflareStatus.url && (
        <div className="text-xs opacity-75">
          {cloudflareStatus.url}
        </div>
      )}
    </div>
  );
};

export default CloudflareStatus;
