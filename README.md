# Learn CLI

一个用于学习 CLI 工具开发的脚手架项目，支持创建不同类型的 JavaScript/Node.js 模板文件。

## 功能特性

- 🚀 快速创建 JavaScript/Node.js 项目模板
- 📝 支持多种模板类型（基础 JS、Node 模块、CLI 工具）
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

### 创建新文件

```bash
learn-cli create
# 或使用别名
learn-cli init
```

### 强制覆盖现有文件

```bash
learn-cli create --force
# 或
learn-cli create -f
```

## 模板类型

CLI 工具支持以下模板类型：

1. **basic-js** - 基础 JavaScript 模板
2. **node-module** - Node.js 模块模板
3. **cli-tool** - CLI 工具模板

## 项目结构

```
learn-cli/
├── bin/
│   └── index.js          # CLI 入口点
├── scripts/
│   └── create.js         # 创建命令逻辑
├── package.json          # 项目配置
├── README.md             # 项目文档
└── pnpm-lock.yaml        # 依赖锁定文件
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

### 测试

```bash
# 运行测试（待实现）
npm test
```

## 技术栈

- **Commander.js** - 命令行界面框架
- **Chalk** - 终端字符串样式
- **Inquirer.js** - 交互式命令行界面
- **Ora** - 优雅的终端微调器
- **fs-extra** - 增强的文件系统操作

## 许可证

ISC License