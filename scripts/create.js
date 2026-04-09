const commander = require("commander");
const fs = require("fs-extra");
const path = require("path");

const program = new commander.Command();

module.exports = async function create() {
  const chalk = (await import("chalk")).default;
  const inquirer = (await import("inquirer")).default;
  const ora = (await import("ora")).default;

  return new Promise((resolve, reject) => {
    console.log("------------create start------------");

    program
      .command("create")
      .alias("init")
      .description("新建一个 output.js 文件")
      .option("-f,--force", "如果有就覆盖")
      .action(async (options) => {
        try {
          await init(options, chalk, inquirer, ora);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

    program.parse();
  });
};

function delay(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time);
  });
}

async function init(options, chalk, inquirer, ora) {
  console.log("------------init start------------");

  try {
    const { choose } = await inquirer.prompt([
      {
        name: "choose",
        type: "list",
        message: "请选择要创建的模板类型",
        choices: ["basic-js", "node-module", "cli-tool"],
      },
    ]);

    const waiting = ora("正在创建文件...");
    waiting.start();

    await delay(500);

    const fileName = "output.js";
    const filePath = path.join(process.cwd(), fileName);

    if ((await fs.pathExists(filePath)) && !options.force) {
      waiting.fail(`文件 ${fileName} 已存在，请使用 --force 选项覆盖`);
      return;
    }

    const template = getTemplate(choose);
    await fs.writeFile(filePath, template);

    waiting.succeed();
    console.log(
      chalk.green(`✅ 成功创建 ${chalk.blue.underline.bold(fileName)} 文件!`),
    );
    console.log(chalk.gray(`📁 文件位置: ${filePath}`));
  } catch (error) {
    console.error(chalk.red("❌ 创建文件失败:"), error.message);
    throw error;
  }
}

function getTemplate(type) {
  const templates = {
    "basic-js": `// Basic JavaScript Template
console.log('Hello from ${type} template!');

module.exports = {
  greet: function() {
    return 'Hello World!';
  }
};
`,
    "node-module": `// Node.js Module Template
const path = require('path');

class MyModule {
  constructor() {
    this.name = '${type}';
  }
  
  getName() {
    return this.name;
  }
}

module.exports = MyModule;
`,
    "cli-tool": `#!/usr/bin/env node
// CLI Tool Template
const chalk = require('chalk');

console.log(chalk.green('🚀 CLI Tool Started!'));
console.log(chalk.blue('Template type: ${type}'));

// Add your CLI logic here
`,
  };

  return templates[type] || templates["basic-js"];
}
