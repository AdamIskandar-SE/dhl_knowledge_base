/**
 * DHL Knowledge Base - View Articles Page Logic
 */

let allArticles = [];
let currentPage = 1;
const articlesPerPage = 9;

document.addEventListener('DOMContentLoaded', () => {
    if (!protectPage()) return;
    
    setupLogout();
    loadArticles();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            applyFilters();
        }, 300));
    }
    
    const filterInputs = ['tagFilter', 'statusFilter', 'creatorFilter'];
    filterInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                currentPage = 1;
                applyFilters();
            });
        }
    });
}

async function loadArticles() {
    try {
        showLoading(true, 'articlesLoading');
        allArticles = await getArticles();
        applyFilters();
        showLoading(false, 'articlesLoading');
    } catch (error) {
        console.error('Error loading articles:', error);
        showError('Failed to load articles');
        showLoading(false, 'articlesLoading');
    }
}

function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const tag = document.getElementById('tagFilter')?.value.toLowerCase() || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const creator = document.getElementById('creatorFilter')?.value.toLowerCase() || '';
    
    let filtered = [...allArticles];
    
    if (search) {
        filtered = filtered.filter(a => 
            a.title.toLowerCase().includes(search) ||
            a.content.toLowerCase().includes(search) ||
            a.summary.toLowerCase().includes(search)
        );
    }
    
    if (tag) {
        filtered = filtered.filter(a => 
            a.tags && a.tags.some(t => t.toLowerCase().includes(tag))
        );
    }
    
    if (status) {
        filtered = filtered.filter(a => a.status === status);
    }
    
    if (creator) {
        filtered = filtered.filter(a => 
            a.createdBy.toLowerCase().includes(creator)
        );
    }
    
    renderArticles(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const statusFilter = document.getElementById('statusFilter');
    const creatorFilter = document.getElementById('creatorFilter');
    
    if (searchInput) searchInput.value = '';
    if (tagFilter) tagFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (creatorFilter) creatorFilter.value = '';
    
    currentPage = 1;
    renderArticles(allArticles);
}

function renderArticles(articles) {
    const start = (currentPage - 1) * articlesPerPage;
    const paginated = articles.slice(start, start + articlesPerPage);
    const totalPages = Math.ceil(articles.length / articlesPerPage);
    
    const container = document.getElementById('articlesGrid');
    if (!container) return;
    
    if (paginated.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>No articles found. Create your first article!</p>
                <button class="btn-primary" onclick="window.location.href='upload.html'" style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> Create Article
                </button>
            </div>
        `;
        renderPagination(0);
        return;
    }
    
    container.innerHTML = paginated.map(article => `
        <div class="article-card">
            <div class="article-header">
                <h3>${escapeHtml(article.title)}</h3>
                <div class="article-meta">
                    <span><i class="fas fa-user"></i> ${escapeHtml(article.createdBy)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(article.createdAt)}</span>
                </div>
                <div class="tags-container">
                    ${article.tags?.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') || '<span class="tag">no-tag</span>'}
                </div>
            </div>
            <div class="article-body">
                <div class="article-summary">
                    ${escapeHtml(truncateText(article.summary || article.content, 120))}
                </div>
            </div>
            <div class="article-footer">
                ${getStatusBadge(article.status)}
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewArticle(${article.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="editArticle(${article.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteArticle(${article.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    applyFilters();
}

async function viewArticle(id) {
    try {
        const article = await getArticle(id);
        
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (modalTitle && modalBody) {
            modalTitle.innerHTML = escapeHtml(article.title);
            modalBody.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div class="article-meta" style="margin-bottom: 12px;">
                        <span><i class="fas fa-user"></i> Created by: ${escapeHtml(article.createdBy)}</span>
                        <span><i class="fas fa-clock"></i> Created: ${formatDateTime(article.createdAt)}</span>
                        <span><i class="fas fa-sync-alt"></i> Updated: ${formatDateTime(article.updatedAt)}</span>
                    </div>
                    ${getStatusBadge(article.status)}
                    <div style="background: #f8f9ff; padding: 16px; border-radius: 12px; margin: 20px 0;">
                        <strong>Summary:</strong>
                        <p style="margin-top: 8px;">${escapeHtml(article.summary)}</p>
                    </div>
                    <div>
                        <strong>Full Content:</strong>
                        <p style="margin-top: 8px; white-space: pre-wrap;">${escapeHtml(article.content)}</p>
                    </div>
                    ${article.versionHistory && article.versionHistory.length > 0 ? `
                        <div class="version-history">
                            <strong><i class="fas fa-history"></i> Version History</strong>
                            ${article.versionHistory.map(v => `
                                <div class="version-item">
                                    Version ${v.version} - ${v.status} - ${formatDateTime(v.changedAt)}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="action-buttons" style="margin-top: 20px;">
                    <button class="btn-primary" onclick="updateArticleStatus(${article.id}, 'reviewed')">Submit for Review</button>
                    <button class="btn-primary" onclick="updateArticleStatus(${article.id}, 'published')">Publish</button>
                    <button class="btn-secondary" onclick="closeModal()">Close</button>
                </div>
            `;
        }
        
        document.getElementById('articleModal')?.classList.add('active');
    } catch (error) {
        console.error('Error viewing article:', error);
        showError('Failed to load article details');
    }
}

async function updateArticleStatus(id, newStatus) {
    try {
        await updateArticleStatus(id, newStatus);
        await loadArticles();
        closeModal();
        showNotification(`Article status updated to ${newStatus}`, 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showError('Failed to update status');
    }
}

async function deleteArticle(id) {
    if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
        try {
            await deleteArticle(id);
            await loadArticles();
            showNotification('Article deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting article:', error);
            showError('Failed to delete article');
        }
    }
}

function editArticle(id) {
    window.location.href = `edit.html?id=${id}`;
}

function closeModal() {
    document.getElementById('articleModal')?.classList.remove('active');
}