import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Eye, 
  Edit, 
  Save, 
  Undo, 
  Redo, 
  Settings,
  Type,
  Image as ImageIcon,
  Square,
  Move,
  Palette,
  Layout
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'section';
  content: string;
  styles: Record<string, string>;
  position: { x: number; y: number };
}

const VisualEditor = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elements, setElements] = useState<EditableElement[]>([
    {
      id: 'hero-title',
      type: 'text',
      content: 'ยินดีต้อนรับสู่ Kunlun',
      styles: { 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#000',
        textAlign: 'center' 
      },
      position: { x: 0, y: 0 }
    },
    {
      id: 'hero-subtitle',
      type: 'text',
      content: 'ร้านเกมออนไลน์ที่ดีที่สุด',
      styles: { 
        fontSize: '1.2rem', 
        color: '#666',
        textAlign: 'center',
        marginTop: '1rem' 
      },
      position: { x: 0, y: 60 }
    },
    {
      id: 'cta-button',
      type: 'button',
      content: 'เลือกซื้อสินค้าเลย!',
      styles: { 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer'
      },
      position: { x: 0, y: 140 }
    }
  ]);
  
  const [editingElement, setEditingElement] = useState<EditableElement | null>(null);
  const [history, setHistory] = useState<EditableElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  const handleElementClick = (elementId: string) => {
    if (!isEditMode) return;
    
    setSelectedElement(elementId);
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setEditingElement({ ...element });
    }
  };

  const updateElement = (updates: Partial<EditableElement>) => {
    if (!editingElement) return;
    
    saveToHistory();
    setElements(prev => prev.map(el => 
      el.id === editingElement.id 
        ? { ...el, ...updates }
        : el
    ));
    setEditingElement(prev => prev ? { ...prev, ...updates } : null);
  };

  const addNewElement = (type: 'text' | 'image' | 'button' | 'section') => {
    saveToHistory();
    const newElement: EditableElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'ข้อความใหม่' : type === 'button' ? 'ปุ่มใหม่' : type === 'image' ? 'https://via.placeholder.com/200x100' : 'Section ใหม่',
      styles: type === 'text' 
        ? { fontSize: '1rem', color: '#000' }
        : type === 'button'
        ? { backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '4px' }
        : type === 'image'
        ? { width: '200px', height: '100px' }
        : { backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px' },
      position: { x: 50, y: 50 }
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setEditingElement(newElement);
  };

  const deleteElement = (elementId: string) => {
    saveToHistory();
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
      setEditingElement(null);
    }
  };

  const saveChanges = async () => {
    try {
      // Save to API (implement later)
      toast({
        title: "บันทึกสำเร็จ",
        description: "การเปลี่ยนแปลงได้รับการบันทึกแล้ว"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการเปลี่ยนแปลงได้",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Visual Editor - แก้ไขหน้าเว็บแบบ Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2"
            >
              {isEditMode ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isEditMode ? 'โหมดแก้ไข' : 'โหมดดู'}
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNewElement('text')}
                disabled={!isEditMode}
              >
                <Type className="w-4 h-4 mr-1" />
                เพิ่มข้อความ
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNewElement('button')}
                disabled={!isEditMode}
              >
                <Square className="w-4 h-4 mr-1" />
                เพิ่มปุ่ม
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNewElement('image')}
                disabled={!isEditMode}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                เพิ่มรูปภาพ
              </Button>
            </div>

            <Button onClick={saveChanges} className="ml-auto">
              <Save className="w-4 h-4 mr-2" />
              บันทึก
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>ตัวอย่างหน้าเว็บ {isEditMode && '(คลิกเพื่อแก้ไข)'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative min-h-96 bg-gray-50 p-6 rounded-lg border-2 border-dashed"
                style={{ position: 'relative', overflow: 'visible' }}
              >
                {elements.map((element) => (
                  <div
                    key={element.id}
                    onClick={() => handleElementClick(element.id)}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      selectedElement === element.id && isEditMode 
                        ? 'ring-2 ring-blue-500 ring-opacity-50' 
                        : ''
                    } ${isEditMode ? 'hover:ring-2 hover:ring-gray-300' : ''}`}
                    style={{
                      left: element.position.x,
                      top: element.position.y,
                      ...element.styles
                    }}
                  >
                    {element.type === 'text' && (
                      <span>{element.content}</span>
                    )}
                    {element.type === 'button' && (
                      <button style={element.styles}>
                        {element.content}
                      </button>
                    )}
                    {element.type === 'image' && (
                      <img 
                        src={element.content} 
                        alt="Element" 
                        style={element.styles}
                      />
                    )}
                    {element.type === 'section' && (
                      <div style={element.styles}>
                        {element.content}
                      </div>
                    )}
                    
                    {selectedElement === element.id && isEditMode && (
                      <div className="absolute -top-8 -right-8 bg-white shadow-lg rounded px-2 py-1 border">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 h-auto"
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                คุณสมบัติ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingElement ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">เนื้อหา</label>
                    {editingElement.type === 'text' || editingElement.type === 'button' ? (
                      <Input
                        value={editingElement.content}
                        onChange={(e) => updateElement({ content: e.target.value })}
                        placeholder="ใส่เนื้อหา..."
                      />
                    ) : editingElement.type === 'image' ? (
                      <Input
                        value={editingElement.content}
                        onChange={(e) => updateElement({ content: e.target.value })}
                        placeholder="URL รูปภาพ..."
                      />
                    ) : (
                      <Textarea
                        value={editingElement.content}
                        onChange={(e) => updateElement({ content: e.target.value })}
                        placeholder="เนื้อหา section..."
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">ตำแหน่ง X</label>
                      <Input
                        type="number"
                        value={editingElement.position.x}
                        onChange={(e) => updateElement({ 
                          position: { 
                            ...editingElement.position, 
                            x: parseInt(e.target.value) || 0 
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">ตำแหน่ง Y</label>
                      <Input
                        type="number"
                        value={editingElement.position.y}
                        onChange={(e) => updateElement({ 
                          position: { 
                            ...editingElement.position, 
                            y: parseInt(e.target.value) || 0 
                          }
                        })}
                      />
                    </div>
                  </div>

                  {(editingElement.type === 'text' || editingElement.type === 'button') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">ขนาดตัวอักษร</label>
                      <Input
                        value={editingElement.styles.fontSize || '1rem'}
                        onChange={(e) => updateElement({ 
                          styles: { 
                            ...editingElement.styles, 
                            fontSize: e.target.value 
                          }
                        })}
                        placeholder="1rem"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">สี</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={editingElement.styles.color || '#000000'}
                        onChange={(e) => updateElement({ 
                          styles: { 
                            ...editingElement.styles, 
                            color: e.target.value 
                          }
                        })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={editingElement.styles.color || '#000000'}
                        onChange={(e) => updateElement({ 
                          styles: { 
                            ...editingElement.styles, 
                            color: e.target.value 
                          }
                        })}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  {editingElement.type === 'button' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">สีพื้นหลัง</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={editingElement.styles.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateElement({ 
                            styles: { 
                              ...editingElement.styles, 
                              backgroundColor: e.target.value 
                            }
                          })}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={editingElement.styles.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateElement({ 
                            styles: { 
                              ...editingElement.styles, 
                              backgroundColor: e.target.value 
                            }
                          })}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isEditMode 
                    ? 'คลิกที่ element เพื่อแก้ไข' 
                    : 'เปิดโหมดแก้ไขเพื่อปรับแต่ง'
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;