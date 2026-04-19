const fs = require("fs-extra");
const path = require("path");
const {
  getLatestVersion,
  getTemplateFiles,
} = require("./templates/versions.js");

module.exports = async function create(options = {}) {
  const chalk = (await import("chalk")).default;
  const inquirer = (await import("inquirer")).default;
  const ora = (await import("ora")).default;

  await init(options, chalk, inquirer, ora);
};

function delay(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time);
  });
}

async function init(options, chalk, inquirer, ora) {
  try {
    const { choose } = await inquirer.prompt([
      {
        name: "choose",
        type: "select",
        message: "请选择要创建的模板类型",
        choices: ["basic-js", "node-module", "cli-tool"],
      },
    ]);

    const latestVersion = getLatestVersion(choose);
    if (!latestVersion) {
      throw new Error(`未找到模板: ${choose}`);
    }

    const templateData = getTemplateFiles(choose, latestVersion);
    if (!templateData) {
      throw new Error(`无法获取模板 ${choose}@${latestVersion}`);
    }

    const waiting = ora(`正在创建 ${choose} 项目 (v${latestVersion})...`);
    waiting.start();

    await delay(500);

    const targetDir = process.cwd();
    const generatedFiles = [];
    const overwrittenFiles = [];

    for (const [fileName, content] of Object.entries(templateData.files)) {
      const filePath = path.join(targetDir, fileName);

      if ((await fs.pathExists(filePath)) && !options.force) {
        waiting.fail(`文件 ${fileName} 已存在，请使用 --force 选项覆盖`);
        return;
      }

      await fs.writeFile(filePath, content);

      if ((await fs.pathExists(filePath)) && options.force) {
        overwrittenFiles.push(fileName);
      }
      generatedFiles.push(fileName);
    }

    const metaInfo = {
      templateName: choose,
      templateVersion: latestVersion,
      createdAt: new Date().toISOString(),
      files: generatedFiles,
      cliVersion: require("../package.json").version,
    };

    const metaPath = path.join(targetDir, ".learn-cli.json");
    if (!(await fs.pathExists(metaPath)) || options.force) {
      await fs.writeJson(metaPath, metaInfo, { spaces: 2 });
      if (!generatedFiles.includes(".learn-cli.json")) {
        generatedFiles.push(".learn-cli.json");
      }
    }

    waiting.succeed();
    console.log(
      chalk.green(`✅ 成功创建 ${chalk.blue.underline.bold(choose)} 项目!`),
    );
    console.log(chalk.gray(`📦 模板版本: v${latestVersion}`));
    console.log(chalk.gray(`📁 生成文件:`));
    generatedFiles.forEach((f) => {
      console.log(chalk.gray(`   - ${f}`));
    });

    if (overwrittenFiles.length > 0) {
      console.log(chalk.yellow(`\n⚠️  以下文件已被覆盖:`));
      overwrittenFiles.forEach((f) => {
        console.log(chalk.yellow(`   - ${f}`));
      });
    }

    console.log(
      chalk.cyan(
        `\n💡 提示: 运行 ${chalk.bold("npx learn-cli update")} 可检查模板更新`,
      ),
    );
  } catch (error) {
    console.error(chalk.red("❌ 创建项目失败:"), error.message);
    throw error;
  }
}
