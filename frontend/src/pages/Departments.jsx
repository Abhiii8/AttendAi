import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = () => {
    setLoading(true);
    adminService.getDepartments()
      .then(data => setDepartments(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
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
      const response = await fetch(`http://localhost:5000/api/admin/departments/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user'))?.token}`
        }
      });
      if(!response.ok) throw new Error('Failed to delete department');
      fetchDepartments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const url = editingId 
        ? `http://localhost:5000/api/admin/departments/${editingId}`
        : 'http://localhost:5000/api/admin/departments';
        
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
      fetchDepartments();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading && departments.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading departments...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Departments</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage academic departments and programs.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary text-[#0f172a] px-6 py-3 rounded-full font-bold text-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Department
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-sm text-red-400 font-mono text-center">
          {error}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        {departments.map(dept => (
          <div key={dept._id} className="glass-panel relative overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col min-h-[160px]">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div className="p-6 relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-6">
                {/* Code Badge (Auto-sizes to content) */}
                <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-4 h-4 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  <span className="text-primary font-bold text-[13px] tracking-widest uppercase">{dept.code}</span>
                </div>
                
                {/* Action Buttons */}
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
