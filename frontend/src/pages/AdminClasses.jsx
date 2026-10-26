import { useEffect, useState } from 'react';
import facultyService from '../services/faculty.service';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyService.getClasses()
      .then(data => setClasses(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && classes.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading classes...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Active Classes</h1>
          <p className="text-text-muted text-[15px] mt-1">System-wide view of all running classes and enrollments.</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Class Details</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Assigned Faculty</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Enrolled Students</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {classes.map(cls => (
              <tr key={cls._id} className="group">
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-l border-border/10 group-hover:bg-[#1f2231] transition-colors rounded-l-[16px] first:mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-sm text-blue-500 overflow-hidden shadow-inner border border-blue-500/20">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                      <p className="font-bold text-white">{cls.name}</p>
                      <p className="text-[12px] text-primary font-mono mt-0.5">{cls.subject?.name || 'No Subject Assigned'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-border/10 group-hover:bg-[#1f2231] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#242736] flex items-center justify-center text-[10px] text-white">
                       {cls.faculty?.name?.charAt(0) || '?'}
                    </div>
                    <p className="text-sm text-white font-medium">{cls.faculty?.name || 'Unassigned'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-border/10 group-hover:bg-[#1f2231] transition-colors">
                  <div className="flex items-center gap-2">
                     <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                     <span className="text-sm font-bold text-white">{cls.students?.length || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-r border-border/10 group-hover:bg-[#1f2231] transition-colors rounded-r-[16px] text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00d09c]/10 text-[#00d09c] border border-[#00d09c]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d09c] mr-1.5 animate-pulse"></span>
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {classes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-20 h-20 rounded-full bg-[#1a1c25] border border-border/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
             </div>
             <p className="text-white font-semibold text-lg mb-2">No Classes Found</p>
             <p className="text-text-muted text-sm text-center max-w-sm">There are no classes running in the system at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
