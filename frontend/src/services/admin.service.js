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

const getUsers = async () => {
    const response = await fetch(API_URL + 'users', {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
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

const adminService = {
    getStats,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getDepartments,
    getDepartmentHierarchy,
    getCourses
};

export default adminService;
