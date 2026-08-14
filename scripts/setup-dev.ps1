# Setup development environment script for StartupGo
# Run this in an elevated PowerShell if installing global tools is required.

Set-StrictMode -Version Latest

Write-Host "Starting setup-dev.ps1"

# 1) Ensure corepack and pnpm (optional)
try {
  Write-Host "Enabling corepack..."
  corepack enable
  Write-Host "Preparing pnpm..."
  corepack prepare pnpm@latest --activate
} catch {
  Write-Warning "corepack/pnpm activation failed; ensure pnpm is installed or install it manually from https://pnpm.io/"
}

# 2) Install root deps (pnpm preferred)
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm install
} else {
  Write-Host "pnpm not found, falling back to npm install in each package. This is slower."
  Push-Location packages\backend; npm install; Pop-Location
  Push-Location packages\admin; npm install; Pop-Location
  Push-Location packages\founder; npm install; Pop-Location
}

# 3) Start docker-compose (if Docker available)
if (Get-Command docker -ErrorAction SilentlyContinue) {
  Write-Host "Starting docker-compose services..."
  Push-Location .\packages\infra
  docker compose up -d
  Pop-Location
} else {
  Write-Warning "Docker not found. Start Postgres manually or install Docker Desktop and re-run this script."
}

# 4) Backend: generate prisma client (no DB required for generation)
Push-Location packages\backend
Write-Host "Generating Prisma client..."
if (Get-Command pnpm -ErrorAction SilentlyContinue) { pnpm prisma generate } else { npx prisma generate }

Write-Host "Setup complete. Next steps:"
Write-Host " - Create packages/backend/.env from .env.example and set DATABASE_URL and JWT_SECRET"
Write-Host " - From packages/backend: run npx prisma migrate dev --name init  (requires Postgres)"
Write-Host " - Then run npm run prisma:seed and npm run dev"
Pop-Location
