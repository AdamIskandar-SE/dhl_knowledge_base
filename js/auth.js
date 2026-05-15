/**
 * DHL Knowledge Base - Authentication Module
 */

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    // Update UI with current user info
    const user = getCurrentUser();
    if (user) {
        updateUserUI(user);
    }
}

function updateUserUI(user) {
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl) userNameEl.innerText = user.username;
    if (userAvatarEl) userAvatarEl.innerText = user.username.charAt(0).toUpperCase();
    if (userRoleEl) userRoleEl.innerText = user.role;
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
}

// Protect page - redirect to login if not authenticated
function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get auth header for API requests
function getAuthHeader() {
    const user = getCurrentUser();
    if (user) {
        return {
            'X-User-Id': user.id,
            'X-User-Role': user.role
        };
    }
    return {};
}