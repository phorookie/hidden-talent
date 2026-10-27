# 隐藏天赋实验室 · 测评网站

一个「发现你被埋没的天赋」趣味测评网站：密码门 → 答题（可返回上一题）→ 结果页（保存大图 / 复制链接 / 再测一次 / 好评有礼）。

- **部署**：前端 + 后端同源部署在一台服务器（如阿里云 ECS），零依赖 Node 服务 `server.js` 同时托管静态页与接口，**国内访问快**。
- **数据库**：本地 JSON 文件（`passwords.json`），真实可管理；限次逻辑由后端负责。
- **密码管理**：`admin.html` 后台，输入 master 密钥即可增删改密码、查看剩余次数。

---

## 一、部署到服务器（推荐：阿里云 ECS）

本项目是**前端 + 后端同源**部署：零依赖的 `server.js` 既托管静态页面，又提供 `/api/unlock`（密码校验限次）和 `/api/admin`（商家管理）接口。部署到国内服务器（如你已有的阿里云 ECS）后，国内访问即为毫秒级，彻底告别 Supabase 海外延迟。

### 方式 A：直接上传运行（最简单）
1. 把仓库这些文件上传到服务器目录（如 `/opt/hidden-talent/`）：
   `index.html`、`admin.html`、`server.js`，以及所需的静态资源（图片等）。
   > `passwords.json` 会在首次运行时自动创建，无需上传。
2. 服务器安装 Node.js（v16+），进入目录运行：
   ```bash
   node server.js
   # 默认端口 3000；可用 PORT=8080 node server.js 修改
   ```
3. 浏览器访问 `http://<服务器公网IP>:3000` 即可。
4. （可选）用 `pm2` 守护进程、`nginx` 反代 + HTTPS 域名，详见下方。

### 方式 B：Nginx 反代 + 域名 + HTTPS（生产推荐）
1. `node server.js` 或 `pm2 start server.js` 让服务跑在 3000 端口。
2. Nginx 把你的域名反代到 `http://127.0.0.1:3000`，并配 SSL 证书（免费 Let's Encrypt / Certbot）。
3. 开放防火墙：安全组放行 443（和 80 跳转），3000 端口只监听本地、不对外暴露。
   - 优点：用户访问 `https://你的域名` 安全稳定；复制链接、保存图片等浏览器能力在 HTTPS 下才完整可用。

### 进程守护（避免关终端即停）
```bash
npm i -g pm2
pm2 start server.js --name hidden-talent
pm2 save
pm2 startup
```

> 想要更灵活？`server.js` 已开启 CORS，前端也可单独放在 GitHub Pages / 对象存储，只要把 `index.html` 里的接口地址指向 `http://<ECS公网IP>:3000` 即可。同源部署则无需任何额外配置。

---

## 二、管理密码（admin.html）

部署后访问 `http://<服务器地址>/admin.html`（或你的域名 `/admin.html`）：

1. 首次 **管理密钥 master** 填 `CHANGE_ME_ADMIN`（请尽快在后台「修改密钥」改成你自己的）。
2. 「进入 / 刷新列表」可看到所有密码与剩余 / 上限次数、备注。
3. 「新增 / 覆盖密码」可按渠道批量建码（如 `DOUYIN01`、备注「抖音投放」），默认 3 次。
4. 某密码用完可点「重置」恢复次数。

> 安全机制：所有读写都需校验 master 密钥；admin 页面是公开链接，请妥善保管 master 密钥，并建议用 HTTPS + 强密钥。

---

## 三、本地测试

直接运行 `node server.js`，访问 `http://localhost:3000`：
- 密码限次由本地 `passwords.json` 负责（已自带演示密码 `TALENT2026` / `HIDDEN888` 各 3 次）。
- 想重置演示密码次数：编辑 `passwords.json` 把对应 `left` 改回 `max`，或进 admin.html 点「重置」。
- 前端已无需任何外部 CDN / 数据库，开箱即用。

---

## 四、上线前记得改的两处占位

1. `index.html` 里好评弹窗的客服微信：`XXXX（占位，请替换）` → 你的真实客服号。
2. `admin.html` / 后端的 master 密钥：`CHANGE_ME_ADMIN` → 你自己的密钥（进 admin 后台「修改密钥」即可，或设环境变量 `ADMIN_MASTER`）。

