import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Webhook, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Download,
  Copy,
  Shield
} from 'lucide-react';

interface WebhookLog {
  id: string;
  timestamp: string;
  scriptName: string;
  scriptId: string;
  version: string;
  updateCount: number;
  status: 'success' | 'failed' | 'pending';
  response?: string;
  error?: string;
  webhookUrl: string;
  addedFeatures?: string;
  removedFeatures?: string;
}

const WebhookLogs = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const navigate = useNavigate();

  // Test dialog state
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testData, setTestData] = useState({
    scriptId: '',
    scriptName: '',
    version: '',
    scriptType: 'Free' as 'Free' | 'Paid',
    addedFeatures: '',
    removedFeatures: ''
  });

  // Form state
  const [scriptId, setScriptId] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [version, setVersion] = useState('');
  const [scriptType, setScriptType] = useState<'Free' | 'Paid'>('Free');
  const [profileName, setProfileName] = useState('');
  const [addedFeatures, setAddedFeatures] = useState('');
  const [removedFeatures, setRemovedFeatures] = useState('');

  useEffect(() => {
    checkAuth();
    loadLogs();
  }, []);

  const checkAuth = () => {
    const authenticated = isAuthenticated();
    setIsAdmin(authenticated);
    setAuthChecking(false);
    
    if (!authenticated) {
      navigate('/admin-login');
    }
  };

  const loadLogs = () => {
    try {
      const savedLogs = localStorage.getItem('webhook_logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWebhookLog = (log: WebhookLog) => {
    const updatedLogs = [log, ...logs];
    setLogs(updatedLogs);
    
    // เก็บใน localStorage (จำกัด 1000 logs)
    const limitedLogs = updatedLogs.slice(0, 1000);
    localStorage.setItem('webhook_logs', JSON.stringify(limitedLogs));
  };

  const simulateWebhookCall = async (scriptId: string, scriptName: string, version: string, useTestData: boolean = false) => {
    const featuresToAdd = useTestData ? testData.addedFeatures : addedFeatures;
    const featuresToRemove = useTestData ? testData.removedFeatures : removedFeatures;
    
    const log: WebhookLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      scriptName,
      scriptId,
      version,
      updateCount: 1,
      status: 'pending' as const,
      webhookUrl: 'https://discord.com/api/webhooks/1475891486443831367/JoMJNJUD4B9UlpUJ3FnOglr2HtHW-rLAVQ9Dmpt4MTGY8dTBRuYLe5rh883yAt9Xm4a2',
      addedFeatures: featuresToAdd.trim() || undefined,
      removedFeatures: featuresToRemove.trim() || undefined
    };

    saveWebhookLog(log);

    // จำลองส่ง webhook
    try {
      // สร้างข้อความพร้อม features
      const currentScriptType = useTestData ? testData.scriptType : scriptType;
      let message = `**Script: ${scriptName} ${version} - ${currentScriptType}**`;
      
      // เพิ่ม features ที่เพิ่ม
      if (featuresToAdd.trim()) {
        const addedList = featuresToAdd.split('\n').filter(f => f.trim()).map(f => `+ ${f.trim()}`).join('\n');
        message += `\n\`\`\`diff\n${addedList}\n\`\`\``;
      }
      
      // เพิ่ม features ที่ลบ
      if (featuresToRemove.trim()) {
        const removedList = featuresToRemove.split('\n').filter(f => f.trim()).map(f => `- ${f.trim()}`).join('\n');
        message += `\n\`\`\`diff\n${removedList}\n\`\`\``;
      }
      
      message += `\n@everyone\n\n**Get Script ⁠⁠https://discord.com/channels/1425425387256680519/1432548436535672912**`;

      const payload = {
        content: message
      };

      const response = await fetch('https://discord.com/api/webhooks/1475891486443831367/JoMJNJUD4B9UlpUJ3FnOglr2HtHW-rLAVQ9Dmpt4MTGY8dTBRuYLe5rh883yAt9Xm4a2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const successLog = {
          ...log,
          status: 'success' as const,
          response: 'Webhook sent successfully'
        };
        saveWebhookLog(successLog);
        
        // Clear form if not using test data
        if (!useTestData) {
          setScriptId('');
          setScriptName('');
          setVersion('');
          setAddedFeatures('');
          setRemovedFeatures('');
        }
        
        // อัปเดต log เดิม
        const index = logs.findIndex(l => l.id === log.id);
        if (index !== -1) {
          const updatedLogs = [...logs];
          updatedLogs[index] = successLog;
          setLogs(updatedLogs);
        }
      } else {
        throw new Error('Failed to send webhook');
      }
    } catch (error) {
      const errorLog = {
        ...log,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      saveWebhookLog(errorLog);
      
      // อัปเดต log เดิม
      const index = logs.findIndex(l => l.id === log.id);
      if (index !== -1) {
        const updatedLogs = [...logs];
        updatedLogs[index] = errorLog;
        setLogs(updatedLogs);
      }
    }
  };

  const testWebhook = () => {
    setShowTestDialog(true);
  };

  const executeTestWebhook = async () => {
    await simulateWebhookCall(
      testData.scriptId || 'test-script',
      testData.scriptName || 'Test Script',
      testData.version || '1.0.0',
      true // useTestData flag
    );
    setShowTestDialog(false);
    setTestData({
      scriptId: '',
      scriptName: '',
      version: '',
      scriptType: 'Free',
      addedFeatures: '',
      removedFeatures: ''
    });
  };

  const clearLogs = () => {
    if (confirm('คุณต้องการลบุนทุก logs ใช่หรือไม่?')) {
      setLogs([]);
      localStorage.removeItem('webhook_logs');
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `webhook-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('คัดลอกสำเร็จ!');
    } catch (error) {
      alert('ไม่สามารถคัดลอกได้');
    }
  };

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Webhook className="w-4 h-4" />;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์เข้าถึงหน้า logs</p>
          <button
            onClick={() => navigate('/admin-login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            เข้าสู่ระบบ Admin
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📡 Webhook Logs</h1>
                <p className="text-gray-600">ดูประวัติการส่งข้อมูลไป Discord</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={testWebhook} variant="outline" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  ทดสอบ Webhook
                </Button>
                <Button onClick={clearLogs} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  ล้าง Logs
                </Button>
                <Button onClick={exportLogs} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Logs
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
                <Webhook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-xs text-muted-foreground">logs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สำเร็จ</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <p className="text-xs text-muted-foreground">logs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ล้มเหลว</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">logs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">รอดคอยู่</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">logs</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium">กรอง:</span>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              ทั้งหมด
            </Button>
            <Button
              variant={filter === 'success' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('success')}
            >
              สำเร็จ
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              ล้มเหลว
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              รอดคอยู่
            </Button>
          </div>

          {/* Webhook Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                ส่ง Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="scriptName">ชื่อ Script</Label>
                    <Input
                      id="scriptName"
                      value={scriptName}
                      onChange={(e) => setScriptName(e.target.value)}
                      placeholder="เช่น Kunlun Premium Script"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="เช่น 1.0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scriptType">ประเภท Script</Label>
                    <Select value={scriptType} onValueChange={(value: 'Free' | 'Paid') => setScriptType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free">Free</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scriptId">Script ID (optional)</Label>
                  <Input
                    id="scriptId"
                    value={scriptId}
                    onChange={(e) => setScriptId(e.target.value)}
                    placeholder="เช่น kunlun-premium"
                  />
                </div>

                <div>
                  <Label htmlFor="addedFeatures">Features ที่เพิ่ม (แบ่งบรรทัดละ 1 อัน)</Label>
                  <Textarea
                    id="addedFeatures"
                    value={addedFeatures}
                    onChange={(e) => setAddedFeatures(e.target.value)}
                    placeholder="+ ESP Wallhack&#10;+ Aimbot&#10;+ Speed Hack"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="removedFeatures">Features ที่ลบ (แบ่งบรรทัดละ 1 อัน)</Label>
                  <Textarea
                    id="removedFeatures"
                    value={removedFeatures}
                    onChange={(e) => setRemovedFeatures(e.target.value)}
                    placeholder="- Old ESP System&#10;- Legacy Aimbot"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => simulateWebhookCall(scriptId || 'test-script', scriptName || 'Test Script', version || '1.0.0')}
                  disabled={!scriptName || !version}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  ส่ง Webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhook Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">ไม่มี logs</p>
                    <p className="text-sm text-gray-500">ลองส่ง webhook หรือทดสอบ</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{log.scriptName}</h3>
                            <p className="text-sm text-gray-600">ID: {log.scriptId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.version}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Update #{log.updateCount}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Timestamp: {new Date(log.timestamp).toLocaleString('th-TH')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Webhook className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Webhook: {log.webhookUrl.substring(0, 50)}...
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(log.webhookUrl)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {log.status === 'success' && log.response && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>✅ Success:</strong> {log.response}
                          </p>
                        </div>
                      )}
                      
                      {log.addedFeatures && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 font-semibold mb-2">✨ Added Features:</p>
                          <pre className="text-xs text-blue-700 whitespace-pre-wrap">{log.addedFeatures}</pre>
                        </div>
                      )}
                      
                      {log.removedFeatures && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-semibold mb-2">🗑️ Removed Features:</p>
                          <pre className="text-xs text-red-700 whitespace-pre-wrap">{log.removedFeatures}</pre>
                        </div>
                      )}
                      
                      {log.status === 'failed' && log.error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>❌ Error:</strong> {log.error}
                          </p>
                        </div>
                      )}
                      
                      {log.status === 'pending' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>⏳ Pending:</strong> กำลังส่ง...
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Webhook Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>ทดสอบ Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testScriptName">ชื่อ Script</Label>
                  <Input
                    id="testScriptName"
                    value={testData.scriptName}
                    onChange={(e) => setTestData({ ...testData, scriptName: e.target.value })}
                    placeholder="เช่น Test Script"
                  />
                </div>
                <div>
                  <Label htmlFor="testVersion">Version</Label>
                  <Input
                    id="testVersion"
                    value={testData.version}
                    onChange={(e) => setTestData({ ...testData, version: e.target.value })}
                    placeholder="เช่น 1.0.0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="testScriptType">ประเภท Script</Label>
                <Select value={testData.scriptType} onValueChange={(value: 'Free' | 'Paid') => setTestData({ ...testData, scriptType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="testScriptId">Script ID (optional)</Label>
                <Input
                  id="testScriptId"
                  value={testData.scriptId}
                  onChange={(e) => setTestData({ ...testData, scriptId: e.target.value })}
                  placeholder="เช่น test-script"
                />
              </div>
              <div>
                <Label htmlFor="testAddedFeatures">Features ที่เพิ่ม (optional)</Label>
                <Textarea
                  id="testAddedFeatures"
                  value={testData.addedFeatures}
                  onChange={(e) => setTestData({ ...testData, addedFeatures: e.target.value })}
                  placeholder="+ ESP Wallhack&#10;+ Aimbot"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="testRemovedFeatures">Features ที่ลบ (optional)</Label>
                <Textarea
                  id="testRemovedFeatures"
                  value={testData.removedFeatures}
                  onChange={(e) => setTestData({ ...testData, removedFeatures: e.target.value })}
                  placeholder="- Old System&#10;- Legacy Features"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={executeTestWebhook}>
                ส่ง Webhook
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default WebhookLogs;
