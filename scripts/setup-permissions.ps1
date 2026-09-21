$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root
function Step($m){Write-Host "`n==> $m" -ForegroundColor Cyan}
function Ok($m){Write-Host "[OK] $m" -ForegroundColor Green}
function Warn($m){Write-Host "[WARN] $m" -ForegroundColor Yellow}
function Fail($m){Write-Host "[STOP] $m" -ForegroundColor Red}
function Read-DotEnv($path){$map=@{};if(Test-Path $path){Get-Content $path|ForEach-Object{$line=$_.Trim();if($line -and !$line.StartsWith('#') -and $line.Contains('=')){$i=$line.IndexOf('=');$map[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim()}}};return $map}
function Test-RestTable($base,$key,$table){
  try {
    $headers=@{apikey=$key}
    $resp=Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri "$base/rest/v1/$table?select=*&limit=0" -Method Get
    return ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300)
  } catch { return $false }
}

$envPath=Join-Path $Root '.env'
if(!(Test-Path $envPath)){Copy-Item '.env.example' '.env';Ok '.env created.'}
$config=Read-DotEnv $envPath
$url=$config['VITE_SUPABASE_URL'];if(!$url){$url=$config['SUPABASE_URL']}
$key=$config['VITE_SUPABASE_PUBLISHABLE_KEY'];if(!$key){$key=$config['SUPABASE_PUBLISHABLE_KEY']};if(!$key){$key=$config['SUPABASE_ANON_KEY']}
$site=$config['VITE_SITE_URL'];if(!$site){$site=$config['PUBLIC_SITE_URL']};if(!$site){$site='https://ko9ma7.github.io/llm-bible-community'}
$site=$site.TrimEnd('/')
if(!$url -or !$key){throw 'Supabase URL / publishable key is missing in .env.'}
$projectRef=([Uri]$url).Host.Split('.')[0]
$sqlUrl="https://supabase.com/dashboard/project/$projectRef/sql/new"
$authUrl="https://supabase.com/dashboard/project/$projectRef/auth/url-configuration"

Step '1/4 - Install or upgrade LLM Bible DB schema'
$schema=Get-Content (Join-Path $Root 'supabase/schema.sql') -Raw -Encoding UTF8
Set-Clipboard $schema
Start-Process $sqlUrl
Write-Host 'FULL schema.sql is now in your clipboard.' -ForegroundColor Yellow
Write-Host 'In Supabase SQL Editor: Ctrl+V -> Run. Wait for SUCCESS before pressing Enter here.' -ForegroundColor Yellow
Write-Host 'Do NOT run the admin promotion SQL before this step succeeds.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter ONLY AFTER the full schema.sql query succeeds')

Step 'Verifying required tables'
$profilesOk=Test-RestTable $url $key 'profiles'
$submissionsOk=Test-RestTable $url $key 'submissions'
if(!$profilesOk -or !$submissionsOk){
  Fail 'Required DB tables are still missing or not exposed through the Data API.'
  Write-Host "profiles reachable:    $profilesOk" -ForegroundColor Yellow
  Write-Host "submissions reachable: $submissionsOk" -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'The setup will STOP here so later admin SQL cannot fail against missing tables.' -ForegroundColor Yellow
  Write-Host '1) Return to the SQL Editor tab.' -ForegroundColor White
  Write-Host '2) Confirm you pasted the FULL contents of supabase/schema.sql, not the admin promotion SQL.' -ForegroundColor White
  Write-Host '3) Click Run and fix the FIRST red SQL error if one appears.' -ForegroundColor White
  Write-Host '4) Then run this setup command again.' -ForegroundColor White
  Set-Clipboard $schema
  exit 21
}
Ok 'profiles and submissions are reachable through PostgREST.'

Step '2/4 - Fix Auth production redirect'
Start-Process $authUrl
Write-Host "Site URL:      $site/" -ForegroundColor Yellow
Write-Host "Redirect URL:  $site/**" -ForegroundColor Yellow
Write-Host 'Keep redirect URLs used by your other services; ADD these URLs instead of deleting existing ones.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter after saving URL Configuration')

Step '3/4 - Choose account permission'
Write-Host 'user  : submit examples + read own submissions' -ForegroundColor Gray
Write-Host 'admin : everything above + moderation queue + publish/archive/reject' -ForegroundColor Gray
$adminEmail=Read-Host 'Email to promote to admin (blank = keep as normal user)'
if($adminEmail){
  $safe=$adminEmail.Replace("'","''")
  $promote="insert into public.profiles(id,display_name,role) select id, coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'), 'admin' from auth.users where lower(email)=lower('$safe') on conflict(id) do update set role='admin'; select id,display_name,role from public.profiles where id=(select id from auth.users where lower(email)=lower('$safe'));"
  Set-Clipboard $promote
  Start-Process $sqlUrl
  Write-Host 'Admin promotion SQL copied. Paste -> Run once.' -ForegroundColor Yellow
  Write-Host 'The result MUST show role = admin before continuing.' -ForegroundColor Yellow
  [void](Read-Host 'Press Enter after the result shows role = admin')
  Ok 'Admin promotion SQL step acknowledged.'
} else {Ok 'Account remains a normal user.'}

Step '4/4 - Optional moderation Edge Function'
Write-Host 'This is optional for now. Auth and DB work without it; moderation actions need it later.' -ForegroundColor Gray
$choice=Read-Host 'Deploy/refresh moderate-submission Edge Function now? (Y/N, recommended N until DB is confirmed)'
if($choice -match '^[Yy]'){
  if(Get-Command npx -ErrorAction SilentlyContinue){
    $temp=New-TemporaryFile
    & npx --yes supabase@latest projects list *> $temp.FullName
    $loggedIn=($LASTEXITCODE -eq 0)
    Remove-Item $temp.FullName -Force -ErrorAction SilentlyContinue
    if(!$loggedIn){
      Warn 'Supabase CLI is not logged in. Edge Function deployment was skipped.'
      Write-Host 'Run this once in a terminal: npx supabase@latest login' -ForegroundColor Yellow
      Write-Host 'Then rerun setup-permissions.cmd and choose Y in step 4.' -ForegroundColor Yellow
    } else {
      & npx --yes supabase@latest functions deploy moderate-submission --project-ref $projectRef
      if($LASTEXITCODE -eq 0){Ok 'moderate-submission deployed.'}else{Warn 'Edge Function deployment failed; DB/Auth setup remains valid.'}
    }
  } else {Warn 'npx not found; Edge Function deployment skipped.'}
} else {Ok 'Edge Function deployment skipped for now.'}

Write-Host "`nNext:" -ForegroundColor Cyan
Write-Host '1) run redeploy-pages.cmd' -ForegroundColor White
Write-Host '2) wait for GitHub Actions to turn green' -ForegroundColor White
Write-Host "3) open $site/#/account" -ForegroundColor White
Write-Host '4) sign out/in once if you changed admin role' -ForegroundColor White
