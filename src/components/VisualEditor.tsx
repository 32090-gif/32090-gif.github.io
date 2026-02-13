import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Image, 
  Square, 
  MousePointer, 
  Undo, 
  Redo, 
  Save,
  Eye,
  Code,
  Settings,
  Palette,
  Layout,
  Move,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const VisualEditor: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageData>({
    id: 'home',
    name: 'หน้าหลัก',
    elements: [],
    styles: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [history, setHistory] = useState<PageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  // Load page data on component mount
  useEffect(() => {
    const loadPageData = async () => {
      try {
        const response = await fetch(`/api/admin/pages/home`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.page) {
            setCurrentPage(data.page);
            setHistory([data.page]);
            setHistoryIndex(0);
          } else {
            // Use default page data if not found
            const defaultPage = {
              id: 'home',
              name: 'หน้าหลัก',
              elements: [
                {
                  id: '1',
                  type: 'hero' as const,
                  content: 'ยินดีต้อนรับสู่ Slumzick',
                  styles: {
                    fontSize: '3rem',
                    color: '#ffffff',
                    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '4rem 2rem',
                    textAlign: 'center' as const,
                    fontWeight: 'bold',
                    borderRadius: '0.5rem'
                  },
                  position: { x: 0, y: 0 }
                },
                {
                  id: '2',
                  type: 'text' as const,
                  content: 'เติมเงินเกมและซื้อสินค้าดิจิทัลได้ง่ายๆ ปลอดภัย รวดเร็ว',
                  styles: {
                    fontSize: '1.2rem',
                    color: '#6b7280',
                    textAlign: 'center' as const,
                    padding: '2rem',
                    margin: '1rem 0'
                  },
                  position: { x: 0, y: 200 }
                },
                {
                  id: '3',
                  type: 'button' as const,
                  content: 'เริ่มต้นใช้งาน',
                  styles: {
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  },
                  position: { x: 0, y: 300 }
                }
              ],
              styles: {
                backgroundColor: '#f8fafc',
                minHeight: '100vh'
              }
            };
            setCurrentPage(defaultPage);
            setHistory([defaultPage]);
            setHistoryIndex(0);
          }
        }
      } catch (error) {
        console.error('Error loading page data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, []);

  // Save to backend
  const savePageData = useCallback(async () => {
    try {
      const response = await fetch('https://getkunlun.me/api/admin/pages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(currentPage)
      });

      if (response.ok) {
        toast({
          title: "บันทึกสำเร็จ",
          description: "การแก้ไขหน้าเว็บได้รับการบันทึกแล้ว"
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการแก้ไขได้",
        variant: "destructive"
      });
    }
  }, [currentPage]);

  // History management
  const addToHistory = (newPageData: PageData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPage(newPageData);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPage(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPage(history[historyIndex + 1]);
    }
  };

  // Element manipulation
  const updateElement = (elementId: string, updates: Partial<PageElement>) => {
    const newPageData = {
      ...currentPage,
      elements: currentPage.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    };
    addToHistory(newPageData);
  };

  const deleteElement = (elementId: string) => {
    const newPageData = {
      ...currentPage,
      elements: currentPage.elements.filter(el => el.id !== elementId)
    };
    addToHistory(newPageData);
    setSelectedElement(null);
  };

  const addNewElement = (type: PageElement['type']) => {
    const newElement: PageElement = {
      id: `element_${Date.now()}`,
      type,
      content: type === 'text' ? 'ข้อความใหม่' : 
               type === 'button' ? 'ปุ่มใหม่' :
               type === 'image' ? 'https://via.placeholder.com/200x150' :
               'เนื้อหาใหม่',
      styles: {
        fontSize: type === 'text' ? '1rem' : type === 'hero' ? '2rem' : '1rem',
        color: '#000000',
        backgroundColor: type === 'button' ? '#3b82f6' : 'transparent',
        padding: '1rem',
        margin: '0.5rem',
        borderRadius: '0.25rem'
      },
      position: { x: 100, y: 100 }
    };

    const newPageData = {
      ...currentPage,
      elements: [...currentPage.elements, newElement]
    };
    addToHistory(newPageData);
    setSelectedElement(newElement.id);
  };

  // Drag and drop
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (isPreviewMode) return;
    
    setDraggedElement(elementId);
    setSelectedElement(elementId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedElement) return;
    
    const container = document.getElementById('editor-canvas');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    updateElement(draggedElement, {
      position: { x: Math.max(0, newX), y: Math.max(0, newY) }
    });
  }, [draggedElement, dragOffset, updateElement]);

  const handleMouseUp = useCallback(() => {
    setDraggedElement(null);
  }, []);

  React.useEffect(() => {
    if (draggedElement) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedElement, handleMouseMove, handleMouseUp]);

  const selectedElementData = currentPage.elements.find(el => el.id === selectedElement);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลหน้าเว็บ...</p>
        </div>
      </div>
    );
  }

  const renderElement = (element: PageElement) => {
    const isSelected = selectedElement === element.id;
    const isDragging = draggedElement === element.id;
    
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      cursor: isPreviewMode ? 'default' : 'move',
      border: isSelected && !isPreviewMode ? '2px solid #3b82f6' : 'none',
      outline: isDragging ? '2px dashed #3b82f6' : 'none',
      zIndex: isSelected ? 1000 : 'auto',
      ...element.styles,
      background: element.styles.backgroundColor
    };

    const content = (() => {
      switch (element.type) {
        case 'hero':
          return (
            <div 
              style={elementStyle}
              onMouseDown={e => handleMouseDown(e, element.id)}
              className="hero-section"
            >
              <h1>{element.content}</h1>
            </div>
          );
        case 'text':
          return (
            <p 
              style={elementStyle}
              onMouseDown={e => handleMouseDown(e, element.id)}
            >
              {element.content}
            </p>
          );
        case 'button':
          return (
            <button
              style={elementStyle}
              onMouseDown={e => handleMouseDown(e, element.id)}
              className="px-4 py-2 rounded"
            >
              {element.content}
            </button>
          );
        case 'image':
          return (
            <img
              src={element.content}
              alt="Element"
              style={elementStyle}
              onMouseDown={e => handleMouseDown(e, element.id)}
              className="max-w-full h-auto"
            />
          );
        case 'card':
          return (
            <div
              style={elementStyle}
              onMouseDown={e => handleMouseDown(e, element.id)}
              className="p-4 border rounded-lg shadow"
            >
              {element.content}
            </div>
          );
        default:
          return (
            <div
              style={elementStyle}
              onMouseDown={e => handleMouseDown(e, element.id)}
            >
              {element.content}
            </div>
          );
      }
    })();

    return (
      <div key={element.id} className="relative">
        {content}
        {isSelected && !isPreviewMode && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 p-0"
            onClick={() => deleteElement(element.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-64 bg-white border-r p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Page Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">การจัดการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={undo}
                  disabled={historyIndex === 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={redo}
                  disabled={historyIndex === history.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={savePageData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant={isPreviewMode ? "default" : "outline"}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'แก้ไข' : 'ดูตัวอย่าง'}
              </Button>
            </CardContent>
          </Card>

          {/* Add Elements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">เพิ่มองค์ประกอบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNewElement('text')}
                className="w-full justify-start"
              >
                <Type className="h-4 w-4 mr-2" />
                ข้อความ
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNewElement('button')}
                className="w-full justify-start"
              >
                <Square className="h-4 w-4 mr-2" />
                ปุ่ม
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNewElement('image')}
                className="w-full justify-start"
              >
                <Image className="h-4 w-4 mr-2" />
                รูปภาพ
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNewElement('card')}
                className="w-full justify-start"
              >
                <Layout className="h-4 w-4 mr-2" />
                การ์ด
              </Button>
            </CardContent>
          </Card>

          {/* Elements List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">องค์ประกอบ ({currentPage.elements.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentPage.elements.map((element) => (
                <div
                  key={element.id}
                  className={`p-2 rounded cursor-pointer border ${
                    selectedElement === element.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {element.type === 'text' && <Type className="h-4 w-4" />}
                      {element.type === 'button' && <Square className="h-4 w-4" />}
                      {element.type === 'image' && <Image className="h-4 w-4" />}
                      {element.type === 'hero' && <Layout className="h-4 w-4" />}
                      {element.type === 'card' && <Layout className="h-4 w-4" />}
                      <span className="text-sm font-medium capitalize">
                        {element.type}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {element.id.slice(0, 6)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {element.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="font-semibold">{currentPage.name}</h2>
            <Badge variant="outline">
              {currentPage.elements.length} องค์ประกอบ
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isPreviewMode ? "default" : "secondary"}>
              {isPreviewMode ? 'โหมดดูตัวอย่าง' : 'โหมดแก้ไข'}
            </Badge>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <div
            id="editor-canvas"
            className="relative min-h-full"
            style={{
              backgroundColor: currentPage.styles.backgroundColor,
              backgroundImage: currentPage.styles.backgroundImage,
              minHeight: currentPage.styles.minHeight || '100vh'
            }}
            onClick={() => !isPreviewMode && setSelectedElement(null)}
          >
            {currentPage.elements.map(renderElement)}
            
            {!isPreviewMode && currentPage.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Layout className="h-12 w-12 mx-auto mb-4" />
                  <p>เริ่มสร้างหน้าเว็บของคุณ</p>
                  <p className="text-sm">เพิ่มองค์ประกอบจากแถบด้านซ้าย</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      {selectedElementData && !isPreviewMode && (
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                คุณสมบัติ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content */}
              <div>
                <Label htmlFor="content">เนื้อหา</Label>
                {selectedElementData.type === 'text' || selectedElementData.type === 'hero' ? (
                  <Textarea
                    id="content"
                    value={selectedElementData.content}
                    onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    id="content"
                    value={selectedElementData.content}
                    onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                    className="mt-1"
                  />
                )}
              </div>

              <Separator />

              {/* Styles */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">การจัดรูปแบบ</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fontSize" className="text-xs">ขนาดตัวอักษร</Label>
                    <Input
                      id="fontSize"
                      value={selectedElementData.styles.fontSize || ''}
                      onChange={(e) => updateElement(selectedElementData.id, {
                        styles: { ...selectedElementData.styles, fontSize: e.target.value }
                      })}
                      placeholder="1rem"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fontWeight" className="text-xs">น้ำหนักตัวอักษร</Label>
                    <Select
                      value={selectedElementData.styles.fontWeight || 'normal'}
                      onValueChange={(value) => updateElement(selectedElementData.id, {
                        styles: { ...selectedElementData.styles, fontWeight: value }
                      })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">ปกติ</SelectItem>
                        <SelectItem value="bold">หนา</SelectItem>
                        <SelectItem value="lighter">เบา</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="color" className="text-xs">สีตัวอักษร</Label>
                    <Input
                      id="color"
                      type="color"
                      value={selectedElementData.styles.color || '#000000'}
                      onChange={(e) => updateElement(selectedElementData.id, {
                        styles: { ...selectedElementData.styles, color: e.target.value }
                      })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="backgroundColor" className="text-xs">สีพื้นหลัง</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={
                        selectedElementData.styles.backgroundColor?.startsWith('#') 
                          ? selectedElementData.styles.backgroundColor 
                          : '#ffffff'
                      }
                      onChange={(e) => updateElement(selectedElementData.id, {
                        styles: { ...selectedElementData.styles, backgroundColor: e.target.value }
                      })}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="textAlign" className="text-xs">จัดตำแหน่งข้อความ</Label>
                  <Select
                    value={selectedElementData.styles.textAlign || 'left'}
                    onValueChange={(value: 'left' | 'center' | 'right') => updateElement(selectedElementData.id, {
                      styles: { ...selectedElementData.styles, textAlign: value }
                    })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">ซ้าย</SelectItem>
                      <SelectItem value="center">กลาง</SelectItem>
                      <SelectItem value="right">ขวา</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="padding" className="text-xs">Padding</Label>
                    <Input
                      id="padding"
                      value={selectedElementData.styles.padding || ''}
                      onChange={(e) => updateElement(selectedElementData.id, {
                        styles: { ...selectedElementData.styles, padding: e.target.value }
                      })}
                      placeholder="1rem"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin" className="text-xs">Margin</Label>
                    <Input
                      id="margin"
                      value={selectedElementData.styles.margin || ''}
                      onChange={(e) => updateElement(selectedElementData.id, {
                        styles: { ...selectedElementData.styles, margin: e.target.value }
                      })}
                      placeholder="1rem"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="borderRadius" className="text-xs">มุมโค้ง</Label>
                  <Input
                    id="borderRadius"
                    value={selectedElementData.styles.borderRadius || ''}
                    onChange={(e) => updateElement(selectedElementData.id, {
                      styles: { ...selectedElementData.styles, borderRadius: e.target.value }
                    })}
                    placeholder="0.5rem"
                    className="text-xs"
                  />
                </div>
              </div>

              <Separator />

              {/* Position */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">ตำแหน่ง</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="posX" className="text-xs">X</Label>
                    <Input
                      id="posX"
                      type="number"
                      value={selectedElementData.position.x}
                      onChange={(e) => updateElement(selectedElementData.id, {
                        position: { ...selectedElementData.position, x: parseInt(e.target.value) || 0 }
                      })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="posY" className="text-xs">Y</Label>
                    <Input
                      id="posY"
                      type="number"
                      value={selectedElementData.position.y}
                      onChange={(e) => updateElement(selectedElementData.id, {
                        position: { ...selectedElementData.position, y: parseInt(e.target.value) || 0 }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VisualEditor;