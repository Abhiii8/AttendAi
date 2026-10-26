import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import attendanceService from '../services/attendance.service';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getRecords();
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (history.length === 0) return { percent: 0, present: 0, total: 0 };
    const total = history.length;
    const present = history.filter(s => s.studentStatus === 'Present').length;
    return {
      percent: Math.round((present / total) * 100),
      present,
      total
    };
  };

  const stats = calculateStats();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Fetching attendance history...</p>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-in space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
           <Activity className="w-8 h-8 text-primary" /> My Attendance Profile
        </h1>
        <p className="text-text-muted text-[15px] mt-2">Track your academic presence and biometric verification history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#12131a] p-8 rounded-[32px] border border-primary/20 shadow-[0_20px_40px_-15px_rgba(0,208,156,0.15)] relative overflow-hidden group">
          <div className="absolute -inset-4 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="text-[11px] font-bold text-primary mb-3 uppercase tracking-[0.2em]">Overall Attendance</div>
            <div className="flex items-baseline gap-1">
               <div className="text-6xl font-black text-white">{stats.percent}</div>
               <div className="text-2xl font-bold text-primary">%</div>
            </div>
            
            {/* Simple progress bar */}
            <div className="w-full h-1.5 bg-[#1a1c25] rounded-full mt-6 overflow-hidden">
               <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${stats.percent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1c25] p-8 rounded-[32px] border border-border/10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[11px] font-bold text-text-muted mb-3 uppercase tracking-[0.2em]">Total Classes</div>
          <div className="text-5xl font-black text-white">{stats.total}</div>
        </div>

        <div className="bg-[#1a1c25] p-8 rounded-[32px] border border-border/10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[11px] font-bold text-text-muted mb-3 uppercase tracking-[0.2em]">Classes Attended</div>
          <div className="text-5xl font-black text-blue-500" style={{ textShadow: '0 0 20px rgba(59,130,246,0.3)' }}>{stats.present}</div>
        </div>
      </div>

      <div className="glass-panel rounded-[32px] border border-border/10 overflow-hidden bg-[#161720]">
        <div className="p-6 md:p-8 border-b border-border/10 bg-[#12131a]/50">
          <h2 className="font-bold text-white text-lg tracking-wide uppercase">Recent Sessions</h2>
        </div>
        
        <div className="divide-y divide-border/10">
          {history.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-[#12131a] border border-border/10 flex items-center justify-center mb-6">
                  <Activity className="w-8 h-8 text-text-muted opacity-50" />
               </div>
               <p className="text-white font-semibold text-lg mb-2">No History Found</p>
               <p className="text-text-muted text-sm text-center">Your attendance history is currently empty.</p>
            </div>
          ) : (
            history.map(session => (
              <div key={session._id} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-[#1a1c25] transition-colors gap-6 group">
                
                <div className="flex gap-6 items-center">
                  <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 border ${
                    session.studentStatus === 'Present' 
                      ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_rgba(0,208,156,0.2)]' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {session.studentStatus === 'Present' ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg tracking-wide group-hover:text-primary transition-colors">
                      {session.class?.subject?.name || session.class?.name || 'Class'}
                    </div>
                    <div className="text-[12px] font-medium text-text-muted flex flex-wrap items-center gap-4 mt-2 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                  <div className="text-[11px] text-text-muted font-bold uppercase tracking-widest bg-[#12131a] px-4 py-2 rounded-full border border-border/10">
                    Faculty: <span className="text-white">{session.faculty?.name || 'Unknown'}</span>
                  </div>
                  <div className={`px-6 py-2.5 rounded-full font-bold text-[12px] text-center uppercase tracking-widest border ${
                    session.studentStatus === 'Present' 
                      ? 'bg-primary text-[#0f172a] border-primary/50 shadow-[0_0_15px_rgba(0,208,156,0.3)]' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {session.studentStatus}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
