# 响应式设计测试指南

本文档提供AI思考过程可视化系统的响应式设计测试用例和验证清单。

---

## 测试环境

### 设备尺寸分类

| 设备类型 | 屏幕宽度 | 断点 (Tailwind CSS) | 测试优先级 |
|---------|---------|---------------------|-----------|
| 移动端 (手机) | 320px - 640px | `sm` | 🔴 高 |
| 平板 (竖屏) | 641px - 768px | `md` | 🟡 中 |
| 平板 (横屏) | 769px - 1024px | `lg` | 🟡 中 |
| 桌面 (小) | 1025px - 1280px | `xl` | 🟢 低 |
| 桌面 (大) | 1281px+ | `2xl` | 🟢 低 |

### 推荐测试设备

**移动端:**
- iPhone SE (375x667)
- iPhone 12/13 Pro (390x844)
- Samsung Galaxy S21 (360x800)
- Google Pixel 5 (393x851)

**平板:**
- iPad Mini (768x1024)
- iPad Air (820x1180)
- iPad Pro 11" (834x1194)
- Samsung Galaxy Tab (800x1280)

**桌面:**
- 1366x768 (标准笔记本)
- 1920x1080 (Full HD)
- 2560x1440 (2K)

---

## 组件响应式测试清单

### ✅ T180: VisualizationPanel 移动端布局

**测试目标:** 确保可视化面板在小屏幕上正确显示为单列布局

#### 测试步骤

1. **导航到可视化页面**
   ```
   打开: http://localhost:12000/visualization
   ```

2. **切换到移动端视图**
   - 使用浏览器开发工具 (F12)
   - 切换到设备模拟模式
   - 选择 iPhone 12 Pro (390x844)

3. **验证布局**
   - [ ] Agent卡片以单列形式垂直排列
   - [ ] 每个卡片宽度占满容器（100% width）
   - [ ] 卡片之间有适当间距（16px margin）
   - [ ] 不出现横向滚动条
   - [ ] 进度条在卡片内正确显示

4. **验证交互**
   - [ ] 点击Agent卡片可展开/收起详情
   - [ ] 滚动流畅，无性能问题
   - [ ] 触摸手势响应正常

5. **验证内容**
   - [ ] Agent名称完整可见
   - [ ] 进度百分比清晰显示
   - [ ] 状态图标大小适中（24x24px）
   - [ ] 文字大小可读（至少14px）

#### 预期结果

```css
/* 移动端样式 */
@media (max-width: 640px) {
  .visualization-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .agent-card {
    width: 100%;
    min-width: unset;
  }
}
```

#### 截图位置
`/docs/screenshots/responsive/visualization-panel-mobile.png`

---

### ✅ T181: DecisionSidebar 平板布局

**测试目标:** 确保决策侧边栏在平板上以滑入式方式显示

#### 测试步骤

1. **切换到平板视图**
   - 选择 iPad Air (820x1180)
   - 同时测试竖屏和横屏模式

2. **验证初始状态**
   - [ ] 侧边栏默认隐藏
   - [ ] 显示"决策"按钮或图标
   - [ ] 未读决策数量徽章可见

3. **验证展开行为**
   - [ ] 点击按钮，侧边栏从右侧滑入
   - [ ] 滑入动画流畅（300ms transition）
   - [ ] 侧边栏宽度适中（60% - 80%屏幕宽度）
   - [ ] 显示遮罩层（overlay）
   - [ ] 点击遮罩层可关闭侧边栏

4. **验证内容显示**
   - [ ] 决策卡片垂直排列
   - [ ] 时间轴在左侧显示
   - [ ] 卡片标题和内容完整可见
   - [ ] 展开/收起按钮正常工作

5. **验证滚动**
   - [ ] 侧边栏内容可独立滚动
   - [ ] 滚动时主内容区不滚动
   - [ ] 滚动性能流畅（60fps）

#### 预期结果

```css
/* 平板布局 */
@media (min-width: 641px) and (max-width: 1024px) {
  .decision-sidebar {
    position: fixed;
    right: -100%;
    top: 0;
    height: 100vh;
    width: 70%;
    max-width: 500px;
    transition: right 0.3s ease;
    z-index: 1000;
  }

  .decision-sidebar.open {
    right: 0;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}
```

#### 截图位置
- `/docs/screenshots/responsive/decision-sidebar-tablet-closed.png`
- `/docs/screenshots/responsive/decision-sidebar-tablet-open.png`

---

### ✅ T182: AgentListView 和 AgentGraphView 响应式断点

**测试目标:** 确保Agent视图在不同屏幕尺寸下正确适配

#### 测试步骤 - AgentListView

1. **移动端 (< 640px)**
   - [ ] 单列布局
   - [ ] 紧凑卡片样式
   - [ ] 隐藏次要信息
   - [ ] 点击展开查看完整详情

2. **平板 (641px - 1024px)**
   - [ ] 双列布局（竖屏）或三列布局（横屏）
   - [ ] 卡片显示更多信息
   - [ ] 悬停效果正常

3. **桌面 (> 1024px)**
   - [ ] 三列或四列网格布局
   - [ ] 完整卡片信息显示
   - [ ] 悬停动画和交互增强

#### 测试步骤 - AgentGraphView

1. **移动端 (< 640px)**
   - [ ] 显示提示："请在更大屏幕上查看图形视图"
   - [ ] 或切换为简化版线性流程图
   - [ ] 提供"切换到列表视图"按钮

2. **平板 (641px - 1024px)**
   - [ ] 显示简化图形（节点较大，连线更粗）
   - [ ] 支持缩放和平移
   - [ ] 节点文字可读（至少12px）

3. **桌面 (> 1024px)**
   - [ ] 完整图形视图
   - [ ] 所有交互功能可用
   - [ ] 自动布局优化

#### 预期断点配置

```typescript
// responsive.config.ts
export const BREAKPOINTS = {
  mobile: { max: 640 },
  tablet: { min: 641, max: 1024 },
  desktop: { min: 1025 },
};

export const LAYOUT_CONFIG = {
  mobile: {
    columns: 1,
    cardSize: 'compact',
    showGraph: false,
  },
  tablet: {
    columns: 2,
    cardSize: 'medium',
    showGraph: 'simplified',
  },
  desktop: {
    columns: 3,
    cardSize: 'full',
    showGraph: true,
  },
};
```

---

## 自动化测试脚本

### Playwright 响应式测试

创建 `frontend/tests/responsive.spec.ts`:

```typescript
import { test, expect, devices } from '@playwright/test';

// 测试移动端布局
test.describe('Mobile Layout', () => {
  test.use({ ...devices['iPhone 12'] });

  test('VisualizationPanel should display in single column', async ({ page }) => {
    await page.goto('http://localhost:12000/visualization');

    const panel = page.locator('.visualization-panel');
    await expect(panel).toHaveCSS('flex-direction', 'column');

    const cards = page.locator('.agent-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const width = await card.evaluate(el => el.getBoundingClientRect().width);
      const viewportWidth = page.viewportSize()!.width;

      expect(width).toBeGreaterThan(viewportWidth * 0.9); // 至少90%宽度
    }
  });
});

// 测试平板布局
test.describe('Tablet Layout', () => {
  test.use({ ...devices['iPad'] });

  test('DecisionSidebar should slide in from right', async ({ page }) => {
    await page.goto('http://localhost:12000/visualization');

    const sidebar = page.locator('.decision-sidebar');

    // 初始状态：隐藏
    await expect(sidebar).toHaveCSS('right', /^-\d+px$/);

    // 点击按钮打开
    await page.click('[data-testid="open-decisions-btn"]');

    // 动画后：可见
    await page.waitForTimeout(350); // 等待动画完成
    await expect(sidebar).toHaveCSS('right', '0px');

    // 检查遮罩层
    const overlay = page.locator('.sidebar-overlay');
    await expect(overlay).toBeVisible();

    // 点击遮罩关闭
    await overlay.click();
    await page.waitForTimeout(350);
    await expect(sidebar).toHaveCSS('right', /^-\d+px$/);
  });
});
```

### 运行测试

```bash
# 安装依赖
npm install --save-dev @playwright/test

# 运行响应式测试
npx playwright test tests/responsive.spec.ts

# 生成截图对比
npx playwright test --update-snapshots
```

---

## 浏览器兼容性测试

### 必测浏览器

| 浏览器 | 最低版本 | 测试设备 | 优先级 |
|-------|---------|---------|--------|
| Chrome | 90+ | 桌面 + 移动 | 🔴 高 |
| Safari | 14+ | iOS + macOS | 🔴 高 |
| Firefox | 88+ | 桌面 | 🟡 中 |
| Edge | 90+ | 桌面 | 🟡 中 |
| Samsung Internet | 14+ | Android | 🟢 低 |

### 测试清单

- [ ] CSS Grid 和 Flexbox 布局正常
- [ ] CSS 变量（自定义属性）生效
- [ ] 动画和过渡效果流畅
- [ ] 触摸事件响应
- [ ] WebSocket 连接稳定
- [ ] 字体加载和回退正确

---

## 性能基准

### 移动端性能目标

- **首次内容绘制 (FCP)**: < 1.5s
- **最大内容绘制 (LCP)**: < 2.5s
- **首次输入延迟 (FID)**: < 100ms
- **累积布局偏移 (CLS)**: < 0.1
- **滚动帧率**: ≥ 60fps

### 性能测试工具

```bash
# Lighthouse 移动端审计
npx lighthouse http://localhost:12000/visualization \
  --emulated-form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=html \
  --output-path=./lighthouse-mobile-report.html

# Bundle 大小分析
cd frontend && npm run build -- --analyze
```

---

## 无障碍 (a11y) 测试

### 移动端特定检查

- [ ] 触摸目标至少 44x44px
- [ ] 文字对比度至少 4.5:1
- [ ] 支持屏幕阅读器
- [ ] 表单输入有清晰标签
- [ ] 焦点指示器可见
- [ ] 支持缩放（不禁用 user-scalable）

### 自动化检查

```bash
# axe-core 无障碍审计
npm install --save-dev @axe-core/playwright
npx playwright test tests/a11y.spec.ts
```

---

## 常见问题排查

### 问题 1: 移动端横向滚动

**原因:** 子元素宽度超出容器

**解决方案:**
```css
body {
  overflow-x: hidden;
}

.container {
  max-width: 100vw;
  overflow-x: hidden;
}
```

### 问题 2: 触摸延迟 (300ms delay)

**原因:** iOS Safari 默认双击缩放延迟

**解决方案:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
```

```css
button {
  touch-action: manipulation;
}
```

### 问题 3: 固定定位元素在移动端滚动时抖动

**原因:** iOS Safari 滚动优化问题

**解决方案:**
```css
.fixed-element {
  position: fixed;
  transform: translateZ(0); /* 启用硬件加速 */
  -webkit-transform: translateZ(0);
}
```

---

## 测试报告模板

```markdown
## 响应式测试报告

**测试日期:** YYYY-MM-DD
**测试人员:** [姓名]
**测试版本:** [Git commit hash]

### 测试设备

| 设备 | 操作系统 | 浏览器 | 结果 |
|-----|---------|--------|------|
| iPhone 12 Pro | iOS 16 | Safari | ✅ 通过 |
| iPad Air | iPadOS 16 | Safari | ✅ 通过 |
| Samsung Galaxy S21 | Android 12 | Chrome | ⚠️ 轻微问题 |
| Desktop | Windows 11 | Chrome | ✅ 通过 |

### 发现的问题

1. **问题描述:** [详细描述]
   - **严重程度:** 🔴 高 / 🟡 中 / 🟢 低
   - **复现步骤:** [步骤]
   - **截图:** [链接]
   - **建议修复:** [方案]

### 性能指标

| 设备类型 | FCP | LCP | FID | CLS |
|---------|-----|-----|-----|-----|
| 移动端 | 1.2s | 2.1s | 80ms | 0.08 |
| 平板 | 0.9s | 1.8s | 60ms | 0.05 |
| 桌面 | 0.6s | 1.2s | 40ms | 0.03 |

### 总体评估

✅ 通过 / ⚠️ 有问题但可发布 / ❌ 阻塞问题

### 备注

[其他说明]
```

---

## 持续集成 (CI) 集成

### GitHub Actions 配置

创建 `.github/workflows/responsive-tests.yml`:

```yaml
name: Responsive Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run responsive tests
        run: npx playwright test tests/responsive.spec.ts

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results
          path: test-results/
```

---

## 参考资源

- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/responsive-design)
- [MDN - Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google Web Fundamentals - Responsive Web Design Basics](https://developers.google.com/web/fundamentals/design-and-ux/responsive)
- [Can I Use - Browser Support Tables](https://caniuse.com/)

---

**最后更新:** 2025-10-30
