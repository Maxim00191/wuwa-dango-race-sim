# 鸣潮二周年团子赛跑模拟器

[English](./README.md)

这是一个面向《鸣潮》二周年 `小团快跑·锦标赛` 活动的网页版同人模拟器。

你可以在这里自由搭配 6 团子阵容，逐步观察比赛过程，复盘锦标赛流程，并通过大规模蒙特卡洛模拟评估阵容强度、夺冠概率与名次走势。

> 本项目的官方站点为 [wuwadango.com](https://wuwadango.com)。

## 功能亮点

- 普通竞速：支持单场比赛的逐动作推进、整回合播放、自动播放、瞬间结算，以及带动画的棋盘与实时排名展示。
- 完整二轮战流程：先跑预赛，再基于预赛结果直接进入决赛，或者手动重排决赛发车顺位做自定义验证。
- 独立分析工作区：蒙特卡洛批量模拟结束后，可在专门的分析界面查看总览、条件分析与锦标赛洞察。
- 更灵活的蒙特卡洛工具：内置 `100`、`1,000`、`10,000` 次预设批量，也支持自定义运行次数、实时进度显示与中途取消。
- 更好用的阵容配置体验：可按属性或配队分组挑选角色，并持久化保存当前阵容、主题和语言偏好。

## 键盘快捷键

- `Enter`：可开局时启动当前比赛；否则直接将整场比赛瞬间结算。
- `Right Arrow`：推进下一步动作。
- `Ctrl + Right Arrow`：播放当前整回合。
- `Space`：切换自动播放。

## 技术栈

本项目是纯前端单页应用（SPA），主要使用：

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Cloudflare Vite 插件与 Wrangler（用于本地预览和部署）

## 本地开发

请先安装 Node.js `20+`。

```bash
npm install
npm run dev
```

可用脚本如下：

- `npm run dev`：启动 Vite 开发服务器。
- `npm run lint`：执行 ESLint，且不允许 warning。
- `npm run typecheck`：执行 TypeScript 项目级类型检查。
- `npm run check`：一次性执行 lint 和 typecheck。
- `npm run build`：在 lint 与 typecheck 通过后构建生产版本。
- `npm run preview`：先构建，再通过 Wrangler 在本地预览 Cloudflare 产物。
- `npm run deploy`：构建并部署到 Cloudflare。

## Cloudflare 预览与部署

仓库已经包含 `wrangler.jsonc` 和 Cloudflare Vite 插件，生产流程默认按 Cloudflare 资产托管和 SPA fallback 的方式配置。

常见本地预览流程：

```bash
npm run build
npm run preview
```

准备发布时，先确认 Wrangler 已完成认证，然后执行：

```bash
npm run deploy
```

## 项目结构

- `src/components`：主界面、比赛控制区、配置面板与数据分析面板。
- `src/components/analysis`：蒙特卡洛结果分析相关视图。
- `src/services`：模拟引擎、锦标赛流程、棋盘初始化与分析辅助逻辑。
- `src/hooks`：可复用状态逻辑，包括本地持久化与 UI 偏好。
- `src/i18n`：多语言字典与翻译辅助函数。
- `src/constants`：ID、属性、棋盘元数据等静态配置。
- `src/types`：共享的 TypeScript 领域类型。

## 免责声明

本项目为非官方玩家同人作品，与库洛游戏（Kuro Games）不存在官方隶属、赞助或背书关系。

模拟结果基于项目内重构的规则与随机数计算得出。文档和界面中展示的仅为统计估算，不代表游戏内绝对结果。

## 开源协议

本项目基于 MIT License 开源，详见 `LICENSE`。