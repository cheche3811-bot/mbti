#!/usr/bin/env bash
# ============================================================
#  测试总入口
#
#  自动探测可用的 node，避免版本目录改名导致路径失效
#  （曾因 22.22.2 → 22.22.2-2 导致全部套件误报失败）
#
#  用法：./run-tests.sh
# ============================================================
set -uo pipefail
cd "$(dirname "$0")"

# ---------- 探测 node ----------
find_node() {
  # 1) PATH 里的 node
  if command -v node >/dev/null 2>&1; then command -v node; return; fi
  # 2) WorkBuddy 托管的 node（取版本号最大的）
  local base="$HOME/.workbuddy/binaries/node/versions"
  if [ -d "$base" ]; then
    local c
    c=$(ls -1 "$base" 2>/dev/null | grep -v '^current$' | sort -V | tail -1)
    if [ -n "$c" ] && [ -x "$base/$c/bin/node" ]; then echo "$base/$c/bin/node"; return; fi
  fi
  return 1
}

NODE=$(find_node) || { echo "❌ 未找到 node，请先安装"; exit 1; }
echo "node: $($NODE --version)  ($NODE)"
echo ""

SUITES=(
  test-astro
  test-synthesis
  test-profile
  test-animals
  test-share-engine
  test-a11y
  test-e2e
  test-share-layout
  test-card-v2-layout
  test-share-url
)

total=0
failed=0
failed_names=()

for t in "${SUITES[@]}"; do
  out=$("$NODE" "test/$t.js" 2>&1)
  code=$?
  n=$(echo "$out" | grep -oE '通过 [0-9]+' | grep -oE '[0-9]+' | tail -1)
  [ -z "$n" ] && n=0
  total=$((total + n))

  if [ $code -eq 0 ]; then
    if [ "$n" != "0" ]; then
      printf "  ✅ %-24s %s 项\n" "$t" "$n"
    else
      printf "  ✅ %-24s 布局核算\n" "$t"
    fi
  else
    failed=$((failed + 1))
    failed_names+=("$t")
    printf "  ❌ %-24s 失败\n" "$t"
    echo "$out" | tail -12 | sed 's/^/       /'
  fi
done

echo ""
echo "────────────────────────────────────"
if [ $failed -eq 0 ]; then
  echo "  ✅ 全部通过 · 累计 $total 项断言"
  echo "────────────────────────────────────"
  exit 0
else
  echo "  ❌ $failed 个套件失败: ${failed_names[*]}"
  echo "     已通过 $total 项"
  echo "────────────────────────────────────"
  exit 1
fi
