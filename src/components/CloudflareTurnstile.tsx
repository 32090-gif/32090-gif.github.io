import { useState, useEffect, useRef } from 'react';
import { Shield, XCircle, Loader2 } from 'lucide-react';

const TURNSTILE_SITE_KEY = '0x4AAAAAACf9_YA-uWiPDCnS';
const SESSION_KEY = 'cf_turnstile_verified';

const CloudflareTurnstile = () => {
  // ถ้า session ผ่านแล้ว ไม่ต้องแสดง popup อีก
  const alreadyVerified = sessionStorage.getItem(SESSION_KEY) === 'true';
  const [isVerified, setIsVerified] = useState(alreadyVerified);
  // needsInteraction = true หมายความว่า Cloudflare ตัดสินว่า suspicious → ต้องแสดง popup
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ถ้าผ่านแล้วใน session นี้ ข้ามทั้งหมด
    if (isVerified) return;

    let isMounted = true;

    const handleVerified = (token: string) => {
      console.log('Turnstile passed:', token.slice(0, 20) + '...');
      if (!isMounted) return;
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsVerified(true);
      setNeedsInteraction(false);
      setIsLoading(false);
      setError(null);
    };

    const initTurnstile = () => {
      if (!turnstileRef.current || !isMounted) return;

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
          // "interaction-only" = แสดง checkbox เฉพาะเมื่อ Cloudflare
          // ตัดสินว่า traffic น่าสงสัย คนปกติผ่านอัตโนมัติ (invisible)
          appearance: 'interaction-only',
          execution: 'render',
          callback: (token: string) => {
            handleVerified(token);
          },
          'unsupported-callback': () => {
            // Browser ไม่รองรับ → ให้ผ่านไปเลย
            if (isMounted) {
              sessionStorage.setItem(SESSION_KEY, 'true');
              setIsVerified(true);
              setNeedsInteraction(false);
            }
          },
          'before-interactive-callback': () => {
            // Cloudflare ตัดสินว่า suspicious → แสดง popup
            if (isMounted) {
              setNeedsInteraction(true);
              setIsLoading(false);
            }
          },
          'after-interactive-callback': () => {
            // ผู้ใช้ทำ challenge สำเร็จ → callback จะถูกเรียกตาม
            if (isMounted) setNeedsInteraction(false);
          },
          'error-callback': () => {
            if (isMounted) {
              setError('การยืนยันตัวตนล้มเหลว กรุณาลองใหม่');
              setNeedsInteraction(true);
              setIsLoading(false);
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              sessionStorage.removeItem(SESSION_KEY);
              setIsVerified(false);
              setNeedsInteraction(true);
              setError('หมดเวลายืนยันตัวตน กรุณายืนยันใหม่');
            }
          },
          'timeout-callback': () => {
            // หมดเวลาโหลด แต่คนปกติให้ผ่านไป
            if (isMounted) {
              sessionStorage.setItem(SESSION_KEY, 'true');
              setIsVerified(true);
              setNeedsInteraction(false);
            }
          },
        });
        widgetIdRef.current = id;
        // Widget render แล้ว รอ callback จาก Cloudflare
        // ถ้าไม่มี before-interactive-callback ภายใน 3 วินาที = คนปกติ → ผ่าน
        setTimeout(() => {
          if (isMounted && !isVerified) {
            const response = widgetIdRef.current
              ? window.turnstile?.getResponse(widgetIdRef.current)
              : undefined;
            if (response) {
              handleVerified(response);
            }
          }
        }, 3000);
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error('Error rendering Turnstile widget:', err);
        if (isMounted) {
          // ถ้า render ไม่ได้เลย ให้ผ่านไปเพื่อไม่ block ทุกคน
          sessionStorage.setItem(SESSION_KEY, 'true');
          setIsVerified(true);
        }
      }
    };

    const loadScript = () => {
      if (window.turnstile) { initTurnstile(); return; }

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
        // โหลด script ไม่ได้ → ให้ผ่านไปเพื่อไม่ block คนปกติ
        if (isMounted) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          setIsVerified(true);
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
    setNeedsInteraction(false);
    setIsLoading(true);
    setError(null);
  };

  // ผ่านแล้ว หรือยังไม่ถูก flag ว่า suspicious → ไม่แสดงอะไร
  if (isVerified || (!needsInteraction && !isLoading)) {
    // ซ่อน widget แต่ยังคง render div เพื่อให้ turnstile ทำงานใน background
    return (
      <div
        ref={turnstileRef}
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      />
    );
  }

  // กำลังโหลด Turnstile script → แสดงแค่ spinner เล็กๆ ที่มุมจอ ไม่ block
  if (isLoading && !needsInteraction) {
    return (
      <>
        <div
          ref={turnstileRef}
          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
        />
        <div className="fixed bottom-4 right-4 z-[9999] bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-2 flex items-center gap-2 shadow text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          กำลังตรวจสอบความปลอดภัย...
        </div>
      </>
    );
  }

  // Cloudflare flag ว่า suspicious → แสดง popup เต็ม
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="w-16 h-16 text-blue-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">ยืนยันตัวตน</h1>
          <p className="text-gray-600">
            ระบบตรวจพบว่าการเชื่อมต่อของคุณอาจผิดปกติ<br />
            กรุณายืนยันเพื่อดำเนินการต่อ
          </p>

          {/* Turnstile Widget */}
          <div className="flex justify-center">
            <div
              ref={turnstileRef}
              className="min-h-[65px] w-full flex items-center justify-center"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-800">เกิดข้อผิดพลาด</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <button
              onClick={handleRetry}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              ลองใหม่อีกครั้ง
            </button>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-800">การป้องกันอัตโนมัติ</p>
                <p className="text-xs text-blue-700 mt-1">
                  ระบบนี้ช่วยป้องกันบอทและการโจมตีอัตโนมัติ<br />
                  ผู้เข้าชมทั่วไปจะผ่านโดยอัตโนมัติโดยไม่ต้องยืนยัน
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">Secured by Cloudflare Turnstile</div>
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
