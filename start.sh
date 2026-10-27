#!/usr/bin/env bash
# ============================================================
# 隐藏天赋实验室 · ECS 一键启动脚本（零依赖，需已装 Node v16+）
# 用法：
#   bash start.sh                      # 默认端口 3000
#   PORT=8080 bash start.sh            # 指定端口
#   ADMIN_MASTER=你的密钥 bash start.sh # 启动时直接设管理密钥
# ============================================================
set -e
PORT="${PORT:-3000}"
MASTER="${ADMIN_MASTER:-CHANGE_ME_ADMIN}"
cd "$(dirname "$0")"

echo "🔍 Node 版本："
node -v || { echo "❌ 未检测到 Node，请先安装 Node v16+"; exit 1; }

echo "🚀 启动服务（端口 $PORT，后台运行，日志 → talent.log）..."
nohup env PORT="$PORT" ADMIN_MASTER="$MASTER" node server.js > talent.log 2>&1 &
echo "✅ 已启动，PID $!"

sleep 1
if curl -s "http://127.0.0.1:$PORT/api/health" >/dev/null; then
  echo "💚 健康检查通过"
else
  echo "⚠️ 健康检查未通过，查看 talent.log"
fi

echo ""
echo "🌐 网站首页： http://<你的ECS公网IP>:$PORT/"
echo "🔧 密码后台： http://<你的ECS公网IP>:$PORT/admin.html"
echo ""
echo "📌 上线前必做："
echo "   1) 阿里云安全组 / 防火墙放行 TCP:$PORT 入站"
echo "   2) 尽快修改 admin 默认密钥（进 /admin.html 点『修改密钥』，或启动时设 ADMIN_MASTER）"
echo "   3) 把 index.html 里好评弹窗的客服微信『XXXX（占位，请替换）』改掉"
echo "   4) 关闭 SSH 终端不会停（nohup）；但机器重启需重新运行本脚本（建议配 systemd 守护）"
