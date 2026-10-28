import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  QrCode, 
  Calendar, 
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  Command
} from 'lucide-react';
import authService from '../services/auth.service';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(loggedInUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Loading...</div>;

  // Role-based navigation links
  const getNavLinks = () => {
    switch(user.role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'User Management', path: '/dashboard/users', icon: Users },
          { name: 'Departments', path: '/dashboard/departments', icon: BookOpen },
          { name: 'Courses / Branches', path: '/dashboard/courses', icon: BookOpen },
          { name: 'Subjects', path: '/dashboard/subjects', icon: BookOpen },
          { name: 'All Classes', path: '/dashboard/classes', icon: BookOpen },
        ];
      case 'faculty':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Classes', path: '/dashboard/my-classes', icon: BookOpen },
          { name: 'Timetable', path: '/dashboard/timetable', icon: Calendar },
          { name: 'My Students', path: '/dashboard/students', icon: Users },
          { name: 'Subjects', path: '/dashboard/subjects', icon: BookOpen },
          { name: 'Generate QR', path: '/dashboard/qr', icon: QrCode },
          { name: 'Attendance Records', path: '/dashboard/records', icon: Calendar },
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Timetable', path: '/dashboard/timetable', icon: Calendar },
          { name: 'Scan QR', path: '/dashboard/scan', icon: QrCode },
          { name: 'My History', path: '/dashboard/history', icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-[#09090b] flex text-[#fafafa] font-sans selection:bg-primary/30 p-0 md:p-4 gap-4">
      
      {/* Detached Floating Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#18181b]/90 backdrop-blur-xl border border-white/5 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] my-0 md:my-0 flex flex-col`}>
        <div className="h-full flex flex-col pt-4">
          
          {/* Logo Area */}
          <div className="h-20 flex items-center px-8 mb-4">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             </div>
             <span className="text-2xl font-bold tracking-tight text-white">Attend<span className="text-primary">AI</span></span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Navigation</p>
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center px-4 py-3 text-[14px] font-medium rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`mr-3 h-[18px] w-[18px] transition-colors ${isActive ? 'text-primary' : 'text-white/40 group-hover:text-white/80'}`} strokeWidth={isActive ? 2.5 : 2} />
                    {link.name}
                    {isActive && <div className="ml-auto w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>}
                  </Link>
                );
              })}
            </div>

            <div className="mt-10">
               <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Account</p>
               <button onClick={handleLogout} className="flex w-full items-center px-4 py-3 text-[14px] font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group">
                 <LogOut className="mr-3 h-[18px] w-[18px] text-white/40 group-hover:text-red-400" />
                 Log Out
               </button>
            </div>
          </nav>

          {/* User Profile Mini */}
          <div className="p-4 mt-auto">
             <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5">
                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} className="w-10 h-10 rounded-full border border-white/10" alt="avatar" />
                <div className="overflow-hidden">
                   <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                   <p className="text-[11px] text-white/50 uppercase tracking-wider truncate">{user.role}</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b] md:rounded-3xl relative">
        
        {/* Glow effect in background */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2"></div>

        {/* Top Navigation Bar - Glassmorphic */}
        <header className="h-24 flex items-center justify-between px-6 md:px-10 relative z-50">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-white/60 hover:text-white md:hidden mr-4"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search removed per user request */}
          </div>
          
          {/* Right Top Icons */}
          <div className="flex items-center space-x-4 relative">
             {/* Notifications */}
             <div className="relative">
               <button onClick={() => {
                 // Close settings if open, toggle notifications
                 document.getElementById('settings-menu')?.classList.add('hidden');
                 document.getElementById('notifications-menu')?.classList.toggle('hidden');
               }} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all relative group">
                 <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
               </button>
               {/* Notifications Dropdown */}
               <div id="notifications-menu" className="hidden absolute right-0 mt-2 w-72 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                     <span className="text-sm font-bold text-white">Notifications</span>
                     <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">1 New</span>
                  </div>
                  <div className="p-4 flex gap-3 items-start hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5">
                     <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                       <span className="text-primary text-xs font-bold">A</span>
                     </div>
                     <div>
                        <p className="text-[12px] text-white/90 leading-tight"><span className="font-semibold text-white">System</span> layout updated successfully</p>
                        <p className="text-[10px] text-white/40 mt-1">Just now</p>
                     </div>
                  </div>
                  <div className="p-3 text-center cursor-pointer hover:text-white text-[12px] text-primary font-semibold">Mark all as read</div>
               </div>
             </div>
             
             {/* Settings */}
             <div className="relative">
               <button onClick={() => {
                 document.getElementById('notifications-menu')?.classList.add('hidden');
                 document.getElementById('settings-menu')?.classList.toggle('hidden');
               }} className="w-10 h-10 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group">
                 <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
               </button>
               {/* Settings Dropdown */}
               <div id="settings-menu" className="hidden absolute right-0 mt-2 w-48 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-2">
                  <div onClick={() => { document.getElementById('settings-menu').classList.add('hidden'); alert('Profile settings opened') }} className="px-4 py-2 hover:bg-white/5 text-[13px] text-white/80 cursor-pointer flex items-center gap-2 transition-colors">
                     <Users className="w-4 h-4 text-white/40" /> Profile
                  </div>
                  <div onClick={() => { document.getElementById('settings-menu').classList.add('hidden'); alert('Workspace settings opened') }} className="px-4 py-2 hover:bg-white/5 text-[13px] text-white/80 cursor-pointer flex items-center gap-2 transition-colors">
                     <Settings className="w-4 h-4 text-white/40" /> Workspace
                  </div>
                  <div className="h-px bg-white/5 my-1 w-full"></div>
                  <div onClick={handleLogout} className="px-4 py-2 hover:bg-red-500/10 text-[13px] text-red-400 cursor-pointer flex items-center gap-2 transition-colors">
                     <LogOut className="w-4 h-4 text-red-400/50" /> Log Out
                  </div>
               </div>
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 relative z-10 scroll-smooth">
          <Outlet />
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
