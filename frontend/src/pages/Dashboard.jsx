import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/admin.service';
import facultyService from '../services/faculty.service';
import attendanceService from '../services/attendance.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, Users, Clock, Calendar, CheckCircle } from 'lucide-react';

// Minimalist Sparkline Component (No hard lines, just a soft gradient fill)
const SmoothAreaChart = ({ color = '#8b5cf6', data = 'M0 30 Q 20 15, 40 25 T 80 15 T 100 20' }) => (
  <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute bottom-0 left-0 opacity-40">
    <defs>
      <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path d={`${data} L 100 40 L 0 40 Z`} fill={`url(#grad-${color.replace('#', '')})`} />
    <path d={data} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-primary font-bold text-lg">{payload[0].value} <span className="text-white/40 text-[11px] font-medium ml-1">scans</span></p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('Daily');

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const parsedUser = JSON.parse(loggedInUser);
      setUser(parsedUser);

      if (parsedUser.role === 'admin') {
        adminService.getStats()
          .then(data => setStats(data))
          .catch(err => setFetchError(err.message || 'Failed to connect to database'))
          .finally(() => setLoading(false));
      } else if (parsedUser.role === 'faculty') {
        facultyService.getFacultyStats()
          .then(data => setStats(data))
          .catch(err => setFetchError(err.message || 'Failed to connect to database'))
          .finally(() => setLoading(false));
      } else if (parsedUser.role === 'student') {
        attendanceService.getStudentStats()
          .then(data => setStats(data))
          .catch(err => setFetchError(err.message || 'Failed to connect to database'))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Dynamic data filter from backend aggregations
  const getFilteredData = () => {
    if (!stats?.chartData) return [];
    if (timeFilter === 'Daily') return stats.chartData.daily || [];
    if (timeFilter === 'Weekly') return stats.chartData.weekly || [];
    if (timeFilter === 'Monthly') return stats.chartData.monthly || [];
    return stats.chartData.daily || [];
  };

  if (!user) return null;
  if (loading) return <div className="text-center p-8 mt-20 text-primary animate-pulse font-medium tracking-wide">Loading workspace...</div>;

  // The Error State Panel
  if (fetchError) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">System Disconnected</h2>
      <p className="text-white/50 text-center max-w-lg text-[15px] leading-relaxed mb-8">
        We cannot fetch dashboard metrics because the server connection failed. If you are using Cloudflare WARP or a VPN, your connection to Atlas may be blocked.
      </p>
      <div className="p-5 bg-black/40 border border-white/5 rounded-2xl text-sm text-red-400 font-mono text-center max-w-2xl shadow-inner w-full">
        {fetchError}
      </div>
    </div>
  );

  // Real CSV Export functionality
  const handleExport = () => {
    const dataToExport = getFilteredData();
    if (!dataToExport || dataToExport.length === 0) return alert("No data available to export");
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Time,Total Scans\n"
      + dataToExport.map(d => `${d.name},${d.value}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendai_${timeFilter.toLowerCase()}_report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-12 pt-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-white/40 text-[14px] mt-1">Here's what's happening in your organization today.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-5 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-white text-sm font-semibold rounded-xl border border-white/10 transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export Report
          </button>
          <button onClick={() => navigate('/dashboard/classes')} className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Class
          </button>
        </div>
      </div>

      {/* Admin Dashboard */}
      {user.role === 'admin' && (
        <div className="flex flex-col gap-6">

          {/* Top Row: Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Metric 1: Users */}
            <div className="glass-panel relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/40 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Total Users</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.totalUsers || 0}</h3>
                    <div className="text-[#10b981] text-[12px] font-bold bg-[#10b981]/10 px-2 py-0.5 rounded-full border border-[#10b981]/20 mb-1 flex items-center">
                      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> 12%
                    </div>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
              </div>
            </div>

            {/* Metric 2: Classes */}
            <div className="glass-panel relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-blue-500/40 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Active Classes</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.activeClasses || 0}</h3>
                    <div className="text-blue-400 text-[12px] font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 mb-1 flex items-center">
                      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> 4%
                    </div>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
              </div>
            </div>

            {/* Metric 3: Departments */}
            <div className="glass-panel relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/40 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Departments</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.totalDepartments || 0}</h3>
                    <div className="text-red-400 text-[12px] font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 mb-1 flex items-center">
                      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg> 1%
                    </div>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
              </div>
            </div>

            {/* Health Box */}
            <div className="glass-panel relative overflow-hidden group hover:border-white/20 transition-all duration-500 bg-gradient-to-br from-[#18181b] to-[#09090b]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-white/10 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex items-center justify-between h-full">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">System Health</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none">Operational</h3>
                    <div className="text-[#10b981] text-[12px] font-semibold flex items-center tracking-wide"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5 animate-pulse shadow-[0_0_8px_#10b981]"></div> All Systems Go</div>
                  </div>
                </div>
                <div className="relative w-14 h-14 shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-white/10" strokeDasharray="100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-[#10b981]" strokeDasharray="100" strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white">99%</div>
                </div>
              </div>
            </div>

          </div>

          {/* Middle Row: Main Chart + Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Chart (Spans 2 cols) */}
            <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-[420px]">
              <div className="flex justify-between items-center mb-6 z-10 relative">
                <div>
                  <h3 className="text-white font-bold text-lg">Attendance Volume</h3>
                  <p className="text-white/40 text-[13px]">Total scans recorded across all departments</p>
                </div>
                <div className="flex bg-[#18181b] rounded-lg p-1 border border-white/10 shadow-inner">
                  {['Daily', 'Monthly', 'Weekly'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-all ${timeFilter === filter
                          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                          : 'text-white/40 hover:text-white/80'
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Area Chart using Recharts */}
              <div className="flex-1 w-full mt-4 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getFilteredData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(value) => value > 0 ? `${value}` : ''}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      activeDot={{ r: 6, fill: '#09090b', stroke: '#8b5cf6', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Activity Panel (Spans 1 col) */}
            <div className="glass-panel p-6 flex flex-col h-[420px] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-white font-bold text-lg">Live Activity</h3>
                <button className="text-[12px] font-semibold text-primary hover:text-white transition-colors">View all</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-5 relative z-10 custom-scrollbar">
                {stats?.activityStream && stats.activityStream.length > 0 ? stats.activityStream.map((activity, i) => {
                  const isLast = i === stats.activityStream.length - 1;
                  let timeAgo = 'Just now';
                  try {
                    timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
                  } catch (e) { /* ignore */ }

                  return (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="relative mt-1 shrink-0">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${activity.color} flex items-center justify-center text-white font-bold text-[11px] shadow-lg group-hover:scale-110 transition-transform`}>
                          {activity.initial}
                        </div>
                        {!isLast && <div className="absolute left-1/2 top-10 bottom-[-16px] w-px bg-white/10 -translate-x-1/2"></div>}
                      </div>
                      <div>
                        <p className="text-[13px] text-white/90 leading-snug">
                          <span className="font-semibold text-white">{activity.name}</span> {activity.action} <span className="text-white font-medium">{activity.target}</span>
                        </p>
                        <p className="text-[11px] text-white/40 mt-1 font-medium capitalize">{timeAgo}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-white/40 text-[13px] text-center mt-10">No recent activity</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Faculty Dashboard View */}
      {user.role === 'faculty' && (
        <div className="mt-8 space-y-6 animate-fade-in">
          {/* Top Row: Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">My Classes</p>
                  <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.totalClasses || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Total Students</p>
                  <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.totalStudents || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Sessions Hosted</p>
                  <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.totalSessions || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <div className="glass-panel p-6 h-[420px] flex flex-col">
              <h3 className="text-white font-bold text-lg mb-6">Quick Actions</h3>
              <div className="space-y-4 flex-grow flex flex-col justify-center">
                <button 
                  onClick={() => navigate('/dashboard/qr')}
                  className="w-full flex items-center p-4 bg-primary text-black rounded-2xl font-bold shadow-[0_5px_20px_rgba(0,208,156,0.2)] hover:-translate-y-1 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center mr-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  Start Attendance Session
                </button>

                <button 
                  onClick={() => navigate('/dashboard/timetable')}
                  className="w-full flex items-center p-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                    <Calendar className="w-5 h-5" />
                  </div>
                  Manage Timetable
                </button>

                <button 
                  onClick={() => navigate('/dashboard/my-classes')}
                  className="w-full flex items-center p-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                    <Users className="w-5 h-5" />
                  </div>
                  View My Classes
                </button>
              </div>
            </div>

            {/* Today's Lectures */}
            <div className="lg:col-span-2 glass-panel p-6 h-[420px] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>
               <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="text-white font-bold text-lg">Today's Schedule</h3>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-3 relative z-10 custom-scrollbar">
                  {stats?.upcomingLectures && stats.upcomingLectures.length > 0 ? (
                    stats.upcomingLectures.map((lecture, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">{lecture.className}</h4>
                            <p className="text-white/50 text-sm">{lecture.startTime} - {lecture.endTime} | Room: {lecture.room || 'TBA'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate('/dashboard/qr')}
                          className="px-4 py-2 bg-white/10 hover:bg-primary hover:text-black text-white rounded-lg font-bold text-sm transition-colors"
                        >
                          Start
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40">
                      <Calendar className="w-12 h-12 mb-4 opacity-50" />
                      <p>You have no lectures scheduled for today.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT Dashboard */}
      {user.role === 'student' && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Metric 1: Total Classes Enrolled */}
            <div className="glass-panel relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/40 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Enrolled Classes</p>
                  <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.totalClasses || 0}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>

            {/* Metric 2: Attendance % */}
            <div className="glass-panel relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-blue-500/40 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Overall Attendance</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-white tracking-tight leading-none">{stats?.attendancePercentage || 0}%</h3>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle className="w-7 h-7 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Metric 3: ID Banner */}
            <div className="glass-panel relative overflow-hidden group hover:border-white/20 transition-all duration-500 bg-gradient-to-br from-[#18181b] to-[#09090b]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-white/10 transition-all duration-700"></div>
              <div className="p-6 relative z-10 flex flex-col justify-center h-full">
                <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest mb-1">Student ID</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-none">{user.name}</h3>
                    <p className="text-white/40 text-[13px] font-mono tracking-widest mt-1">{user.idNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <div className="lg:col-span-1 glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2 relative z-10">Student Actions</h3>
                <p className="text-white/40 text-[13px] mb-8 relative z-10">Access your attendance portals instantly.</p>
              </div>
              
              <div className="space-y-4 relative z-10">
                <button 
                  onClick={() => navigate('/dashboard/scan')}
                  className="w-full flex items-center p-4 bg-primary text-black rounded-2xl font-bold shadow-[0_5px_20px_rgba(0,208,156,0.2)] hover:-translate-y-1 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                  </div>
                  Scan QR (Mark Present)
                </button>

                <button 
                  onClick={() => navigate('/dashboard/timetable')}
                  className="w-full flex items-center p-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                    <Calendar className="w-5 h-5" />
                  </div>
                  View Full Schedule
                </button>

                <button 
                  onClick={() => navigate('/dashboard/history')}
                  className="w-full flex items-center p-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  Attendance History
                </button>
              </div>
            </div>

            {/* Today's Lectures */}
            <div className="lg:col-span-2 glass-panel p-6 h-[420px] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>
               <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="text-white font-bold text-lg">Today's Classes</h3>
                 <span className="text-[12px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-3 relative z-10 custom-scrollbar">
                  {stats?.todayLectures && stats.todayLectures.length > 0 ? (
                    stats.todayLectures.map((lecture, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">{lecture.subjectName}</h4>
                            <p className="text-white/50 text-sm">{lecture.className} | {lecture.startTime} - {lecture.endTime} | Room: {lecture.room || 'TBA'}</p>
                          </div>
                        </div>
                        {lecture.isMarked ? (
                          <div className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Marked
                          </div>
                        ) : (
                          <button 
                            onClick={() => navigate('/dashboard/scan')}
                            className="px-4 py-2 bg-white/10 hover:bg-primary hover:text-black text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-wider"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40">
                      <Calendar className="w-12 h-12 mb-4 opacity-50" />
                      <p>You have no classes scheduled for today.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
