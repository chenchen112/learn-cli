const fs = require("fs-extra");
const path = require("path");
const {
  getLatestVersion,
  getTemplateFiles,
  getAllVersions,
  compareVersions,
  getChangelog,
} = require("./templates/versions.js");

module.exports = async function update(options = {}) {
  const chalk = (await import("chalk")).default;
  const inquirer = (await import("inquirer")).default;
  const ora = (await import("ora")).default;

  await runUpdate(options, chalk, inquirer, ora);
};

async function runUpdate(options, chalk, inquirer, ora) {
  const targetDir = process.cwd();
  const metaPath = path.join(targetDir, ".learn-cli.json");

  if (!(await fs.pathExists(metaPath))) {
    console.log(
      chalk.yellow(
        "⚠️  当前目录不是由 learn-cli 创建的项目（未找到 .learn-cli.json）",
      ),
    );
    console.log(chalk.gray('   请先运行 "learn-cli create" 创建项目'));
    return;
  }

  const metaInfo = await fs.readJson(metaPath);
  const { templateName, templateVersion } = metaInfo;

  const loading = ora(`正在检查 ${templateName} 模板更新...`).start();

  await delay(300);

  const latestVersion = getLatestVersion(templateName);

  if (!latestVersion) {
    loading.fail(`未知模板: ${templateName}`);
    return;
  }

  if (compareVersions(latestVersion, templateVersion) <= 0) {
    loading.succeed();
    console.log(chalk.green(`\n✅ 你的项目已是最新版本!`));
    console.log(
      chalk.gray(
        `   当前版本: v${templateVersion} | 最新版本: v${latestVersion}`,
      ),
    );
    return;
  }

  loading.succeed();
  console.log(
    chalk.cyan(
      `\n🔄 发现新版本: ${chalk.red("v" + templateVersion)} → ${chalk.green("v" + latestVersion)}`,
    ),
  );

  const changelog = getChangelog(templateName, templateVersion, latestVersion);
  if (changelog) {
    console.log(chalk.gray("\n📋 更新内容:"));
    console.log(chalk.gray("   " + changelog.split("\n").join("\n   ")));
  }

  if (options.check) {
    console.log(chalk.yellow('\n💡 使用 "learn-cli update" 执行升级'));
    return;
  }

  const allVersions = getAllVersions(templateName);
  const updatePlan = buildUpdatePlan(
    templateName,
    templateVersion,
    latestVersion,
    allVersions,
    targetDir,
  );

  if (
    updatePlan.newFiles.length === 0 &&
    updatePlan.changedFiles.length === 0 &&
    updatePlan.removedFiles.length === 0
  ) {
    console.log(chalk.green("\n✅ 所有文件已是最新的"));
    return;
  }

  console.log(chalk.bold("\n📦 更新计划:"));

  if (updatePlan.newFiles.length > 0) {
    console.log(chalk.green("\n  🆕 新增文件:"));
    updatePlan.newFiles.forEach((f) => console.log(chalk.green(`     + ${f}`)));
  }

  if (updatePlan.changedFiles.length > 0) {
    console.log(chalk.yellow("\n  📝 变更文件:"));
    updatePlan.changedFiles.forEach((f) => {
      const status = f.userModified
        ? chalk.red("(用户已修改)")
        : chalk.gray("(未修改)");
      console.log(chalk.yellow(`     ~ ${f.fileName} ${status}`));
    });
  }

  if (updatePlan.removedFiles.length > 0) {
    console.log(chalk.red("\n  🗑️  已移除的文件（旧版有但新版没有）:"));
    updatePlan.removedFiles.forEach((f) =>
      console.log(chalk.red(`     - ${f}`)),
    );
  }

  if (!options.force) {
    console.log("");
    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "是否执行更新?",
        default: true,
      },
    ]);
    if (!confirm) {
      console.log(chalk.gray("已取消更新"));
      return;
    }
  }

  await executeUpdate(
    updatePlan,
    templateName,
    latestVersion,
    metaPath,
    metaInfo,
    chalk,
    ora,
    options,
  );
}

function buildUpdatePlan(
  templateName,
  fromVersion,
  toVersion,
  allVersions,
  targetDir,
) {
  const newFiles = [];
  const changedFiles = [];
  const removedFiles = [];
  const existingFileHashes = {};

  for (const version of allVersions) {
    if (compareVersions(version, fromVersion) <= 0) continue;
    if (compareVersions(version, toVersion) > 0) break;

    const templateData = getTemplateFiles(templateName, version);
    if (!templateData) continue;

    for (const [fileName, content] of Object.entries(templateData.files)) {
      const filePath = path.join(targetDir, fileName);
      const exists = fs.pathExistsSync(filePath);

      if (!exists) {
        if (!newFiles.includes(fileName)) {
          newFiles.push(fileName);
        }
      } else {
        if (!existingFileHashes[fileName]) {
          const currentContent = fs.readFileSync(filePath, "utf-8");
          const originalData = getTemplateFiles(templateName, fromVersion);
          const originalContent = originalData?.files?.[fileName] || "";

          const userModified = currentContent !== originalContent;
          existingFileHashes[fileName] = true;

          changedFiles.push({
            fileName,
            userModified,
            currentContent,
            newContent: content,
          });
        }
      }
    }
  }

  const fromData = getTemplateFiles(templateName, fromVersion);
  const toData = getTemplateFiles(templateName, toVersion);

  if (fromData && toData) {
    for (const fileName of Object.keys(fromData.files)) {
      if (!(fileName in toData.files)) {
        removedFiles.push(fileName);
      }
    }
  }

  return { newFiles, changedFiles, removedFiles };
}

async function executeUpdate(
  updatePlan,
  templateName,
  newVersion,
  metaPath,
  metaInfo,
  chalk,
  ora,
  options,
) {
  const waiting = ora("正在更新文件...").start();
  let updatedCount = 0;
  let skippedCount = 0;

  for (const fileName of updatePlan.newFiles) {
    const templateData = getTemplateFiles(templateName, newVersion);
    if (templateData?.files?.[fileName]) {
      const filePath = path.join(process.cwd(), fileName);
      await fs.writeFile(filePath, templateData.files[fileName]);
      updatedCount++;
    }
  }

  for (const file of updatePlan.changedFiles) {
    if (file.userModified && !options.force) {
      const inquirer = (await import("inquirer")).default;

      const { action } = await inquirer.prompt([
        {
          name: "action",
          type: "select",
          message: `文件 ${chalk.yellow(file.fileName)} 已被你修改过，如何处理?`,
          choices: [
            {
              name: "🔴 覆盖（使用新版模板，丢弃我的修改）",
              value: "overwrite",
            },
            { name: "🟢 保留（保持我的修改不变）", value: "skip" },
            { name: "🔵 查看差异后决定", value: "diff" },
          ],
        },
      ]);

      if (action === "diff") {
        showDiff(file.fileName, file.currentContent, file.newContent, chalk);
        const { finalAction } = await inquirer.prompt([
          {
            name: "finalAction",
            type: "select",
            message: "选择操作:",
            choices: [
              { name: "覆盖为新版", value: "overwrite" },
              { name: "保留当前版本", value: "skip" },
            ],
          },
        ]);
        if (finalAction === "overwrite") {
          await fs.writeFile(
            path.join(process.cwd(), file.fileName),
            file.newContent,
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else if (action === "overwrite") {
        await fs.writeFile(
          path.join(process.cwd(), file.fileName),
          file.newContent,
        );
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      await fs.writeFile(
        path.join(process.cwd(), file.fileName),
        file.newContent,
      );
      updatedCount++;
    }
  }

  metaInfo.templateVersion = newVersion;
  metaInfo.updatedAt = new Date().toISOString();
  await fs.writeJson(metaPath, metaInfo, { spaces: 2 });

  waiting.succeed();
  console.log(chalk.green(`\n✅ 更新完成!`));
  console.log(chalk.gray(`   已更新: ${updatedCount} 个文件`));
  if (skippedCount > 0) {
    console.log(chalk.yellow(`   已跳过: ${skippedCount} 个文件`));
  }
  console.log(chalk.gray(`   当前版本: v${newVersion}`));
}

function showDiff(fileName, oldContent, newContent, chalk) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const maxLines = Math.max(oldLines.length, newLines.length);

  console.log(chalk.bold.cyan(`\n  📄 差异对比: ${fileName}\n`));
  console.log(chalk.gray("  " + "-".repeat(60)));

  for (let i = 0; i < Math.min(maxLines, 30); i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine !== newLine) {
      if (oldLine !== undefined) {
        console.log(chalk.red(`  - ${oldLine}`));
      }
      if (newLine !== undefined) {
        console.log(chalk.green(`  + ${newLine}`));
      }
    } else if (oldLine !== undefined) {
      console.log(chalk.gray(`    ${oldLine}`));
    }
  }

  if (maxLines > 30) {
    console.log(chalk.gray("  ... (省略更多行)"));
  }
  console.log(chalk.gray("  " + "-".repeat(60)));
}

function delay(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
