import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const CloudflareCheck = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('กำลังตรวจสอบเบราว์เซอร์ของคุณ...');
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    const checkCloudflareConnection = async () => {
      try {
        // ตรวจสอบว่ามีการเชื่อมต่อผ่าน Cloudflare หรือไม่
        const response = await fetch('/api/cloudflare-status');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.status === 'connected') {
            setStatus('success');
            setMessage('การตรวจสอบสำเร็จ - กำลังเข้าสู่เว็บไซต์...');
            setTimeout(() => setCanProceed(true), 1000);
          } else {
            setStatus('error');
            setMessage('ไม่ได้เชื่อมต่อผ่าน Cloudflare - กรุณาตรวจสอบการตั้งค่า');
          }
        } else {
          throw new Error('Cloudflare connection failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('ไม่สามารถตรวจสอบการเชื่อมต่อ Cloudflare ได้');
      }
    };

    // ตรวจสอบว่าอยู่บน localhost หรือไม่
    const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('192.168.') ||
                      window.location.hostname.includes('169.254.');

    if (isLocalhost) {
      setMessage('กำลังใช้งาน Localhost - โหมดพัฒนา');
      setTimeout(() => setCanProceed(true), 1000);
      return;
    }

    // ตรวจสอบว่ามี Cloudflare headers หรือไม่ (client-side check)
    const hasCloudflareHeaders = () => {
      // ตรวจสอบว่าโหลดมาจาก Cloudflare หรือไม่
      return document.cookie.includes('cf_clearance') || 
             window.location.hostname.includes('cloudflare') ||
             navigator.userAgent.includes('Cloudflare');
    };

    if (hasCloudflareHeaders()) {
      checkCloudflareConnection();
    } else {
      // ถ้าไม่มี Cloudflare ให้แสดงข้อความแนะนำ
      setStatus('error');
      setMessage('กรุณาเชื่อมต่อผ่าน Cloudflare Tunnel ก่อนเข้าใช้งาน');
    }
  }, []);

  const handleProceed = () => {
    setCanProceed(true);
  };

  if (canProceed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-center">
            {status === 'checking' && (
              <div className="relative">
                <Shield className="w-16 h-16 text-blue-400" />
                <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 animate-spin text-blue-300" />
              </div>
            )}
            {status === 'success' && (
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="relative">
                <XCircle className="w-16 h-16 text-red-400" />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white">
            {status === 'checking' && 'กำลังตรวจสอบเบราว์เซอร์'}
            {status === 'success' && 'ตรวจสอบสำเร็จ'}
            {status === 'error' && 'ไม่สามารถเชื่อมต่อได้'}
          </h1>
          
          <p className="text-gray-400">
            {message}
          </p>
        </div>

        {/* Status Display */}
        <div className={`p-6 rounded-xl border ${
          status === 'checking' ? 'border-blue-500 bg-blue-500/10' :
          status === 'success' ? 'border-green-500 bg-green-500/10' :
          'border-red-500 bg-red-500/10'
        }`}>
          <div className="space-y-4">
            {status === 'checking' && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-blue-400">กำลังตรวจสอบ...</span>
              </div>
            )}
            
            {status === 'success' && (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">พร้อมใช้งาน</span>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">ต้องการการตั้งค่า</span>
                </div>
                
                <div className="text-left text-sm text-gray-400 space-y-2">
                  <p>• ตรวจสอบว่าได้เชื่อมต่อ Cloudflare Tunnel</p>
                  <p>• ตรวจสอบการตั้งค่า DNS</p>
                  <p>• ติดต่อผู้ดูแลระบบหากยังไม่ได้</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200"
            >
              ลองใหม่
            </button>
            
            <button
              onClick={handleProceed}
              className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-all duration-200"
            >
              ดำเนินการต่อ (ไม่แนะนำ)
            </button>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-xs text-gray-600">
          <p>การเชื่อมต่อผ่าน Cloudflare ช่วยเพิ่มความปลอดภัย</p>
          <p className="mt-1">Secured by Cloudflare</p>
        </div>
      </div>
    </div>
  );
};

export default CloudflareCheck;
