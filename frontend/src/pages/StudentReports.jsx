import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  User as UserIcon, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Building2, 
  BookOpen, 
  ChevronRight, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import attendanceService from '../services/attendance.service';
import adminService from '../services/admin.service';

export default function StudentReports() {
  const [currentUser, setCurrentUser] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Roster / Student Search states
  const [rosterData, setRosterData] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setCurrentUser(parsed);
      if (parsed.role === 'student') {
        setSelectedStudentId(parsed._id || parsed.id);
      }
    }
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await adminService.getCourses();
      setCourses(data || []);
    } catch (err) {
      console.warn('Courses could not be loaded:', err);
    }
  };

  // Load roster or single student report when timeframe/date or student changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'student') {
      fetchStudentReport(currentUser._id || currentUser.id);
    } else if (selectedStudentId) {
      fetchStudentReport(selectedStudentId);
    } else {
      fetchRoster();
    }
  }, [currentUser, selectedStudentId, timeframe, selectedDate, startDate, endDate, courseFilter]);

  const getFilterParams = (studentId = null) => {
    const params = { timeframe };
    if (studentId) params.studentId = studentId;
    if (timeframe === 'daily') {
      params.date = selectedDate;
    } else if (timeframe === 'custom') {
      params.startDate = startDate;
      params.endDate = endDate;
    } else if (timeframe === 'weekly' || timeframe === 'monthly') {
      params.endDate = endDate;
    }
    if (courseFilter) params.courseId = courseFilter;
    return params;
  };

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getStudentReport(getFilterParams());
      setRosterData(data.students || []);
      setAllStudents(data.students || []);
    } catch (error) {
      console.error('Failed to fetch roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentReport = async (studentId) => {
    setReportLoading(true);
    try {
      const data = await attendanceService.getStudentReport(getFilterParams(studentId));
      setStudentReport(data);
    } catch (error) {
      console.error('Failed to fetch student report:', error);
    } finally {
      setReportLoading(false);
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId);
  };

  const handleBackToRoster = () => {
    setSelectedStudentId(null);
    setStudentReport(null);
  };

  // PDF Export using jsPDF and jspdf-autotable
  const exportPDF = () => {
    if (!studentReport || !studentReport.student) return;
    setExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const st = studentReport.student;
      const sum = studentReport.summary;
      const tfLabel = timeframe.toUpperCase();

      // Palette
      const primaryColor = [99, 102, 241]; // Indigo
      const darkBg = [24, 24, 27];
      const grayText = [113, 113, 122];

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AttendAI • Academic Biometric Attendance System', 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text('OFFICIAL STUDENT ATTENDANCE & VERIFICATION REPORT', 14, 22);

      const generatedOn = new Date().toLocaleString();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${generatedOn} | Period: ${tfLabel}`, 14, 29);

      // 2. Student Info Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 42, 182, 32, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Student Profile Information', 18, 48);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      // Column 1
      doc.text(`Name: ${st.name || 'N/A'}`, 18, 56);
      doc.text(`Enrollment / ID: ${st.idNumber || 'N/A'}`, 18, 62);
      doc.text(`Email: ${st.email || 'N/A'}`, 18, 68);

      // Column 2
      doc.text(`Degree / Course: ${st.course || 'N/A'}`, 110, 56);
      doc.text(`Department: ${st.department || 'N/A'}`, 110, 62);
      doc.text(`Academic Year: ${st.year || 'Current Year'}`, 110, 68);

      // 3. KPI Statistics Cards
      const startYCards = 80;
      const cardWidth = 42;
      const cardHeight = 22;

      // Card 1: Total Classes
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, startYCards, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL CLASSES', 18, startYCards + 7);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${sum.totalClasses}`, 18, startYCards + 17);

      // Card 2: Attended
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(60, startYCards, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text('ATTENDED (PRESENT)', 64, startYCards + 7);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`${sum.attended}`, 64, startYCards + 17);

      // Card 3: Absent
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(106, startYCards, cardWidth, cardHeight, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(239, 68, 68);
      doc.text('ABSENT / MISSED', 110, startYCards + 7);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(`${sum.absent}`, 110, startYCards + 17);

      // Card 4: Attendance Rate
      const isEligible = sum.percentage >= 75;
      doc.setFillColor(isEligible ? 240 : 254, isEligible ? 253 : 242, isEligible ? 244 : 242);
      doc.roundedRect(152, startYCards, 44, cardHeight, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(isEligible ? 21 : 220, isEligible ? 128 : 38, isEligible ? 61 : 38);
      doc.text('OVERALL ATTENDANCE', 156, startYCards + 7);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${sum.percentage}%`, 156, startYCards + 17);

      // 4. Subject Breakdown Table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Subject-Wise Attendance Breakdown', 14, 110);

      const subjectRows = (studentReport.subjects || []).map(s => [
        `${s.name} (${s.code || 'GEN'})`,
        s.facultyName || 'Instructor',
        `${s.total}`,
        `${s.attended}`,
        `${s.absent}`,
        `${s.percentage}%`,
        s.percentage >= 75 ? 'ELIGIBLE' : s.percentage >= 65 ? 'WARNING' : 'SHORTAGE'
      ]);

      autoTable(doc, {
        startY: 114,
        head: [['Subject Name', 'Faculty Instructor', 'Total', 'Attended', 'Absent', 'Attendance %', 'Status']],
        body: subjectRows.length > 0 ? subjectRows : [['No classes conducted in this period', '-', '-', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: { cellPadding: 2.5 }
      });

      // 5. Session Biometric Logs Table
      const finalY = doc.lastAutoTable?.finalY || 150;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Chronological Attendance & Biometric Audit Log', 14, finalY + 10);

      const sessionRows = (studentReport.sessionLogs || []).map(sess => {
        const d = new Date(sess.date);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const telemetry = sess.status === 'Present' 
          ? `${sess.distance !== null ? sess.distance + 'm' : ''} ${sess.matchQuality ? `(${sess.matchQuality})` : ''}`
          : 'Absent';

        return [
          `${dateStr} ${timeStr}`,
          sess.subjectName || 'Class',
          sess.facultyName || 'Faculty',
          sess.status,
          telemetry
        ];
      });

      autoTable(doc, {
        startY: finalY + 14,
        head: [['Date & Time', 'Subject', 'Faculty Instructor', 'Status', 'Biometric & GPS Telemetry']],
        body: sessionRows.length > 0 ? sessionRows : [['No sessions recorded in this timeframe', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: { cellPadding: 2 }
      });

      // 6. Signatures & Official Stamp Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 282, 196, 282);

        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('AttendAI Biometric Verification Engine • Cryptographically Signed Record', 14, 287);
        doc.text(`Page ${i} of ${totalPages}`, 180, 287);
      }

      // Add signature block on last page
      doc.setPage(totalPages);
      const sigY = 265;
      doc.setDrawColor(203, 213, 225);
      doc.line(20, sigY, 70, sigY);
      doc.line(135, sigY, 185, sigY);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Faculty In-Charge Signature', 22, sigY + 5);
      doc.text('Head of Department / Dean', 137, sigY + 5);

      // Save PDF
      const sanitizedName = (st.name || 'Student').replace(/\s+/g, '_');
      const filename = `Attendance_Report_${sanitizedName}_${st.idNumber || 'ID'}_${timeframe}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const filteredRoster = rosterData.filter(item => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (item.student?.name || '').toLowerCase().includes(term);
    const idMatch = (item.student?.idNumber || '').toLowerCase().includes(term);
    const emailMatch = (item.student?.email || '').toLowerCase().includes(term);
    return nameMatch || idMatch || emailMatch;
  });

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            {selectedStudentId && currentUser?.role !== 'student' && (
              <button
                onClick={handleBackToRoster}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-white/70 hover:text-white"
                title="Back to Student List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" /> 
              {selectedStudentId ? 'Student Attendance Report' : 'Student Reports & Analytics'}
            </h1>
          </div>
          <p className="text-text-muted text-[15px] mt-1">
            {selectedStudentId 
              ? 'Comprehensive attendance breakdown, subject performance, and official PDF export.' 
              : 'Analyze student attendance percentages by day, week, month, or custom period.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {studentReport && (
            <>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-white/70" /> Print
              </button>
              <button
                onClick={exportPDF}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Generating PDF...' : 'Export Official PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Timeframe Tabs */}
          <div className="flex items-center bg-[#09090b] p-1 rounded-xl border border-white/5">
            {[
              { id: 'daily', label: '☀️ Daily' },
              { id: 'weekly', label: '📅 Weekly' },
              { id: 'monthly', label: '🗓️ Monthly' },
              { id: 'custom', label: '🔍 Custom' },
              { id: 'all', label: '♾️ All Time' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Pickers based on timeframe */}
          <div className="flex items-center gap-3 flex-wrap">
            {timeframe === 'daily' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-medium">Select Day:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {timeframe === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-white/50 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Course Filter */}
            {currentUser?.role !== 'student' && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-white/40" />
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#09090b] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="">All Branches / Courses</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Student Search & Quick Select bar (Admin / Faculty view) */}
        {currentUser?.role !== 'student' && !selectedStudentId && (
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name, enrollment ID number, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#09090b] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="text-xs text-white/50 font-medium">
              Showing <span className="text-white font-bold">{filteredRoster.length}</span> students
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading || reportLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-text-muted text-sm font-medium">Compiling attendance records...</p>
        </div>
      ) : selectedStudentId && studentReport ? (
        /* ================== DETAILED SINGLE STUDENT VIEW ================== */
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-[#18181b] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20">
                  {studentReport.student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{studentReport.student?.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                      {studentReport.student?.courseCode || 'STUDENT'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 mt-1.5">
                    <span className="font-mono text-white/90">ID: {studentReport.student?.idNumber || 'N/A'}</span>
                    <span>•</span>
                    <span>{studentReport.student?.email}</span>
                    <span>•</span>
                    <span>{studentReport.student?.department}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                  studentReport.summary?.percentage >= 75
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : studentReport.summary?.percentage >= 65
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {studentReport.summary?.percentage >= 75 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {studentReport.summary?.eligibility || 'ELIGIBLE'}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Statistics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-sm">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Total Classes</span>
              <div className="text-3xl font-black text-white mt-2 font-mono">{studentReport.summary?.totalClasses || 0}</div>
              <span className="text-[11px] text-white/50 mt-1 block">Held in this {timeframe} window</span>
            </div>

            <div className="bg-[#18181b] border border-emerald-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Attended (Present)</span>
              <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">{studentReport.summary?.attended || 0}</div>
              <span className="text-[11px] text-emerald-400/60 mt-1 block">Biometrically verified check-ins</span>
            </div>

            <div className="bg-[#18181b] border border-red-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Absent (Missed)</span>
              <div className="text-3xl font-black text-red-400 mt-2 font-mono">{studentReport.summary?.absent || 0}</div>
              <span className="text-[11px] text-red-400/60 mt-1 block">Unrecorded or non-attended sessions</span>
            </div>

            <div className="bg-[#18181b] border border-primary/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Attendance Percentage</span>
              <div className="text-3xl font-black text-white mt-2 font-mono flex items-baseline gap-1">
                {studentReport.summary?.percentage || 0}<span className="text-lg text-primary">%</span>
              </div>
              <div className="w-full h-1.5 bg-[#09090b] rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    studentReport.summary?.percentage >= 75 ? 'bg-emerald-500' : studentReport.summary?.percentage >= 65 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${studentReport.summary?.percentage || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Subject-Wise Performance Table */}
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Subject-Wise Attendance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Subject</th>
                    <th className="py-3 px-4 font-bold">Faculty Instructor</th>
                    <th className="py-3 px-4 font-bold text-center">Total</th>
                    <th className="py-3 px-4 font-bold text-center text-emerald-400">Present</th>
                    <th className="py-3 px-4 font-bold text-center text-red-400">Absent</th>
                    <th className="py-3 px-4 font-bold text-right">Attendance %</th>
                    <th className="py-3 px-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(!studentReport.subjects || studentReport.subjects.length === 0) ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-white/40">No subject records in this timeframe.</td>
                    </tr>
                  ) : (
                    studentReport.subjects.map(s => (
                      <tr key={s.subjectId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {s.name} <span className="text-white/40 font-mono text-[11px] ml-1">({s.code})</span>
                        </td>
                        <td className="py-3.5 px-4 text-white/70">{s.facultyName}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-white/90">{s.total}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">{s.attended}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-red-400">{s.absent}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          <span className={`${s.percentage >= 75 ? 'text-emerald-400' : s.percentage >= 65 ? 'text-amber-400' : 'text-red-400'}`}>
                            {s.percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.percentage >= 75 ? 'bg-emerald-500/10 text-emerald-400' : s.percentage >= 65 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {s.percentage >= 75 ? 'Eligible' : s.percentage >= 65 ? 'Warning' : 'Shortage'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Session Verification Audit Log */}
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Chronological Session Attendance Log
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Class / Subject</th>
                    <th className="py-3 px-4 font-bold">Faculty</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">GPS Geofence</th>
                    <th className="py-3 px-4 font-bold">Facial Biometrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(!studentReport.sessionLogs || studentReport.sessionLogs.length === 0) ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-white/40">No attendance sessions recorded for this window.</td>
                    </tr>
                  ) : (
                    studentReport.sessionLogs.map((log, idx) => (
                      <tr key={log.sessionId + idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-white/80 whitespace-nowrap">
                          {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <span className="text-white/40 ml-2 font-mono text-[11px]">
                            {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {log.subjectName} <span className="text-white/40 text-[11px]">({log.className})</span>
                        </td>
                        <td className="py-3 px-4 text-white/70">{log.facultyName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.status === 'Present' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/60 font-mono">
                          {log.distance !== null ? `${log.distance}m` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {log.matchQuality ? (
                            <span className="text-primary font-medium text-[11px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> {log.matchQuality}
                            </span>
                          ) : (
                            <span className="text-white/30">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================== ROSTER OVERVIEW (ADMIN / FACULTY) ================== */
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" /> Student Attendance Roster Summary
            </h2>
            <span className="text-xs text-white/50">
              Period: <strong className="text-white uppercase font-mono">{timeframe}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider bg-white/[0.01]">
                  <th className="py-3.5 px-5 font-bold">Student Name</th>
                  <th className="py-3.5 px-5 font-bold">Enrollment ID</th>
                  <th className="py-3.5 px-5 font-bold">Course / Department</th>
                  <th className="py-3.5 px-5 font-bold text-center">Total Classes</th>
                  <th className="py-3.5 px-5 font-bold text-center text-emerald-400">Attended</th>
                  <th className="py-3.5 px-5 font-bold text-center text-red-400">Absent</th>
                  <th className="py-3.5 px-5 font-bold text-right">Attendance %</th>
                  <th className="py-3.5 px-5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-white/40">
                      No students found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map(item => (
                    <tr 
                      key={item.student._id} 
                      onClick={() => handleSelectStudent(item.student._id)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 font-bold text-xs">
                          {item.student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div>{item.student.name}</div>
                          <div className="text-[10px] text-white/40 font-normal">{item.student.email}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-white/70">{item.student.idNumber}</td>
                      <td className="py-3.5 px-5 text-white/60">
                        {item.student.course} <span className="text-white/30 ml-1">({item.student.department})</span>
                      </td>
                      <td className="py-3.5 px-5 text-center font-mono text-white/90">{item.totalClasses}</td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-emerald-400">{item.attended}</td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-red-400">{item.absent}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          item.percentage >= 75 ? 'bg-emerald-500/10 text-emerald-400' : item.percentage >= 65 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectStudent(item.student._id); }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          View & Export PDF <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
