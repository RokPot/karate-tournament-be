# PowerShell script for Windows bootstrap
param(
    [string]$Stage = "local"
)

$env:STAGE = $Stage
Write-Host "Bootstrapping with STAGE=$Stage"

# Run ecs-deploy bootstrap
yarn ecs-deploy bootstrap

if ($LASTEXITCODE -eq 0) {
    Write-Host "Bootstrap completed successfully!"
} else {
    Write-Host "Bootstrap failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

