/**
 * DHL Knowledge Base - Utility Functions
 */

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification message
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        padding: 12px 24px;
        border-radius: 12px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show/hide loading spinner
function showLoading(show, elementId = 'loading') {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.toggle('active', show);
    }
}

// Show/hide messages
function showSuccess(message) {
    const el = document.getElementById('successMsg');
    if (el) {
        el.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 3000);
    } else {
        showNotification(message, 'success');
    }
}

function showError(message) {
    const el = document.getElementById('errorMsg');
    if (el) {
        el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 3000);
    } else {
        showNotification(message, 'error');
    }
}

function hideMessages() {
    const success = document.getElementById('successMsg');
    const error = document.getElementById('errorMsg');
    if (success) success.style.display = 'none';
    if (error) error.style.display = 'none';
}

// Get status badge HTML
function getStatusBadge(status) {
    const statusMap = {
        'draft': 'Draft',
        'reviewed': 'Under Review',
        'published': 'Published'
    };
    return `<span class="status-badge status-${status}">${statusMap[status] || status}</span>`;
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Truncate text
function truncateText(text, maxLength = 120) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}