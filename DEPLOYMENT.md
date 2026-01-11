# 部署指南

## 部署到 Vercel

### 1. 准备 GitHub 仓库

#### 1.1 初始化 Git（如果还未初始化）
```bash
git init
git add .
git commit -m "Initial commit: eFootball Immersive Web"
```

#### 1.2 创建 GitHub 仓库
1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库名称（如：`efootball-immersive-web`）
4. 选择 Public 或 Private
5. **不要**勾选 "Initialize this repository with a README"（因为本地已有文件）
6. 点击 "Create repository"

## 环境变量
```bash
在 Vercel 项目 Settings → Environment Variables 添加：
git branch -M main
- 服务端（推荐）：
	- `DOUBAO_API_KEY`（必填，用于 Serverless Function 代理 Ark）
	- `DOUBAO_BASE_URL`（可选，默认 `https://ark.cn-beijing.volces.com/api/v3`）
- 前端（可选，仅用于本地直连 Ark）：
	- `VITE_DOUBAO_API_KEY`
	- `VITE_DOUBAO_BASE_URL`
	- `VITE_DOUBAO_MODEL`
### 2. 部署到 Vercel
生产环境建议仅配置服务端变量，避免在浏览器暴露密钥。
#### 2.1 导入项目
1. 访问 [Vercel](https://vercel.com) 并登录（可使用 GitHub 账号登录）
2. 点击 "Add New..." → "Project"
项目内置 `vercel.json`：
4. 点击 "Import"

#### 2.2 配置环境变量（重要！）
在 "Configure Project" 页面：

1. 展开 "Environment Variables" 部分
2. 添加以下环境变量：
		{
			"source": "/api/(.*)",
			"destination": "/api/$1"
		},

| Name | Value |
|------|-------|
| `VITE_DOUBAO_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` |
| `VITE_DOUBAO_API_KEY` | `你的豆包API密钥` |
| `VITE_DOUBAO_MODEL` | `doubao-seed-1-8-251228` |

3. 确保环境变量应用于所有环境（Production、Preview、Development）
这确保 `/api/*` 不会被重写到前端 SPA，而是由 Serverless Function 处理。
#### 2.3 部署设置
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
已内置函数：`api/doubao/[...path].js`
- **Install Command**: `npm install`
它会将 `/api/doubao/responses` 等路径代理到 Ark，并在服务端注入 `Authorization: Bearer DOUBAO_API_KEY`，从而避免 CORS 与密钥泄露。
#### 2.4 开始部署
点击 "Deploy" 按钮，Vercel 将自动构建并部署你的项目。

前端默认优先使用代理（`VITE_DOUBAO_PROXY_BASE=/api/doubao`），当存在 `/api/doubao` 时，浏览器不再发送 `Authorization`。

#### 访问你的网站
部署完成后，Vercel 会提供一个 URL（如：`https://efootball-immersive-web.vercel.app`）

#### 更新环境变量
如需修改环境变量：
1. 进入 Vercel 项目控制台
2. 点击 "Settings" → "Environment Variables"
3. 修改或添加变量
4. 点击 "Save"
5. 在 "Deployments" 页面重新部署

#### 自动部署
配置完成后，每次向 GitHub 推送代码，Vercel 都会自动触发部署：
```bash
git add .
git commit -m "Update: 描述你的更改"
git push
```

## 安全最佳实践

### ✅ 已实现的安全措施
- `.gitignore` 已配置，`.env.local` 不会被提交到 GitHub
- API Key 存储在 Vercel 环境变量中，不在代码仓库中
- 代码通过 `import.meta.env` 安全读取环境变量

### ⚠️ 注意事项
1. **永远不要**将 `.env.local` 文件提交到 GitHub
2. **永远不要**在代码中硬编码 API Key
3. 定期轮换你的 API Key
4. 只给必要的人员提供 Vercel 项目访问权限

### 本地开发
1. 复制 `.env.example` 为 `.env.local`
2. 在 `.env.local` 中填入你的 API Key
3. 运行 `npm run dev` 开始开发

```bash
cp .env.example .env.local
# 编辑 .env.local，填入真实的 API Key
npm run dev
```

## 故障排除

### 构建失败
- 检查 `package.json` 中的依赖是否正确
- 确保所有必需的文件都已提交到 GitHub

### API 调用失败
- 检查 Vercel 环境变量是否正确配置
- 确认 API Key 是否有效
- 检查浏览器控制台的错误信息

### 页面 404
- 确认 `vercel.json` 文件存在且配置正确
- 检查 `dist` 目录是否正确生成

## 更多资源
- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [GitHub 文档](https://docs.github.com)
