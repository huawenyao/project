# LangGraph Server - AI Builder Studio

这是 AI Builder Studio 的 LangGraph Server 部署，提供强大的 AI Agent 能力。

## 🚀 快速开始

### 1. 环境准备

确保已安装：
- Python 3.10+
- Node.js 20+ (用于 LangGraph CLI)

### 2. 安装依赖

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 API Keys
nano .env
```

**必需配置:**
- `OPENAI_API_KEY` - OpenAI API 密钥
- `ANTHROPIC_API_KEY` - Anthropic API 密钥（可选）

### 4. 启动服务器

```bash
# 方法1: 使用启动脚本
chmod +x start-server.sh
./start-server.sh

# 方法2: 手动启动
source venv/bin/activate
langgraph serve --host 0.0.0.0 --port 8123 --config langgraph.json
```

服务器将在 http://localhost:8123 启动

### 5. 测试 Agent

```bash
# 测试 Builder Agent
python test-agent.py "我需要创建一个待办事项应用"

# 或者使用 API
curl -X POST http://localhost:8123/runs/stream \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "builder_agent",
    "input": {
      "messages": [{"role": "user", "content": "我需要创建一个博客系统"}]
    }
  }'
```

## 📚 项目结构

```
langgraph-server/
├── src/
│   ├── agents/           # Agent 定义
│   │   ├── builder_agent.py   # 应用构建 Agent
│   │   └── __init__.py
│   ├── workflows/        # 工作流定义
│   ├── tools/            # 自定义工具
│   └── utils/            # 工具函数
├── tests/                # 测试文件
├── venv/                 # Python 虚拟环境
├── .env                  # 环境变量 (不提交)
├── .env.example          # 环境变量模板
├── langgraph.json        # LangGraph 配置
├── requirements.txt      # Python 依赖
├── pyproject.toml        # 项目元数据
├── start-server.sh       # 启动脚本
├── test-agent.py         # 测试脚本
└── README.md             # 本文件
```

## 🤖 可用的 Agents

### Builder Agent
- **功能**: 帮助用户构建应用
- **能力**:
  - 需求分析
  - 架构设计
  - 代码生成
  - 部署建议
- **API 端点**: `/builder_agent`

## 📖 API 文档

启动服务器后，访问 http://localhost:8123/docs 查看完整的 API 文档。

### 主要端点

- `POST /runs/stream` - 流式运行 Agent
- `POST /runs/wait` - 同步运行 Agent
- `GET /assistants` - 列出所有可用的 Agents
- `GET /threads/{thread_id}` - 获取对话历史

### 示例请求

```python
import requests

response = requests.post(
    "http://localhost:8123/runs/stream",
    json={
        "assistant_id": "builder_agent",
        "input": {
            "messages": [{
                "role": "user",
                "content": "我需要创建一个电商网站"
            }]
        },
        "config": {
            "configurable": {}
        }
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

## 🔧 配置说明

### langgraph.json

```json
{
  "node_version": "20",
  "graphs": {
    "builder_agent": "./src/agents/builder_agent.py:create_builder_graph"
  },
  "env": ".env"
}
```

- `graphs`: 定义可用的 Agent 图
- `env`: 环境变量文件路径

### 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | 是 |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | 否 |
| `LANGCHAIN_TRACING_V2` | 启用 LangSmith 追踪 | 否 |
| `LANGCHAIN_API_KEY` | LangSmith API 密钥 | 否 |
| `LANGGRAPH_SERVER_HOST` | 服务器主机 | 否 (默认 0.0.0.0) |
| `LANGGRAPH_SERVER_PORT` | 服务器端口 | 否 (默认 8123) |

## 🧪 开发和测试

### 运行测试

```bash
# 激活虚拟环境
source venv/bin/activate

# 运行单元测试
pytest tests/

# 运行单个测试
pytest tests/test_builder_agent.py -v
```

### 添加新的 Agent

1. 在 `src/agents/` 创建新文件，例如 `new_agent.py`
2. 定义 Agent 图和工具
3. 在 `langgraph.json` 中注册:
   ```json
   {
     "graphs": {
       "new_agent": "./src/agents/new_agent.py:create_new_graph"
     }
   }
   ```
4. 重启服务器

### 调试技巧

```bash
# 查看服务器日志
LOG_LEVEL=DEBUG ./start-server.sh

# 使用 LangSmith 追踪 (需要 API Key)
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=your_key
```

## 🔐 安全注意事项

1. **API Keys**: 永远不要将 `.env` 文件提交到版本控制
2. **生产环境**: 使用环境变量而非 `.env` 文件
3. **认证**: 在生产环境中启用 JWT 认证
4. **速率限制**: 配置适当的速率限制

## 📊 监控和日志

### 日志级别

```bash
# .env 文件中设置
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

### LangSmith 集成

启用 LangSmith 可以追踪所有 Agent 执行：

```bash
# .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=ai-builder-studio
```

访问 https://smith.langchain.com 查看追踪数据。

## 🚨 故障排除

### 问题1: 虚拟环境激活失败

```bash
# 确保已安装 venv
sudo apt install python3-venv

# 重新创建虚拟环境
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 问题2: API Key 错误

```
错误: openai.AuthenticationError
```

**解决方案**: 检查 `.env` 文件中的 `OPENAI_API_KEY` 是否正确

### 问题3: 端口被占用

```
错误: Address already in use
```

**解决方案**: 更改端口或停止占用端口的进程

```bash
# 查找占用端口的进程
lsof -i :8123

# 停止进程
kill -9 <PID>

# 或者使用不同端口
LANGGRAPH_SERVER_PORT=8124 ./start-server.sh
```

### 问题4: 依赖安装失败

```bash
# 升级 pip
pip install --upgrade pip

# 清理缓存
pip cache purge

# 重新安装
pip install -r requirements.txt
```

## 🤝 集成到 AI Builder Studio

### 后端集成

在 `backend/src/services/` 创建 LangGraph 客户端：

```typescript
// backend/src/services/LangGraphClient.ts
import axios from 'axios';

export class LangGraphClient {
  private baseURL = 'http://localhost:8123';

  async runAgent(agentId: string, input: any) {
    const response = await axios.post(
      `${this.baseURL}/runs/stream`,
      {
        assistant_id: agentId,
        input: input
      },
      { responseType: 'stream' }
    );

    return response.data;
  }
}
```

### 前端集成

使用 EventSource 或 fetch API 连接流式响应：

```typescript
// frontend/src/services/AgentService.ts
export async function* streamAgent(agentId: string, message: string) {
  const response = await fetch('http://localhost:8123/runs/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assistant_id: agentId,
      input: { messages: [{ role: 'user', content: message }] }
    })
  });

  const reader = response.body?.getReader();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = new TextDecoder().decode(value);
    yield text;
  }
}
```

## 📝 更新日志

### v0.1.0 (2025-10-30)
- ✨ 初始版本
- 🤖 实现 Builder Agent
- 📦 配置 LangGraph Server
- 📚 完整文档

## 📄 许可证

MIT License

## 🔗 相关链接

- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [LangChain 文档](https://python.langchain.com/)
- [LangSmith](https://smith.langchain.com/)
- [AI Builder Studio](https://github.com/your-repo)

## 💬 支持

如有问题或建议，请提交 Issue 或联系团队。
