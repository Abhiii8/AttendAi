import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      if (response && response.token) {
        navigate('/dashboard');
      } else {
        setError('Login failed, please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed, please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0C10] font-sans selection:bg-primary/30">
      
      {/* Left Side - Brand & Graphic with Generated Image */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-white/5">
        
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-screen transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: 'url(/bg-login.png)' }}
        ></div>
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C10]/80 via-[#0B0C10]/40 to-[#0B0C10]/90"></div>

        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,208,156,0.4)]">
                <svg className="w-6 h-6 text-[#0B0C10]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             </div>
             <h1 className="text-3xl font-black text-white tracking-wide">Attend<span className="text-primary">AI</span></h1>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
           <div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
              Enterprise Grade
           </div>
           <h2 className="text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
             Intelligent Insights.<br />Flawless Tracking.
           </h2>
           <p className="text-white/60 text-lg leading-relaxed font-medium max-w-md">
             A highly polished, deeply integrated platform for administrators, faculty, and students to manage attendance effortlessly.
           </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/40 text-[13px] font-semibold tracking-wider">
           <span>&copy; 2026 AttendAI Platform</span>
           <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
           <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
        </div>
      </div>

      {/* Right Side - Login Form (Frosted Glass Style) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

        <div className="w-full max-w-[420px] relative z-10 bg-[#12131A]/60 backdrop-blur-2xl p-10 md:p-12 rounded-[32px] border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,208,156,0.4)]">
                <svg className="w-6 h-6 text-[#0B0C10]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             </div>
             <h1 className="text-3xl font-black text-white tracking-wide">Attend<span className="text-primary">AI</span></h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-white/50 text-[15px] font-medium">Please enter your credentials to access your workspace.</p>
          </div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 backdrop-blur-md">
               <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
               <span className="text-[13px] text-red-400 leading-relaxed font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-[#0B0C10]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div className="group">
              <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                <span className="text-white/50 group-focus-within:text-primary transition-colors">Password</span>
                <a href="#" className="text-primary/70 hover:text-primary lowercase tracking-normal font-medium transition-colors">forgot?</a>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0B0C10]/50 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-[#00a87d] text-[#0f172a] py-4 rounded-2xl font-bold text-[15px] hover:shadow-[0_10px_30px_-10px_rgba(0,208,156,0.6)] transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transform hover:-translate-y-1"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-[#0f172a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Authenticate'}
            </button>
          </form>

          <div className="mt-10 text-center">
             <p className="text-white/40 text-[13px] font-medium">
               System restricted to authorized users. <br className="hidden md:block" />
               <Link to="/register" className="text-white hover:text-primary transition-colors font-semibold border-b border-white/20 hover:border-primary/50 pb-0.5 ml-1">
                 Request Access
               </Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
