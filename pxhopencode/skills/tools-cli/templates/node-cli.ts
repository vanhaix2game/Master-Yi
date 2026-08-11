#!/usr/bin/env node
import { Command } from "commander";
import { input, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";

const program = new Command();

program
  .name("my-cli")
  .description("CLI tool description")
  .version("1.0.0")
  .hook("preAction", () => {
    process.on("SIGINT", () => {
      console.log("\n👋 Tạm biệt!");
      process.exit(0);
    });
  });

program
  .command("init")
  .description("Init a new project")
  .option("-n, --name <name>", "Project name")
  .option("-t, --type <type>", "Project type", "web")
  .action(async (options) => {
    const name = options.name || await input({ message: "Tên dự án:", validate: v => v.length > 0 });
    const type = options.type || await select({
      message: "Loại dự án:",
      choices: [
        { name: "Web", value: "web" },
        { name: "Game", value: "game" },
        { name: "CLI", value: "cli" },
      ]
    });

    const spinner = ora(`Đang tạo ${name}...`).start();
    try {
      await createProject(name, type);
      spinner.succeed(chalk.green(`✅ Đã tạo ${name}`));
    } catch (err) {
      spinner.fail(chalk.red(`❌ Thất bại: ${err}`));
      process.exit(1);
    }
  });

program.parse();
