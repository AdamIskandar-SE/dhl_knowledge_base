const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');

function initDataFiles() {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    if (!fs.existsSync(path.join(__dirname, '../data'))) {
        fs.mkdirSync(path.join(__dirname, '../data'));
    }
    
    if (!fs.existsSync(ARTICLES_FILE)) {
        const sampleArticles = [
            {
                id: 1,
                title: "Standard Operating Procedure - Package Handling",
                content: "Step 1: Receive package at loading dock\nStep 2: Scan barcode\nStep 3: Verify address\nStep 4: Sort by destination\nStep 5: Load onto vehicle",
                summary: "Complete SOP for package handling",
                tags: ["sop", "logistics"],
                status: "published",
                version: 1,
                versionHistory: [],
                createdBy: "admin",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                publishedAt: new Date().toISOString(),
                attachments: [],
                sourceType: "manual",
                viewCount: 0
            }
        ];
        fs.writeFileSync(ARTICLES_FILE, JSON.stringify(sampleArticles, null, 2));
    }
    
    if (!fs.existsSync(USERS_FILE)) {
        const defaultUsers = [
            { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
            { id: 2, username: 'editor', password: 'editor123', role: 'editor' },
            { id: 3, username: 'reviewer', password: 'reviewer123', role: 'reviewer' }
        ];
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    }
}

function readArticles() {
    const data = fs.readFileSync(ARTICLES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeArticles(articles) {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

function readUsers() {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/api/articles', (req, res) => {
    let articles = readArticles();
    const { search, tag, status, creator } = req.query;
    
    if (search) {
        articles = articles.filter(a => 
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.content.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (tag) {
        articles = articles.filter(a => a.tags && a.tags.includes(tag));
    }
    if (status) {
        articles = articles.filter(a => a.status === status);
    }
    if (creator) {
        articles = articles.filter(a => a.createdBy === creator);
    }
    
    res.json(articles);
});

app.get('/api/articles/:id', (req, res) => {
    const articles = readArticles();
    const article = articles.find(a => a.id === parseInt(req.params.id));
    article ? res.json(article) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/articles', upload.array('attachments', 5), (req, res) => {
    const articles = readArticles();
    const { title, content, summary, tags, createdBy, status } = req.body;
    
    const newArticle = {
        id: articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1,
        title: title || 'Untitled',
        content: content || '',
        summary: summary || (content || '').substring(0, 200),
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
        status: status || 'draft',
        version: 1,
        versionHistory: [],
        createdBy: createdBy || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        attachments: [],
        sourceType: 'manual',
        viewCount: 0
    };
    
    articles.push(newArticle);
    writeArticles(articles);
    res.status(201).json(newArticle);
});

app.put('/api/articles/:id', (req, res) => {
    let articles = readArticles();
    const index = articles.findIndex(a => a.id === parseInt(req.params.id));
    
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    const old = articles[index];
    articles[index] = { ...old, ...req.body, id: old.id, updatedAt: new Date().toISOString() };
    
    if (req.body.status === 'published' && old.status !== 'published') {
        articles[index].publishedAt = new Date().toISOString();
        articles[index].version = old.version + 1;
    }
    
    writeArticles(articles);
    res.json(articles[index]);
});

app.patch('/api/articles/:id/status', (req, res) => {
    let articles = readArticles();
    const index = articles.findIndex(a => a.id === parseInt(req.params.id));
    
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    articles[index].status = req.body.status;
    articles[index].updatedAt = new Date().toISOString();
    
    if (req.body.status === 'published' && articles[index].publishedAt === null) {
        articles[index].publishedAt = new Date().toISOString();
        articles[index].version += 1;
    }
    
    writeArticles(articles);
    res.json(articles[index]);
});

app.delete('/api/articles/:id', (req, res) => {
    let articles = readArticles();
    const filtered = articles.filter(a => a.id !== parseInt(req.params.id));
    
    if (filtered.length === articles.length) {
        return res.status(404).json({ error: 'Not found' });
    }
    
    writeArticles(filtered);
    res.json({ message: 'Deleted successfully' });
});

app.post('/api/ai/summarize', (req, res) => {
    const { content } = req.body;
    const firstLine = (content || '').split('\n')[0];
    const title = firstLine.substring(0, 50) || 'Processed Article';
    const summary = (content || '').substring(0, 200);
    res.json({ title, summary, tags: ['auto-generated'] });
});

app.post('/api/rpa/ingest', (req, res) => {
    const { content, sourceType } = req.body;
    const articles = readArticles();
    
    const newArticle = {
        id: articles.length + 1,
        title: `RPA Import: ${new Date().toISOString()}`,
        content: content || '',
        summary: (content || '').substring(0, 200),
        tags: ['rpa-imported'],
        status: 'draft',
        version: 1,
        versionHistory: [],
        createdBy: 'rpa-bot',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        attachments: [],
        sourceType: sourceType || 'rpa',
        viewCount: 0
    };
    
    articles.push(newArticle);
    writeArticles(articles);
    res.json({ status: 'created', articleId: newArticle.id });
});

initDataFiles();
app.listen(PORT, () => {
    console.log(`\n✅ DHL Knowledge Base Server Running!`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`👤 Login: admin / admin123\n`);
});