import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import facultyService from '../services/faculty.service';
import attendanceService from '../services/attendance.service';

export default function GenerateQR() {
  const location = useLocation();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(location.state?.classId || '');
  const [attendanceCode, setAttendanceCode] = useState(Math.floor(1000 + Math.random() * 9000).toString());
  const [radius, setRadius] = useState(150);
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    facultyService.getClasses()
      .then(data => {
        setClasses(data);
        if (data.length > 0 && !location.state?.classId) {
          setSelectedClass(data[0]._id);
        }
      })
      .catch(err => console.error(err));
  }, [location.state]);

  const handleGenerate = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Cannot start secure session.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const data = await attendanceService.startSession(selectedClass, {
          attendanceCode,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: parseInt(radius)
        });
        setSession(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, (geoErr) => {
      setError('Failed to get location: ' + geoErr.message + '. Please allow location access to start a secure session.');
      setLoading(false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const handleStop = () => {
    setSession(null);
    setAttendanceCode(Math.floor(1000 + Math.random() * 9000).toString()); // regenerate for next time
  };

  return (
    <div className="max-w-[1000px] mx-auto animate-fade-in flex flex-col min-h-[80vh]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Generate Live Session</h1>
        <p className="text-text-muted text-[15px] mt-2">Initialize a secure, GPS-fenced attendance portal for your students.</p>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        {!session ? (
          <div className="glass-panel p-10 rounded-[40px] w-full max-w-2xl relative z-10 border border-border/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
            <div className="space-y-8">
              
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 ml-2">Target Class</label>
                <div className="relative">
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-6 py-4 text-[15px] text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none"
                  >
                    {classes.length === 0 && <option value="">No classes found</option>}
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} — {cls.subject?.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-text-muted">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#12131a] p-6 rounded-[24px] border border-border/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-4 text-primary ml-1 relative z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                    Passcode Override
                  </label>
                  <input 
                    type="text" 
                    value={attendanceCode} 
                    onChange={(e) => setAttendanceCode(e.target.value)}
                    className="w-full bg-[#1a1c25] border border-border/10 rounded-full px-4 py-3 text-center font-mono text-2xl tracking-widest text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 relative z-10"
                    maxLength="6"
                  />
                  <p className="text-[10px] text-text-muted mt-3 text-center uppercase tracking-widest relative z-10">Share verbally in class</p>
                </div>

                <div className="bg-[#12131a] p-6 rounded-[24px] border border-border/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-4 text-blue-500 ml-1 relative z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Geofence Radius
                  </label>
                  <div className="flex items-center gap-4 bg-[#1a1c25] rounded-full px-4 py-3 border border-border/10 relative z-10">
                    <input 
                      type="range" 
                      min="150" max="500" step="10"
                      value={radius} 
                      onChange={(e) => setRadius(e.target.value)}
                      style={{ background: `linear-gradient(to right, #3b82f6 ${((radius - 150) / (500 - 150)) * 100}%, #242736 ${((radius - 150) / (500 - 150)) * 100}%)` }}
                      className="w-full h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer relative z-10"
                    />
                    <span className="font-mono font-bold text-[15px] text-white min-w-[3rem] text-right">{radius}m</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-3 text-center uppercase tracking-widest relative z-10">Max scanning distance</p>
                </div>
              </div>
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center justify-center font-medium text-center">
                  {error}
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={loading || classes.length === 0}
                className="w-full py-4 bg-primary text-[#0f172a] rounded-full font-bold text-[15px] hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,208,156,0.8)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0f172a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Acquiring GPS Signal...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Initialize Secure Session
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-4xl relative z-10 animate-fade-in">
            <div className="glass-panel p-10 md:p-16 rounded-[40px] w-full border border-primary/30 shadow-[0_0_80px_rgba(0,208,156,0.15)] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 relative overflow-hidden">
              
              {/* Animated scan line effect in background */}
              <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 shadow-[0_0_20px_rgba(0,208,156,0.8)] animate-[scan_4s_linear_infinite]"></div>
              </div>

              {/* Left Side: Passcode */}
              <div className="flex flex-col items-center justify-center relative z-10 w-full md:w-1/2">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(0,208,156,1)]"></div>
                  <h3 className="text-xl font-bold text-white tracking-widest uppercase">Session Live</h3>
                </div>
                
                <p className="text-[12px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4">Manual Code</p>
                <div className="bg-[#12131a] border border-primary/30 px-10 py-6 rounded-[32px] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                  <span className="font-mono text-6xl md:text-7xl font-bold text-primary tracking-widest" style={{ textShadow: '0 0 30px rgba(0,208,156,0.5)' }}>{session.attendanceCode}</span>
                </div>
              </div>

              <div className="hidden md:block w-px h-64 bg-gradient-to-b from-transparent via-border/30 to-transparent"></div>

              {/* Right Side: QR Code */}
              <div className="flex flex-col items-center justify-center relative z-10 w-full md:w-1/2">
                <p className="text-[12px] font-bold text-text-muted uppercase tracking-[0.3em] mb-6">Scan to Connect</p>
                <div className="p-4 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#12131a] relative group" style={{ colorScheme: 'light' }}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[34px] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-[24px] p-4 flex items-center justify-center" style={{ filter: 'none !important' }}>
                    <QRCodeCanvas 
                      value={session.sessionToken} 
                      size={200}
                      level="H"
                      fgColor="#000000"
                      bgColor="#ffffff"
                      includeMargin={true}
                      className="qr-ignore-dark"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleStop}
              className="mt-12 px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-[14px] hover:bg-red-500 hover:text-white hover:shadow-[0_10px_30px_-10px_rgba(239,68,68,0.5)] transition-all duration-300 tracking-wider uppercase"
            >
              Terminate Session
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
