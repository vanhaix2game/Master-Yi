import click
from rich.console import Console
from rich.progress import Progress
import time

console = Console()

@click.group()
@click.version_option("1.0.0")
def cli():
    """CLI tool description"""

@cli.command()
@click.option("--name", prompt="Name", help="Project name")
@click.option("--type", type=click.Choice(["web", "game", "cli"]), default="web")
def init(name: str, type: str):
    """Init a new project"""
    with Progress() as progress:
        task = progress.add_task(f"Creating {name}...", total=100)
        for i in range(10):
            progress.update(task, advance=10)
            time.sleep(0.05)
    console.print(f"[bold green]✅ Created[/] {name} ({type})")
