# Build and Push Docker Image to Docker Hub
# Usage: .\build-and-push.ps1 <docker-hub-username>

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$ImageName = "$DockerUsername/raidbot"
$FullImageTag = "${ImageName}:${Tag}"

Write-Host "Building Docker image for linux/amd64..." -ForegroundColor Cyan
Write-Host "Image: $FullImageTag" -ForegroundColor Yellow

# Build for linux/amd64 (remote server platform)
docker buildx build --platform linux/amd64 `
    --target runtime `
    -t $FullImageTag `
    --load `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nBuild successful!" -ForegroundColor Green
Write-Host "Image size:" -ForegroundColor Cyan
docker images $FullImageTag

Write-Host "`nPushing image to Docker Hub..." -ForegroundColor Cyan
Write-Host "Make sure you're logged in: docker login" -ForegroundColor Yellow

docker push $FullImageTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed! Did you run 'docker login'?" -ForegroundColor Red
    exit 1
}

Write-Host "`nSuccessfully pushed $FullImageTag to Docker Hub!" -ForegroundColor Green
Write-Host "`nTo use on remote server, update docker-compose.yml:" -ForegroundColor Cyan
Write-Host "  image: $FullImageTag" -ForegroundColor Yellow
