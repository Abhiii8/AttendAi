const API_URL = '/api/';

const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
    };
};

const getClasses = async () => {
    const response = await fetch(API_URL + 'classes', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch classes');
    return response.json();
};

const createClass = async (classData) => {
    const response = await fetch(API_URL + 'classes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create class');
    return data;
};

const getSubjects = async () => {
    const response = await fetch(API_URL + 'subjects', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch subjects');
    return response.json();
};

const createSubject = async (subjectData) => {
    const response = await fetch(API_URL + 'subjects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(subjectData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create subject');
    return data;
};

const getFacultyList = async () => {
    const response = await fetch(API_URL + 'faculty-list', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch faculty list');
    return response.json();
};

const getStudents = async () => {
    const response = await fetch(API_URL + 'students', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
};

const createStudent = async (studentData) => {
    const response = await fetch(API_URL + 'students', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create student');
    return data;
};

const getFacultyStats = async () => {
    const response = await fetch(API_URL + 'faculty-stats', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch faculty stats');
    return response.json();
};

const facultyService = {
    getClasses,
    createClass,
    getSubjects,
    createSubject,
    getFacultyList,
    getStudents,
    createStudent,
    getFacultyStats
};

export default facultyService;
