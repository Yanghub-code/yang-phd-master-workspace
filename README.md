# Yang · PhD Master Workspace

一个面向博士研究生的本地优先工作台，用于把日计划、项目与任务、论文推进、投稿、实验数据、文献、代码仿真、健康和复盘放在同一套系统中管理。

## 功能

- 日计划、项目看板、任务与专注计时
- 博士论文里程碑、章节进度与推进日志
- 投稿流程与推进记录
- 数据记录、文献记录、代码仿真记录
- 健康习惯、心灵关怀、导师沟通与每日复盘
- 可配置名称与字号，适配个人工作方式
- JSON 备份、导入，以及浏览器授权的本地文件夹同步

## 本地运行

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 数据与隐私

本项目不会把你的任务、实验数据或健康记录写入代码仓库。运行时数据默认保存在浏览器本地存储中；如连接本地文件夹，会写入你自行选择文件夹中的 `phd-master-workspace-data.json`。

该 JSON 文件、环境变量和部署配置均已在 `.gitignore` 中排除。提交代码前仍建议检查是否误把任何个人数据文件放入项目目录。

本地文件夹同步依赖 Chromium 浏览器的 File System Access API；Chrome 或 Edge 的支持更完整。

## 主要技术栈

- React 19 / Next.js 16 / Vinext
- Vite / Cloudflare Workers 运行时
- TypeScript

## 贡献

欢迎提交 Issue 或 Pull Request。涉及个人数据、路径或截图时，请先进行脱敏。

## 许可证

[MIT License](LICENSE)
