import { useEffect, useState } from 'react';
import { Plus, BookOpen, Users, Clock, MapPin } from 'lucide-react';
import facultyService from '../services/faculty.service';

export default function FacultyClasses() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsData, subData] = await Promise.all([
        facultyService.getClasses(),
        facultyService.getSubjects()
      ]);
      setClasses(clsData);
      setSubjects(subData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const newClass = await facultyService.createClass(formData);
      setClasses([...classes, newClass]);
      setIsModalOpen(false);
      setFormData({ name: '', subject: '' });
    } catch (err) {
      setError(err.message || 'Failed to create class');
    }
  };

  if (loading && classes.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading your classes...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Classes</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage the classes you teach and view their basic details.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-[#0f172a] px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(0,208,156,0.2)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Create Class
        </button>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {classes.length === 0 && !loading ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#1a1c25] rounded-3xl border border-border/10">
             <div className="w-20 h-20 rounded-full bg-[#1f2231] flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-text-muted" />
             </div>
             <p className="text-white font-semibold text-lg mb-2">No Classes Created Yet</p>
             <p className="text-text-muted text-sm text-center max-w-sm mb-6">Click the button above to create your first class and start taking attendance.</p>
           </div>
        ) : (
          classes.map(cls => (
            <div key={cls._id} className="bg-[#1a1c25] rounded-3xl p-6 border border-border/10 hover:border-primary/30 transition-all shadow-lg group relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{cls.name}</h3>
                  <p className="text-primary font-mono text-sm mt-1">{cls.subject?.name || 'No Subject Assigned'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#1f2231] flex items-center justify-center shadow-inner group-hover:bg-primary/10 transition-colors">
                  <BookOpen className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </div>
              
              <div className="space-y-4 relative z-10 mt-auto">
                <div className="flex items-center justify-between text-sm">
                   <span className="flex items-center text-text-muted"><Users className="w-4 h-4 mr-2" /> Enrolled Students</span>
                   <span className="text-white font-semibold">{cls.students?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                   <span className="flex items-center text-text-muted"><Clock className="w-4 h-4 mr-2" /> Weekly Slots</span>
                   <span className="text-white font-semibold">{cls.schedule?.length || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#18181b] rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">Create New Class</h2>
            <p className="text-white/50 text-sm mb-6">Create a generic class. You can add specific timeslots in the Timetable Builder later.</p>
            
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Class Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                  placeholder="e.g. TY-BTech-A"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Subject</label>
                <select 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none appearance-none"
                  required
                >
                  <option value="">Select a subject...</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/10 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-black px-6 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(0,208,156,0.3)] transition-all"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
