import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Loader2, Activity, Lock, Globe } from 'lucide-react';

const CloudflareBrowserCheck = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    { icon: Shield, title: "กำลังตรวจสอบความปลอดภัย", description: "ตรวจสอบการเชื่อมต่อของคุณ" },
    { icon: Activity, title: "กำลังวิเคราะห์", description: "ตรวจสอบพฤติกรรมการใช้งาน" },
    { icon: Lock, title: "กำลังยืนยันตัวตน", description: "ยืนยันว่าคุณเป็นมนุษย์" },
    { icon: Globe, title: "กำลังเชื่อมต่อ", description: "กำลังเชื่อมต่อไปยังเว็บไซต์" }
  ];

  useEffect(() => {
    const checkBrowser = async () => {
      // ตรวจสอบว่าอยู่บน localhost หรือไม่
      const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('192.168.') ||
                        window.location.hostname.includes('169.254.');

      if (isLocalhost) {
        // Localhost - ข้ามการตรวจสอบ
        setCurrentStep(steps.length - 1);
        setProgress(100);
        setTimeout(() => setIsComplete(true), 500);
        return;
      }

      // Simulate browser checking process
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        setProgress(((i + 1) / steps.length) * 100);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
      }
      
      setIsComplete(true);
    };

    checkBrowser();
  }, []);

  const handleProceed = () => {
    setIsComplete(true);
  };

  if (isComplete) {
    return null; // ซ่อนหน้าตรวจสอบเมื่อเสร็จสิ้น
  }

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="w-16 h-16 text-blue-400" />
              <div className="absolute -top-2 -right-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white">
            กำลังตรวจสอบเบราว์เซอร์ของคุณ
          </h1>
          
          <p className="text-gray-400">
            กรุณารอสักครู่ ระบบกำลังตรวจสอบความปลอดภัยก่อนเข้าสู่เว็บไซต์
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-blue-400 w-8' 
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Current Step */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <CurrentIcon className="w-12 h-12 text-blue-400" />
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">
              {currentStepData.title}
            </h3>
            
            <p className="text-gray-400 text-sm">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>กำลังดำเนินการ...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>การป้องกัน DDoS</span>
            </div>
            <div className="flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>การเข้ารหัส SSL</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>ตรวจสอบอัตโนมัติ</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600">
          <p>การตรวจสอบนี้ใช้เวลาไม่เกิน 5 วินาที</p>
          <p className="mt-1">Secured by Cloudflare</p>
        </div>

        {/* Skip Button (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleProceed}
            className="mt-4 text-xs text-gray-500 hover:text-gray-400 underline"
          >
            ข้ามการตรวจสอบ (พัฒนา)
          </button>
        )}
      </div>
    </div>
  );
};

export default CloudflareBrowserCheck;
