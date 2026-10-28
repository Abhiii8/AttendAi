import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' | 'list'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptData, hierData] = await Promise.all([
        adminService.getDepartments().catch(() => []),
        adminService.getDepartmentHierarchy().catch(() => [])
      ]);
      setDepartments(deptData || []);
      setHierarchy(hierData || []);
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
    setFormData({ name: '', code: '' });
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditingId(dept._id);
    setFormData({ name: dept.name, code: dept.code });
    setShowModal(true);
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
        }
      });
      if(!response.ok) throw new Error('Failed to delete department');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const url = editingId 
        ? `/api/admin/departments/${editingId}`
        : '/api/admin/departments';
        
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
        },
        body: JSON.stringify(formData)
      });
      if(!response.ok) throw new Error(`Failed to ${editingId ? 'update' : 'create'} department`);
      
      setShowModal(false);
      setFormData({ name: '', code: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && departments.length === 0 && hierarchy.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading university hierarchy...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">University Academic System</h1>
          <p className="text-text-muted text-[15px] mt-1">
            Department structure, branch/course offerings, and faculty subject assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Selector */}
          <div className="bg-[#12131a] p-1 rounded-full border border-border/10 flex items-center">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'hierarchy' 
                  ? 'bg-primary text-[#0f172a] shadow-lg' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              🏛️ Academic Hierarchy & Branches
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'list' 
                  ? 'bg-primary text-[#0f172a] shadow-lg' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              📋 Departments List
            </button>
          </div>

          <button 
            onClick={openCreateModal}
            className="bg-primary text-[#0f172a] px-5 py-2.5 rounded-full font-bold text-xs hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Department
          </button>
        </div>
      </div>

      {/* Relational Foreign Key Explanation Card (Viva Helper) */}
      <div className="mb-8 p-5 md:p-6 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-[#0e1626] border border-blue-500/30 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 mt-1 border border-blue-500/30 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-white font-bold text-base">
                  Database Foreign Keys & Referential Integrity System
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono uppercase font-bold border border-emerald-500/30">Active Protection</span>
              </div>
              <p className="text-text-muted text-xs md:text-sm mt-1.5 leading-relaxed max-w-4xl">
                In MongoDB NoSQL, relational foreign keys are implemented at the <strong>Mongoose Schema & Application Layer</strong>. 
                Our backend guarantees full referential integrity: 
                <span className="text-white font-medium"> (1) Foreign ID Existence Verification</span> rejects insertions if parent records do not exist; 
                <span className="text-white font-medium"> (2) RESTRICT Deletion Protection</span> prevents deleting a Department or Branch if subjects or faculty are still linked; 
                <span className="text-white font-medium"> (3) Normalized Joins</span> are executed via <code className="text-primary font-mono font-semibold">.populate()</code>.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 shrink-0">
            <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase text-text-muted font-bold block">Foreign Key</span>
              <span className="text-xs text-primary font-mono font-semibold">ObjectId(ref)</span>
            </div>
            <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase text-text-muted font-bold block">Integrity Check</span>
              <span className="text-xs text-blue-400 font-mono font-semibold">RESTRICT Delete</span>
            </div>
            <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase text-text-muted font-bold block">Existence Check</span>
              <span className="text-xs text-amber-400 font-mono font-semibold">400 Bad Request</span>
            </div>
            <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] uppercase text-text-muted font-bold block">SQL Join Match</span>
              <span className="text-xs text-emerald-400 font-mono font-semibold">.populate()</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-sm text-red-400 font-mono text-center">
          {error}
        </div>
      )}

      {/* TAB 1: ACADEMIC HIERARCHY TREE VIEW */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-8">
          {hierarchy.map(item => (
            <div key={item.department._id} className="glass-panel p-6 md:p-8 rounded-3xl border border-border/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none"></div>

              {/* Department Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/5 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                    {item.department.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">Department</span>
                      <span className="text-xs text-text-muted font-mono">ID: {item.department._id}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-1">{item.department.name}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Total Enrolled Students</p>
                    <p className="text-lg font-bold text-white font-mono">{item.studentCount} Students</p>
                  </div>
                </div>
              </div>

              {/* Grid 1: Multiple Courses / Branches (1 Department -> Multiple Courses) */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Offered Branches / Degree Courses ({item.branches?.length || 0})
                  </h3>
                  <span className="text-[11px] font-mono text-blue-400/80">Foreign Key: Course.department &rarr; Department</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.branches && item.branches.map(course => (
                    <div key={course._id} className="p-5 rounded-2xl bg-[#12131a]/80 border border-white/5 hover:border-blue-500/30 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20 font-mono">
                            {course.code}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono">{course.durationYears} Years / {course.totalSemesters} Semesters</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{course.name}</h4>
                        <p className="text-xs text-text-muted line-clamp-2">{course.description || 'Degree program under this department.'}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-text-muted">
                        <span>Course ID: {course._id.substring(0, 10)}...</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 2: Faculty Members (1 Faculty -> Multiple Subjects) */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Faculty Team & Subject Assignments ({item.faculty?.length || 0})
                  </h3>
                  <span className="text-[11px] font-mono text-purple-400/80">Foreign Key: User.assignedSubjects &rarr; Subject[]</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.faculty && item.faculty.map(f => (
                    <div key={f.id} className="p-5 rounded-2xl bg-[#12131a]/80 border border-white/5 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                            {f.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white">{f.name}</h4>
                            <p className="text-xs text-text-muted">{f.email} | Emp ID: {f.idNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/20">
                          {f.subjectsCount} Subjects
                        </span>
                      </div>

                      {/* Multiple Subjects Taught by This Faculty */}
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Assigned Subjects (1 Faculty &rarr; Multiple Subjects):</p>
                        <div className="flex flex-wrap gap-2">
                          {f.subjects && f.subjects.length > 0 ? (
                            f.subjects.map(sub => (
                              <div key={sub._id} className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white flex items-center gap-1.5">
                                <span className="font-mono text-primary font-bold">{sub.code}:</span>
                                <span>{sub.name}</span>
                                <span className="text-[10px] text-text-muted font-mono">({sub.credits} cr)</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-text-muted italic">No specific subjects mapped</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 3: Subjects Linked to Courses */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Subjects & Course Mapping ({item.subjects?.length || 0})
                  </h3>
                  <span className="text-[11px] font-mono text-primary/80">Foreign Key: Subject.course &rarr; Course</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {item.subjects && item.subjects.map(s => (
                    <div key={s._id} className="p-3.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-primary">{s.code}</span>
                          <span className="text-[10px] font-mono text-text-muted bg-white/5 px-2 py-0.5 rounded">Sem {s.semester || 1}</span>
                        </div>
                        <p className="text-sm font-bold text-white line-clamp-1">{s.name}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-text-muted font-mono">
                        <span>Course: {s.course?.code || 'iMScIT'}</span>
                        <span>{s.credits} Credits</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* TAB 2: TRADITIONAL DEPARTMENT CARDS */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
          {departments.map(dept => (
            <div key={dept._id} className="glass-panel relative overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col min-h-[160px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700"></div>
              
              <div className="p-6 relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-4 h-4 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <span className="text-primary font-bold text-[13px] tracking-widest uppercase">{dept.code}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => openEditModal(dept)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 hover:border-white/10 shadow-sm" title="Edit Department">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept._id); }} className="w-8 h-8 flex items-center justify-center text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/10 hover:border-red-500/20 shadow-sm" title="Delete Department">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-primary transition-colors line-clamp-2">{dept.name}</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-white/40 text-[11px] font-mono bg-[#18181b] px-2.5 py-1 rounded-md border border-white/5">
                       <span className="opacity-50 mr-1.5">ID</span> {dept._id.substring(0, 8)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {departments.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
               <div className="w-20 h-20 rounded-[24px] bg-[#1a1c25] border border-border/10 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
               </div>
               <p className="text-white font-semibold text-lg mb-2">No Departments</p>
               <p className="text-text-muted text-sm text-center max-w-sm">There are no academic departments configured yet. Click "Add Department" to create one.</p>
            </div>
          )}
        </div>
      )}

      {/* Premium Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[450px] mx-4 relative z-10 overflow-hidden flex flex-col">
            
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
               <h3 className="text-xl font-bold text-white tracking-wide">{editingId ? 'Edit Department' : 'Add Department'}</h3>
               <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            <div className="p-8">
              <form id="deptForm" onSubmit={handleCreateDepartment} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Department Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Department Code</label>
                  <input 
                    type="text" name="code" value={formData.code} onChange={handleChange} required
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. CS"
                  />
                </div>
              </form>
            </div>
            
            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                 Cancel
               </button>
               <button form="deptForm" type="submit" disabled={creating} className="px-6 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0">
                 {editingId ? (creating ? 'Updating...' : 'Update Department') : (creating ? 'Saving...' : 'Save Department')}
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
