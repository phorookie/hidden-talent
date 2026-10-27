# 隐藏天赋实验室 · 后端部署到 Supabase Edge Functions

> 前端（GitHub Pages）已上线，现把密码校验 / 管理后端部署到 Supabase Edge Function。
> 说明：Supabase 跑不了 `server.js` 这种 Node 进程，因此后端逻辑改写为 Deno 函数 `talent`，数据存 Supabase 数据库。

## 架构
- 前端 `index.html` / `admin.html` 调 `https://<项目ref>.functions.supabase.co/functions/v1/talent`（POST，body 带 `route` 字段：`unlock` / `admin` / `health`）
- 函数内部用 `service_role` 密钥读写 `passwords` / `meta` 两张表（密钥只在函数内，不暴露前端）
- 前端已保留 `localStorage` 兜底：若函数调不通，自动回退本地限次（仅纯静态兜底用）

## 步骤

### 1. 建表（一次性）
Supabase 控制台 → SQL Editor → 新建查询 → 粘贴 `supabase/schema.sql` 全部内容 → Run。
建好后 `passwords` 表有演示密码 `TALENT2026` / `HIDDEN888`，`meta` 表有 master=`CHANGE_ME_ADMIN`。

### 2. 安装并登录 Supabase CLI
```bash
npm i -g supabase
supabase login
```

### 3. 部署 Edge Function
在 `hidden-talent` 目录下执行（`<项目ref>` 在 Supabase 控制台 Project Settings → General 里，形如 `abcdefghijklmnop`）：
```bash
supabase functions deploy talent --project-ref <项目ref>
```
> 函数代码在 `supabase/functions/talent/index.ts`。`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 部署到关联项目后会被自动注入，无需手动 set。

### 4. 验证函数可用
```bash
curl -X POST https://<项目ref>.functions.supabase.co/functions/v1/talent \
  -H "Content-Type: application/json" \
  -d '{"route":"health"}'
# 应返回 {"ok":true}

curl -X POST https://<项目ref>.functions.supabase.co/functions/v1/talent \
  -H "Content-Type: application/json" \
  -d '{"route":"unlock","password":"TALENT2026","consume":false}'
# 应返回 {"ok":true,"remaining":3}
```

### 5. 让前端指向后端
打开 `index.html` 和 `admin.html`，把顶部的：
```js
const API_BASE = '';
```
改为（注意不含尾部斜杠）：
```js
const API_BASE = 'https://<项目ref>.functions.supabase.co/functions/v1';
```
改完重新 push 到 GitHub（Pages 会自动重新部署）。

### 6. 管理密码
浏览器打开 `https://<你的Pages地址>/admin.html`：
- 管理密钥填 `CHANGE_ME_ADMIN` → 进「修改密钥」改成你自己的
- 可新增 / 覆盖密码（如 `DOUYIN01`）、重置次数、查看列表

## 注意事项
- **地区与延迟**：Supabase 默认海外节点，国内访问可能比国内服务器慢几秒（仅「解锁 / 管理」瞬间）。若后续对速度敏感，可考虑腾讯云 SCF / 阿里云 FC 等同构函数方案（逻辑一致，改数据库客户端即可）。
- 数据库表默认未开 RLS，且函数用 `service_role` 跳过 RLS，读写安全（密钥不落地前端）。如担心，可给两张表开启 RLS 并仅放行 `service_role`（函数仍可用）。
- `passwords.json` 与 `server.js` 仅用于「同源 Node 部署」场景，走 Supabase 方案时不再需要它们（可保留作本地测试）。
