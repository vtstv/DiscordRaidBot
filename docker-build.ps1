# Build and push multi-architecture Docker image
# Supports: linux/amd64, linux/arm64
#
# Discord Raid Bot
# By Murr (https://github.com/vtstv)
# GitHub: https://github.com/vtstv/DiscordRaidBot
# Version: 1.0.0

param(
    [string]$Tag = "latest",
    [string]$Registry = "",  # e.g., "ghcr.io/vtstv" or "vtstv" for Docker Hub
    [switch]$Push = $false,
    [switch]$LoadLocal = $false
)

$ErrorActionPreference = "Stop"

# Add Docker to PATH
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Discord Raid Bot Multi-Architecture Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Image configuration
$ImageName = "raidbot"
if ($Registry) {
    $FullImageName = "${Registry}/${ImageName}:${Tag}"
    $LatestImageName = "${Registry}/${ImageName}:latest"
} else {
    $FullImageName = "${ImageName}:${Tag}"
    $LatestImageName = "${ImageName}:latest"
}

# Check if buildx is available
Write-Host "Checking Docker buildx..." -ForegroundColor Yellow
docker buildx version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker buildx not available!" -ForegroundColor Red
    exit 1
}

# Create and use buildx builder if not exists
Write-Host ""
Write-Host "Setting up buildx builder..." -ForegroundColor Yellow
$builderName = "raidbot-builder"

# Check if builder exists
$existingBuilder = docker buildx ls | Select-String $builderName
if ($existingBuilder) {
    Write-Host "Builder '$builderName' already exists, using it..." -ForegroundColor Green
    docker buildx use $builderName
} else {
    Write-Host "Creating new builder '$builderName'..." -ForegroundColor Green
    docker buildx create --name $builderName --driver docker-container --bootstrap
    docker buildx use $builderName
}

# Inspect builder
docker buildx inspect --bootstrap

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building multi-arch image..." -ForegroundColor Cyan
Write-Host "Platforms: linux/amd64, linux/arm64" -ForegroundColor Cyan
Write-Host "Tag: $FullImageName" -ForegroundColor Cyan
if ($Tag -ne "latest") {
    Write-Host "Also tagging as: $LatestImageName" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Build command
$buildArgs = @(
    "buildx", "build",
    "--platform", "linux/amd64,linux/arm64",
    "--tag", $FullImageName
)

# Add latest tag if custom tag provided
if ($Tag -ne "latest") {
    $buildArgs += "--tag", $LatestImageName
}

# Determine build mode
if ($Push) {
    Write-Host "Mode: Build and PUSH to registry" -ForegroundColor Yellow
    $buildArgs += "--push"
} elseif ($LoadLocal) {
    Write-Host "Mode: Build and LOAD locally (single platform only)" -ForegroundColor Yellow
    Write-Host "WARNING: --load works only with single platform, building for current platform only" -ForegroundColor Yellow
    $buildArgs = @(
        "buildx", "build",
        "--tag", $FullImageName,
        "--load"
    )
} else {
    Write-Host "Mode: Build only (no push, no load)" -ForegroundColor Yellow
}

$buildArgs += "."

# Execute build
& docker $buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Multi-arch build complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($Push) {
    Write-Host "Image pushed to registry:" -ForegroundColor Cyan
    Write-Host "  - $FullImageName (supports amd64 + arm64)" -ForegroundColor White
    if ($Tag -ne "latest") {
        Write-Host "  - $LatestImageName (supports amd64 + arm64)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "To pull on any platform:" -ForegroundColor Yellow
    Write-Host "  docker pull $FullImageName" -ForegroundColor White
    Write-Host ""
    Write-Host "Docker will automatically select the correct architecture!" -ForegroundColor Green
    Write-Host ""
    
    # Show image manifest
    Write-Host "Image manifest:" -ForegroundColor Yellow
    docker buildx imagetools inspect $FullImageName
} elseif ($LoadLocal) {
    Write-Host "Image loaded locally:" -ForegroundColor Cyan
    Write-Host "  - $FullImageName (current platform only)" -ForegroundColor White
    Write-Host ""
    Write-Host "To run:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor White
} else {
    Write-Host "Build completed but not pushed or loaded." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To push to registry, run:" -ForegroundColor Yellow
    Write-Host "  .\docker-build.ps1 -Tag $Tag -Registry <registry> -Push" -ForegroundColor White
    Write-Host ""
    Write-Host "To load locally (single platform), run:" -ForegroundColor Yellow
    Write-Host "  .\docker-build.ps1 -Tag $Tag -LoadLocal" -ForegroundColor White
}

Write-Host ""
