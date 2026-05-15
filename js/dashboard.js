/**
 * DHL Knowledge Base - Dashboard Page Logic
 */

let dashboardArticles = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!protectPage()) return;
    
    setupLogout();
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        showLoading(true, 'dashboardLoading');
        
        const articles = await getArticles();
        dashboardArticles = articles;
        
        updateStats(articles);
        updateRecentArticles(articles);
        
        showLoading(false, 'dashboardLoading');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
        showLoading(false, 'dashboardLoading');
    }
}

function updateStats(articles) {
    const stats = {
        total: articles.length,
        drafts: articles.filter(a => a.status === 'draft').length,
        reviewed: articles.filter(a => a.status === 'reviewed').length,
        published: articles.filter(a => a.status === 'published').length
    };
    
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="background: #e0e7ff; color: #667eea;">
                <i class="fas fa-file-alt"></i>
            </div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Articles</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: #fff3cd; color: #856404;">
                <i class="fas fa-pen-fancy"></i>
            </div>
            <div class="stat-value">${stats.drafts}</div>
            <div class="stat-label">Drafts</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: #d4edda; color: #155724;">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-value">${stats.reviewed}</div>
            <div class="stat-label">Under Review</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: #cce5ff; color: #004085;">
                <i class="fas fa-globe"></i>
            </div>
            <div class="stat-value">${stats.published}</div>
            <div class="stat-label">Published</div>
        </div>
    `;
}

function updateRecentArticles(articles) {
    const recent = [...articles]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    const container = document.getElementById('recentArticles');
    if (!container) return;
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>No articles yet. Create your first article!</p>
                <button class="btn-primary" onclick="window.location.href='upload.html'" style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> Create Article
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recent.map(article => `
        <div class="article-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #eee; border-radius: 12px; margin-bottom: 12px;">
            <div class="article-info">
                <h4 style="margin-bottom: 8px;">${escapeHtml(article.title)}</h4>
                <div class="article-meta">
                    <span><i class="fas fa-user"></i> ${escapeHtml(article.createdBy)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(article.createdAt)}</span>
                    <span><i class="fas fa-tag"></i> ${article.tags?.join(', ') || 'No tags'}</span>
                </div>
            </div>
            ${getStatusBadge(article.status)}
        </div>
    `).join('');
}

async function refreshStats() {
    await loadDashboardData();
    showNotification('Dashboard refreshed', 'success');
}