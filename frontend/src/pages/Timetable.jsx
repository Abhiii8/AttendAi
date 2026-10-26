import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Printer, Play, CheckCircle, Plus } from 'lucide-react';
import facultyService from '../services/faculty.service';
import attendanceService from '../services/attendance.service';

const TIMESLOTS = [
  { id: '1', label: '7.30 AM - 8.15 AM', start: '07:30', end: '08:15' },
  { id: '2', label: '8.15 AM - 9.00 AM', start: '08:15', end: '09:00' },
  { id: '3', label: '9.00 AM - 9.45 AM', start: '09:00', end: '09:45' },
  { id: 'break', label: 'BREAK (9.45 AM - 10.05 AM)', isBreak: true },
  { id: '4', label: '10.05 AM - 10.50 AM', start: '10:05', end: '10:50' },
  { id: '5', label: '10.50 AM - 11.35 AM', start: '10:50', end: '11:35' },
  { id: '6', label: '11.35 AM - 12.20 PM', start: '11:35', end: '12:20' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Faculty only data
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  
  const [classForm, setClassForm] = useState({ 
    name: '', subject: '', faculty: '', room: '', type: 'Lecture',
    dayOfWeek: '', startTime: '', endTime: ''
  });

  const [sessionModalState, setSessionModalState] = useState({
    isOpen: false,
    classDetails: null,
    radius: 150,
    isProcessing: false,
    successCode: null,
    error: null
  });

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    setUser(loggedInUser);
    
    fetchClasses();
    if (loggedInUser?.role === 'faculty') {
      facultyService.getSubjects().then(setSubjects).catch(console.error);
      facultyService.getFacultyList().then(setFacultyList).catch(console.error);
    }
  }, []);

  const fetchClasses = () => {
    setLoading(true);
    facultyService.getClasses()
      .then(data => setClasses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const schedulePayload = [{
        dayOfWeek: classForm.dayOfWeek,
        startTime: classForm.startTime,
        endTime: classForm.endTime,
        room: classForm.room,
        type: classForm.type
      }];

      const newClass = await facultyService.createClass({
        name: classForm.name,
        subject: classForm.subject,
        faculty: classForm.faculty || user._id,
        schedule: schedulePayload
      });
      
      const existingIdx = classes.findIndex(c => c._id === newClass._id);
      if (existingIdx !== -1) {
          const updatedClasses = [...classes];
          updatedClasses[existingIdx] = newClass;
          setClasses(updatedClasses);
      } else {
          setClasses([...classes, newClass]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const getBlockForSlot = (day, slot) => {
    for (let cls of classes) {
      if (cls.schedule) {
        for (let s of cls.schedule) {
          if (s.dayOfWeek === day && s.startTime === slot.start && s.endTime === slot.end) {
            return { class: cls, schedule: s };
          }
        }
      }
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartSessionClick = (cls) => {
    setSessionModalState({
      isOpen: true,
      classDetails: cls,
      radius: 150,
      isProcessing: false,
      successCode: null,
      error: null
    });
  };

  const handleConfirmStartSession = async (e) => {
    e.preventDefault();
    setSessionModalState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      navigator.geolocation.getCurrentPosition(async (position) => {
        const payload = {
          attendanceCode: code,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: parseInt(sessionModalState.radius, 10)
        };
        await attendanceService.startSession(sessionModalState.classDetails._id, payload);
        
        setSessionModalState(prev => ({ ...prev, isProcessing: false, successCode: code }));
      }, (geoErr) => {
          setSessionModalState(prev => ({ ...prev, isProcessing: false, error: 'Could not access GPS. Please allow location access.' }));
      });
    } catch (err) {
      setSessionModalState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };
  const handleMarkAttendance = (cls) => {
    navigate('/dashboard/scan', { state: { classId: cls._id } });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="text-text-muted font-medium">Loading schedule...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in print:m-0 print:p-0">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <Calendar className="w-8 h-8 text-primary" /> Master Schedule
          </h1>
          <p className="text-text-muted text-[15px] mt-1">Manage, view, and initiate sessions directly from your timetable.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-[#12131a] text-white px-5 py-2.5 rounded-full font-bold text-[13px] border border-border/20 hover:bg-[#1a1c25] hover:border-primary/50 transition-all duration-200 flex items-center shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
        >
          <Printer className="w-4 h-4 mr-2" /> Export Schedule
        </button>
      </div>

      <div className="glass-panel rounded-[24px] overflow-x-auto shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-border/10 print:shadow-none print:border-black print:rounded-none bg-[#161720]">
        
        {/* Header (Print only) */}
        <div className="hidden print:block text-center py-4 border-b-2 border-black font-bold uppercase">
          <div>ACADEMIC SCHEDULE</div>
          <div className="text-sm font-normal mt-1">Generated via AttendAI Biometric System</div>
        </div>

        <table className="w-full text-center border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="bg-[#12131a] border-b border-border/10 print:bg-white print:border-black">
              <th className="px-4 py-4 border-r border-border/10 print:border-black font-bold text-text-muted text-[10px] uppercase tracking-widest w-32">Time Window</th>
              {DAYS.map(day => (
                <th key={day} className="px-4 py-4 border-r border-border/10 print:border-black font-bold text-white text-[11px] uppercase tracking-widest">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMESLOTS.map((slot, index) => {
              if (slot.isBreak) {
                return (
                  <tr key={index} className="bg-[#0f1118] border-b border-border/10 print:border-black print:bg-gray-50">
                    <td colSpan={7} className="px-4 py-3 font-bold text-primary opacity-80 tracking-[0.3em] text-[10px] uppercase">
                      {slot.label}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={index} className="border-b border-border/10 print:border-black hover:bg-[#1a1c25] transition-colors group">
                  <td className="px-4 py-6 border-r border-border/10 print:border-black text-[11px] font-bold text-text-muted whitespace-nowrap bg-[#12131a]/50 print:bg-white tracking-wider">
                    {slot.label}
                  </td>
                  
                  {DAYS.map(day => {
                    const blockInfo = getBlockForSlot(day, slot);
                    
                    return (
                      <td key={day} className="px-2 py-2 border-r border-border/10 print:border-black align-top min-w-[140px] group/cell relative">
                        {blockInfo ? (
                          <div className="flex flex-col h-full justify-between items-center bg-[#1f2231] p-3 rounded-[16px] border border-border/5 group-hover/cell:border-primary/30 transition-colors print:border-none print:bg-transparent print:p-0 shadow-inner">
                            <span className="font-bold text-[13px] text-white mb-2 text-center leading-tight">
                              {blockInfo.class.subject?.name || blockInfo.class.name}
                            </span>
                            
                            <div className="flex flex-col text-[10px] text-text-muted items-center font-medium uppercase tracking-wide gap-1">
                              {blockInfo.schedule.type && (
                                <span className="bg-[#12131a] px-2 py-0.5 rounded-md border border-border/10">{blockInfo.schedule.type}</span>
                              )}
                              {blockInfo.schedule.room && (
                                <span className="text-primary">RM: {blockInfo.schedule.room}</span>
                              )}
                            </div>
                            
                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center print:hidden rounded-[16px]">
                              {user?.role === 'faculty' ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleStartSessionClick(blockInfo.class); }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300"
                                >
                                  <Play className="w-3.5 h-3.5" /> Start Session
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleMarkAttendance(blockInfo.class)}
                                  className="px-4 py-2 bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-full hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                >
                                  <CheckCircle className="w-3 h-3" /> Mark
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full min-h-[80px] flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-border/20 group-hover/cell:hidden"></div>
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                              {user?.role === 'faculty' && (
                                <button 
                                  onClick={() => {
                                    setClassForm({
                                      name: '', subject: '', faculty: '', room: '', type: 'Lecture',
                                      dayOfWeek: day, startTime: slot.start, endTime: slot.end
                                    });
                                    setShowModal(true);
                                  }}
                                  className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-[#0f172a] hover:shadow-[0_0_15px_rgba(0,208,156,0.5)] flex items-center justify-center transition-all print:hidden"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Premium Dark Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center print:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-surface rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-border/10 w-full max-w-[550px] mx-4 relative z-10 overflow-hidden flex flex-col">
            
            <div className="px-8 py-6 border-b border-border/10 flex justify-between items-center bg-[#1a1c25]">
               <h3 className="text-xl font-bold text-white tracking-wide">Assign Time Block</h3>
               <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-white bg-[#12131a] rounded-full transition-colors border border-border/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            <div className="p-8">
              <div className="mb-8 flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                 <Calendar className="w-5 h-5 text-primary" />
                 <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Selected Slot</p>
                    <p className="text-sm text-white font-medium">{classForm.dayOfWeek} — {classForm.startTime} to {classForm.endTime}</p>
                 </div>
              </div>

              <form id="slotForm" onSubmit={handleCreateClass} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Class/Division Name</label>
                  <input 
                    type="text" 
                    list="existing-classes-list"
                    value={classForm.name} 
                    onChange={(e) => {
                       const val = e.target.value;
                       const existing = classes.find(c => c.name === val);
                       if (existing && existing.subject) {
                          setClassForm({...classForm, name: val, subject: existing.subject._id || existing.subject });
                       } else {
                          setClassForm({...classForm, name: val});
                       }
                    }} 
                    required
                    className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    placeholder="e.g. Div A or TY-BTech-A"
                  />
                  <datalist id="existing-classes-list">
                    {classes.map(c => <option key={c._id} value={c.name} />)}
                  </datalist>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Subject</label>
                    <div className="relative">
                      <select 
                        value={classForm.subject} onChange={(e) => setClassForm({...classForm, subject: e.target.value})} required
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none"
                      >
                        <option value="">Select subject...</option>
                        {subjects.map(sub => (
                          <option key={sub._id} value={sub._id}>{sub.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Assign Faculty</label>
                    <div className="relative">
                      <select 
                        value={classForm.faculty} onChange={(e) => setClassForm({...classForm, faculty: e.target.value})}
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none"
                      >
                        <option value="">(Self) {user?.name}</option>
                        {facultyList.map(fac => (
                          <option key={fac._id} value={fac._id}>{fac.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Room Assignment</label>
                    <input 
                      type="text" value={classForm.room} onChange={(e) => setClassForm({...classForm, room: e.target.value})} required
                      className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                      placeholder="e.g. Lab 3"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 ml-1">Session Type</label>
                    <div className="relative">
                      <select 
                        value={classForm.type} onChange={(e) => setClassForm({...classForm, type: e.target.value})}
                        className="w-full bg-[#12131a] border border-border/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none"
                      >
                        <option value="Lecture">Lecture</option>
                        <option value="Lab">Lab</option>
                        <option value="Tutorial">Tutorial</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors">
                 Cancel
               </button>
               <button form="slotForm" type="submit" className="px-8 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 uppercase tracking-wide">
                 Lock Assignment
               </button>
            </div>

          </div>
        </div>
      )}

      {/* Geofence Configuration & Success Modal */}
      {sessionModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !sessionModalState.isProcessing && !sessionModalState.successCode && setSessionModalState(prev => ({...prev, isOpen: false}))}></div>
          <div className="bg-[#12131a] w-full max-w-md rounded-[32px] border border-primary/20 shadow-[0_0_50px_rgba(0,208,156,0.2)] relative z-10 overflow-hidden animate-fade-in flex flex-col">
            
            {!sessionModalState.successCode ? (
              <>
                <div className="p-8 border-b border-border/10">
                  <h3 className="text-2xl font-bold text-white mb-2">Initialize Session</h3>
                  <p className="text-text-muted text-sm">Configure geofence parameters for <strong className="text-white">{sessionModalState.classDetails?.name}</strong>.</p>
                </div>

                <form onSubmit={handleConfirmStartSession} className="p-8 space-y-6 flex-1">
                  {sessionModalState.error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                      {sessionModalState.error}
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-4 text-primary ml-1 relative z-10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      Geofence Radius
                    </label>
                    <div className="flex items-center gap-4 bg-[#1a1c25] rounded-full px-4 py-3 border border-border/10 relative z-10">
                      <input 
                        type="range" 
                        min="150" max="500" step="10"
                        value={sessionModalState.radius} 
                        onChange={(e) => setSessionModalState({...sessionModalState, radius: e.target.value})}
                        style={{ background: `linear-gradient(to right, #00d09c ${((sessionModalState.radius - 150) / (500 - 150)) * 100}%, #242736 ${((sessionModalState.radius - 150) / (500 - 150)) * 100}%)` }}
                        className="w-full h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer relative z-10"
                      />
                      <span className="font-mono font-bold text-[15px] text-white min-w-[3rem] text-right">{sessionModalState.radius}m</span>
                    </div>
                    <p className="text-xs text-text-muted/60 mt-2 ml-1 text-center">Minimum 150m to account for GPS drift.</p>
                  </div>
                </form>
                
                <div className="px-8 py-5 border-t border-border/10 bg-[#1a1c25] flex justify-end gap-3 mt-auto">
                   <button 
                     type="button"
                     disabled={sessionModalState.isProcessing}
                     onClick={() => setSessionModalState(prev => ({...prev, isOpen: false}))} 
                     className="px-6 py-2.5 text-sm font-semibold text-text-muted hover:text-white transition-colors disabled:opacity-50"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleConfirmStartSession}
                     disabled={sessionModalState.isProcessing || sessionModalState.radius < 150}
                     className="px-8 py-2.5 bg-primary text-[#0f172a] rounded-full text-sm font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,208,156,0.6)] transition-all duration-200 uppercase tracking-wide flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                   >
                     {sessionModalState.isProcessing ? (
                       <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Starting...</>
                     ) : (
                       <><Play className="w-4 h-4" /> Start Live Session</>
                     )}
                   </button>
                </div>
              </>
            ) : (
              <div className="p-10 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 relative">
                   <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                   <CheckCircle className="w-10 h-10 text-primary" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Session Live!</h3>
                 <p className="text-text-muted text-sm mb-8">Share this manual code with your students.</p>
                 
                 <div className="bg-[#1a1c25] border border-primary/20 px-10 py-5 rounded-2xl shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] mb-8">
                   <span className="font-mono text-5xl font-black text-primary tracking-[0.2em]" style={{ textShadow: '0 0 20px rgba(0,208,156,0.5)' }}>
                     {sessionModalState.successCode}
                   </span>
                 </div>
                 
                 <button 
                   onClick={() => navigate('/dashboard/qr')}
                   className="w-full py-4 bg-primary text-[#0f172a] rounded-full font-bold text-[15px] hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,208,156,0.8)] transition-all duration-300 uppercase tracking-wide"
                 >
                   Open QR Code Display
                 </button>
                 <button 
                   onClick={() => setSessionModalState(prev => ({...prev, isOpen: false}))}
                   className="mt-4 text-text-muted hover:text-white text-sm font-semibold transition-colors"
                 >
                   Close & Return to Timetable
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
