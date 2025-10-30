#!/bin/bash

echo "🔍 验证 LangGraph Server 安装..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查项计数
PASSED=0
FAILED=0

# 检查函数
check_item() {
    local name="$1"
    local command="$2"

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $name"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $name"
        ((FAILED++))
    fi
}

echo "📦 检查系统环境..."
check_item "Python 3.10+" "python3 --version | grep -E 'Python 3\.(10|11|12)'"
check_item "pip3 已安装" "which pip3"
check_item "虚拟环境目录存在" "test -d venv"

echo ""
echo "📚 检查项目文件..."
check_item ".env 配置文件" "test -f .env"
check_item "langgraph.json 配置" "test -f langgraph.json"
check_item "requirements.txt" "test -f requirements.txt"
check_item "启动脚本" "test -x start-server.sh"
check_item "测试脚本" "test -x test-agent.py"

echo ""
echo "🤖 检查 Agent 文件..."
check_item "src/__init__.py" "test -f src/__init__.py"
check_item "agents/__init__.py" "test -f src/agents/__init__.py"
check_item "builder_agent.py" "test -f src/agents/builder_agent.py"

echo ""
echo "🔧 检查 Python 包..."
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    check_item "langgraph 已安装" "python -c 'import langgraph' 2>/dev/null"
    check_item "langchain 已安装" "python -c 'import langchain' 2>/dev/null"
    check_item "fastapi 已安装" "python -c 'import fastapi' 2>/dev/null"
    check_item "uvicorn 已安装" "python -c 'import uvicorn' 2>/dev/null"
    deactivate
else
    echo -e "${RED}❌${NC} 虚拟环境未激活"
    ((FAILED++))
fi

echo ""
echo "🔐 检查配置..."
if [ -f ".env" ]; then
    if grep -q "sk-your-key-here" .env || grep -q "your_openai_api_key_here" .env; then
        echo -e "${YELLOW}⚠️${NC}  OpenAI API Key 需要配置"
        echo "   请编辑 .env 文件并添加真实的 API Key"
    else
        echo -e "${GREEN}✅${NC} OpenAI API Key 已配置"
        ((PASSED++))
    fi
else
    echo -e "${RED}❌${NC} .env 文件不存在"
    ((FAILED++))
fi

echo ""
echo "=" * 60
echo "📊 验证结果"
echo "=" * 60
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！LangGraph Server 已准备就绪${NC}"
    echo ""
    echo "下一步："
    echo "  1. 配置 API Key:    nano .env"
    echo "  2. 启动服务器:      ./start-server.sh"
    echo "  3. 测试 Agent:       python test-agent.py '你的测试请求'"
    echo "  4. 访问 API 文档:   http://localhost:8123/docs"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED 项检查未通过${NC}"
    echo ""
    echo "请修复上述问题后重新运行此脚本"
    echo "如需帮助，请查看 README.md 或 DEPLOYMENT_SUMMARY.md"
    exit 1
fi
