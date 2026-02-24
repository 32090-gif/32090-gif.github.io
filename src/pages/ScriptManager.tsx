import { useState, useEffect } from 'react';
import { Code, Upload, Download, Eye, Trash2, Plus, Edit, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Script {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

const ScriptManager = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        toast.error('ไม่สามารถโหลด scripts ได้');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลด scripts');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('คัดลอกสำเร็จ!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  const getLoadstringCommand = (scriptId: string) => {
    return `loadstring(game:HttpGet("https://getkunlun.me/api/scripts/${scriptId}/raw"))()`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด scripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎮 Roblox Script Manager</h1>
          <p className="text-gray-600">จัดการและแชร์ Roblox scripts สำหรับ executor</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{scripts.length}</p>
              </div>
              <Code className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ขนาดรวม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(scripts.reduce((acc, script) => acc + script.size, 0) / 1024).toFixed(1)} KB
                </p>
              </div>
              <Download className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">เวอร์ชันล่าสุด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scripts.length > 0 ? scripts[0].version : 'N/A'}
                </p>
              </div>
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Scripts List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Scripts ทั้งหมด</h2>
          </div>
          
          {scripts.length === 0 ? (
            <div className="text-center py-12">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">ยังไม่มี scripts</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                อัปโหลด Script
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scripts.map((script) => (
                <div key={script.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{script.name}</h3>
                      <p className="text-gray-600 mb-2">{script.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>เวอร์ชัน: {script.version}</span>
                        <span>โดย: {script.author}</span>
                        <span>ขนาด: {(script.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => copyToClipboard(getLoadstringCommand(script.id), script.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="คัดลอก loadstring"
                      >
                        {copiedId === script.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedScript(script);
                          setShowViewModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/api/scripts/${script.id}/raw`, '_blank')}
                        className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                        title="ดู raw"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Loadstring Command */}
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <code className="text-sm text-gray-700 break-all">
                      {getLoadstringCommand(script.id)}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📖 วิธีใช้งาน</h3>
          <div className="space-y-2 text-blue-800">
            <p>1. คัดลอกคำสั่ง loadstring ของ script ที่ต้องการ</p>
            <p>2. ไปที่เกม Roblox และเปิด executor (เช่น Synapse X, KRNL, ฯลฯ)</p>
            <p>3. วางคำสั่งใน executor และกด Execute</p>
            <p>4. Script จะโหลดและทำงานในเกม</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptManager;
