import { useState, useEffect } from 'react';
import { Code, Upload, Download, Eye, Trash2, Plus, Edit, Copy, Check, Save, FileText, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Script {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  content?: string;
}

const ScriptEditor = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [showNewScriptModal, setShowNewScriptModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newScript, setNewScript] = useState({
    id: '',
    name: '',
    description: '',
    version: '1.0.0',
    author: 'Kunlun Team',
    content: ''
  });

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
      
      if (data.success) {
        setScripts(data.scripts);
      } else {
        alert('ไม่สามารถโหลด scripts ได้');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการโหลด scripts');
    } finally {
      setLoading(false);
    }
  };

  const fetchScriptContent = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/raw`);
      const content = await response.text();
      
      if (response.ok) {
        return content;
      } else {
        throw new Error('ไม่สามารถโหลด script ได้');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการโหลด script');
      return '';
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      alert('คัดลอกสำเร็จ!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      alert('ไม่สามารถคัดลอกได้');
    }
  };

  const getLoadstringCommand = (scriptId: string) => {
    return `loadstring(game:HttpGet("https://getkunlun.me/api/scripts/${scriptId}/raw"))()`;
  };

  const handleEditScript = async (script: Script) => {
    const content = await fetchScriptContent(script.id);
    setEditingScript({ ...script, content });
  };

  const handleSaveScript = async () => {
    if (!editingScript) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/scripts/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scriptId: editingScript.id,
          content: editingScript.content,
          name: editingScript.name,
          description: editingScript.description,
          version: editingScript.version,
          author: editingScript.author
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('บันทึก script สำเร็จ!');
        setEditingScript(null);
        fetchScripts();
      } else {
        alert('ไม่สามารถบันทึก script ได้: ' + data.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก script');
    }
  };

  const handleCreateScript = async () => {
    if (!newScript.id || !newScript.name || !newScript.content) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/scripts/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scriptId: newScript.id,
          content: newScript.content,
          name: newScript.name,
          description: newScript.description,
          version: newScript.version,
          author: newScript.author
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('สร้าง script สำเร็จ!');
        setNewScript({
          id: '',
          name: '',
          description: '',
          version: '1.0.0',
          author: 'Kunlun Team',
          content: ''
        });
        setShowNewScriptModal(false);
        fetchScripts();
      } else {
        alert('ไม่สามารถสร้าง script ได้: ' + data.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการสร้าง script');
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm('คุณต้องการลบ script นี้ใช่หรือไม่?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('ลบ script สำเร็จ!');
        fetchScripts();
      } else {
        alert('ไม่สามารถลบ script ได้');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ script');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🎮 Roblox Scripts Manager</h3>
          <p className="text-sm text-muted-foreground">จัดการ scripts สำหรับ Roblox executor</p>
        </div>
        <Dialog open={showNewScriptModal} onOpenChange={setShowNewScriptModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              สร้าง Script ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>สร้าง Script ใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scriptId">Script ID</Label>
                  <Input
                    id="scriptId"
                    placeholder="my-script"
                    value={newScript.id}
                    onChange={(e) => setNewScript(prev => ({ ...prev, id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="scriptName">ชื่อ Script</Label>
                  <Input
                    id="scriptName"
                    placeholder="My Awesome Script"
                    value={newScript.name}
                    onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="scriptDesc">คำอธิบาย</Label>
                <Input
                  id="scriptDesc"
                  placeholder="คำอธิบาย script"
                  value={newScript.description}
                  onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scriptVersion">เวอร์ชัน</Label>
                  <Input
                    id="scriptVersion"
                    placeholder="1.0.0"
                    value={newScript.version}
                    onChange={(e) => setNewScript(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="scriptAuthor">ผู้สร้าง</Label>
                  <Input
                    id="scriptAuthor"
                    placeholder="Kunlun Team"
                    value={newScript.author}
                    onChange={(e) => setNewScript(prev => ({ ...prev, author: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="scriptContent">เนื้อหา Script (Lua)</Label>
                <Textarea
                  id="scriptContent"
                  placeholder="-- @name My Script&#10;-- @description Awesome script&#10;&#10;print('Hello World!')"
                  rows={10}
                  value={newScript.content}
                  onChange={(e) => setNewScript(prev => ({ ...prev, content: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewScriptModal(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleCreateScript}>
                  สร้าง Script
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scripts List */}
      <div className="grid gap-4">
        {scripts.map((script) => (
          <Card key={script.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{script.name}</CardTitle>
                    <Badge variant="secondary">{script.version}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{script.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>โดย: {script.author}</span>
                    <span>ขนาด: {(script.size / 1024).toFixed(1)} KB</span>
                    <span>อัปเดต: {new Date(script.updatedAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getLoadstringCommand(script.id), script.id)}
                  >
                    {copiedId === script.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/api/scripts/${script.id}/raw`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditScript(script)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteScript(script.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Loadstring Command */}
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <code className="text-sm break-all">
                  {getLoadstringCommand(script.id)}
                </code>
              </div>
            </CardHeader>
          </Card>
        ))}
        
        {scripts.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">ยังไม่มี scripts</p>
              <Button onClick={() => setShowNewScriptModal(true)}>
                สร้าง Script แรก
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Script Modal */}
      {editingScript && (
        <Dialog open={!!editingScript} onOpenChange={() => setEditingScript(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                แก้ไข Script: {editingScript.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">ชื่อ Script</Label>
                  <Input
                    id="editName"
                    value={editingScript.name}
                    onChange={(e) => setEditingScript(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editVersion">เวอร์ชัน</Label>
                  <Input
                    id="editVersion"
                    value={editingScript.version}
                    onChange={(e) => setEditingScript(prev => prev ? { ...prev, version: e.target.value } : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editDesc">คำอธิบาย</Label>
                <Input
                  id="editDesc"
                  value={editingScript.description}
                  onChange={(e) => setEditingScript(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editContent">เนื้อหา Script (Lua)</Label>
                <Textarea
                  id="editContent"
                  rows={20}
                  value={editingScript.content || ''}
                  onChange={(e) => setEditingScript(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="font-mono text-sm"
                  placeholder="-- Script content here..."
                />
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  <Terminal className="w-4 h-4 inline mr-1" />
                  ใช้ภาษา Lua สำหรับ Roblox
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingScript(null)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveScript}>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ScriptEditor;
