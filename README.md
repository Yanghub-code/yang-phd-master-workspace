# Yang · PhD Master Workspace

面向博士阶段研究与日常执行的个人工作台。它把项目、日计划、任务、日程、实验数据、文献、代码仿真、沟通留痕与复盘放在同一套可回看的记录系统里。

## 核心工作流

- **日计划 → 任务 → 时间块**：新建一条日计划会同时建立可编辑的任务和日程时间块；三者会联动更新，排错后可编辑或撤回时间块，不会丢掉原任务。
- **按日期回看**：右上角工作日历会切换工作台到所选日期；历史日期展示对应的任务、日程、工作时长和科研记录。
- **项目研究档案**：以项目而非每天新建的任务为主索引，聚合任务、实验与证据、文献、代码运行和导师/企业/合作方沟通。
- **可复现实验记录**：数据与代码运行日志可记录项目、GitHub 仓库、模块、分支/commit、配置、输入、输出、证据位置与结论，并支持原位编辑。
- **个人云端工作台**：一个私有账号可在多台电脑登录，同步同一套记录；GitHub 仓库只存放代码，不存放工作数据或密码。

## 使用方式（Windows 与 macOS）

日常使用与操作系统无关：打开已部署的网址，使用 Chrome、Edge、Safari 或其他较新的现代浏览器即可。无需安装 Node.js、Python 或本地客户端。

| 场景 | Windows | macOS |
| --- | --- | --- |
| 打开、登录、云端同步、导入/导出 JSON | 支持 | 支持 |
| 使用 GitHub 链接、查看数据/文献/仿真日志 | 支持 | 支持 |
| 选择本地文件夹自动同步 | 推荐 Chrome / Edge | 推荐 Chrome / Edge |

“本地文件夹同步”依赖浏览器的 File System Access API；Safari 通常不提供该能力。即使不使用它，云端同步与“数据管理 → 下载 JSON 备份”仍可在 Windows 和 macOS 正常使用。

### 首次启用个人账户

部署者会单独提供一次性初始化码。首次访问时，在页面中自行设置账号和密码并输入初始化码。账户建立后：

1. 当前电脑会先提示选择“使用本机记录并同步”或“改用云端记录”，不会自动覆盖已有浏览器数据；
2. 另一台电脑直接使用同一账号和密码登录；
3. 数据修改会自动同步，也可在“数据管理”手动同步或下载 JSON 备份；
4. 在不再使用的设备上，可通过“数据管理 → 退出当前设备”只退出该设备，不影响其他电脑。

密码以加盐 PBKDF2 哈希形式保存在数据库中，源代码、浏览器本地 JSON 与 GitHub 不包含密码。建议仍定期下载 JSON 备份。

## 隐私与仓库边界

- 浏览器历史本机数据键：`phd_master_workspace_merged_v1`
- 云端工作数据：部署环境的私有 D1 数据库，仅在登录后读取和写入
- 不提交：`.env*`、本地同步 JSON、浏览器数据、部署会话、密码或一次性初始化码
- `OWNER_SETUP_TOKEN` 仅作为部署环境的秘密变量设置，绝不写入仓库

## Contributor / runtime notes

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
