import { useEffect, useState } from 'react';
import { Download, Users, Calendar, Search, MapPin } from 'lucide-react';
import attendanceService from '../services/attendance.service';

export default function Records() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getRecords();
      setSessions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (session) => {
    const headers = ['Student Name', 'ID Number', 'Status', 'Marked At'];
    const rows = session.records.map(record => {
      const date = record.markedAt ? new Date(record.markedAt).toLocaleString() : '-';
      return `"${record.student?.name || 'Unknown'}","${record.student?.idNumber || 'Unknown'}","${record.status}","${date}"`;
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${session.class?.name || 'class'}_${new Date(session.date).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter(s => 
    (s.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.class?.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading session archives...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <Calendar className="w-8 h-8 text-primary" /> Session Archives
          </h1>
          <p className="text-text-muted text-[15px] mt-1">Review historical attendance data and export reports.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search classes or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#12131a] border border-border/10 rounded-full focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-[14px] text-white shadow-inner"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-20 h-20 rounded-full bg-[#1a1c25] border border-border/10 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-text-muted opacity-50" />
             </div>
             <p className="text-white font-semibold text-lg mb-2">No Archives Found</p>
             <p className="text-text-muted text-sm text-center max-w-sm">No historical attendance sessions match your criteria.</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isExpanded = expandedSession === session._id;
            const presentCount = session.records.filter(r => r.status === 'Present').length;
            const totalCount = session.records.length;
            
            return (
              <div key={session._id} className={`bg-[#1a1c25] rounded-[24px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-primary/30' : 'border-border/5 hover:border-border/20'}`}>
                {/* Header / Summary Row */}
                <div 
                  className="p-6 md:p-8 flex flex-wrap justify-between items-center cursor-pointer group"
                  onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/20 text-primary' : 'bg-[#12131a] text-white border border-border/10 group-hover:bg-[#1f2231]'}`}>
                       <Users className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-lg text-white tracking-wide">
                        {session.class?.subject?.name || 'Unknown Subject'} <span className="text-text-muted font-normal mx-2">|</span> <span className="text-primary">{session.class?.name || 'Class'}</span>
                      </h3>
                      <div className="flex items-center gap-4 text-[12px] text-text-muted font-medium uppercase tracking-wider mt-1">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} @ {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="flex items-center gap-1.5 text-blue-500/70"><MapPin className="w-3 h-3" /> {session.radius}m Radius</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-black text-white">{presentCount} <span className="text-sm font-bold text-text-muted">/ {totalCount}</span></div>
                        <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest text-primary">Present</div>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportCSV(session); }}
                        className="p-3 bg-[#12131a] text-blue-500 rounded-[12px] hover:bg-blue-500/20 transition-colors border border-border/10 tooltip relative z-10 hover:-translate-y-0.5 shadow-sm"
                        title="Export CSV"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/10 bg-[#12131a]/50 p-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                       <Users className="w-5 h-5 text-primary" />
                       <h4 className="font-bold text-[13px] text-white uppercase tracking-wider">Student Roster Details</h4>
                    </div>
                    {session.records.length === 0 ? (
                      <div className="p-4 bg-[#1a1c25] rounded-xl border border-border/10 text-center">
                         <p className="text-sm text-text-muted">No attendance data recorded for this session.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {session.records.map(record => (
                          <div key={record._id} className="flex justify-between items-center p-4 bg-[#1a1c25] border border-border/5 rounded-[16px] hover:border-primary/20 transition-colors group/card">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#12131a] flex items-center justify-center overflow-hidden border border-border/10">
                                <img src={`https://ui-avatars.com/api/?name=${record.student?.name || 'U'}&background=random&color=fff`} alt="" />
                              </div>
                              <div>
                                <div className="font-bold text-sm text-white">{record.student?.name || 'Unknown'}</div>
                                <div className="text-[11px] font-mono text-text-muted opacity-80 mt-0.5">{record.student?.idNumber || 'No ID'}</div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                              record.status === 'Present' 
                              ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(0,208,156,0.2)]' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
