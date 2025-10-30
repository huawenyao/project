#!/bin/bash

# LangGraph Server 启动脚本

echo "🚀 启动 LangGraph Server..."

# 进入脚本所在目录
cd "$(dirname "$0")"

# 激活虚拟环境
echo "📦 激活虚拟环境..."
source venv/bin/activate

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，从示例文件复制..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件并添加你的 API Keys"
    exit 1
fi

# 检查 API Key
if grep -q "your_openai_api_key_here" .env || grep -q "sk-your-key-here" .env; then
    echo "❌ 错误: 请在 .env 文件中配置你的 OPENAI_API_KEY"
    echo "   编辑 .env 文件并替换 OPENAI_API_KEY 的值"
    exit 1
fi

# 加载环境变量
echo "🔧 加载环境变量..."
export $(cat .env | grep -v '^#' | xargs)

# 启动 LangGraph Server
echo "✨ 启动 LangGraph Server 在端口 ${LANGGRAPH_SERVER_PORT:-8123}..."
echo ""
echo "📍 服务器将运行在: http://${LANGGRAPH_SERVER_HOST:-0.0.0.0}:${LANGGRAPH_SERVER_PORT:-8123}"
echo "📖 API 文档: http://localhost:${LANGGRAPH_SERVER_PORT:-8123}/docs"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 使用 langgraph-cli 启动服务器
langgraph serve \
    --host ${LANGGRAPH_SERVER_HOST:-0.0.0.0} \
    --port ${LANGGRAPH_SERVER_PORT:-8123} \
    --config langgraph.json
