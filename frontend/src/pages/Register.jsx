import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Brand & Graphic */}
      <div className="hidden lg:flex w-1/2 bg-[#12131a] border-r border-border/10 flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract Decorative SVG Background */}
        <svg className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 opacity-10 text-primary animate-pulse" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,97.2,-2.5C97.6,13.1,92.4,28.9,83.3,42.5C74.2,56.1,61.2,67.5,46.5,74.5C31.8,81.5,15.9,84.1,0.5,83.3C-14.9,82.5,-29.8,78.2,-43.3,70.6C-56.8,63,-68.9,52,-76.4,38.8C-83.9,25.6,-86.8,10.2,-85.7,-4.9C-84.6,-20,-79.5,-34.7,-70.7,-46.5C-61.9,-58.3,-49.4,-67.2,-36,-74.6C-22.6,-82,-8.3,-87.9,3.5,-83.4C15.3,-78.9,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white tracking-wider mb-2">Attend<span className="text-primary">AI</span></h1>
          <p className="text-text-muted text-sm font-medium uppercase tracking-widest">Next-Gen Attendance System</p>
        </div>

        <div className="relative z-10 max-w-md">
           <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Secure Registration Closed</h2>
           <p className="text-text-muted text-lg leading-relaxed">
             Public registration is currently disabled for security purposes. All accounts are provisioned by the system administrator.
           </p>
        </div>

        <div className="relative z-10 text-text-muted text-sm font-medium">
           &copy; 2026 AttendAI Platform
        </div>
      </div>

      {/* Right Side - Info Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[400px] relative z-10 text-center">
          
          <div className="lg:hidden mb-10">
             <h1 className="text-3xl font-bold text-white tracking-wider mb-1">Attend<span className="text-primary">AI</span></h1>
             <p className="text-text-muted text-xs font-medium uppercase tracking-widest">Next-Gen Attendance</p>
          </div>

          <div className="w-20 h-20 bg-[#1a1c25] rounded-full mx-auto flex items-center justify-center mb-6 border border-border/10 shadow-lg">
             <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">Registration Locked</h2>
          <p className="text-text-muted text-[15px] leading-relaxed mb-8">
            Self-registration is disabled. Please contact your institution's administrator or your faculty department head to receive your login credentials.
          </p>

          <Link to="/login" className="inline-block w-full bg-[#1a1c25] border border-border/20 text-white py-3.5 px-4 rounded-full font-bold text-[15px] hover:bg-[#242736] transition-all duration-200">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
