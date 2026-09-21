$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
$envPath=Join-Path $ProjectRoot '.env'
if(-not (Test-Path $envPath)){ Copy-Item '.env.example' '.env'; Warn '.env created. Fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then run again.'; exit 2 }
$config=@{}; Get-Content $envPath | ForEach-Object { $line=$_.Trim(); if($line -and !$line.StartsWith('#') -and $line.Contains('=')){ $i=$line.IndexOf('='); $config[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim() } }
$url=$config['VITE_SUPABASE_URL']; $key=$config['VITE_SUPABASE_PUBLISHABLE_KEY']
if(!$url -or $url.Contains('YOUR_PROJECT') -or !$key -or $key.Contains('REPLACE_ME')){ Warn 'Supabase URL/publishable key are not configured in .env.'; exit 2 }
$projectRef=([Uri]$url).Host.Split('.')[0]

Step 'Opening Supabase SQL Editor and copying schema.sql'
$schema=Get-Content (Join-Path $ProjectRoot 'supabase/schema.sql') -Raw -Encoding UTF8
if(Get-Command Set-Clipboard -ErrorAction SilentlyContinue){ Set-Clipboard $schema; Ok 'supabase/schema.sql copied to clipboard.' }
$sqlUrl="https://supabase.com/dashboard/project/$projectRef/sql/new"
Start-Process $sqlUrl
Write-Host 'Paste the SQL, click Run, then return here.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter after schema.sql completed successfully')

Step 'Opening Authentication Users for first administrator account'
Start-Process "https://supabase.com/dashboard/project/$projectRef/auth/users"
Write-Host 'Create the administrator email/password user in Authentication > Users (or sign up from the site).' -ForegroundColor Yellow
$adminEmail=Read-Host 'Administrator email to promote'
$promote="update public.profiles set role = 'admin' where id = (select id from auth.users where email = '$($adminEmail.Replace("'","''"))');"
if(Get-Command Set-Clipboard -ErrorAction SilentlyContinue){ Set-Clipboard $promote; Ok 'Admin promotion SQL copied to clipboard.' }
Start-Process $sqlUrl
Write-Host 'Run the copied UPDATE once, then return here.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter after the administrator role was promoted')

Step 'Deploying Edge Function with Supabase CLI'
if(Get-Command supabase -ErrorAction SilentlyContinue){
  Write-Host 'Global Supabase CLI detected. If not logged in, the CLI may prompt for authentication.' -ForegroundColor Cyan
  & supabase functions deploy moderate-submission --project-ref $projectRef
  if($LASTEXITCODE -eq 0){ Ok 'moderate-submission deployed.' } else { Warn 'Edge Function deploy failed. Use the command from README.' }
} elseif(Get-Command npx -ErrorAction SilentlyContinue){
  Write-Host 'Using npx to run the current Supabase CLI.' -ForegroundColor Cyan
  & npx --yes supabase@latest functions deploy moderate-submission --project-ref $projectRef
  if($LASTEXITCODE -eq 0){ Ok 'moderate-submission deployed.' } else { Warn 'Edge Function deploy failed. Sign in with `npx supabase login` and retry the command from README.' }
} else {
  Warn 'Supabase CLI runner not found.'
  Write-Host 'Official options: install Supabase CLI globally with Scoop, or install it as a project dev dependency and run it with npx.'
  Write-Host "Example: npx supabase@latest functions deploy moderate-submission --project-ref $projectRef"
}

Write-Host "`nBackend setup checklist complete." -ForegroundColor Green
Write-Host 'Run github-bootstrap.cmd again so Supabase browser-safe variables are stored in GitHub Actions Variables.'
