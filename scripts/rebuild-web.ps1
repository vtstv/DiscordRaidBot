# Quick rebuild web container after code changes
Write-Host "Stopping web container..." -ForegroundColor Yellow
docker compose down web

Write-Host "Building frontend assets..." -ForegroundColor Cyan
npm run build:frontend

Write-Host "Rebuilding web Docker image..." -ForegroundColor Cyan
docker compose build --no-cache web

Write-Host "Starting web container..." -ForegroundColor Green
docker compose --profile with-web up -d web

Write-Host "Done! Web container updated." -ForegroundColor Green
Write-Host "Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
docker compose logs -f web
