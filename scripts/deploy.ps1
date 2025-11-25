# Copyright (c) 2025 Murr (https://github.com/vtstv)
# PowerShell deployment script for Discord Raid Bot
# Usage: .\scripts\deploy.ps1 [-Mode local|remote] [-RemoteHost ubuntu@IP] [-SshKey path]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "remote")]
    [string]$Mode = "local",
    
    [Parameter(Mandatory=$false)]
    [string]$RemoteHost = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SshKey = ""
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    switch ($Type) {
        "Info" { Write-Host "[INFO] $Message" -ForegroundColor Green }
        "Warn" { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
        "Error" { Write-Host "[ERROR] $Message" -ForegroundColor Red }
    }
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." "Info"
    
    # Check Docker
    try {
        docker --version | Out-Null
    } catch {
        Write-ColorOutput "Docker is not installed or not in PATH" "Error"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
    } catch {
        try {
            docker compose version | Out-Null
        } catch {
            Write-ColorOutput "Docker Compose is not installed" "Error"
            exit 1
        }
    }
    
    # Check .env file
    if (-not (Test-Path ".env")) {
        Write-ColorOutput ".env file not found" "Warn"
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-ColorOutput "Created .env from .env.example - please configure it" "Warn"
            exit 1
        } else {
            Write-ColorOutput ".env.example not found" "Error"
            exit 1
        }
    }
    
    Write-ColorOutput "Prerequisites check passed" "Info"
}

function Deploy-Local {
    Write-ColorOutput "Deploying locally..." "Info"
    
    # Build images
    Write-ColorOutput "Building Docker images..." "Info"
    docker-compose build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Docker build failed" "Error"
        exit 1
    }
    
    # Start services
    Write-ColorOutput "Starting services..." "Info"
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Failed to start services" "Error"
        exit 1
    }
    
    # Wait for services
    Write-ColorOutput "Waiting for services to be healthy..." "Info"
    Start-Sleep -Seconds 10
    
    # Check status
    docker-compose ps
    
    Write-ColorOutput "Local deployment complete!" "Info"
    Write-ColorOutput "Bot logs: docker-compose logs -f bot" "Info"
    Write-ColorOutput "Web panel: http://localhost:3000" "Info"
}

function Deploy-Remote {
    Write-ColorOutput "Deploying to remote server..." "Info"
    
    if ([string]::IsNullOrEmpty($RemoteHost)) {
        Write-ColorOutput "RemoteHost parameter is required for remote deployment" "Error"
        Write-ColorOutput "Example: .\scripts\deploy.ps1 -Mode remote -RemoteHost ubuntu@XXX.XXX.XXX.XXX -SshKey C:\Users\username\.ssh\key" "Info"
        exit 1
    }
    
    $sshArgs = @()
    if (-not [string]::IsNullOrEmpty($SshKey)) {
        $sshArgs += @("-i", $SshKey)
    }
    
    Write-ColorOutput "Connecting to $RemoteHost..." "Info"
    
    # Test connection
    $testCmd = $sshArgs + @($RemoteHost, "echo 'Connection successful'")
    try {
        & ssh @testCmd | Out-Null
    } catch {
        Write-ColorOutput "Cannot connect to remote server" "Error"
        exit 1
    }
    
    # Create project directory
    $createDirCmd = $sshArgs + @($RemoteHost, "mkdir -p ~/DiscordRaidBot")
    & ssh @createDirCmd
    
    # Sync files using scp
    Write-ColorOutput "Syncing files to remote server..." "Info"
    
    $excludeDirs = @("node_modules", ".git", "logs", "dist", ".vscode")
    $projectRoot = Get-Location
    
    # Create a temporary archive excluding unwanted directories
    $tempArchive = "$env:TEMP\raidbot-deploy.tar.gz"
    if (Test-Path $tempArchive) {
        Remove-Item $tempArchive
    }
    
    # Use tar to create archive (requires tar in PATH - included in Windows 10+)
    $excludeArgs = $excludeDirs | ForEach-Object { "--exclude=$_" }
    & tar -czf $tempArchive @excludeArgs -C $projectRoot .
    
    # Copy archive to remote
    $scpArgs = @()
    if (-not [string]::IsNullOrEmpty($SshKey)) {
        $scpArgs += @("-i", $SshKey)
    }
    $scpArgs += @($tempArchive, "${RemoteHost}:~/raidbot-deploy.tar.gz")
    & scp @scpArgs
    
    # Extract on remote
    $extractCmd = $sshArgs + @($RemoteHost, "cd ~/DiscordRaidBot && tar -xzf ~/raidbot-deploy.tar.gz && rm ~/raidbot-deploy.tar.gz")
    & ssh @extractCmd
    
    # Clean up local temp file
    Remove-Item $tempArchive
    
    # Deploy on remote server
    Write-ColorOutput "Building and starting services on remote server..." "Info"
    $deployCmd = $sshArgs + @($RemoteHost, "cd ~/DiscordRaidBot && docker-compose down && docker-compose build --no-cache && docker-compose up -d")
    & ssh @deployCmd
    
    # Wait and check status
    Start-Sleep -Seconds 10
    $statusCmd = $sshArgs + @($RemoteHost, "cd ~/DiscordRaidBot && docker-compose ps")
    & ssh @statusCmd
    
    Write-ColorOutput "Remote deployment complete!" "Info"
    Write-ColorOutput "Check logs: ssh $RemoteHost 'cd ~/DiscordRaidBot && docker-compose logs -f bot'" "Info"
}

# Main execution
Write-ColorOutput "Discord Raid Bot Deployment Script" "Info"
Write-ColorOutput "Mode: $Mode" "Info"

# Change to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Test-Prerequisites

switch ($Mode) {
    "local" {
        Deploy-Local
    }
    "remote" {
        Deploy-Remote
    }
}
