const API_URL = '/api/attendance/';

const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
    };
};

const startSession = async (classId, sessionData) => {
    const response = await fetch(API_URL + 'start', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ classId, ...sessionData })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to start session');
    return data;
};

const markAttendance = async (markData) => {
    const response = await fetch(API_URL + 'mark', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(markData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to mark attendance');
    return data;
};

const getActiveSession = async (classId) => {
    const response = await fetch(API_URL + 'active-session/' + classId, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch active session');
    }
    return response.json();
};

const getRecords = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch records');
    }
    return response.json();
};

const getStudentStats = async () => {
    const response = await fetch(API_URL + 'student-stats', {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch student stats');
    }
    return response.json();
};

const attendanceService = {
    startSession,
    markAttendance,
    getActiveSession,
    getRecords,
    getStudentStats
};

export default attendanceService;
