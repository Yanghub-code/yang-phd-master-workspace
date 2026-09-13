# Yang · PhD Master Workspace

面向博士研究生的本地优先工作台，用于把日计划、项目与任务、论文推进、投稿、实验数据、文献、代码仿真、健康与复盘放在同一套系统中管理。

在线版本：[Yang · PhD Master Workspace](https://phd-master-workspace.right-dace-0278.chatgpt.site)

## 功能

- 日计划、项目看板、任务详情、专注计时与日程时间块
- 工作日历：按日期回看任务、专注、日程与科研记录
- 博士论文里程碑、章节进度与推进日志
- 投稿流程与推进记录
- 数据记录、文献记录、代码仿真与项目级关联
- 导师 / 企业 / 合作方沟通留痕、健康习惯、心灵关怀与每日复盘
- 浏览器本地保存、JSON 备份导入，以及浏览器授权的本地文件夹同步

## 本地运行

需要 Node.js 22.13 或更高版本，以及 Git。

```bash
git clone https://github.com/Yanghub-code/yang-phd-master-workspace.git
cd yang-phd-master-workspace
npm install
npx vite
```

启动后在浏览器打开终端显示的本地地址（通常是 `http://localhost:5173`）。

### Windows

在 PowerShell 中执行上面的命令即可。若要使用“本地文件夹同步”，建议用 Chrome 或 Edge，并在“数据管理”中选择例如：

```
D:\博士生工作台
```

### macOS

Intel Mac 与 Apple Silicon 均可运行；安装 Node.js 22 后执行相同命令即可。若要使用“本地文件夹同步”，建议用 Chrome 或 Edge，并在“数据管理”中选择例如：

```
~/Documents/博士生工作台
```

应用功能本身不区分 Windows 与 macOS；差异主要是本地文件夹路径和浏览器权限。当前文件夹同步依赖浏览器的 `showDirectoryPicker` 能力，若浏览器提示不支持，请使用 Chrome 或 Edge，或改用 JSON 备份。

### 生产构建

当前仓库中的 `npm run build` 是托管环境使用的 Bash 包装脚本。为兼容 Windows 与 macOS，本地可直接执行：

```bash
npx vinext build
npx vinext start
```

## 在另一台电脑继续使用

工作台数据默认保存在当前浏览器本地，并不会随 GitHub 仓库或网页自动同步。迁移步骤：

1. 原电脑进入“数据管理”，下载 JSON 备份。
2. 在新电脑打开工作台后，在同一页面导入该 JSON。
3. 如需持续备份，在新电脑重新选择本地文件夹；授权本身不会跨设备迁移。

本地同步生成的 `phd-master-workspace-data.json` 是个人数据文件，请勿提交到 GitHub。

## 数据与隐私

本项目不会把任务、实验数据、健康记录或你选定的本地文件夹路径写入源码仓库。浏览器数据、同步 JSON、环境变量与部署配置均已排除在公开仓库之外。

## 技术栈

- React 19 / Next.js 16 / Vinext
- Vite / Cloudflare Workers 运行时
- TypeScript

## 许可证

[MIT License](LICENSE)
