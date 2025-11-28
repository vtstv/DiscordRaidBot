Write-Host "Stopping all services..." -ForegroundColor Yellow
docker-compose --profile with-web down

Write-Host "Rebuilding all services without cache..." -ForegroundColor Yellow
docker-compose --profile with-web build --no-cache

Write-Host "Starting all services..." -ForegroundColor Green
docker-compose --profile with-web up -d

Write-Host "All services rebuilt and restarted successfully!" -ForegroundColor Green
docker-compose --profile with-web ps
