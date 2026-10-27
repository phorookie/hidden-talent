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

---

## 五、欣赏相册集（`album.html`）

个人用的「看图 → 分析构图 → 写读图笔记」工具，与测评站相互独立、可共存于同一站点。

**打开方式**：`http://<服务器地址>/album.html`（或你的域名）

### 功能

- **分层相册**：分类树，有子分类的节点自动成为「分组」（只汇总、不直接存图，计数 = 子分类之和，点击看全部）
- **构图分析图层**：手绘 / 直线 / 箭头 / 矩形；「选择」工具可点选已有线条拖动移位、拖端点变形、改色改粗细、单条删除；三分线 / 黄金分割参考线（不写入导出）
- **读图评论**：每张图可写「觉得好 / 觉得坏」，与标签一起参与全库搜索
- **标签**：多标签 + 标签栏点选过滤（跨分类检索的关键）
- **双图对比**：并排 + 缩放/平移可「联动」或「独立」，支持原尺寸（1 像素 = 1 像素）
- **查看器缩放**：滚轮 / 双指捏合 / 平移模式 / 原尺寸，构图线随缩放保持对齐
- **批量整理**：☑ 多选后批量移动分类、批量删除
- **数据安全**：⬇ 备份整库为 JSON / ⬆ 恢复；超 14 天未备份会提醒
- **导出**：📄 读图笔记 HTML（含缩略图）/ 📝 Markdown；「⋯ → 载入推荐分类结构」可按标准分类树一键补全
- **PWA**：可「添加到主屏幕」当 App 用，离线可打开；💾 存图 / 🖼 存分析图（iOS 走分享菜单→存储图像）

### 存储

- 图片 + 构图线 + 评论 + 标签 → 浏览器 **IndexedDB**
- 分类树 + 标签词库 → **localStorage**
- **纯本地，不上传任何服务器**。换设备 / 清缓存前务必先 ⬇ 备份

### 云同步（可选，默认关闭，仍用 Supabase）

1. Supabase → SQL Editor → 执行 `supabase/album-schema.sql`
2. Authentication → Providers → 打开 **Anonymous Sign-ins**
3. `config.js` 里加一行 `ALBUM_SYNC_ON: true`

之后「⋯」菜单会出现「☁️ 上传到云端 / 从云端恢复」。注意：匿名账号身份存在浏览器里，清缓存会换身份导致云端数据失联，所以**本地备份仍然是最终保险**。

---

## 六、文件结构

```
index.html / admin.html / server.js    隐藏天赋测评站（前端 + 零依赖后端，同源部署）
passwords.json                        密码库（首次运行自动创建，已被 .gitignore 挡住，不会公开）

supabase/schema.sql / talent-config.js  ⚠️ 已弃用：早期 Supabase 方案残留，现已切回同源 Node 后端，无需它们
.github/workflows/                    早期 GitHub Pages 部署配置（改 ECS 部署后可删除）

album.html / album-* / make_icons.py / supabase/album-schema.sql   欣赏相册集（独立功能）
```

---

## 七、常见问题

- **原来用 Supabase 太慢？** 早期方案用 Supabase（海外节点）导致国内延迟高；现已切回同源 Node 后端，部署到国内服务器（如阿里云 ECS）即毫秒级。
- **想换端口？** 用 `PORT=8080 node server.js`。
- **密码门提示 invalid / exhausted？** 检查密码是否正确、或剩余次数是否用完（进 admin.html 点「重置」即可恢复）。
- **前端想放 GitHub Pages、后端放 ECS？** `server.js` 已开 CORS，把前端静态资源传到 Pages，接口仍指向 ECS 地址即可。
