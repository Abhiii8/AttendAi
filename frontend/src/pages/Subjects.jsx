import { useEffect, useState } from 'react';
import facultyService from '../services/faculty.service';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = () => {
    setLoading(true);
    facultyService.getSubjects()
      .then(data => setSubjects(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await facultyService.createSubject(formData);
      setShowModal(false);
      setFormData({ name: '', code: '' });
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && subjects.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading subjects...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Subject Library</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage academic subjects across the institution.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-[#0f172a] px-6 py-3 rounded-full font-bold text-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Subject
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-sm text-red-400 font-mono text-center">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Subject Details</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider text-right">Created At</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {subjects.map(s => (
              <tr key={s._id} className="group">
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-l border-border/10 group-hover:bg-[#1f2231] transition-colors rounded-l-[16px] first:mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary overflow-hidden shadow-inner border border-primary/20">
                       {s.code.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-[12px] text-primary font-mono mt-0.5">{s.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-border/10 group-hover:bg-[#1f2231] transition-colors">
                  <p className="text-sm text-text-muted">{s.department?.name || 'Global Subject'}</p>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-r border-border/10 group-hover:bg-[#1f2231] transition-colors rounded-r-[16px] text-right">
                  <p className="text-sm text-text-muted">{new Date(s.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {subjects.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-20 h-20 rounded-full bg-[#1a1c25] border border-border/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             </div>
             <p className="text-white font-semibold text-lg mb-2">No Subjects Found</p>
             <p className="text-text-muted text-sm text-center max-w-sm">The library is currently empty. Click "Add Subject" to create one.</p>
          </div>
        )}
      </div>

      {/* Premium Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[450px] mx-4 relative z-10 overflow-hidden flex flex-col">
            
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
               <h3 className="text-xl font-bold text-white tracking-wide">Add New Subject</h3>
               <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            <div className="p-8">
              <form id="subjectForm" onSubmit={handleCreateSubject} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Subject Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. Advanced Database Systems"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Subject Code</label>
                  <input 
                    type="text" name="code" value={formData.code} onChange={handleChange} required
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. CS302"
                  />
                </div>
              </form>
            </div>
            
            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                 Cancel
               </button>
               <button form="subjectForm" type="submit" disabled={creating} className="px-6 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0">
                 {creating ? 'Creating...' : 'Create Subject'}
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
