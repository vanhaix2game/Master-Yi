class CLIError extends Error {
  constructor(message: string, public code: number = 1) {
    super(message);
    this.name = "CLIError";
  }
}

async function main() {
  try {
    await run();
  } catch (err) {
    if (err instanceof CLIError) {
      console.error(chalk.red(`❌ ${err.message}`));
      process.exit(err.code);
    }
    console.error(chalk.red(`❌ Unexpected error:`), err);
    process.exit(1);
  }
}
