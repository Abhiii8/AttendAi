import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Users, MapPin, CheckCircle2, XCircle, Download, Printer, 
  Search, ShieldCheck, ArrowLeft, RefreshCw, Clock, Radio, Navigation
} from 'lucide-react';
import facultyService from '../services/faculty.service';
import attendanceService from '../services/attendance.service';
import { getHighAccuracyCoordinates } from '../utils/geo';

export default function GenerateQR() {
  const location = useLocation();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(location.state?.classId || '');
  const [attendanceCode, setAttendanceCode] = useState(Math.floor(1000 + Math.random() * 9000).toString());
  const [radius, setRadius] = useState(150);
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Post-Session Report State
  const [report, setReport] = useState(null);
  const [stopping, setStopping] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'present', 'absent'
  const [searchTerm, setSearchTerm] = useState('');
  const [livePresentCount, setLivePresentCount] = useState(0);

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

  // Live polling for student check-ins while session is active
  useEffect(() => {
    if (!session?._id) return;

    const interval = setInterval(async () => {
      try {
        const summary = await attendanceService.getSessionSummary(session._id);
        if (summary) {
          setLivePresentCount(summary.presentCount || 0);
        }
      } catch (err) {
        // quiet error during background polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [session?._id]);

  const handleGenerate = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError('');
    setReport(null);

    try {
      // Use multi-sample high-accuracy GPS lock
      const position = await getHighAccuracyCoordinates(5000);
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy ? Math.round(position.coords.accuracy * 10) / 10 : null;
      setGpsAccuracy(acc);

      const data = await attendanceService.startSession(selectedClass, {
        attendanceCode,
        lat,
        lng,
        radius: parseInt(radius, 10)
      });
      setSession(data);
      setLivePresentCount(0);
    } catch (err) {
      setError(err.message || 'Failed to acquire high-accuracy GPS coordinates.');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!session?._id) {
      setSession(null);
      return;
    }

    setStopping(true);
    try {
      const summaryData = await attendanceService.stopSession(session._id);
      setReport(summaryData);
      setSession(null);
    } catch (err) {
      setError('Failed to stop session: ' + err.message);
    } finally {
      setStopping(false);
    }
  };

  const handleStartNew = () => {
    setReport(null);
    setSession(null);
    setAttendanceCode(Math.floor(1000 + Math.random() * 9000).toString());
    setError('');
  };

  const exportCSV = () => {
    if (!report) return;

    const headers = [
      'Student Name',
      'Enrollment / ID',
      'Email',
      'Status',
      'Distance from Teacher (m)',
      'GPS Precision (±m)',
      'Biometric Distance',
      'Marked At Time'
    ];

    const rows = report.students.map(s => {
      const markedTime = s.markedAt ? new Date(s.markedAt).toLocaleTimeString() : 'N/A';
      const distance = s.distance !== null && s.distance !== undefined ? `${s.distance} m` : 'N/A';
      const accuracy = s.accuracy !== null && s.accuracy !== undefined ? `±${s.accuracy} m` : 'N/A';
      const faceDist = s.faceDistance !== null && s.faceDistance !== undefined ? s.faceDistance : 'N/A';

      return [
        `"${s.name}"`,
        `"${s.idNumber}"`,
        `"${s.email}"`,
        `"${s.status}"`,
        `"${distance}"`,
        `"${accuracy}"`,
        `"${faceDist}"`,
        `"${markedTime}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_${report.className}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter and search students in report
  const filteredStudents = report?.students.filter(student => {
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'present' ? student.status === 'Present' : 
      student.status !== 'Present';

    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-in flex flex-col min-h-[85vh] print:p-0">
      
      {/* =========================================================================
          VIEW 1: POST-SESSION ATTENDANCE REPORT & DISTANCE BREAKDOWN
      ========================================================================= */}
      {report ? (
        <div className="space-y-8 animate-fade-in print:space-y-4">
          
          {/* Top Banner Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <button 
              onClick={handleStartNew}
              className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Start Another Session
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="bg-[#161720] text-white px-5 py-2.5 rounded-full font-bold text-[13px] border border-border/20 hover:bg-[#1f212d] transition-all flex items-center shadow-md"
              >
                <Printer className="w-4 h-4 mr-2" /> Print Summary
              </button>
              <button 
                onClick={exportCSV}
                className="bg-primary text-[#0f172a] px-6 py-2.5 rounded-full font-bold text-[13px] hover:shadow-[0_10px_25px_-5px_rgba(0,208,156,0.5)] transition-all flex items-center"
              >
                <Download className="w-4 h-4 mr-2" /> Export to CSV
              </button>
            </div>
          </div>

          {/* Report Header Card */}
          <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden bg-gradient-to-br from-[#12131a] via-[#161722] to-[#12131a]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-widest mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Session Concluded & Logged
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">{report.className}</h1>
                <p className="text-text-muted text-sm mt-1 flex items-center gap-4 flex-wrap">
                  <span>Subject: <strong className="text-white">{report.subjectName}</strong></span>
                  <span>•</span>
                  <span>Date: <strong className="text-white">{new Date(report.date).toLocaleDateString()}</strong></span>
                  <span>•</span>
                  <span>Passcode: <strong className="font-mono text-primary">{report.attendanceCode}</strong></span>
                  <span>•</span>
                  <span>Max Radius: <strong className="text-white">{report.radius}m</strong></span>
                </p>
              </div>

              {/* Attendance percentage indicator */}
              <div className="flex items-center gap-4 bg-[#0B0C10]/60 p-4 rounded-2xl border border-white/5">
                <div className="text-right">
                  <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Attendance Rate</div>
                  <div className="text-3xl font-black text-primary font-mono">{report.attendanceRate}%</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Ambient backdrop glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Key Metrics KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#12131a] p-6 rounded-2xl border border-white/5 shadow-md">
              <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-2">Total Enrolled</span>
              <div className="text-3xl font-extrabold text-white font-mono">{report.totalStudents}</div>
              <span className="text-[11px] text-text-muted mt-1 block">Expected in class</span>
            </div>

            <div className="bg-[#12131a] p-6 rounded-2xl border border-emerald-500/20 shadow-md">
              <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider block mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Present
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">{report.presentCount}</div>
              <span className="text-[11px] text-emerald-400/60 mt-1 block">Verified & check-in</span>
            </div>

            <div className="bg-[#12131a] p-6 rounded-2xl border border-red-500/20 shadow-md">
              <span className="text-[11px] font-bold uppercase text-red-400 tracking-wider block mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Absent
              </span>
              <div className="text-3xl font-extrabold text-red-400 font-mono">{report.absentCount}</div>
              <span className="text-[11px] text-red-400/60 mt-1 block">Unverified or missing</span>
            </div>

            <div className="bg-[#12131a] p-6 rounded-2xl border border-blue-500/20 shadow-md">
              <span className="text-[11px] font-bold uppercase text-blue-400 tracking-wider block mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Avg Distance
              </span>
              <div className="text-3xl font-extrabold text-blue-400 font-mono">{report.avgDistance}<span className="text-lg">m</span></div>
              <span className="text-[11px] text-blue-400/60 mt-1 block">From your position</span>
            </div>
          </div>

          {/* Roster & Distance Table */}
          <div className="bg-[#12131a] rounded-[28px] border border-white/5 overflow-hidden shadow-xl">
            {/* Table Filter Toolbar */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-2 bg-[#0B0C10] p-1.5 rounded-full border border-white/5">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-[#0f172a]' : 'text-text-muted hover:text-white'}`}
                >
                  All ({report.totalStudents})
                </button>
                <button
                  onClick={() => setFilter('present')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'present' ? 'bg-emerald-500 text-white' : 'text-text-muted hover:text-white'}`}
                >
                  Present ({report.presentCount})
                </button>
                <button
                  onClick={() => setFilter('absent')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'absent' ? 'bg-red-500 text-white' : 'text-text-muted hover:text-white'}`}
                >
                  Absent ({report.absentCount})
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search student or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Students List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-muted">
                <thead className="bg-[#0B0C10]/80 text-[11px] uppercase tracking-wider text-text-muted font-bold border-b border-white/5">
                  <tr>
                    <th className="py-4 px-6">Student Information</th>
                    <th className="py-4 px-6">Enrollment ID</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Distance from Teacher</th>
                    <th className="py-4 px-6">Biometric Match</th>
                    <th className="py-4 px-6">Check-in Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-text-muted">
                        No students match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const isPresent = s.status === 'Present';
                      
                      // Highlight distance based on how close student was
                      let distanceBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      if (s.distance > 75) {
                        distanceBadgeClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                      } else if (s.distance > 40) {
                        distanceBadgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      }

                      return (
                        <tr key={s.studentId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1f212d] to-[#12131a] border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{s.name}</div>
                                <div className="text-xs text-text-muted">{s.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 font-mono text-xs font-semibold text-white">
                            {s.idNumber}
                          </td>

                          <td className="py-4 px-6">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle className="w-3.5 h-3.5" /> Absent
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            {isPresent && s.distance !== null ? (
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${distanceBadgeClass}`}>
                                  <MapPin className="w-3.5 h-3.5" />
                                  {s.distance} m away
                                </span>
                                {s.accuracy && (
                                  <span className="text-[10px] text-text-muted" title="Device GPS satellite accuracy">
                                    (±{s.accuracy}m)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted italic">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verified {s.faceDistance ? `(${s.faceDistance})` : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted italic">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-xs font-mono">
                            {s.markedAt ? (
                              <span className="flex items-center gap-1.5 text-white">
                                <Clock className="w-3 h-3 text-text-muted" />
                                {new Date(s.markedAt).toLocaleTimeString()}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: SESSION INITIATOR OR ACTIVE LIVE BROADCASTER
        ========================================================================= */
        <div className="flex flex-col flex-1">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Live Attendance Hub</h1>
            <p className="text-text-muted text-[15px] mt-2">Initialize or conclude a high-precision GPS-fenced biometric session.</p>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            {!session ? (
              /* Session Form */
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
                        <Radio className="w-4 h-4" />
                        In-Class PIN Code
                      </label>
                      <input 
                        type="text" 
                        value={attendanceCode} 
                        onChange={(e) => setAttendanceCode(e.target.value)}
                        className="w-full bg-[#1a1c25] border border-border/10 rounded-full px-4 py-3 text-center font-mono text-2xl tracking-widest text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 relative z-10"
                        maxLength="6"
                      />
                      <p className="text-[10px] text-text-muted mt-3 text-center uppercase tracking-widest relative z-10">Displayed on classroom board</p>
                    </div>

                    <div className="bg-[#12131a] p-6 rounded-[24px] border border-border/10 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-4 text-blue-500 ml-1 relative z-10">
                        <Navigation className="w-4 h-4" />
                        Geofence Radius
                      </label>
                      <div className="flex items-center gap-4 bg-[#1a1c25] rounded-full px-4 py-3 border border-border/10 relative z-10">
                        <input 
                          type="range" 
                          min="50" max="300" step="10"
                          value={radius} 
                          onChange={(e) => setRadius(e.target.value)}
                          style={{ background: `linear-gradient(to right, #3b82f6 ${((radius - 50) / (300 - 50)) * 100}%, #242736 ${((radius - 50) / (300 - 50)) * 100}%)` }}
                          className="w-full h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer relative z-10"
                        />
                        <span className="font-mono font-bold text-[15px] text-white min-w-[3rem] text-right">{radius}m</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-3 text-center uppercase tracking-widest relative z-10">Distance boundary limit</p>
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
                        <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0f172a]" />
                        Locking High-Accuracy GPS Satellites...
                      </span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Start Live Attendance Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Active Live Session Screen */
              <div className="flex flex-col items-center w-full max-w-4xl relative z-10 animate-fade-in">
                
                {/* Live Check-in Counter Banner */}
                <div className="mb-6 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{livePresentCount} student{livePresentCount === 1 ? '' : 's'} checked in so far</span>
                  {gpsAccuracy && <span className="text-text-muted font-normal">• GPS locked (±{gpsAccuracy}m)</span>}
                </div>

                <div className="glass-panel p-10 md:p-16 rounded-[40px] w-full border border-primary/30 shadow-[0_0_80px_rgba(0,208,156,0.15)] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 relative overflow-hidden bg-[#12131a]/80">
                  
                  {/* Animated scan line effect */}
                  <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 shadow-[0_0_20px_rgba(0,208,156,0.8)] animate-[scan_4s_linear_infinite]"></div>
                  </div>

                  {/* Left: PIN Code */}
                  <div className="flex flex-col items-center justify-center relative z-10 w-full md:w-1/2">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(0,208,156,1)]"></div>
                      <h3 className="text-xl font-bold text-white tracking-widest uppercase">Session Live</h3>
                    </div>
                    
                    <p className="text-[12px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4">Board Passcode</p>
                    <div className="bg-[#12131a] border border-primary/30 px-10 py-6 rounded-[32px] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                      <span className="font-mono text-6xl md:text-7xl font-bold text-primary tracking-widest" style={{ textShadow: '0 0 30px rgba(0,208,156,0.5)' }}>
                        {session.attendanceCode}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-4">Students must be within {session.radius}m</p>
                  </div>

                  <div className="hidden md:block w-px h-64 bg-gradient-to-b from-transparent via-border/30 to-transparent"></div>

                  {/* Right: QR Code */}
                  <div className="flex flex-col items-center justify-center relative z-10 w-full md:w-1/2">
                    <p className="text-[12px] font-bold text-text-muted uppercase tracking-[0.3em] mb-6">Scan to Connect</p>
                    <div className="p-4 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#12131a] relative group" style={{ colorScheme: 'light' }}>
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[34px] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-white rounded-[24px] p-4 flex items-center justify-center">
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
                
                {/* End Session Button */}
                <button 
                  onClick={handleStop}
                  disabled={stopping}
                  className="mt-10 px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full font-bold text-[14px] hover:shadow-[0_10px_30px_-5px_rgba(239,68,68,0.6)] transition-all duration-300 tracking-wider uppercase flex items-center gap-3 disabled:opacity-50"
                >
                  {stopping ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Closing Session & Compiling Report...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      End Session & View Attendance List
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
