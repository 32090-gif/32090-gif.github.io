import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Key, Shield, User, Clock, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { isAuthenticated, getCurrentUser } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollingBanner from "@/components/ScrollingBanner";

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzHFZ2AZgZyPuViHoOhBdiG-wnE-SIbhEDYCdwPf1OJUOwSqLYVtR-y6WxswurUw1ac8g/exec';
const AD_LIST = [
    'https://endfield.gryphline.com/landing/ua/obt?hg_media=macan&hg_link_code=y6J9Nkzb&sid=20260129363d1769689232064454a&gid=39_10415609&hg_campaign_id=128&lang=en-us',
    'https://chokbet.win/lobby-slots?a=764989c23f8a150615ef3995d9ab65b1&utm_campaign=anw&utm_source=propeller&utm_medium=popunder_9332077&utm_prid=1040714997287883945',
    'https://playyaibet.org/?a=exo_3dd6ca7216f35e14bbb0801c00cb5bbc&utm_campaign=anw&utm_source=propellerads&utm_medium=popunder&utm_term=10415609&utm_prid=1040714776424223409',
    'https://nokheng789.com/?action=register&marketingRef=68e5df351a495a2bb8ed44df',
    'https://www.narakathegame.com/buy/fab-1/TH/',
    'https://chokbet.win/lobby-slots?a=764989c23f8a150615ef3995d9ab65b1&utm_campaign=anw&utm_source=propeller&utm_medium=popunder_9332080&utm_prid=1040721092135891039'
];

interface KeyHistory {
    key: string;
    expiry: string;
    genTime: number;
}

const GetKey = () => {
    const navigate = useNavigate();
    const [clickCount, setClickCount] = useState(() => {
        const userId = getCurrentUser()?.id;
        const storageKey = userId ? `user_clicks_${userId}` : 'user_clicks';
        return parseInt(localStorage.getItem(storageKey) || '0');
    });
    const [selectedHours, setSelectedHours] = useState('1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [keyHistory, setKeyHistory] = useState<KeyHistory[]>(() => {
        const userId = getCurrentUser()?.id;
        const storageKey = userId ? `key_history_${userId}` : 'key_history';
        const history = localStorage.getItem(storageKey);
        return history ? JSON.parse(history) : [];
    });
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const progressPercentage = (clickCount / 10) * 100;

    useEffect(() => {
        checkAuthentication();
    }, []);

    useEffect(() => {
        // Reload user-specific data when currentUser changes
        if (currentUser) {
            const userId = currentUser.id;
            const clickStorageKey = `user_clicks_${userId}`;
            const historyStorageKey = `key_history_${userId}`;
            
            const savedClicks = localStorage.getItem(clickStorageKey);
            const savedHistory = localStorage.getItem(historyStorageKey);
            
            setClickCount(savedClicks ? parseInt(savedClicks) : 0);
            setKeyHistory(savedHistory ? JSON.parse(savedHistory) : []);
        }
    }, [currentUser]);

    const checkAuthentication = () => {
        if (!isAuthenticated()) {
            setShowLoginModal(true);
        } else {
            const user = getCurrentUser();
            setCurrentUser(user);
        }
    };

    useEffect(() => {
        const userId = currentUser?.id;
        const storageKey = userId ? `user_clicks_${userId}` : 'user_clicks';
        localStorage.setItem(storageKey, clickCount.toString());
    }, [clickCount, currentUser]);

    useEffect(() => {
        const userId = currentUser?.id;
        const storageKey = userId ? `key_history_${userId}` : 'key_history';
        localStorage.setItem(storageKey, JSON.stringify(keyHistory));
    }, [keyHistory, currentUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            renderKeyHistory();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (cooldownTime > 0) {
            const timer = setTimeout(() => {
                setCooldownTime(cooldownTime - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsCooldown(false);
        }
    }, [cooldownTime]);

    const openRandomAd = () => {
        const randomIndex = Math.floor(Math.random() * AD_LIST.length);
        const randomID = Math.random().toString(36).substring(7);
        const targetUrl = AD_LIST[randomIndex] + (AD_LIST[randomIndex].includes('?') ? '&' : '?') + 'click_id=' + randomID;
        window.open(targetUrl, '_blank');
    };

    const handleWebLogin = () => {
        navigate('/login');
    };

    const handleGenerateAction = () => {
        if (isCooldown || isGenerating) return;

        openRandomAd();

        if (clickCount < 10) {
            setClickCount(prev => prev + 1);
            setIsCooldown(true);
            setCooldownTime(3);
            return;
        }

        generateKey();
    };

const generateKey = () => {
    setIsGenerating(true);
    
    // 1. สร้างค่า Key และวันหมดอายุ (ใช้ ค.ศ. เพื่อความแม่นยำ)
    const key = generateAES256();
    const expiry = getExpiry(selectedHours); 
    
    // 2. อัปเดตประวัติการสร้างในเครื่อง (Local UI)
    const newKey = { key, expiry, genTime: Date.now() };
    setKeyHistory(prev => [newKey, ...prev].slice(0, 15));

    // 3. เตรียมข้อมูลส่งไปที่ Google Sheets (ส่งแค่ 2 ค่า)
    const params = new URLSearchParams({
        key: key,
        expiry: expiry
    });

    // 4. ส่งข้อมูลแบบ GET ไปยัง Web App URL
    fetch(`${WEB_APP_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'cors', // ป้องกันปัญหาเรื่องข้ามโดเมน
    })
    .then((response) => {
        if (response.ok) {
            console.log("Data sent to Sheets successfully");
            toast({
                title: "สำเร็จ",
                description: "สร้างคีย์และบันทึกลงระบบเรียบร้อยแล้ว!",
            });
        }
    })
    .catch(err => {
        console.error("Network Error:", err);
        toast({
            variant: "destructive",
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถบันทึกคีย์ลงฐานข้อมูลได้",
        });
    })
    .finally(() => {
        // 5. รีเซ็ตค่าต่างๆ เพื่อเริ่มรอบใหม่
        setClickCount(0);
        setIsGenerating(false);
    });
};

    const generateAES256 = () => {
        const bytes = new Uint8Array(32);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    };

// ค้นหาฟังก์ชัน getExpiry เดิม แล้วแทนที่ด้วยอันนี้
const getExpiry = (h: string) => {
    const d = new Date();
    d.setHours(d.getHours() + parseInt(h));
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    
    // เปลี่ยนจาก d.getFullYear() + 543 เป็น d.getFullYear() (คริสต์ศักราช)
    // เพื่อให้ระบบหลังบ้านคำนวณได้แม่นยำ 100%
    const year = d.getFullYear(); 
    
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hour}:${min}`;
};

    const getTimeAgo = (timestamp: number) => {
        if (!timestamp) return 'Unknown';
        
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return seconds <= 10 ? 'Now' : `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const renderKeyHistory = () => {
        const now = Date.now();
        const filtered = keyHistory.filter(item => !item.genTime || (now - item.genTime) <= 12 * 60 * 60 * 1000);
        return filtered.slice(0, 3);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "คัดลอกแล้ว",
                description: "คัดลอกคีย์ไปยังคลิปบอร์ดแล้ว",
            });
        });
    };

    if (showLoginModal && !currentUser) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <ScrollingBanner />
                
                <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
                    <Card className="w-full max-w-md shadow-2xl border-border/50">
                        <CardHeader className="space-y-3">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Login Required
                            </CardTitle>
                            <p className="text-muted-foreground text-center">
                                Please login to generate keys
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button 
                                className="w-full h-12 text-base font-semibold" 
                                onClick={handleWebLogin}
                            >
                                <User className="w-5 h-5 mr-2" />
                                Login to Kunlun
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full h-12 text-base" 
                                onClick={() => window.location.href = '/'}
                            >
                                กลับหน้าหลัก
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <ScrollingBanner />
            
            {/* Header */}
            <div className="border-b border-border/50 bg-card/50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center">
                            <Key className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                                Key Generator
                            </h1>
                            <p className="text-sm text-muted-foreground">Generate free keys for Kunlun platform</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Progress */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-mono">PROGRESS: {clickCount}/10</span>
                                        <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-4" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Key Duration</label>
                                    <Select value={selectedHours} onValueChange={setSelectedHours}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Hour</SelectItem>
                                            <SelectItem value="6">6 Hours</SelectItem>
                                            <SelectItem value="12">12 Hours</SelectItem>
                                            <SelectItem value="24">24 Hours</SelectItem>
                                            <SelectItem value="72">3 Days</SelectItem>
                                            <SelectItem value="168">1 Week</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button 
                                    className="w-full h-12 text-base font-semibold" 
                                    onClick={handleGenerateAction}
                                    disabled={isCooldown || isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            SAVING...
                                        </>
                                    ) : isCooldown ? (
                                        <>
                                            <Clock className="w-5 h-5 mr-2" />
                                            WAIT {cooldownTime}s
                                        </>
                                    ) : clickCount >= 10 ? (
                                        <>
                                            <Key className="w-5 h-5 mr-2" />
                                            GET KEY
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5 mr-2" />
                                            START
                                        </>
                                    )}
                                </Button>

                                {currentUser && (
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg p-3">
                                        <User className="w-4 h-4 text-primary" />
                                        <span className="text-sm text-primary font-medium">
                                            {currentUser.username || currentUser.email || 'User'}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

{/* Right Panel - Key History */}
<div className="lg:col-span-2">
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Key History
            </CardTitle>
        </CardHeader>
        <CardContent>
            {/* --- เพิ่มส่วนหัวตารางตรงนี้ --- */}
            <div className="grid grid-cols-5 items-center pb-3 border-b border-border/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="pl-2">Key</div>
                <div className="text-center">Status</div>
                <div className="text-center">Expired</div>
                <div className="text-center">Created</div>
                <div className="text-right pr-4">Action</div>
            </div>
            {/* --------------------------- */}

            <div className="space-y-0"> {/* ปรับ space-y เป็น 0 เพื่อให้ติดกับ header */}
                {renderKeyHistory().length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm tracking-wider">
                        + CLICK START TO GENERATE A NEW KEY
                    </div>
                ) : (
                    renderKeyHistory().map((item, index) => (
                        <div key={index} className="grid grid-cols-5 items-center py-4 border-b border-border/5 text-sm hover:bg-white/5 transition-colors">
                            <div className="font-mono text-emerald-400 truncate pr-4 text-[11px] pl-2">
                                {item.key}
                            </div>
                            <div className="text-center">
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px] h-5">
                                    ACTIVE
                                </Badge>
                            </div>
                            <div className="text-center text-muted-foreground text-[11px]">
                                {item.expiry}
                            </div>
                            <div className="text-center text-blue-400 text-[11px] font-semibold">
                                {getTimeAgo(item.genTime)}
                            </div>
                            <div className="text-right pr-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(item.key)}
                                    className="h-8 text-[10px] px-3"
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    COPY
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </CardContent>
    </Card>
</div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default GetKey;
