#!/bin/bash
# ============================================================
#  一键部署到 GitHub Pages
#  用法：./deploy.sh <你的GitHub用户名> [仓库名]
#  例：./deploy.sh wangche mbti
# ============================================================
set -e

USER="$1"
REPO="${2:-mbti}"

if [ -z "$USER" ]; then
  echo "❌ 请提供 GitHub 用户名"
  echo "   用法: ./deploy.sh <GitHub用户名> [仓库名]"
  echo "   例如: ./deploy.sh wangche mbti"
  exit 1
fi

cd "$(dirname "$0")"

echo "▸ 目标仓库: https://github.com/$USER/$REPO"
echo ""

# 配置本仓库的提交身份（不污染全局配置）
git config user.name "$USER"
git config user.email "$USER@users.noreply.github.com"

# 设置远程地址
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/$USER/$REPO.git"
  echo "▸ 已更新 remote origin"
else
  git remote add origin "https://github.com/$USER/$REPO.git"
  echo "▸ 已添加 remote origin"
fi

echo "▸ 正在推送到 main 分支…"
git push -u origin main

echo ""
echo "✅ 推送完成！"
echo ""
echo "最后一步（只需做一次）："
echo "  1. 打开 https://github.com/$USER/$REPO/settings/pages"
echo "  2. Source 选择「GitHub Actions」"
echo "  3. 等 1-2 分钟，访问："
echo ""
echo "     https://$USER.github.io/$REPO/"
echo ""
