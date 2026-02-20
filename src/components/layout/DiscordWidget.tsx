import { useState, useEffect } from "react";
import { MessageCircle, X, Users } from "lucide-react";

interface DiscordWidgetData {
  id: string;
  name: string;
  instant_invite: string;
  channels: Array<{
    id: string;
    name: string;
    position: number;
  }>;
  members: Array<{
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    status: string;
    bot: boolean;
  }>;
  presence_count: number;
}

const DiscordWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [widgetData, setWidgetData] = useState<DiscordWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SERVER_ID = "1425425387256680519";

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://discordapp.com/api/servers/${SERVER_ID}/widget.json`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch Discord widget data');
        }
        
        const data = await response.json();
        setWidgetData(data);
        setError(null);
      } catch (err) {
        console.error('Discord widget error:', err);
        setError('ไม่สามารถโหลดข้อมูล Discord ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchWidgetData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Discord Widget Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-gradient-to-r from-[#5865F2] to-[#7289DA] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">{widgetData?.name || 'Kunlun Shop Community'}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5865F2]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">{error}</p>
                <a
                  href={`https://discord.gg/${SERVER_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  เข้าร่วม Discord
                </a>
              </div>
            ) : widgetData ? (
              <>
                <p className="text-sm text-muted-foreground">
                  เข้าร่วมชุมชน Discord ของเราเพื่อรับข่าวสาร โปรโมชั่น และการสนับสนุนลูกค้า
                </p>
                
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Users className="w-8 h-8 text-[#5865F2]" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{widgetData.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {widgetData.presence_count} ออนไลน์ • {widgetData.members.length} สมาชิก
                      </p>
                    </div>
                  </div>
                </div>

                {/* Online Members Preview */}
                {widgetData.members.slice(0, 6).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">สมาชิกที่ออนไลน์อยู่</p>
                    <div className="flex -space-x-2">
                      {widgetData.members.slice(0, 6).map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center text-white text-xs font-medium border-2 border-card"
                          title={`${member.username}#${member.discriminator}`}
                        >
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {widgetData.members.length > 6 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                          +{widgetData.members.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <a
                  href={widgetData.instant_invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-center py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  เข้าร่วม Discord ({widgetData.presence_count} ออนไลน์)
                </a>
              </>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Discord Button with online indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#5865F2] hover:bg-[#4752C4] text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center group relative"
        aria-label="เปิด Discord widget"
      >
        <MessageCircle className="w-6 h-6" />
        {widgetData && widgetData.presence_count > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {widgetData.presence_count > 99 ? '99+' : widgetData.presence_count}
          </span>
        )}
        {!isOpen && (
          <span className="absolute right-full mr-3 bg-card border border-border px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            แชทกับเราบน Discord {widgetData && `(${widgetData.presence_count} ออนไลน์)`}
          </span>
        )}
      </button>
    </div>
  );
};

export default DiscordWidget;
