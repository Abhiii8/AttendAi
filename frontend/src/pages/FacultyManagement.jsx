import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import facultyService from '../services/faculty.service';

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    idNumber: '',
    role: 'faculty',
    department: '',
    assignedSubjects: []
  });
  const [creating, setCreating] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facData, deptData, subData] = await Promise.all([
        adminService.getUsers('faculty').catch(() => []),
        adminService.getDepartments().catch(() => []),
        facultyService.getSubjects().catch(() => [])
      ]);
      setFaculty(facData || []);
      setDepartments(deptData || []);
      setSubjects(subData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateTempPassword = (name, id) => {
    if (!name) return '';
    const firstWord = name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    return `${firstWord}${id || '123'}`;
  };

  const openCreateModal = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      idNumber: '',
      role: 'faculty',
      department: departments[0]?._id || '',
      assignedSubjects: []
    });
    setShowModal(true);
  };

  const openEditModal = (f) => {
    setEditingFaculty(f);
    setFormData({
      name: f.name,
      email: f.email,
      password: '',
      idNumber: f.idNumber || '',
      role: 'faculty',
      department: f.department?._id || f.department || '',
      assignedSubjects: f.assignedSubjects ? f.assignedSubjects.map(s => s._id || s) : []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      await adminService.deleteUser(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    let payload = { ...formData, role: 'faculty' };
    if (!editingFaculty && !payload.password) {
      payload.password = generateTempPassword(formData.name, formData.idNumber);
    }

    try {
      if (editingFaculty) {
        await adminService.updateUser(editingFaculty._id, payload);
      } else {
        await adminService.createUser(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && faculty.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading faculty members...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Faculty Members</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage teaching professors, departmental affiliations, and multiple subject assignments.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary text-[#0f172a] px-6 py-3 rounded-full font-bold text-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 flex items-center self-start md:self-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Faculty Member
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-sm text-red-400 font-mono text-center">
          {error}
        </div>
      )}

      {/* Grid of Faculty Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        {faculty.map(f => (
          <div key={f._id} className="glass-panel relative overflow-hidden group hover:border-purple-500/40 transition-all duration-500 flex flex-col justify-between p-6 min-h-[220px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-base">
                    {f.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{f.name}</h3>
                    <p className="text-xs text-text-muted">{f.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => openEditModal(f)} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5" title="Edit Faculty">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={() => handleDelete(f._id)} className="p-2 text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/10" title="Delete Faculty">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>

              {/* Department & Employee ID */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] font-mono bg-purple-500/10 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/20">
                  🏛️ {f.department?.code || f.department?.name || 'Department N/A'}
                </span>
                <span className="text-[11px] font-mono bg-white/5 text-text-muted px-2.5 py-0.5 rounded-md">
                  Emp ID: {f.idNumber || 'N/A'}
                </span>
              </div>

              {/* Assigned Subjects (1 Faculty -> Multiple Subjects) */}
              <div className="mt-3">
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2">
                  Assigned Subjects ({f.assignedSubjects?.length || 0}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {f.assignedSubjects && f.assignedSubjects.length > 0 ? (
                    f.assignedSubjects.map(sub => (
                      <span key={sub._id || sub} className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white font-medium flex items-center gap-1.5">
                        <span className="font-mono text-primary font-bold">{sub.code}:</span>
                        <span className="text-white/90">{sub.name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted italic">No subjects assigned yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-text-muted font-mono">
              <span>Account Status: Active</span>
              <span className="text-primary font-semibold">Faculty Role</span>
            </div>
          </div>
        ))}

        {faculty.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <p className="text-white font-semibold text-lg mb-2">No Faculty Members Found</p>
            <p className="text-text-muted text-sm text-center max-w-sm">Click "Add Faculty Member" to provision professors and assign their subjects.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[500px] mx-4 relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
              <h3 className="text-xl font-bold text-white tracking-wide">{editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-4">
              <form id="facultyForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Professor Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. Prof. Mahir Patel"
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Email / Login ID</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    placeholder="e.g. mahir@gmail.com"
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Employee ID</label>
                    <input 
                      type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required
                      placeholder="e.g. EMP101"
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

                {/* Assigned Subjects (1 Faculty -> Multiple Subjects) */}
                <div className="p-4 bg-[#1a1c25] rounded-[24px] border border-border/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider ml-1">
                      Assigned Subjects ({formData.assignedSubjects?.length || 0} selected)
                    </label>
                    <span className="text-[10px] text-primary font-mono font-bold">Multi-Subject</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 bg-[#12131a] rounded-xl border border-white/5">
                    {subjects.map(s => {
                      const isChecked = formData.assignedSubjects?.includes(s._id);
                      return (
                        <label 
                          key={s._id} 
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/40 text-white font-medium' 
                              : 'border-transparent text-text-muted hover:bg-white/5'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = formData.assignedSubjects || [];
                              const updated = e.target.checked 
                                ? [...current, s._id] 
                                : current.filter(id => id !== s._id);
                              setFormData({ ...formData, assignedSubjects: updated });
                            }}
                            className="rounded border-white/20 text-primary focus:ring-0"
                          />
                          <span className="font-mono text-primary font-bold">{s.code}</span>
                          <span className="truncate">{s.name}</span>
                        </label>
                      );
                    })}
                    {subjects.length === 0 && (
                      <p className="text-xs text-text-muted col-span-2">No subjects in library.</p>
                    )}
                  </div>
                </div>

                {editingFaculty ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Update Password</label>
                    <input 
                      type="password" name="password" value={formData.password} onChange={handleChange}
                      placeholder="Leave blank to keep existing password"
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-[20px] text-center">
                    <p className="text-xs text-text-muted mb-1">Auto-Generated Initial Password:</p>
                    <p className="font-mono font-bold text-white text-base tracking-wider">
                      {generateTempPassword(formData.name, formData.idNumber) || 'Waiting for details...'}
                    </p>
                  </div>
                )}
              </form>
            </div>

            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                Cancel
              </button>
              <button form="facultyForm" type="submit" disabled={creating} className="px-6 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all disabled:opacity-50">
                {creating ? 'Saving...' : (editingFaculty ? 'Save Changes' : 'Provision Faculty')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
