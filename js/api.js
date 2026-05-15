/**
 * DHL Knowledge Base API Module
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ========== AUTHENTICATION ==========

async function login(username, password) {
    return apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function isAuthenticated() {
    return getCurrentUser() !== null;
}

// ========== ARTICLES CRUD ==========

async function getArticles(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/articles${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint);
}

async function getArticle(id) {
    return apiRequest(`/articles/${id}`);
}

async function createArticle(articleData) {
    return apiRequest('/articles', {
        method: 'POST',
        body: JSON.stringify(articleData)
    });
}

async function updateArticle(id, articleData) {
    return apiRequest(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(articleData)
    });
}

async function updateArticleStatus(id, status) {
    return apiRequest(`/articles/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
}

async function deleteArticle(id) {
    return apiRequest(`/articles/${id}`, {
        method: 'DELETE'
    });
}

// ========== AI PROCESSING ==========

async function processWithAI(content) {
    return apiRequest('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

async function uploadFiles(formData) {
    const url = `${API_BASE_URL}/articles`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// ========== RPA ENDPOINTS ==========

async function rpaIngest(data) {
    return apiRequest('/rpa/ingest', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getRPAStats(lastRun) {
    const params = lastRun ? `?lastRun=${lastRun}` : '';
    return apiRequest(`/rpa/stats${params}`);
}

// ========== HELPER FUNCTIONS ==========

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}