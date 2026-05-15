/**
 * DHL Knowledge Base - Upload Page Logic
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!protectPage()) return;
    
    currentUser = getCurrentUser();
    setupLogout();

    if (currentUser.role === 'reviewer') {
        showError('Reviewers cannot create or upload articles. Redirecting to View Articles.');
        setTimeout(() => window.location.href = 'view-articles.html', 1800);
        return;
    }

    setupTabs();
    setupFileUpload();
    setupFormSubmit();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab button
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active pane
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        for (let file of e.target.files) {
            fileList.innerHTML += `
                <div style="background: #f0f4ff; padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <i class="fas fa-file"></i> ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(2)} KB)
                </div>
            `;
        }
    });
}

function setupFormSubmit() {
    const textForm = document.getElementById('textForm');
    if (textForm) {
        textForm.addEventListener('submit', handleTextSubmit);
    }
}

async function handleTextSubmit(e) {
    e.preventDefault();
    hideMessages();
    showLoading(true);
    
    const title = document.getElementById('title')?.value;
    const content = document.getElementById('content')?.value;
    const tagsRaw = document.getElementById('tags')?.value;
    const status = document.getElementById('status')?.value;
    
    if (!title || !content) {
        showError('Please fill in both title and content');
        showLoading(false);
        return;
    }
    
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : [];
    
    try {
        const article = await createArticle({
            title,
            content,
            summary: content.substring(0, 200),
            tags,
            status,
            createdBy: currentUser.username,
            sourceType: 'manual'
        });
        
        showSuccess('Article created successfully!');
        
        // Clear form
        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
        document.getElementById('tags').value = '';
        
        setTimeout(() => {
            window.location.href = 'view-articles.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to create article. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function handleTextAIProcess() {
    const content = document.getElementById('content')?.value;
    if (!content) {
        showError('Please enter some content to process');
        return;
    }
    
    showLoading(true);
    hideMessages();
    
    try {
        const result = await processWithAI(content);
        
        if (result.title) {
            const titleInput = document.getElementById('title');
            if (titleInput) titleInput.value = result.title;
        }
        
        showSuccess('AI processing complete! Review the suggested content.');
        
    } catch (error) {
        showError('AI processing failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput?.files;
    
    if (!files || files.length === 0) {
        showError('Please select files to upload');
        return;
    }
    
    showLoading(true);
    hideMessages();
    
    const formData = new FormData();
    for (let file of files) {
        formData.append('attachments', file);
    }
    formData.append('createdBy', currentUser.username);
    formData.append('status', document.getElementById('fileStatus')?.value || 'draft');
    formData.append('sourceType', 'file-upload');
    
    try {
        const article = await uploadFiles(formData);
        showSuccess(`Successfully created article from ${files.length} file(s)!`);
        
        fileInput.value = '';
        document.getElementById('fileList').innerHTML = '';
        
        setTimeout(() => {
            window.location.href = 'view-articles.html';
        }, 1500);
        
    } catch (error) {
        showError('File upload failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function processRawWithAI() {
    const rawInput = document.getElementById('aiRawInput')?.value;
    if (!rawInput) {
        showError('Please enter raw content to process');
        return;
    }
    
    showLoading(true);
    hideMessages();
    
    try {
        const result = await processWithAI(rawInput);
        
        const aiResultDiv = document.getElementById('aiResult');
        if (aiResultDiv) {
            aiResultDiv.innerHTML = `
                <h4><i class="fas fa-robot"></i> AI Generated Article</h4>
                <div class="ai-suggestion">
                    <strong>Suggested Title:</strong> ${escapeHtml(result.title)}
                    <br><br>
                    <strong>Summary:</strong> ${escapeHtml(result.summary)}
                    <br><br>
                    <strong>Content Preview:</strong> ${escapeHtml(result.content?.substring(0, 300))}...
                </div>
                <div class="action-buttons" style="margin-top: 16px;">
                    <button class="btn-primary" onclick="saveAIArticle('${escapeHtml(result.title)}', ${JSON.stringify(escapeHtml(rawInput))}, '${escapeHtml(result.summary)}')">
                        <i class="fas fa-save"></i> Save to Knowledge Base
                    </button>
                </div>
            `;
            aiResultDiv.classList.add('active');
        }
        
    } catch (error) {
        showError('AI processing failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function saveAIArticle(title, content, summary) {
    showLoading(true);
    
    try {
        const article = await createArticle({
            title: title,
            content: content,
            summary: summary,
            tags: ['ai-generated'],
            status: 'draft',
            createdBy: currentUser.username,
            sourceType: 'ai-generated'
        });
        
        showSuccess('AI-generated article saved successfully!');
        setTimeout(() => {
            window.location.href = 'view-articles.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to save article');
    } finally {
        showLoading(false);
    }
}