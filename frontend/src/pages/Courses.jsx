import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    durationYears: 3,
    totalSemesters: 6,
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [crsData, deptData] = await Promise.all([
        adminService.getCourses().catch(() => []),
        adminService.getDepartments().catch(() => [])
      ]);
      setCourses(crsData || []);
      setDepartments(deptData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      department: departments[0]?._id || '',
      durationYears: 3,
      totalSemesters: 6,
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingId(course._id);
    setFormData({
      name: course.name,
      code: course.code,
      department: course.department?._id || course.department || '',
      durationYears: course.durationYears || 3,
      totalSemesters: course.totalSemesters || 6,
      description: course.description || ''
    });
    setShowModal(true);
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course/branch?')) return;
    try {
      await adminService.deleteCourse(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (editingId) {
        await adminService.updateCourse(editingId, formData);
      } else {
        await adminService.createCourse(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && courses.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading courses & branches...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Courses & Degree Branches</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage academic degree programs (BCA, iMScIT, MCA, B.Tech) and their durations.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary text-[#0f172a] px-6 py-3 rounded-full font-bold text-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 flex items-center self-start md:self-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Course / Branch
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-sm text-red-400 font-mono text-center">
          {error}
        </div>
      )}

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        {courses.map(course => (
          <div key={course._id} className="glass-panel relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500 flex flex-col justify-between p-6 min-h-[200px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 font-mono">
                  {course.code}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => openEditModal(course)} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5" title="Edit Course">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={() => handleDeleteCourse(course._id)} className="p-2 text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/10" title="Delete Course">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{course.name}</h3>
              <p className="text-xs text-text-muted line-clamp-2 mb-4">{course.description || 'Academic degree program.'}</p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-text-muted font-mono">
              <span className="text-white/60">
                🏛️ {course.department?.name || 'Department'} ({course.department?.code || 'N/A'})
              </span>
              <span className="text-blue-400 font-bold">
                {course.durationYears} Yrs ({course.totalSemesters} Sem)
              </span>
            </div>
          </div>
        ))}

        {courses.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <p className="text-white font-semibold text-lg mb-2">No Courses Added</p>
            <p className="text-text-muted text-sm text-center max-w-sm">Click "Add Course / Branch" to configure your degree programs.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[500px] mx-4 relative z-10 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
              <h3 className="text-xl font-bold text-white tracking-wide">{editingId ? 'Edit Course / Branch' : 'Add New Course / Branch'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-8">
              <form id="courseForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Course Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. Bachelor of Computer Applications"
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Course Code</label>
                    <input 
                      type="text" name="code" value={formData.code} onChange={handleChange} required
                      placeholder="e.g. BCA, IMSCIT"
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Department</label>
                    <select 
                      name="department" value={formData.department} onChange={handleChange} required
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Duration (Years)</label>
                    <input 
                      type="number" name="durationYears" value={formData.durationYears} onChange={handleChange} min="1" max="6" required
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Total Semesters</label>
                    <input 
                      type="number" name="totalSemesters" value={formData.totalSemesters} onChange={handleChange} min="1" max="12" required
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Description (Optional)</label>
                  <input 
                    type="text" name="description" value={formData.description} onChange={handleChange}
                    placeholder="Brief description of the degree course"
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </form>
            </div>

            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button form="courseForm" type="submit" disabled={creating} className="px-6 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all disabled:opacity-50">
                {creating ? 'Saving...' : (editingId ? 'Update Course' : 'Create Course')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
