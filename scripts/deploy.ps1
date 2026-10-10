param(
  [string]$ImageTag = "",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir   = Split-Path -Parent $scriptDir
$infraDir  = Join-Path $rootDir "infra"

if (-not $ImageTag) {
  try {
    $ImageTag = (git -C $rootDir rev-parse --short HEAD).Trim()
  } catch {
    $ImageTag = "latest"
  }
}

Push-Location $infraDir
try {
  Write-Host "==> terraform init" -ForegroundColor Cyan
  terraform init

  Write-Host "==> Creando repositorio ECR (fase 1)..." -ForegroundColor Cyan
  terraform apply -auto-approve -target=aws_ecr_repository.lambda

  if (-not $SkipBuild) {
    $accountId = (aws sts get-caller-identity --query Account --output text).Trim()
    $region    = (terraform output -raw aws_region).Trim()
    $repoUrl   = (terraform output -raw ecr_repository_url).Trim()
    $registry  = "$accountId.dkr.ecr.$region.amazonaws.com"

    Write-Host "==> Login en ECR $registry" -ForegroundColor Cyan
    aws ecr get-login-password --region $region |
      docker login --username AWS --password-stdin $registry

    Write-Host "==> Build & push de la imagen ${repoUrl}:$ImageTag" -ForegroundColor Cyan
    docker build -t "${repoUrl}:$ImageTag" $rootDir
    docker push "${repoUrl}:$ImageTag"
  }

  Write-Host "==> Aplicando el resto de la infraestructura (fase 2)..." -ForegroundColor Cyan
  terraform apply -auto-approve -var="image_tag=$ImageTag"

  Write-Host "==> Outputs:" -ForegroundColor Green
  terraform output
}
finally {
  Pop-Location
}
