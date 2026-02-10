import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedGif, setSelectedGif] = useState("");

  // List of GIF URLs
  const gifList = [
    "https://media1.tenor.com/m/SblSfW2LsicAAAAd/omori-stressed.gif",
    "https://media.tenor.com/VmVUyOH2Ir4AAAAj/error-bug.gif",
    "https://media1.tenor.com/m/JNYtWc1H4HMAAAAC/number-numbers.gif",
    "https://media.tenor.com/PB2L934qTp8AAAAM/moonbird-moonbirds.gif"
  ];

  useEffect(() => {
    // Randomly select a GIF
    const randomIndex = Math.floor(Math.random() * gifList.length);
    setSelectedGif(gifList[randomIndex]);
    
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Page not found
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-muted-foreground">
          ไม่พบหน้านี้ กรุณาตรวจสอบลิงค์ใหม่แล้วลองอีกครั้ง
        </p>
        
        {/* GIF Image */}
        <div className="flex justify-center">
          <div className="w-72 h-72 rounded-2xl overflow-hidden bg-card border shadow-lg">
            {selectedGif && (
              <img 
                src={selectedGif} 
                alt="404 Error Animation"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if GIF fails to load
                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMjAyMDIwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPjQwNDwvdGV4dD4KPC9zdmc+";
                }}
              />
            )}
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
          
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-border hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ไปหน้าก่อน
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
