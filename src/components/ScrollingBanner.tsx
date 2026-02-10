import React, { useState, useEffect } from 'react';

const ScrollingBanner = () => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.announcements) {
          setMessages(data.announcements);
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Fallback to default messages
      setMessages([
        "🎉 ยินดีต้อนรับสู่ Kunlun! ร้านเกมออนไลน์ที่ดีที่สุด",
        "⚡ โปรโมชั่นพิเศษ! ลดราคาสินค้าทุกชิ้น 20%",
        "🔥 สินค้าใหม่มาแล้ว! ช็อปเลย"
      ]);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scroll {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          
          .animate-scroll {
            animation: scroll 45s linear infinite;
          }
        `
      }} />
      
      <div className="w-full bg-gradient-to-r from-primary/80 via-accent/70 to-primary/80 py-3 overflow-hidden relative border-y border-border/20">
        <div className="flex items-center">
          <div className="animate-scroll flex items-center whitespace-nowrap">
            {messages.map((message, index) => (
              <span key={index} className="text-primary-foreground font-semibold text-sm md:text-base px-4">
                {message}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ScrollingBanner;