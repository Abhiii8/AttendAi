import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import facultyService from '../services/faculty.service';

export default function Users() {
  const [users, setUsers] = useState([]);
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
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchSubjects();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    adminService.getUsers()
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const fetchDepartments = () => {
    adminService.getDepartments()
      .then(data => setDepartments(data))
      .catch(err => console.error(err));
  };

  const fetchSubjects = () => {
    facultyService.getSubjects()
      .then(data => setSubjects(data || []))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateTempPassword = (name, id) => {
    if (!name) return '';
    const firstWord = name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    return `${firstWord}${id || ''}`;
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    let payload = { ...formData };
    if (!editingUser) {
      payload.password = generateTempPassword(formData.name, formData.idNumber);
    }

    try {
      if (editingUser) {
        await adminService.updateUser(editingUser._id, payload);
      } else {
        await adminService.createUser(payload);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', idNumber: '', role: 'faculty', department: '' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(id);
        fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      idNumber: user.idNumber || '',
      role: user.role,
      department: user.department?._id || user.department || '',
      course: user.course?._id || user.course || '',
      year: user.year || '',
      assignedSubjects: user.assignedSubjects ? user.assignedSubjects.map(s => s._id || s) : []
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      idNumber: '', 
      role: 'faculty', 
      department: '', 
      course: '', 
      year: '', 
      assignedSubjects: [] 
    });
    setShowModal(true);
  };

  if (loading && users.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading user data...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage platform access, roles, and administrative rights.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add New User
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-sm text-red-400 font-mono text-center shadow-inner">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="w-full glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 font-bold text-white/50 text-[11px] uppercase tracking-widest w-[35%]">User Details</th>
                <th className="px-8 py-5 font-bold text-white/50 text-[11px] uppercase tracking-widest w-[35%]">Contact / Email</th>
                <th className="px-8 py-5 font-bold text-white/50 text-[11px] uppercase tracking-widest w-[15%]">Role & Access</th>
                <th className="px-8 py-5 font-bold text-white/50 text-[11px] uppercase tracking-widest text-right w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u._id} className="group hover:bg-white/[0.02] transition-colors duration-300">
                  <td className="px-8 py-5 overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center font-bold text-white shadow-inner text-sm tracking-wide
                        ${u.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-rose-400' :
                          u.role === 'faculty' ? 'bg-gradient-to-br from-blue-500 to-cyan-400' :
                          'bg-gradient-to-br from-primary to-purple-500'}`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-[14px] truncate">{u.name}</p>
                        <p className="text-[12px] text-white/40 mt-0.5 font-medium truncate">ID: {u.idNumber || 'N/A'}</p>
                        {u.role === 'faculty' && u.assignedSubjects && u.assignedSubjects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {u.assignedSubjects.map(sub => (
                              <span key={sub._id || sub} className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded">
                                {sub.code || sub.name || 'Subject'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 overflow-hidden">
                    <p className="text-[13px] text-white/70 font-medium truncate">{u.email}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                      ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        u.role === 'faculty' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        'bg-primary/10 text-primary border border-primary/20'}`}
                    >
                      {u.role === 'admin' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                      {u.role === 'faculty' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                      {u.role === 'student' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(u)} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => handleDeleteUser(u._id)} className="p-2 text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/10 hover:border-red-500/20">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>  
        {users.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-20 h-20 rounded-full bg-[#1a1c25] border border-border/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
             </div>
             <p className="text-white font-semibold text-lg mb-2">No Users Found</p>
             <p className="text-text-muted text-sm text-center max-w-sm">There are currently no users in the system. Click "Add New User" to provision an account.</p>
          </div>
        )}
      </div>

      {/* Premium Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[500px] mx-4 relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
               <h3 className="text-xl font-bold text-white tracking-wide">{editingUser ? 'Edit User Profile' : 'Provision New User'}</h3>
               <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <form id="userForm" onSubmit={handleCreateOrUpdateUser} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-5">
                   <div>
                     <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Access Role</label>
                     <select 
                       name="role" value={formData.role} onChange={handleChange} required
                       className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                     >
                       <option value="student">Student Account</option>
                       <option value="faculty">Faculty Account</option>
                       <option value="admin">Admin Account</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Department</label>
                     <select 
                       name="department" value={formData.department || ''} onChange={handleChange}
                       className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                     >
                       <option value="">-- Optional --</option>
                       {departments.map(dept => (
                         <option key={dept._id} value={dept._id}>{dept.code}</option>
                       ))}
                     </select>
                   </div>
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. John Doe"
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Email / Username</label>
                  <input 
                    type="text" name="email" value={formData.email} onChange={handleChange} required placeholder="email@institution.edu"
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                {formData.role === 'faculty' && (
                  <div className="p-4 bg-[#1a1c25] rounded-[24px] border border-border/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider ml-1">
                        Assigned Subjects ({formData.assignedSubjects?.length || 0} selected)
                      </label>
                      <span className="text-[10px] text-primary font-mono">1 Faculty → Multi-Subject</span>
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
                        <p className="text-xs text-text-muted col-span-2">No subjects available yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {formData.role === 'student' && (
                  <div className="grid grid-cols-2 gap-5 p-4 bg-[#1a1c25] rounded-[24px] border border-border/10 mt-4">
                    <div className="col-span-2">
                       <h4 className="text-[13px] font-bold text-white mb-1">Student Details</h4>
                       <p className="text-[11px] text-text-muted">Required information for student tracking.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Course</label>
                      <input 
                        type="text" name="course" value={formData.course || ''} onChange={handleChange} required
                        placeholder="e.g. iMScIT"
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Semester/Year</label>
                      <input 
                        type="text" name="year" value={formData.year || ''} onChange={handleChange} required
                        placeholder="e.g. Sem IX"
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between bg-[#12131a] px-5 py-3 rounded-full border border-border/10 cursor-pointer" onClick={() => setFormData({...formData, autoAssignEnrollment: !formData.autoAssignEnrollment})}>
                      <span className="text-sm font-medium text-white select-none">Auto-assign Enrollment Number</span>
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${formData.autoAssignEnrollment ? 'bg-primary' : 'bg-[#242736]'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.autoAssignEnrollment ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                  </div>
                )}

                {!(formData.role === 'student' && formData.autoAssignEnrollment) && (
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">ID Number</label>
                    <input 
                      type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required
                      placeholder={formData.role === 'student' ? 'e.g. 202201619010058' : 'Employee ID'}
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                )}

                {!editingUser ? (
                  <div className="p-5 bg-primary/5 border border-primary/20 rounded-[24px]">
                    <label className="block text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 ml-1">Auto-Generated Password</label>
                    <div className="flex items-center justify-center bg-[#12131a] px-4 py-4 rounded-full border border-primary/20">
                      <span className="font-mono text-lg font-bold text-white tracking-widest">
                        {generateTempPassword(formData.name, formData.idNumber) || 'Waiting...'}
                      </span>
                    </div>
                    <p className="text-[11px] text-primary/70 text-center mt-3 font-medium">Provided to the user for first login.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Update Password</label>
                    <input 
                      type="password" name="password" value={formData.password} onChange={handleChange}
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                )}
              </form>
            </div>
            
            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                 Cancel
               </button>
               <button form="userForm" type="submit" disabled={creating} className="px-6 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0">
                 {creating ? 'Processing...' : (editingUser ? 'Save Profile' : 'Provision User')}
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
