const API_URL = '/api/auth/';

// Helper to safely parse JSON response
const safeJsonParse = async (response) => {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error('Backend server is unreachable or returned an invalid response. Ensure the backend is running and connected to the database.');
    }
};

// Register user
const register = async (userData) => {
    const response = await fetch(API_URL + 'register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    
    if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
};

// Login user
const login = async (userData) => {
    const response = await fetch(API_URL + 'login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    
    const data = await safeJsonParse(response);
    
    if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
    }
    
    if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
};

// Logout user
const logout = () => {
    localStorage.removeItem('user');
};

const getMe = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return null;
    const response = await fetch(API_URL + 'me', {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    if (!response.ok) return null;
    return safeJsonParse(response).catch(() => null);
};

const setupFaceId = async (faceDescriptor) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) throw new Error('Not logged in');
    const response = await fetch(API_URL + 'face-setup', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ faceDescriptor })
    });
    
    const data = await safeJsonParse(response);
    if (!response.ok) throw new Error(data.message || 'Failed to setup face ID');
    return data;
};

const authService = {
    register,
    login,
    logout,
    getMe,
    setupFaceId
};

export default authService;
