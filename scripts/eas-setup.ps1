# Requires: npx eas-cli login (interactive) first.
# Sets EAS project + EXPO_PUBLIC_* for preview and production.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$who = npx eas-cli whoami 2>&1
if ($LASTEXITCODE -ne 0 -or "$who" -match "Not logged in") {
  Write-Error "Run: npx eas-cli login"
}

Write-Host "Initializing EAS project..."
npx eas-cli init --non-interactive --force 2>&1
if ($LASTEXITCODE -ne 0) {
  npx eas-cli init 2>&1
}

$supabaseUrl = "https://wrawujclqgxdnbddwokv.supabase.co"
$anonKey = $env:EXPO_PUBLIC_SUPABASE_ANON_KEY
if (-not $anonKey -and (Test-Path .env.local)) {
  $line = Get-Content .env.local | Where-Object { $_ -match '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' } | Select-Object -First 1
  if ($line) { $anonKey = $line.Substring($line.IndexOf('=') + 1).Trim() }
}
if (-not $anonKey) {
  Write-Error "Set EXPO_PUBLIC_SUPABASE_ANON_KEY in the environment or .env.local"
}

$privacy = "https://chef-domingos-legal.vercel.app/privacy-policy.html"
$terms = "https://chef-domingos-legal.vercel.app/terms-of-service.html"

foreach ($environment in @("preview", "production")) {
  foreach ($pair in @(
    @{ Name = "EXPO_PUBLIC_SUPABASE_URL"; Value = $supabaseUrl },
    @{ Name = "EXPO_PUBLIC_SUPABASE_ANON_KEY"; Value = $anonKey },
    @{ Name = "EXPO_PUBLIC_PRIVACY_URL"; Value = $privacy },
    @{ Name = "EXPO_PUBLIC_TERMS_URL"; Value = $terms }
  )) {
    Write-Host "Creating $($pair.Name) for $environment..."
    npx eas-cli env:create --name $pair.Name --value $pair.Value --environment $environment --visibility plaintext --force 2>&1
  }
}

Write-Host "Done. Next: npm run build:preview"
