// 隐藏天赋实验室 · 轻量后端
// 零依赖 Node 服务：托管静态站点 + 密码校验与限次 + 商家密码管理
// 运行：node server.js  （PORT 环境变量可覆盖，默认 3000）
// 管理密钥：环境变量 ADMIN_MASTER 或首次运行写入 passwords.json 的 _admin.master

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;
const PW_FILE = path.join(DIR, 'passwords.json');
const INDEX = path.join(DIR, 'index.html');
const DEFAULT_MASTER = process.env.ADMIN_MASTER || 'CHANGE_ME_ADMIN';

// 读取密码库；不存在则写入默认演示密码（每个 3 次）
function loadPw() {
  let db;
  try {
    db = JSON.parse(fs.readFileSync(PW_FILE, 'utf8'));
  } catch (e) {
    db = { _admin: { master: DEFAULT_MASTER } };
  }
  // 结构归一化：兼容旧版「数字值」，统一为 {left,max,note}
  if (!db._admin || typeof db._admin !== 'object') db._admin = { master: DEFAULT_MASTER };
  if (!db._admin.master) db._admin.master = DEFAULT_MASTER;
  Object.keys(db).forEach(k => {
    if (k === '_admin') return;
    if (typeof db[k] === 'number') db[k] = { left: db[k], max: db[k], note: '' };
    if (typeof db[k] !== 'object') db[k] = { left: 0, max: 0, note: '' };
  });
  if (!db.TALENT2026) db.TALENT2026 = { left: 3, max: 3, note: '演示' };
  if (!db.HIDDEN888) db.HIDDEN888 = { left: 3, max: 3, note: '演示' };
  return db;
}
function savePw(o) {
  try { fs.writeFileSync(PW_FILE, JSON.stringify(o, null, 2)); } catch (e) {}
}

// 收集请求体（JSON）
function readBody(req, cb) {
  let b = '';
  req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); });
  req.on('end', () => { let o = {}; try { o = JSON.parse(b || '{}'); } catch (e) {} cb(o); });
}

const server = http.createServer((req, res) => {
  const json = () => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin', '*'); };
  // 处理 CORS 预检（允许前端部署在任意静态托管，API 在 ECS）
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.statusCode = 204;
    return res.end();
  }
  const html = () => res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // ===== 密码校验 / 限次 =====
  if (req.method === 'POST' && req.url === '/api/unlock') {
    return readBody(req, o => {
      const pw = (o.password || '').toString(), consume = !!o.consume;
      const db = loadPw();
      json();
      if (!pw || !db[pw] || typeof db[pw] !== 'object') {
        return res.end(JSON.stringify({ ok: false, reason: 'invalid' }));
      }
      const rec = db[pw];
      if ((rec.left || 0) <= 0) {
        return res.end(JSON.stringify({ ok: false, reason: 'exhausted' }));
      }
      if (consume) {
        rec.left = (rec.left || 0) - 1;
        savePw(db);
        return res.end(JSON.stringify({ ok: true, remaining: rec.left }));
      }
      return res.end(JSON.stringify({ ok: true, remaining: rec.left }));
    });
  }

  // ===== 商家密码管理 =====
  if (req.method === 'POST' && req.url === '/api/admin') {
    return readBody(req, o => {
      const action = o.action, master = (o.master || '').toString();
      const db = loadPw();
      json();
      if (master !== db._admin.master) {
        return res.end(JSON.stringify({ ok: false, reason: 'forbidden' }));
      }
      if (action === 'list') {
        const rows = Object.keys(db)
          .filter(k => k !== '_admin')
          .map(k => ({ code: k, left: db[k].left, max: db[k].max, note: db[k].note || '' }))
          .sort((a, b) => a.code.localeCompare(b.code));
        return res.end(JSON.stringify({ ok: true, rows }));
      }
      if (action === 'add') {
        const code = (o.code || '').toString().trim();
        const max = parseInt(o.max, 10) || 3;
        const note = (o.note || '').toString();
        if (!code) return res.end(JSON.stringify({ ok: false, reason: 'empty' }));
        if (/[^A-Za-z0-9_-]/.test(code)) {
          return res.end(JSON.stringify({ ok: false, reason: 'badcode' }));
        }
        db[code] = { left: max, max, note };
        savePw(db);
        return res.end(JSON.stringify({ ok: true }));
      }
      if (action === 'reset') {
        const code = (o.code || '').toString();
        if (!db[code] || typeof db[code] !== 'object') {
          return res.end(JSON.stringify({ ok: false, reason: 'notfound' }));
        }
        db[code].left = db[code].max;
        savePw(db);
        return res.end(JSON.stringify({ ok: true }));
      }
      if (action === 'setmaster') {
        const newm = (o.newm || '').toString();
        if (!newm) return res.end(JSON.stringify({ ok: false, reason: 'empty' }));
        db._admin.master = newm;
        savePw(db);
        return res.end(JSON.stringify({ ok: true }));
      }
      return res.end(JSON.stringify({ ok: false, reason: 'badaction' }));
    });
  }

  // ===== 健康检查 =====
  if (req.url === '/api/health') {
    json();
    return res.end(JSON.stringify({ ok: true }));
  }

  // ===== 静态资源 =====
  const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.md': 'text/markdown; charset=utf-8'
  };
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath !== '/' && !urlPath.startsWith('/api/')) {
    const fp = path.normalize(path.join(DIR, urlPath));
    if (fp.startsWith(DIR) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      res.setHeader('Content-Type', MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream');
      return fs.readFile(fp, (err, data) => {
        if (err) { res.statusCode = 500; res.end('read error'); return; }
        res.end(data);
      });
    }
  }

  // ===== 静态页（始终返回 index.html，前端用 hash 路由） =====
  fs.readFile(INDEX, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not found'); return; }
    html();
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('🔮 隐藏天赋实验室已启动：http://localhost:' + PORT);
});
