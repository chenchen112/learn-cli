# Learn CLI

一个用于学习 CLI 工具开发的脚手架项目，支持创建和**升级**不同类型的 JavaScript/Node.js 模板。

## 功能特性

- 🚀 快速创建 JavaScript/Node.js 项目模板
- � **模板版本管理与增量升级** — 创建的项目可检测并更新到最新模板版本
- �📝 支持多种模板类型（基础 JS、Node 模块、CLI 工具）
- 🔍 **智能差异对比** — 检测用户是否修改过文件，提供 diff 查看
- 🎨 美观的命令行界面和进度指示
- ⚡ 支持文件覆盖保护
- 🔧 基于 Commander.js 的完整 CLI 解决方案

## 安装

### 全局安装

```bash
npm install -g .
# 或使用 pnpm
pnpm install -g .
```

### 本地开发使用

```bash
# 安装依赖
pnpm install

# 直接运行
node bin/index.js
```

## 使用方法

### create — 创建新项目

```bash
learn-cli create
# 或使用别名
learn-cli init
```

交互式选择模板类型后，会在当前目录生成模板文件以及 `.learn-cli.json` 元信息文件（记录模板名、版本号等，用于后续升级）。

#### 强制覆盖现有文件

```bash
learn-cli create --force
# 或
learn-cli create -f
```

### update — 升级项目模板

> ⚠️ 需要在由 `learn-cli create` 生成的项目目录中运行（需包含 `.learn-cli.json`）

```bash
# 仅检查是否有新版本可用（不执行更新）
learn-cli update --check

# 执行升级（交互式确认）
learn-cli update

# 强制跳过确认，直接覆盖未修改的文件
learn-cli update -f
```

#### 升级流程说明

1. 读取 `.learn-cli.json` 获取当前模板名称和版本号
2. 从模板注册表拉取最新版本信息，展示 **changelog**
3. 分析变更内容：
   - 🆕 **新增文件** — 直接创建
   - 📝 **变更文件** — 检测用户是否手动修改过
     - 未修改 → 直接覆盖为新版
     - 已修改 → 提供三种选择：**覆盖 / 保留 / 查看差异**
4. 更新 `.learn-cli.json` 中的版本号

## 模板类型与版本

| 模板          | 最新版本 | 说明                                                       |
| ------------- | -------- | ---------------------------------------------------------- |
| `basic-js`    | v1.2.0   | 基础 JavaScript 模板，含 JSDoc 注释、工具函数、ESLint 配置 |
| `node-module` | v1.1.0   | Node.js 模块模板，继承 EventEmitter，支持事件监听          |
| `cli-tool`    | v1.1.0   | CLI 工具模板，集成 commander.js 命令行框架                 |

每个模板维护多版本历史，支持跨版本增量升级（如 v1.0.0 → v1.2.0）。

## 项目结构

```
learn-cli/
├── bin/
│   └── index.js              # CLI 入口点（统一路由 create / update）
├── scripts/
│   ├── create.js             # create 命令逻辑
│   ├── update.js             # update 命令逻辑（版本检测 + 智能合并）
│   └── templates/
│       └── versions.js       # 模板版本注册中心（文件清单 + changelog）
├── package.json              # 项目配置
└── README.md                 # 项目文档
```

### 生成项目的结构示例（以 basic-js 为例）

```
my-project/
├── output.js                  # 主文件
├── utils.js                   # 工具函数（v1.1.0 新增）
├── .eslintrc.cjs              # ESLint 配置（v1.2.0 新增）
└── .learn-cli.json            # 元信息（模板名、版本、生成时间）
```

## 开发

### 依赖管理

项目使用 pnpm 作为包管理器：

```bash
# 安装依赖
pnpm install

# 添加新依赖
pnpm add <package-name>

# 添加开发依赖
pnpm add -D <package-name>
```

### 如何添加新模板或新版本

编辑 [scripts/templates/versions.js](scripts/templates/versions.js)，在 `TEMPLATE_REGISTRY` 中添加或更新模板定义：

```js
"my-template": {
  latest: "1.0.0",
  versions: {
    "1.0.0": {
      files: {
        "index.js": `// 模板内容...`,
      },
      changelog: "- 初始版本",
    },
  },
},
```

然后在 [scripts/create.js](scripts/create.js) 的 inquirer choices 中加入模板名称即可。

### 测试

```bash
# 运行测试（待实现）
npm test
```

## 工作流程

```mermaid
flowchart TD
    A["🖥️ 用户运行 learn-cli"] --> B{选择命令}

    B -->|create / init| C["选择模板类型"]
    C --> D["拉取最新版本模板"]
    D --> E["生成文件到当前目录"]
    E --> F["写入 .learn-cli.json<br/>（记录模板名+版本号）"]
    F --> G["✅ 项目创建完成"]

    B -->|update| H{存在 .learn-cli.json?}
    H -- 否| I["⚠️ 提示: 非脚手架项目"]
    H -- 是| J["读取元信息<br/>获取当前模板名+版本"]
    J --> K{"对比模板注册表<br/>检查是否有新版本"}
    K -- 已是最新| L["✅ 提示: 无需更新"]
    K -- 有新版本| M["展示 changelog + 更新计划"]
    M --> N{用户确认?}
    N -- 取消| O["❌ 取消更新"]
    N -- 确认| P["遍历变更文件"]
    P --> Q{"文件类型?"}
    Q -- 🆕 新增| R["直接创建文件"]
    Q -- 📝 变更| S{"用户是否修改过?"}
    S -- 未修改| T["直接覆盖为新版"]
    S -- 已修改| U["交互选择: 覆盖/保留/查看diff"]
    R --> V["更新 .learn-cli.json 版本号"]
    T --> V
    U --> V
    V --> W["✅ 升级完成"]

    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style W fill:#c8e6c9
    style I fill:#fff3e0
    style L fill:#c8e6c9
    style O fill:#ffcdd2
```

## 技术栈

- **Commander.js** — 命令行界面框架
- **Chalk** — 终端字符串样式
- **Inquirer.js** — 交互式命令行界面
- **Ora** — 优雅的终端微调器
- **fs-extra** — 增强的文件系统操作
