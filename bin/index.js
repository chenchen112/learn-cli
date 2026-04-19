#! /usr/bin/env node

const commander = require("commander");
const chalk = require("chalk");

const program = new commander.Command();

const createHandler = require("../scripts/create.js");
const updateHandler = require("../scripts/update.js");

async function main() {
  try {
    console.log("------------cli start------------");

    program
      .name("learn-cli")
      .description("一个学习用的脚手架工具")
      .version("1.0.0");

    program
      .command("create", { isDefault: true })
      .alias("init")
      .description("新建一个项目")
      .option("-f,--force", "如果有就覆盖")
      .action(async (options) => {
        await createHandler(options);
      });

    program
      .command("update")
      .description("更新项目模板到最新版本")
      .option("--check", "仅检查是否有更新")
      .option("-f,--force", "跳过确认直接更新")
      .action(async (options) => {
        await updateHandler(options);
      });

    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
  }
}

main();
