# LangSmith 追踪配置指南

LangSmith 是 LangChain 官方提供的追踪、调试和监控平台，可以帮助你：

- 📊 可视化 Agent 执行流程
- 🐛 调试 LLM 调用和工具使用
- ⚡ 分析性能瓶颈
- 📈 监控生产环境运行状态

---

## 🚀 快速开始

### 1. 获取 LangSmith API Key

1. 访问 https://smith.langchain.com
2. 注册账号（可以使用 GitHub 登录）
3. 创建新项目或使用默认项目
4. 在设置中生成 API Key

### 2. 配置环境变量

编辑 `.env` 文件，添加以下配置：

```bash
# LangSmith 追踪配置
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=ai-builder-studio
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### 3. 重启服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
./start-server.sh
```

### 4. 查看追踪数据

1. 运行一些 Agent 请求
2. 访问 https://smith.langchain.com
3. 进入你的项目查看追踪数据

---

## 📊 追踪功能说明

### 自动追踪的内容

启用 LangSmith 后，以下内容会自动被追踪：

1. **LLM 调用**
   - 输入 prompt
   - 模型响应
   - Token 使用量
   - 调用延迟

2. **工具调用**
   - 工具名称
   - 输入参数
   - 返回结果
   - 执行时间

3. **Agent 执行流程**
   - 完整的执行图
   - 状态转换
   - 决策路径

4. **错误和异常**
   - 错误类型
   - 错误消息
   - 堆栈跟踪

### 追踪数据示例

```
Run: Builder Agent Execution
├── LLM Call: gpt-4o-mini
│   ├── Input: "我需要创建一个待办事项应用"
│   ├── Output: "我来帮你分析需求..."
│   ├── Tokens: 150 / 300
│   └── Latency: 1.2s
├── Tool: analyze_requirements
│   ├── Input: {"description": "待办事项应用"}
│   ├── Output: {"app_type": "web", ...}
│   └── Duration: 0.05s
└── LLM Call: gpt-4o-mini
    ├── Input: "基于以下分析..."
    └── Output: "推荐使用 React + Node.js..."
```

---

## 🔧 高级配置

### 自定义项目名称

为不同环境使用不同项目：

```bash
# 开发环境
LANGCHAIN_PROJECT=ai-builder-dev

# 生产环境
LANGCHAIN_PROJECT=ai-builder-prod
```

### 添加自定义元数据

在代码中添加元数据：

```python
from src.utils.tracing import get_run_metadata

metadata = get_run_metadata(
    user_id="user123",
    session_id="session456",
    feature="builder_agent",
    version="v1.0"
)
```

### 使用追踪装饰器

为自定义函数添加追踪：

```python
from src.utils.tracing import trace_agent_execution

@trace_agent_execution("my_custom_agent")
def my_agent_function(input_data):
    # 你的代码
    return result
```

---

## 📈 监控和分析

### 关键指标

在 LangSmith 中关注以下指标：

1. **延迟 (Latency)**
   - 平均响应时间
   - P95, P99 延迟
   - 瓶颈识别

2. **Token 使用**
   - 每次调用的 Token 数
   - 每日总消耗
   - 成本估算

3. **错误率**
   - 成功/失败比率
   - 错误类型分布
   - 错误趋势

4. **工具使用**
   - 最常用工具
   - 工具执行时间
   - 工具成功率

### 创建仪表板

LangSmith 允许你创建自定义仪表板：

1. 在项目中点击 "Dashboards"
2. 创建新仪表板
3. 添加图表和指标
4. 保存并分享

---

## 🎯 最佳实践

### 1. 使用有意义的项目名称

```bash
# ❌ 不好
LANGCHAIN_PROJECT=test

# ✅ 好
LANGCHAIN_PROJECT=ai-builder-studio-prod
```

### 2. 为不同环境使用不同项目

```bash
# 本地开发
LANGCHAIN_PROJECT=ai-builder-local

# 测试环境
LANGCHAIN_PROJECT=ai-builder-staging

# 生产环境
LANGCHAIN_PROJECT=ai-builder-prod
```

### 3. 添加有用的标签

```python
metadata = get_run_metadata(
    user_id=user_id,
    feature="builder_agent",
    version="v1.0",
    customer_tier="premium"  # 添加业务相关标签
)
```

### 4. 定期审查追踪数据

- 每周检查错误率
- 识别性能瓶颈
- 优化高频调用
- 监控成本

---

## 🐛 调试技巧

### 查找慢查询

1. 在 LangSmith 中按延迟排序
2. 查看最慢的 runs
3. 分析瓶颈（LLM 调用？工具执行？）

### 调试工具调用失败

1. 找到失败的 run
2. 查看工具调用部分
3. 检查输入参数
4. 查看错误消息
5. 修复代码并重新测试

### 优化 Prompt

1. 查看 LLM 调用的输入输出
2. 分析 Token 使用
3. 优化 prompt 长度和结构
4. 对比优化前后效果

---

## 💰 成本控制

### 查看成本

LangSmith 可以估算 LLM 调用成本：

1. 进入项目统计页面
2. 查看 "Token Usage"
3. 根据模型价格计算成本

### 优化策略

1. **使用更便宜的模型**
   ```python
   # 从 gpt-4 切换到 gpt-4o-mini
   model = ChatOpenAI(model="gpt-4o-mini")
   ```

2. **减少 Token 使用**
   - 优化 prompt 长度
   - 使用更短的系统提示
   - 限制历史消息数量

3. **缓存结果**
   - 缓存常见查询
   - 重用之前的分析结果

---

## 🔒 安全和隐私

### 数据保护

LangSmith 追踪可能包含敏感数据：

1. **不要追踪敏感信息**
   - 密码
   - API Keys
   - 个人身份信息

2. **使用数据脱敏**
   ```python
   # 脱敏敏感数据
   user_email_masked = "u***@example.com"
   ```

3. **配置数据保留期**
   - 在 LangSmith 设置中配置
   - 建议不超过 30 天

### 访问控制

1. 限制 API Key 权限
2. 为团队成员设置适当的角色
3. 定期轮换 API Keys

---

## 🆘 故障排除

### 问题：追踪未显示

**可能原因：**
1. API Key 未配置或错误
2. `LANGCHAIN_TRACING_V2` 未设置为 `true`
3. 网络连接问题

**解决方案：**
```bash
# 1. 检查环境变量
env | grep LANGCHAIN

# 2. 验证 API Key
curl -H "x-api-key: $LANGCHAIN_API_KEY" \
  https://api.smith.langchain.com/api/v1/runs

# 3. 查看服务器日志
```

### 问题：追踪数据不完整

**可能原因：**
1. Agent 执行被中断
2. 网络传输失败

**解决方案：**
- 确保 Agent 完整执行
- 检查网络连接稳定性
- 查看服务器错误日志

### 问题：性能影响

**说明：**
LangSmith 追踪会有轻微的性能开销（通常 < 50ms）

**优化：**
- 在生产环境使用采样（只追踪部分请求）
- 异步发送追踪数据

---

## 📚 更多资源

- [LangSmith 官方文档](https://docs.smith.langchain.com/)
- [LangSmith Python SDK](https://github.com/langchain-ai/langsmith-sdk)
- [LangSmith 视频教程](https://www.youtube.com/results?search_query=langsmith+tutorial)
- [LangChain Discord](https://discord.gg/langchain)

---

## ✅ 检查清单

在启用 LangSmith 前确认：

- [ ] 已注册 LangSmith 账号
- [ ] 已获取 API Key
- [ ] 已配置 `.env` 文件
- [ ] 已重启服务器
- [ ] 可以在 LangSmith 中看到追踪数据
- [ ] 已为生产环境配置独立项目
- [ ] 已设置数据保留期
- [ ] 已配置团队访问权限

---

**更新时间**: 2025-10-30
**版本**: v1.0
