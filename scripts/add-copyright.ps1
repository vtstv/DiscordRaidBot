# Copyright (c) 2025 Murr (https://github.com/vtstv)
# Add copyright headers to all TypeScript files

$copyright = "// Copyright (c) 2025 Murr (https://github.com/vtstv)`n"

Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Check if copyright already exists
    if ($content -notmatch "Copyright.*Murr") {
        # Add copyright at the top
        Set-Content -Path $_.FullName -Value ($copyright + $content) -NoNewline
        Write-Host "Added copyright to: $($_.FullName)"
    } else {
        Write-Host "Copyright already exists in: $($_.FullName)"
    }
}

Write-Host "`nDone! Added copyright headers to all TypeScript files."
