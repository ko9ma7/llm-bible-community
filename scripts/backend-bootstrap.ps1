$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Read-DotEnv($path){ $map=@{}; if(Test-Path $path){ Get-Content $path | ForEach-Object { $line=$_.Trim(); if($line -and !$line.StartsWith('#') -and $line.Contains('=')){ $i=$line.IndexOf('='); $map[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim() } } }; return $map }
function Set-DotEnv($path,$key,$value){ $lines=@(); if(Test-Path $path){$lines=Get-Content $path}; $found=$false; $out=@($lines|ForEach-Object{ if($_ -match "^$([regex]::Escape($key))="){ $found=$true; "$key=$value" } else { $_ } }); if(!$found){$out+="$key=$value"}; Set-Content -LiteralPath $path -Value $out -Encoding UTF8 }

$envPath=Join-Path $ProjectRoot '.env'
if(-not (Test-Path $envPath)){ Copy-Item '.env.example' '.env'; Ok '.env created from the browser-safe existing-project defaults.' }
$config=Read-DotEnv $envPath
$url=$config['VITE_SUPABASE_URL']; if(!$url){$url=$config['SUPABASE_URL']}
$key=$config['VITE_SUPABASE_PUBLISHABLE_KEY']; if(!$key){$key=$config['SUPABASE_PUBLISHABLE_KEY']}; if(!$key){$key=$config['SUPABASE_ANON_KEY']}
if(!$url -or $url.Contains('YOUR_PROJECT') -or !$key -or $key.Contains('REPLACE_ME')){ throw 'Supabase URL/publishable key are not configured.' }
Set-DotEnv $envPath 'VITE_SUPABASE_URL' $url
Set-DotEnv $envPath 'VITE_SUPABASE_PUBLISHABLE_KEY' $key
$projectRef=([Uri]$url).Host.Split('.')[0]
Ok "Connected project: $projectRef"

Step 'Syncing browser-safe Supabase values to GitHub Actions variables'
if(Get-Command gh -ErrorAction SilentlyContinue){
  $repo=''
  try { $repo=(gh repo view --json nameWithOwner --jq .nameWithOwner 2>$null).Trim() } catch {}
  if($repo){
    $url | gh variable set VITE_SUPABASE_URL --repo $repo
    $key | gh variable set VITE_SUPABASE_PUBLISHABLE_KEY --repo $repo
    $site='https://'+($repo.Split('/')[0])+'.github.io/'+($repo.Split('/')[1])
    $site | gh variable set VITE_SITE_URL --repo $repo
    ($repo.Split('/')[1]) | gh variable set VITE_REPO_NAME --repo $repo
    Ok "GitHub Variables synced for $repo"
  } else { Warn 'GitHub repository could not be detected. Run github-bootstrap.cmd/redeploy-pages.cmd after this.' }
} else { Warn 'GitHub CLI not found; skipping Actions variable sync.' }

Step 'Installing/upgrading the LLM Bible schema in the existing Supabase project'
$schema=Get-Content (Join-Path $ProjectRoot 'supabase/schema.sql') -Raw -Encoding UTF8
if(Get-Command Set-Clipboard -ErrorAction SilentlyContinue){ Set-Clipboard $schema; Ok 'supabase/schema.sql copied to clipboard.' }
$sqlUrl="https://supabase.com/dashboard/project/$projectRef/sql/new"
Start-Process $sqlUrl
Write-Host 'Supabase SQL Editor opened. Paste the clipboard contents and click Run.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter after schema.sql completed successfully')

Step 'Installing source registry (small optional DB mirror)'
$sourceSeed=Join-Path $ProjectRoot 'supabase/seed-parts/00-sources.sql'
if(Test-Path $sourceSeed){
  $seed=Get-Content $sourceSeed -Raw -Encoding UTF8
  if(Get-Command Set-Clipboard -ErrorAction SilentlyContinue){ Set-Clipboard $seed; Ok '00-sources.sql copied to clipboard (small seed).' }
  Start-Process $sqlUrl
  Write-Host 'Optional: paste and Run to mirror the 41 source records. The web site itself already works from static category JSON.' -ForegroundColor Yellow
  $choice=Read-Host 'Press Enter after running it, or type SKIP to continue'
}
Write-Host 'Large research data is intentionally split into category-sized SQL files.' -ForegroundColor Cyan
Write-Host 'Run seed-category.cmd later to import Prompt / Skill / Recipe / Failure categories one at a time.' -ForegroundColor Cyan

Step 'Checking Auth redirect URL for GitHub Pages'
$authUrl="https://supabase.com/dashboard/project/$projectRef/auth/url-configuration"
Start-Process $authUrl
$site=$config['VITE_SITE_URL']; if(!$site){$site=$config['PUBLIC_SITE_URL']}; if(!$site){$site='https://ko9ma7.github.io/llm-bible-community'}
$site=$site.TrimEnd('/')
$redirect="$site/**"
Write-Host "Add this Redirect URL if it is not already allowed: $redirect" -ForegroundColor Yellow
Write-Host 'The existing Supabase project may serve another site too, so do not remove its existing redirect URLs.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter after confirming the redirect URL')

Step 'Administrator account setup'
Start-Process "https://supabase.com/dashboard/project/$projectRef/auth/users"
Write-Host 'Create/sign up the administrator email account if it does not exist. Passwords stay in Supabase Auth and are never written to this project.' -ForegroundColor Yellow
$adminEmail=Read-Host 'Administrator email to promote (blank = skip for now)'
if($adminEmail){
  $safe=$adminEmail.Replace("'","''")
  $promote="insert into public.profiles(id,display_name,role) select id, coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'), 'admin' from auth.users where email='$safe' on conflict(id) do update set role='admin';"
  if(Get-Command Set-Clipboard -ErrorAction SilentlyContinue){ Set-Clipboard $promote; Ok 'Admin promotion SQL copied to clipboard.' }
  Start-Process $sqlUrl
  Write-Host 'Run the copied promotion SQL once.' -ForegroundColor Yellow
  [void](Read-Host 'Press Enter after administrator promotion')
}

Step 'Deploying moderation Edge Function'
if(Get-Command npx -ErrorAction SilentlyContinue){
  & npx --yes supabase@latest functions deploy moderate-submission --project-ref $projectRef
  if($LASTEXITCODE -eq 0){ Ok 'moderate-submission deployed.' } else { Warn 'Edge Function deploy needs Supabase CLI login/access token. Login with `npx supabase login` and retry when ready.' }
} else { Warn 'npx not found; deploy the Edge Function later.' }

Write-Host "`n[OK] Existing Supabase project is now wired for LLM Bible." -ForegroundColor Green
Write-Host 'Next: run redeploy-pages.cmd, wait for GitHub Actions to turn green, then open #/account.'
