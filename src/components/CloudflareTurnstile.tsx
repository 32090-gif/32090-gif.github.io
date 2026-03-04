import { useState, useEffect, useRef } from 'react';
import { Shield, XCircle, Loader2 } from 'lucide-react';

const TURNSTILE_SITE_KEY = '0x4AAAAAACf9_YA-uWiPDCnS';

const CloudflareTurnstile = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initTurnstile = () => {
      if (!turnstileRef.current || !isMounted) return;

      // ล้าง widget เก่าถ้ามี
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (_) {}
        widgetIdRef.current = null;
      }
      turnstileRef.current.innerHTML = '';

      try {
        const id = window.turnstile!.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          language: 'th',
          callback: (token: string) => {
            console.log('Turnstile callback token received:', token.slice(0, 20) + '...');
            if (isMounted) {
              setIsVerified(true);
              setIsLoading(false);
              setError(null);
            }
          },
          'error-callback': () => {
            if (isMounted) {
              setError('การยืนยันตัวตนล้มเหลว กรุณาลองใหม่');
              setIsLoading(false);
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setIsVerified(false);
              setError('หมดเวลายืนยันตัวตน กรุณายืนยันใหม่');
            }
          },
        });
        widgetIdRef.current = id;
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error('Error rendering Turnstile widget:', err);
        if (isMounted) {
          setError('ไม่สามารถสร้างวิดเจ็ตยืนยันตัวตนได้');
          setIsLoading(false);
        }
      }
    };

    const loadScript = () => {
      // ถ้า turnstile โหลดแล้ว init เลย
      if (window.turnstile) {
        initTurnstile();
        return;
      }

      // ตรวจว่า script มีอยู่แล้ว
      const existing = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      ) as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener('load', () => { if (isMounted) initTurnstile(); });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(() => { if (isMounted) initTurnstile(); }, 100);
      };
      script.onerror = () => {
        if (isMounted) {
          setError('ไม่สามารถเชื่อมต่อกับ Cloudflare ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
          setIsLoading(false);
        }
      };
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (_) {}
        widgetIdRef.current = null;
      }
    };
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsVerified(false);
    setIsLoading(true);
    setError(null);
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
                <span className="text-sm">กำลังโหลดวิดเจ็ตยืนยันตัวตน...</span>
              </div>
            )}

            {!isLoading && !isVerified && error && (
              <button
                onClick={handleRetry}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                ลองใหม่อีกครั้ง
              </button>
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
      render: (container: HTMLElement | null, params: Record<string, unknown>) => string;
      remove: (widgetIdOrContainer: string | HTMLElement) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

export default CloudflareTurnstile;
