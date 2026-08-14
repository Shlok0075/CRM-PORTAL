param(
    [switch]$NoBackend,
    [switch]$NoFrontend,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

function Kill-PortIfInUse {
    param([int]$Port)
    $connections = netstat -ano | Select-String ":${Port}\s"
    foreach ($conn in $connections) {
        if ($conn -match '\s+(\d+)$') {
            $pid = $Matches[1]
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process on port $Port (PID: $pid)"
            } catch {}
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PraxisCA - Starting Services" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "packages\backend"
$adminDir = Join-Path $projectRoot "packages\admin"

if (-not $NoBackend) {
    Write-Host "[Backend] Checking port 4000..." -ForegroundColor Yellow
    Kill-PortIfInUse -Port 4000

    Write-Host "[Backend] Starting NestJS server..." -ForegroundColor Green
    $backendProcess = Start-Process -FilePath "npx" -ArgumentList "ts-node-dev","--respawn","--transpile-only","src/main.ts" -WorkingDirectory $backendDir -PassThru -WindowStyle Hidden
    Write-Host "[Backend] Starting... PID: $($backendProcess.Id)" -ForegroundColor Green

    $maxRetries = 30
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4000/api/dashboard" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "[Backend] Ready at http://localhost:4000/api`n" -ForegroundColor Green
                break
            }
        } catch {}
        $retryCount++
        Write-Host "[Backend] Waiting for server to be ready... ($retryCount/$maxRetries)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }

    if ($retryCount -eq $maxRetries) {
        Write-Host "[Backend] Failed to start within timeout" -ForegroundColor Red
    }
} else {
    Write-Host "[Backend] Skipped`n" -ForegroundColor DarkGray
}

if (-not $NoFrontend) {
    Write-Host "[Frontend] Checking port 5173..." -ForegroundColor Yellow
    Kill-PortIfInUse -Port 5173

    Write-Host "[Frontend] Starting Vite dev server..." -ForegroundColor Green
    $adminProcess = Start-Process -FilePath "npx" -ArgumentList "vite","--host","0.0.0.0" -WorkingDirectory $adminDir -PassThru -WindowStyle Hidden
    Write-Host "[Frontend] Starting... PID: $($adminProcess.Id)" -ForegroundColor Green

    $maxRetries = 30
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "[Frontend] Ready at http://localhost:5173`n" -ForegroundColor Green
                break
            }
        } catch {}
        $retryCount++
        Write-Host "[Frontend] Waiting for server to be ready... ($retryCount/$maxRetries)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }

    if ($retryCount -eq $maxRetries) {
        Write-Host "[Frontend] Failed to start within timeout" -ForegroundColor Red
    }
} else {
    Write-Host "[Frontend] Skipped`n" -ForegroundColor DarkGray
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:4000/api" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop all services`n" -ForegroundColor DarkGray

if (-not $NoBackend -and -not $NoFrontend) {
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            if ($backendProcess.HasExited -or $adminProcess.HasExited) {
                Write-Host "`nOne of the services has stopped. Shutting down..." -ForegroundColor Yellow
                break
            }
        }
    } catch {
        Write-Host "`nStopping services..." -ForegroundColor Yellow
    } finally {
        if (-not $backendProcess.HasExited) {
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        if (-not $adminProcess.HasExited) {
            Stop-Process -Id $adminProcess.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "All services stopped." -ForegroundColor Green
    }
}
