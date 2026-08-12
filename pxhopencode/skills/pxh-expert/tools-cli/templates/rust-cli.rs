use clap::{Parser, Subcommand};
use indicatif::{ProgressBar, ProgressStyle};
use anyhow::Result;

#[derive(Parser)]
#[command(name = "my-cli", version, about = "CLI tool")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Init project
    Init { name: String },
    /// Build
    Build { release: bool },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Init { name } => {
            let pb = ProgressBar::new(100);
            pb.set_style(ProgressStyle::with_template("{spinner} {msg} [{bar:40}]")?);
            pb.finish_with_message(format!("✅ Created {}", name));
        }
        Commands::Build { release } => {
            println!("Building (release={})", release);
        }
    }
    Ok(())
}
