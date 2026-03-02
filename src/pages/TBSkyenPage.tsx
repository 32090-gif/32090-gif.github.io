import React, { useEffect, useState, useRef } from 'react';

interface SocialLink {
  icon: string;
  value: string;
  label: string;
}

interface DiscordInfo {
  username: string;
  guildTag: string;
  avatar: string;
  lastSeen: string;
}

interface ProfileData {
  username: string;
  displayName: string;
  description: string;
  avatar: string;
  backgroundVideo: string;
  backgroundMusic: string;
  audioTitle: string;
  audioDuration: string;
  profileViews: { totalViews: number; uniqueViews: number; };
  discord: DiscordInfo;
  socials: SocialLink[];
}

const TBSkyenPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [clickToEnter, setClickToEnter] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [viewCount, setViewCount] = useState({ totalViews: 0, uniqueViews: 0 });
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const profileData: ProfileData = {
    username: "TBSkyen",
    displayName: "TBSkyen",
    description: "I don't like to chat with the lower classes",
    avatar: "/server/uploads/avatars/TBSkyen.png",
    backgroundVideo: "/server/video/10882975-uhd_3840_2160_30fps.mp4",
    backgroundMusic: "/server/video/BUFFEROVERFLOW.3DF.mp3",
    audioTitle: "BUFFEROVERFLOW.3DF",
    audioDuration: "3:44",
    profileViews: viewCount,
    discord: {
      username: "Kunlun Exploit",
      guildTag: "Owner-Developer",
      avatar: "/server/uploads/avatars/avatar-1c6d0c1d-6e85-457c-9fd0-de871b7818f9.jpg",
      lastSeen: "3 days ago",
    },
    socials: [
      { icon: "fab fa-github", value: "https://github.com/bufferoverflow", label: "GitHub" },
      { icon: "fab fa-twitter", value: "https://twitter.com/bufferoverflow", label: "Twitter" },
      { icon: "fab fa-discord", value: "https://discord.gg/bufferoverflow", label: "Discord" },
      { icon: "fab fa-instagram", value: "https://instagram.com/bufferoverflow", label: "Instagram" },
      { icon: "fab fa-youtube", value: "https://youtube.com/bufferoverflow", label: "YouTube" },
      { icon: "fab fa-tiktok", value: "https://tiktok.com/@bufferoverflow", label: "TikTok" },
    ],
  };

  const fetchViewCount = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/views/TBSkyen');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data.totalViews === 'number' && typeof data.uniqueViews === 'number') {
        setViewCount({ totalViews: data.totalViews, uniqueViews: data.uniqueViews });
      } else {
        console.error('Invalid response data:', data);
        setViewCount({ totalViews: 0, uniqueViews: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch view count:', error);
      setViewCount({ totalViews: 0, uniqueViews: 0 }); // Fallback to 0 if API fails
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    fetchViewCount(); // Fetch view count on component mount
    
    // Refresh view count every 30 seconds
    const interval = setInterval(fetchViewCount, 30000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const handleEnter = () => {
    setClickToEnter(false);
    // Auto-play audio when entering
    setTimeout(() => {
      const audio = document.getElementById('bg-music') as HTMLAudioElement;
      if (audio && !audioPlaying) {
        audio.play().catch(() => {});
        setAudioPlaying(true);
        progressInterval.current = setInterval(() => {
          if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            setProgress(pct);
            const m = Math.floor(audio.currentTime / 60);
            const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
            setCurrentTime(`${m}:${s}`);
          }
        }, 500);
      }
    }, 500);
  };

  const toggleAudio = () => {
    const audio = document.getElementById('bg-music') as HTMLAudioElement;
    if (audio) {
      if (audioPlaying) {
        audio.pause();
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      } else {
        audio.play().catch(() => {});
        progressInterval.current = setInterval(() => {
          if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            setProgress(pct);
            const m = Math.floor(audio.currentTime / 60);
            const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
            setCurrentTime(`${m}:${s}`);
          }
        }, 500);
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  if (clickToEnter) {
    return (
      <>
        <div onClick={handleEnter} style={{
          position: 'fixed', inset: 0, cursor: 'pointer', zIndex: 9999,
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          <video autoPlay muted loop playsInline style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.4,
          }}>
            <source src={profileData.backgroundVideo} type="video/mp4" />
          </video>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,255,136,0.08) 0%, rgba(0,0,0,0.85) 70%)',
          }} />
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 2rem' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  position: 'absolute', inset: `-${i * 16}px`,
                  border: `1px solid rgba(0,255,136,${0.4 - i * 0.12})`,
                  borderRadius: '50%',
                  animation: `rp ${2 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }} />
              ))}
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                border: '2px solid #00ff88',
                background: 'radial-gradient(circle, rgba(0,255,136,0.15), transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 36, animation: 'fl 3s ease-in-out infinite' }}>⚡</span>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 8 }}>
              bufferoverflow.guns.lol
            </p>
            <p style={{
              color: '#fff', fontSize: 15, letterSpacing: '6px', textTransform: 'uppercase',
              animation: 'bl 2s ease-in-out infinite',
              textShadow: '0 0 20px rgba(0,255,136,0.6)',
            }}>click to enter</p>
          </div>
        </div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          @keyframes rp { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.5} }
          @keyframes fl { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
          @keyframes bl { 0%,100%{opacity:0.5}50%{opacity:1} }
        `}</style>
      </>
    );
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="page-root">
        <video autoPlay muted loop playsInline className="bg-video">
          <source src={profileData.backgroundVideo} type="video/mp4" />
        </video>
        <div className="bg-overlay" />
        <div className="bg-grid" />
        <audio id="bg-music" loop src={profileData.backgroundMusic} />

        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${(i * 17 + 5) % 100}%`,
              animationDuration: `${8 + (i % 7) * 2}s`,
              animationDelay: `${(i * 1.3) % 10}s`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
            }} />
          ))}
        </div>

        <div className={`card ${isLoaded ? 'card--visible' : ''}`}>
          <div className="corner corner--tl" />
          <div className="corner corner--tr" />
          <div className="corner corner--bl" />
          <div className="corner corner--br" />

          {/* Avatar */}
          <div className="avatar-wrap">
            <div className="avatar-glow" />
            <div className="avatar-ring" />
            <img src={profileData.avatar} alt={profileData.username} className="avatar-img" />
            <div className="avatar-status" />
          </div>

          <h1 className="display-name">{profileData.displayName}</h1>
          <p className="tagline">{profileData.description}</p>

          <div className="divider">
            <span className="divider-dot" />
            <span className="divider-line" />
            <span className="divider-diamond">◆</span>
            <span className="divider-line" />
            <span className="divider-dot" />
          </div>

          {/* Discord */}
          <div className="discord-card">
            <div className="discord-card__shine" />
            <div className="discord-avatar-wrap">
              <img src={profileData.discord.avatar} alt="discord" className="discord-avatar" />
              <div className="discord-dot" />
            </div>
            <div className="discord-details">
              <div className="discord-row">
                <span className="discord-name">{profileData.discord.username}</span>
                <span className="discord-tag">
                  <i className="fas fa-code" style={{ fontSize: 9, marginRight: 4 }} />
                  {profileData.discord.guildTag}
                </span>
              </div>
              <span className="discord-lastseen">
                <i className="fas fa-clock" style={{ fontSize: 9, marginRight: 4, opacity: 0.5 }} />
                last seen {profileData.discord.lastSeen}
              </span>
            </div>
            <i className="fab fa-discord discord-icon-bg" />
          </div>

          {/* Socials */}
          <div className="socials-grid">
            {profileData.socials.map((social, i) => (
              <a key={i} href={social.value} target="_blank" rel="noopener noreferrer"
                className="social-btn" style={{ animationDelay: `${0.05 * i + 0.3}s` }} title={social.label}>
                <div className="social-btn__shine" />
                <i className={social.icon} />
                <span className="social-btn__label">{social.label}</span>
              </a>
            ))}
          </div>

          <div className="views-badge">
            <i className="fas fa-eye" />
            <span>{profileData.profileViews.totalViews} views ({profileData.profileViews.uniqueViews} unique)</span>
          </div>
        </div>

        {/* Audio Player */}
        <div className="audio-player">
          <div className="audio-player__accent" />
          <div className="audio-cover-wrap">
            <img src="https://r2.guns.lol/66cbe4ae-c4bb-4ef3-8821-f009f09075da.webp" alt="cover" className="audio-cover" />
            <div className={`vinyl-ring ${audioPlaying ? 'vinyl-ring--spin' : ''}`} />
          </div>
          <div className="audio-meta">
            <p className="audio-title">{profileData.audioTitle}</p>
            <div className="audio-bar-wrap">
              <span className="audio-time">{currentTime}</span>
              <div className="audio-bar">
                <div className="audio-bar__fill" style={{ width: `${progress}%` }} />
                <div className="audio-bar__thumb" style={{ left: `${Math.max(0, Math.min(100, progress))}%` }} />
              </div>
              <span className="audio-time">{profileData.audioDuration}</span>
            </div>
          </div>
          <button className="play-btn" onClick={toggleAudio} aria-label="Toggle audio">
            <i className={`fas ${audioPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        .page-root {
          font-family: 'Space Grotesk', sans-serif;
          min-height: 100vh;
          background: #0a0e16;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem 7rem;
          position: relative; overflow: hidden;
        }

        .bg-video {
          position: fixed; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0.15; z-index: 0;
        }
        .bg-overlay {
          position: fixed; inset: 0; z-index: 1;
          background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,255,136,0.05) 0%, transparent 70%),
                      linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(10,14,22,0.95) 100%);
        }
        .bg-grid {
          position: fixed; inset: 0; z-index: 1;
          background-image: linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .particles { position: fixed; inset: 0; pointer-events: none; z-index: 2; }
        .particle {
          position: absolute; top: -6px; background: #00ff88;
          border-radius: 50%; opacity: 0.3;
          animation: pfx linear infinite;
          box-shadow: 0 0 4px rgba(0,255,136,0.4);
        }
        @keyframes pfx {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        /* CARD */
        .card {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          background: rgba(10,14,22,0.92);
          border: 1px solid rgba(0,255,136,0.15);
          border-radius: 28px;
          padding: 44px 36px 36px;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 0 1px rgba(0,255,136,0.03), 0 30px 80px rgba(0,0,0,0.8);
          text-align: center;
          opacity: 0; transform: translateY(28px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
        }
        .card--visible { opacity: 1; transform: none; }

        .corner {
          position: absolute; width: 18px; height: 18px;
          border-color: #00ff88; border-style: solid; opacity: 0.3;
        }
        .corner--tl { top:14px; left:14px; border-width:2px 0 0 2px; border-radius:4px 0 0 0; }
        .corner--tr { top:14px; right:14px; border-width:2px 2px 0 0; border-radius:0 4px 0 0; }
        .corner--bl { bottom:14px; left:14px; border-width:0 0 2px 2px; border-radius:0 0 0 4px; }
        .corner--br { bottom:14px; right:14px; border-width:0 2px 2px 0; border-radius:0 0 4px 0; }

        /* AVATAR */
        .avatar-wrap { position:relative; width:110px; height:110px; margin:0 auto 20px; }
        .avatar-glow {
          position:absolute; inset:-14px;
          background: radial-gradient(circle, rgba(0,255,136,0.15), transparent 70%);
          border-radius:50%; animation:gp 3s ease-in-out infinite;
        }
        .avatar-ring {
          position:absolute; inset:-5px;
          border:2px dashed rgba(0,255,136,0.25); border-radius:50%;
          animation:rs 10s linear infinite;
        }
        .avatar-img {
          width:100%; height:100%; border-radius:50%; object-fit:cover;
          border:2.5px solid #00ff88; position:relative; z-index:1;
          box-shadow:0 0 20px rgba(0,255,136,0.25);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .avatar-img:hover { transform:scale(1.05); box-shadow:0 0 30px rgba(0,255,136,0.4); }
        .avatar-status {
          position:absolute; bottom:6px; right:6px; z-index:2;
          width:15px; height:15px; border-radius:50%;
          background:#747f8d; border:3px solid #0a0e16;
        }
        @keyframes gp { 0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:0.8;transform:scale(1.1)} }
        @keyframes rs { to{transform:rotate(360deg)} }

        .display-name {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem; font-weight: 800; letter-spacing: 3px;
          background: linear-gradient(135deg, #00ff88 0%, #7affcd 50%, #fff 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin-bottom: 8px; line-height: 1.1;
        }
        .tagline { color: rgba(232,237,245,0.6); font-size: 0.875rem; font-weight: 400; margin-bottom: 24px; letter-spacing: 0.3px; }

        .divider { display:flex; align-items:center; gap:6px; margin:0 auto 24px; max-width:200px; }
        .divider-line { flex:1; height:1px; background:rgba(0,255,136,0.15); }
        .divider-diamond { color:#00ff88; font-size:8px; opacity:0.6; }
        .divider-dot { width:4px; height:4px; border-radius:50%; background:#00ff88; opacity:0.3; }

        /* DISCORD */
        .discord-card {
          position:relative; overflow:hidden;
          display:flex; align-items:center; gap:12px;
          background:rgba(0,0,0,0.3);
          border:1px solid rgba(0,255,136,0.1); border-radius:16px;
          padding:14px 16px; margin-bottom:20px; text-align:left;
          transition: border-color 0.3s, background 0.3s;
        }
        .discord-card:hover { border-color:rgba(0,255,136,0.2); background:rgba(0,0,0,0.4); }
        .discord-card__shine {
          position:absolute; inset:0;
          background:linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
          pointer-events:none;
        }
        .discord-avatar-wrap { position:relative; flex-shrink:0; }
        .discord-avatar { width:48px; height:48px; border-radius:50%; border:2px solid rgba(0,255,136,0.2); }
        .discord-dot {
          position:absolute; bottom:1px; right:1px;
          width:13px; height:13px; border-radius:50%;
          background:#747f8d; border:2.5px solid #0a0e16;
        }
        .discord-details { flex:1; min-width:0; }
        .discord-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap; }
        .discord-name { color:#00ff88; font-weight:600; font-size:0.93rem; }
        .discord-tag {
          background:rgba(0,255,136,0.08); border:1px solid rgba(0,255,136,0.15);
          color:rgba(0,255,136,0.8); font-size:0.62rem; font-weight:600;
          padding:2px 8px; border-radius:20px; letter-spacing:0.5px; text-transform:uppercase;
        }
        .discord-lastseen { color:rgba(232,237,245,0.4); font-size:0.73rem; }
        .discord-icon-bg { font-size:30px; color:rgba(0,255,255,0.05); flex-shrink:0; }

        /* SOCIALS */
        .socials-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:22px; }
        .social-btn {
          position:relative; overflow:hidden;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px;
          height:72px;
          background:rgba(0,255,136,0.03);
          border:1px solid rgba(0,255,136,0.1); border-radius:14px;
          text-decoration:none; color:rgba(232,237,245,0.7);
          transition:all 0.3s cubic-bezier(.16,1,.3,1);
          animation: si 0.5s cubic-bezier(.16,1,.3,1) backwards;
        }
        .social-btn:hover {
          background:rgba(0,255,136,0.08);
          border-color:rgba(0,255,136,0.25);
          transform:translateY(-3px);
          box-shadow:0 8px 22px rgba(0,255,136,0.15);
          color:#00ff88;
        }
        .social-btn__shine {
          position:absolute; inset:0;
          background:linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 55%);
          pointer-events:none;
        }
        .social-btn i { font-size:20px; filter:drop-shadow(0 0 5px rgba(0,255,136,0.3)); }
        .social-btn__label { font-size:0.6rem; font-weight:500; letter-spacing:0.5px; opacity:0.5; text-transform:uppercase; }
        .social-btn:hover .social-btn__label { opacity:1; }
        @keyframes si { from{opacity:0;transform:translateY(12px) scale(0.9)} to{opacity:1;transform:none} }

        .views-badge {
          display:inline-flex; align-items:center; gap:6px;
          color:rgba(232,237,245,0.4); font-size:0.73rem;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);
          padding:5px 14px; border-radius:20px;
        }
        .views-badge i { font-size:10px; }

        /* AUDIO PLAYER */
        .audio-player {
          position:fixed; bottom:18px; left:50%; transform:translateX(-50%);
          z-index:100;
          display:flex; align-items:center; gap:14px;
          background:rgba(10,14,22,0.95);
          border:1px solid rgba(0,255,136,0.2); border-radius:20px;
          padding:12px 18px;
          width:min(400px, calc(100vw - 32px));
          backdrop-filter:blur(24px);
          box-shadow:0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(0,255,136,0.05);
          transition:box-shadow 0.3s;
        }
        .audio-player:hover { box-shadow:0 8px 40px rgba(0,0,0,0.8), 0 0 28px rgba(0,255,136,0.08); }
        .audio-player__accent {
          position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg, transparent, rgba(0,255,136,0.3), transparent);
          border-radius:20px 20px 0 0;
        }

        .audio-cover-wrap { position:relative; flex-shrink:0; width:48px; height:48px; }
        .audio-cover { width:100%; height:100%; border-radius:10px; object-fit:cover; }
        .vinyl-ring {
          position:absolute; inset:-4px; border-radius:50%;
          border:2px solid transparent;
          border-top-color:#00ff88; border-right-color:rgba(0,255,136,0.25);
          opacity:0; transition:opacity 0.3s;
        }
        .vinyl-ring--spin { animation:rs 1.5s linear infinite; opacity:1; }

        .audio-meta { flex:1; min-width:0; }
        .audio-title { font-size:0.8rem; font-weight:600; color:#e8edf5; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .audio-bar-wrap { display:flex; align-items:center; gap:8px; }
        .audio-time { color:rgba(232,237,245,0.4); font-size:0.65rem; flex-shrink:0; font-variant-numeric:tabular-nums; }
        .audio-bar {
          flex:1; height:4px; background:rgba(255,255,255,0.1);
          border-radius:4px; position:relative;
        }
        .audio-bar__fill {
          height:100%; background:#00ff88; border-radius:4px;
          box-shadow:0 0 8px rgba(0,255,136,0.4);
          transition:width 0.5s linear;
        }
        .audio-bar__thumb {
          position:absolute; top:50%; transform:translate(-50%,-50%);
          width:10px; height:10px; border-radius:50%;
          background:#fff; border:2px solid #00ff88;
          box-shadow:0 0 6px rgba(0,255,136,0.4);
          transition:left 0.5s linear;
        }
        .play-btn {
          width:38px; height:38px; border-radius:50%;
          border:1.5px solid #00ff88;
          background:rgba(0,255,136,0.08); color:#00ff88;
          font-size:13px; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.25s ease;
          box-shadow:0 0 12px rgba(0,255,136,0.15);
        }
        .play-btn:hover { background:rgba(0,255,136,0.15); box-shadow:0 0 20px rgba(0,255,136,0.3); transform:scale(1.08); }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:rgba(0,255,136,0.15); border-radius:3px; }

        @media (max-width:480px) {
          .card { padding:34px 20px 28px; }
          .display-name { font-size:1.9rem; }
        }
      `}</style>
    </>
  );
};

export default TBSkyenPage;
