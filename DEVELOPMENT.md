# 开发指南

## 项目概览

这是一个基于 React + Vite 构建的"失意者联盟"沉浸式叙事应用，模拟 2000 年代复古足球 BBS 论坛风格。

## 已完成功能

### ✅ Phase 1: 基础架构
- [x] React 18 + Vite 5 项目搭建
- [x] 复古 BBS UI 样式系统
- [x] LocalStorage 数据持久化
- [x] 数据模型（Player、ForumPost）

### ✅ Phase 2: 核心算法
- [x] 救赎值计算引擎（RedemptionEngine）
- [x] 动态舆论模型（SentimentEngine）
- [x] 叙事生成引擎（NarrativeEngine）

### ✅ Phase 3: UI 组件
- [x] 球员列表展示
- [x] 论坛帖子系统
- [x] 敌对度指示器
- [x] 评论互动（点赞/点踩/回复）

## 待开发功能

### 🔜 Phase 4: 豆包 API 集成
- [ ] Vision API - 截图识别功能
- [ ] Chat API - AI 生成评论
- [ ] 图片上传组件
- [ ] API 错误处理和重试机制

### 🔜 Phase 5: 高级功能
- [ ] 球员详情页
- [ ] 比赛历史可视化（图表）
- [ ] "点踩回击"影响救赎值
- [ ] 导出/导入存档功能
- [ ] 成就系统

## 核心文件说明

### 数据层
- `src/models/DataModels.js` - 球员和帖子数据模型
- `src/utils/storage.js` - LocalStorage 持久化管理

### 业务逻辑层
- `src/engine/GameEngine.js` - 救赎算法、舆论模型、叙事引擎

### 服务层
- `src/services/doubaoAPI.js` - 豆包 API 接口封装（待集成）

### UI 层
- `src/components/BBSComponents.jsx` - 可复用 UI 组件
- `src/App.jsx` - 主应用入口
- `src/styles/retro.css` - 复古 BBS 样式

## 数据流

```
用户上传截图
    ↓
豆包 Vision API 识别
    ↓
更新球员数据（matchData）
    ↓
RedemptionEngine 计算救赎值变化
    ↓
SentimentEngine 更新敌对度
    ↓
NarrativeEngine 生成评论
    ↓
ForumPost 展示在 UI
    ↓
用户互动（点赞/点踩/回复）
    ↓
影响后续叙事
```

## 开发调试

### 启动开发服务器
```bash
npm run dev
```

### 测试评论生成
点击"生成测试评论"按钮，会创建一条模拟评论。

### 查看 LocalStorage 数据
在浏览器控制台执行：
```javascript
// 查看球员数据
console.log(localStorage.getItem('misfit_alliance_players'))

// 查看帖子数据
console.log(localStorage.getItem('misfit_alliance_posts'))

// 清空所有数据
localStorage.clear()
```

### 修改初始数据
编辑 `src/utils/storage.js` 中的 `initializeDefaultData()` 函数。

## 豆包 API 集成步骤

### 1. 配置 API Key
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的豆包 API Key
VITE_DOUBAO_API_KEY=your_actual_api_key
```

### 2. 实现截图上传功能
在 `App.jsx` 中添加文件上传组件：
```jsx
import { recognizeScreenshot } from './services/doubaoAPI';

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  const base64 = await fileToBase64(file);
  const result = await recognizeScreenshot(base64);
  // 处理识别结果...
};
```

### 3. 集成 AI 评论生成
在比赛数据更新后调用：
```javascript
import { generateComment } from './services/doubaoAPI';

const context = {
  player,
  matchData,
  hostility,
  redemptionState: player.getRedemptionState()
};

const aiComment = await generateComment(context);
```

## 样式定制

所有样式都在 `src/styles/retro.css` 中，使用 CSS 变量便于定制：

```css
:root {
  --bg-primary: #111;        /* 主背景色 */
  --text-primary: #ddd;      /* 主文字色 */
  --text-toxic: #ff4444;     /* 攻击性评论色 */
  --text-hype: #44ff44;      /* 追捧评论色 */
  --highlight: #ffcc00;      /* 高亮色 */
}
```

## 性能优化建议

1. **限制历史记录长度**：已在 Player 模型中限制为 20 条
2. **评论分页加载**：当帖子数量超过 50 条时实现虚拟滚动
3. **图片压缩**：上传前压缩截图尺寸
4. **API 请求节流**：避免频繁调用豆包 API

## 常见问题

### Q: 为什么看不到数据？
A: 首次运行会自动创建默认球员数据，可以在控制台查看 LocalStorage。

### Q: 如何重置所有数据？
A: 在控制台执行 `localStorage.clear()` 或在设置中添加"清空存档"按钮。

### Q: 豆包 API 调用失败怎么办？
A: 系统会自动降级到本地模拟数据，不影响核心功能使用。

## 部署

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

构建产物在 `dist/` 目录，可以部署到任何静态托管服务（Vercel、Netlify、GitHub Pages 等）。

## 贡献指南

1. 功能开发请基于 `main` 分支创建特性分支
2. 提交前确保代码符合 ESLint 规范
3. 关键功能需要添加注释说明
4. UI 改动请保持复古 BBS 风格一致性
