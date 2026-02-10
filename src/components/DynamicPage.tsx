import React, { useState, useEffect } from 'react';

interface PageElement {
  id: string;
  type: 'text' | 'button' | 'image' | 'section' | 'hero' | 'card';
  content: string;
  styles: {
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    width?: string;
    height?: string;
  };
  position: {
    x: number;
    y: number;
  };
  props?: Record<string, any>;
}

interface PageData {
  id: string;
  name: string;
  elements: PageElement[];
  styles: {
    backgroundColor?: string;
    backgroundImage?: string;
    minHeight?: string;
  };
}

interface DynamicPageProps {
  pageId: string;
}

const DynamicPage: React.FC<DynamicPageProps> = ({ pageId }) => {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}`);
        const data = await response.json();
        
        if (data.success) {
          setPageData(data.page);
        }
      } catch (error) {
        console.error('Error fetching page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [pageId]);

  const renderElement = (element: PageElement) => {
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      ...element.styles,
      background: element.styles.backgroundColor
    };

    switch (element.type) {
      case 'hero':
        return (
          <div 
            key={element.id}
            style={elementStyle}
            className="hero-section"
          >
            <h1 className="text-center">{element.content}</h1>
          </div>
        );
      
      case 'text':
        return (
          <p 
            key={element.id}
            style={elementStyle}
          >
            {element.content}
          </p>
        );
      
      case 'button':
        return (
          <button
            key={element.id}
            style={elementStyle}
            className="px-4 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              // Handle button click based on element props or content
              if (element.content.includes('เริ่มต้นใช้งาน') || element.content.includes('สมัครสมาชิก')) {
                window.location.href = '/register';
              } else if (element.content.includes('เข้าสู่ระบบ') || element.content.includes('Login')) {
                window.location.href = '/login';
              } else if (element.content.includes('ผลิตภัณฑ์') || element.content.includes('สินค้า')) {
                window.location.href = '/products';
              } else if (element.content.includes('เติมเงิน') || element.content.includes('Topup')) {
                window.location.href = '/topup';
              }
            }}
          >
            {element.content}
          </button>
        );
      
      case 'image':
        return (
          <img
            key={element.id}
            src={element.content}
            alt="Dynamic content"
            style={elementStyle}
            className="max-w-full h-auto"
          />
        );
      
      case 'card':
        return (
          <div
            key={element.id}
            style={elementStyle}
            className="p-4 border rounded-lg shadow-md bg-white"
          >
            {element.content}
          </div>
        );
      
      case 'section':
        return (
          <div
            key={element.id}
            style={elementStyle}
            className="section"
          >
            {element.content}
          </div>
        );
      
      default:
        return (
          <div
            key={element.id}
            style={elementStyle}
          >
            {element.content}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลหน้า</h2>
          <p className="text-gray-600">กรุณาลองใหม่อีกครั้ง</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundColor: pageData.styles.backgroundColor,
        backgroundImage: pageData.styles.backgroundImage,
        minHeight: pageData.styles.minHeight || '100vh'
      }}
    >
      {pageData.elements.map(renderElement)}
      
      {/* Fallback content if no elements */}
      {pageData.elements.length === 0 && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">ยินดีต้อนรับสู่ Slumzick</h1>
            <p className="text-xl text-gray-600 mb-8">เติมเงินเกมและซื้อสินค้าดิจิทัลได้ง่ายๆ ปลอดภัย รวดเร็ว</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = '/register'}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                เริ่มต้นใช้งาน
              </button>
              <button
                onClick={() => window.location.href = '/products'}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ดูสินค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPage;