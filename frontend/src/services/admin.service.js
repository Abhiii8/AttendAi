const API_URL = '/api/admin/';

const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
    };
};

const getStats = async () => {
    const response = await fetch(API_URL + 'stats', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
};

const getUsers = async (roleOrFilter) => {
    let roleStr = '';
    if (typeof roleOrFilter === 'string') {
        roleStr = roleOrFilter;
    } else if (roleOrFilter && typeof roleOrFilter === 'object' && roleOrFilter.role) {
        roleStr = roleOrFilter.role;
    }
    const url = roleStr ? `${API_URL}users?role=${encodeURIComponent(roleStr)}` : `${API_URL}users`;
    const response = await fetch(url, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

const getFacultyList = async () => {
    const response = await fetch(API_URL + 'faculty-list', {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        // Fallback to /api/faculty-list
        const fallback = await fetch('/api/faculty-list', { headers: getAuthHeaders() });
        if (!fallback.ok) throw new Error('Failed to fetch faculty list');
        return fallback.json();
    }
    return response.json();
};

const createUser = async (userData) => {
    const response = await fetch(API_URL + 'users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create user');
    return data;
};

const updateUser = async (id, userData) => {
    const response = await fetch(API_URL + 'users/' + id, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update user');
    return data;
};

const deleteUser = async (id) => {
    const response = await fetch(API_URL + 'users/' + id, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete user');
    return data;
};

const getDepartments = async () => {
    const response = await fetch(API_URL + 'departments', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch departments');
    return response.json();
};

const getDepartmentHierarchy = async () => {
    const response = await fetch(API_URL + 'department-hierarchy', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch department hierarchy');
    return response.json();
};

const getCourses = async () => {
    const response = await fetch(API_URL + 'courses', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
};

const createCourse = async (courseData) => {
    const response = await fetch(API_URL + 'courses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(courseData)
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create course');
    }
    return response.json();
};

const updateCourse = async (id, courseData) => {
    const response = await fetch(API_URL + `courses/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(courseData)
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update course');
    }
    return response.json();
};

const deleteCourse = async (id) => {
    const response = await fetch(API_URL + `courses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete course');
    }
    return response.json();
};

const adminService = {
    getStats,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getDepartments,
    getDepartmentHierarchy,
    getCourses,
    getFacultyList,
    createCourse,
    updateCourse,
    deleteCourse
};

export default adminService;
