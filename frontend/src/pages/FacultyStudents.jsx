import { useEffect, useState, useRef } from 'react';
import * as faceapi from 'face-api.js';
import facultyService from '../services/faculty.service';

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Models State
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idNumber: '',
    course: '',
    year: '',
    autoAssignEnrollment: true
  });
  
  // Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formStatus, setFormStatus] = useState('');

  const imgRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const loadAIModels = async () => {
    if (modelsLoaded) return;
    setLoadingModels(true);
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load models", err);
      setFormError("Failed to load AI Models for verification. Check your internet connection.");
    } finally {
      setLoadingModels(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    loadAIModels();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
    setImagePreview(null);
    setFormError('');
    setFormData({ name: '', email: '', idNumber: '', course: '', year: '', autoAssignEnrollment: true });
  };

  const fetchStudents = () => {
    setLoading(true);
    facultyService.getStudents()
      .then(data => setStudents(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setFormError('');
    }
  };

  const generateTempPassword = (name, id) => {
    if (!name) return '';
    const firstWord = name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    let pwd = `${firstWord}${id || ''}`;
    if (pwd.length < 6) pwd += '123456'.substring(0, 6 - pwd.length);
    return pwd;
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    if (!selectedImage || !imagePreview) {
      setFormError("A passport photo is required to create a secure student profile.");
      setCreating(false);
      return;
    }

    setFormStatus('Processing AI Biometrics...');

    try {
      const detection = await faceapi.detectSingleFace(imgRef.current).withFaceLandmarks().withFaceDescriptor();
      
      if (!detection) {
        throw new Error("No clear face detected in the photo. Please upload a clear, front-facing passport photo.");
      }

      const faceEmbeddings = Array.from(detection.descriptor);
      setFormStatus('Registering Student...');

      let payload = { ...formData, role: 'student', faceEmbeddings };
      payload.password = generateTempPassword(formData.name, formData.idNumber);

      await facultyService.createStudent(payload);
      handleCloseModal();
      fetchStudents();
    } catch (err) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setCreating(false);
      setFormStatus('');
    }
  };

  if (loading && students.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading student data...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Student Roster</h1>
          <p className="text-text-muted text-[15px] mt-1">Manage enrollments and AI biometric profiles.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-primary text-[#0f172a] px-6 py-3 rounded-full font-bold text-[14px] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Register Secured Student
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
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Student Profile</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Enrollment No.</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider">Academic Year</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider text-center">Biometric Status</th>
              <th className="px-6 py-4 font-medium text-text-muted text-[11px] uppercase tracking-wider text-right">Registration Date</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {students.map(s => (
              <tr key={s._id} className="group">
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-l border-border/10 group-hover:bg-[#1f2231] transition-colors rounded-l-[16px] first:mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#12131a] flex items-center justify-center font-bold text-sm text-white overflow-hidden shadow-inner border border-border/10">
                       <img src={`https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff`} alt="avatar" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-[12px] text-text-muted mt-0.5">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-border/10 group-hover:bg-[#1f2231] transition-colors">
                  <p className="text-sm font-mono text-white opacity-80">{s.idNumber || 'Pending'}</p>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-border/10 group-hover:bg-[#1f2231] transition-colors">
                  <p className="text-sm text-text-muted">{s.course} • {s.year}</p>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-border/10 group-hover:bg-[#1f2231] transition-colors text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Face ID Active
                  </span>
                </td>
                <td className="px-6 py-4 bg-[#1a1c25] border-t border-b border-r border-border/10 group-hover:bg-[#1f2231] transition-colors rounded-r-[16px] text-right">
                  <p className="text-sm text-text-muted">{new Date(s.createdAt).toLocaleDateString()}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-20 h-20 rounded-full bg-[#1a1c25] border border-border/10 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
             </div>
             <p className="text-white font-semibold text-lg mb-2">No Students Enrolled</p>
             <p className="text-text-muted text-sm text-center max-w-sm">Register students with their biometric Face ID to get started.</p>
          </div>
        )}
      </div>

      {/* Premium Create Modal with Split AI Scanner layout */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[900px] mx-4 relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
               <h3 className="text-xl font-bold text-white tracking-wide flex items-center">
                 <svg className="w-5 h-5 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                 AI Biometric Registration
               </h3>
               <button onClick={handleCloseModal} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <form id="studentForm" onSubmit={handleCreateStudent}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* Left Column: Form Fields */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Full Name</label>
                      <input 
                        type="text" name="name" value={formData.name} onChange={handleChange} required
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Email Address</label>
                      <input 
                        type="email" name="email" value={formData.email} onChange={handleChange} required
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Course</label>
                        <input 
                          type="text" name="course" value={formData.course} onChange={handleChange} required placeholder="e.g. iMScIT"
                          className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Year / Sem</label>
                        <input 
                          type="text" name="year" value={formData.year} onChange={handleChange} required placeholder="e.g. Sem IX"
                          className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-[#12131a] px-5 py-3 rounded-full border border-border/10 cursor-pointer" onClick={() => setFormData({...formData, autoAssignEnrollment: !formData.autoAssignEnrollment})}>
                      <span className="text-sm font-medium text-white select-none">Auto-assign Enrollment Number</span>
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${formData.autoAssignEnrollment ? 'bg-primary' : 'bg-[#242736]'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.autoAssignEnrollment ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </div>

                    {!formData.autoAssignEnrollment && (
                      <div>
                        <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Manual Enrollment No.</label>
                        <input 
                          type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required
                          className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    )}
                    
                    <div className="p-5 bg-primary/5 border border-primary/20 rounded-[24px] mt-4">
                      <label className="block text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 ml-1">Temporary Password</label>
                      <div className="flex items-center justify-center bg-[#12131a] px-4 py-3 rounded-full border border-primary/20">
                        <span className="font-mono text-lg font-bold text-white tracking-widest">
                          {generateTempPassword(formData.name, formData.idNumber) || 'Waiting...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Photo Upload */}
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">
                      Biometric Face ID Baseline
                    </label>
                    
                    <div className="border-2 border-dashed border-border/20 rounded-[24px] p-4 bg-[#12131a] flex-1 min-h-[300px] flex flex-col items-center justify-center text-center relative hover:bg-[#1f2231] transition-colors overflow-hidden group">
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/jpg" 
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {imagePreview ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Face Scan overlay animation */}
                          <div className="absolute inset-0 bg-primary/10 pointer-events-none animate-pulse"></div>
                          <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(0,208,156,0.8)] pointer-events-none"></div>
                          
                          <img 
                            ref={imgRef}
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-full max-w-full rounded-[16px] object-contain shadow-2xl relative z-0"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-[#1a1c25] rounded-full border border-border/10 flex items-center justify-center mb-4 group-hover:border-primary/30 group-hover:text-primary transition-all">
                             <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          </div>
                          <p className="text-sm font-semibold text-white">Click to upload portrait photo</p>
                          <p className="text-xs text-text-muted mt-2 max-w-[200px] mx-auto">This photo will be scanned by our neural network to create a unique biometric signature.</p>
                        </>
                      )}
                    </div>
                    
                    {loadingModels && (
                      <div className="text-[11px] font-bold text-primary mt-4 flex items-center justify-center gap-2 uppercase tracking-wider bg-primary/10 py-2 rounded-full border border-primary/20">
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Initializing Neural Subsystem...
                      </div>
                    )}
                  </div>
                </div>
                
                {formError && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center justify-center text-center">
                    {formError}
                  </div>
                )}
              </form>
            </div>

            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
               <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                 Cancel
               </button>
               <button 
                 form="studentForm"
                 type="submit" 
                 disabled={creating || loadingModels} 
                 className="px-6 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 min-w-[200px]"
               >
                 {creating ? (formStatus || 'Processing...') : 'Initialize Biometric Profile'}
               </button>
            </div>

          </div>
        </div>
      )}

      {/* Required for the scanning animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
