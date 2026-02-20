import { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

const CloudflareTurnstile = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // ฟังก์ชันตรวจสอบ token กับ server
  const verifyToken = async (token: string) => {
    setIsVerifyingToken(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Turnstile verification successful:', data);
        setIsVerified(true);
        setIsLoading(false);
        setError(null);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setError('การยืนยันตัวตนล้มเหลว กรุณาลองใหม่');
      setIsLoading(false);
      
      // รีเซ็ต turnstile
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset();
      }
    } finally {
      setIsVerifyingToken(false);
    }
  };

  useEffect(() => {
    // โหลด Cloudflare Turnstile script
    const loadTurnstile = () => {
      // ตรวจสอบว่ามี script อยู่แล้วหรือไม่
      if (window.turnstile) {
        initTurnstile();
        return;
      }

      // สร้าง script element
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setTimeout(() => {
          if (window.turnstile) {
            initTurnstile();
          } else {
            console.error('Turnstile not available after script load');
            setError('ไม่สามารถโหลดระบบยืนยันตัวตนได้');
            setIsLoading(false);
          }
        }, 100);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Turnstile script:', error);
        setError('ไม่สามารถเชื่อมต่อกับ Cloudflare ได้');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    const initTurnstile = () => {
      console.log('Initializing Turnstile widget...');
      
      if (!turnstileRef.current) {
        console.error('Turnstile ref not found');
        return;
      }

      // ล้าง turnstile เก่าถ้ามี
      if (turnstileRef.current.firstChild) {
        turnstileRef.current.innerHTML = '';
      }

      // สร้าง turnstile widget
      try {
        setIsLoading(true);
        setError(null);

        // ตรวจสอบว่าอยู่บน localhost หรือไม่
        const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('192.168.') ||
                          window.location.hostname.includes('169.254.');

        if (isLocalhost) {
          console.log('Localhost detected - skipping Turnstile');
          setIsVerified(true);
          setIsLoading(false);
          return;
        }

        // ตรวจสอบว่ามี Cloudflare headers หรือไม่
        const checkCloudflare = async () => {
          try {
            const response = await fetch('/api/cloudflare-status');
            const data = await response.json();
            
            if (!data.success) {
              console.log('Not connected to Cloudflare - skipping Turnstile');
              setError('ไม่ได้เชื่อมต่อผ่าน Cloudflare');
              setIsLoading(false);
              return;
            }
            
            console.log('Cloudflare connected - loading Turnstile');
            // สร้าง turnstile widget
            const widgetId = window.turnstile.render(turnstileRef.current, {
              sitekey: '0x4AAAAAACf9_YA-uWiPDCnS',
              theme: 'light',
              language: 'th',
              callback: verifyToken,
              'error-callback': setError,
              'expired-callback': () => setIsVerified(false)
            });
            
            console.log('Turnstile widget created:', widgetId);
            setIsLoading(false);
          } catch (error) {
            console.error('Cloudflare check failed:', error);
            setError('ไม่สามารถตรวจสอบ Cloudflare ได้');
            setIsLoading(false);
          }
        };

        checkCloudflare();
      } catch (error) {
        console.error('Error creating Turnstile widget:', error);
        setError('ไม่สามารถสร้างวิดเจ็ตยืนยันตัวตนได้');
        setIsLoading(false);
      }
    };

    loadTurnstile();

    return () => {
      // Cleanup
      if (window.turnstile && turnstileRef.current) {
        try {
          window.turnstile.remove(turnstileRef.current);
        } catch (err) {
          console.error('Error removing Turnstile:', err);
        }
      }
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsVerified(false);
    setIsLoading(true);
    setError(null);
  };

  const handleSkip = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องข้ามการยืนยันตัวตน? (ไม่แนะนำสำหรับการใช้งานจริง)')) {
      setIsVerified(true);
    }
  };

  if (isVerified) {
    return null; // ซ่อนหน้า verify เมื่อผ่านแล้ว
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="w-16 h-16 text-blue-500" />
              {isLoading && (
                <div className="absolute -top-1 -right-1">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            ยืนยันตัวตน
          </h1>
          
          <p className="text-gray-600">
            กรุณายืนยันตัวตนเพื่อความปลอดภัยของระบบ
          </p>

          {/* Turnstile Widget Container */}
          <div className="flex justify-center">
            <div 
              ref={turnstileRef} 
              className="min-h-[65px] w-full flex items-center justify-center"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-800">
                    เกิดข้อผิดพลาด
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            )}

            {isVerifyingToken && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">กำลังยืนยันตัวตน...</span>
              </div>
            )}

            {!isLoading && !isVerified && !isVerifyingToken && (
              <>
                {error && (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-red-600">{error}</p>
                    <p className="text-xs text-gray-500">
                      แนะนำ: ตั้งค่า Cloudflare Tunnel หรือ Cloudflare Proxy
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleSkip}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200"
                >
                  ดำเนินการต่อ (ไม่มีการป้องกัน)
                </button>
              </>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-800">
                  การป้องกันอัตโนมัติ
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  ระบบนี้ช่วยป้องกันบอทและการโจมตีอัตโนมัติเพื่อความปลอดภัยของคุณ
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500">
            Secured by Cloudflare Turnstile
          </div>
        </div>
      </div>
    </div>
  );
};

// Add TypeScript declaration for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, params: any) => string;
      remove: (container: HTMLElement) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

export default CloudflareTurnstile;
