$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $PSScriptRoot
Set-Location $Root
function Step($m){Write-Host "`n==> $m" -ForegroundColor Cyan}
function Ok($m){Write-Host "[OK] $m" -ForegroundColor Green}
function Warn($m){Write-Host "[WARN] $m" -ForegroundColor Yellow}
function Read-DotEnv($path){$map=@{};if(Test-Path $path){Get-Content $path|ForEach-Object{$line=$_.Trim();if($line -and !$line.StartsWith('#') -and $line.Contains('=')){$i=$line.IndexOf('=');$map[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim()}}};return $map}

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
Write-Host 'schema.sql was copied to the clipboard.' -ForegroundColor Yellow
Write-Host 'In the SQL Editor: paste -> Run. It is safe to re-run for upgrades.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter AFTER the SQL query succeeds')

Step 'Verifying public.submissions exists'
try {
  $headers=@{apikey=$key}
  $resp=Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri "$url/rest/v1/submissions?select=id&limit=1" -Method Get
  if($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300){Ok 'submissions table is reachable through PostgREST.'}
} catch {
  Warn 'The submissions table still could not be reached.'
  Write-Host $_.Exception.Message -ForegroundColor DarkYellow
  Write-Host 'Re-open supabase/schema.sql in the SQL Editor and check the error line before continuing.' -ForegroundColor Yellow
}

Step '2/4 - Fix Auth production redirect'
Start-Process $authUrl
Write-Host "Site URL:      $site/" -ForegroundColor Yellow
Write-Host "Redirect URL:  $site/**" -ForegroundColor Yellow
Write-Host 'Keep redirect URLs used by your other service; ADD these LLM Bible URLs instead of deleting existing ones.' -ForegroundColor Yellow
Write-Host 'Old confirmation emails that point to localhost cannot be repaired. After saving the URL settings, resend a fresh confirmation email.' -ForegroundColor Yellow
[void](Read-Host 'Press Enter after saving URL Configuration')

Step '3/4 - Choose account permission'
Write-Host 'user  : submit examples + read own submissions' -ForegroundColor Gray
Write-Host 'admin : everything above + moderation queue + publish/archive/reject' -ForegroundColor Gray
$adminEmail=Read-Host 'Email to promote to admin (blank = keep as normal user)'
if($adminEmail){
  $safe=$adminEmail.Replace("'","''")
  $promote="insert into public.profiles(id,display_name,role) select id, coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'), 'admin' from auth.users where email='$safe' on conflict(id) do update set role='admin'; select id,display_name,role from public.profiles where id=(select id from auth.users where email='$safe');"
  Set-Clipboard $promote
  Start-Process $sqlUrl
  Write-Host 'Admin promotion SQL copied. Paste -> Run once.' -ForegroundColor Yellow
  [void](Read-Host 'Press Enter after the result shows role = admin')
  Ok 'Admin promotion step completed.'
} else {Ok 'Account remains a normal user.'}

Step '4/4 - Optional moderation Edge Function'
$choice=Read-Host 'Deploy/refresh moderate-submission Edge Function now? (Y/N)'
if($choice -match '^[Yy]'){
  if(Get-Command npx -ErrorAction SilentlyContinue){
    & npx --yes supabase@latest functions deploy moderate-submission --project-ref $projectRef
    if($LASTEXITCODE -eq 0){Ok 'moderate-submission deployed.'}else{Warn 'CLI deploy failed. Run `npx supabase login`, then retry.'}
  } else {Warn 'npx not found.'}
}

Write-Host "`nNext:" -ForegroundColor Cyan
Write-Host '1) run redeploy-pages.cmd' -ForegroundColor White
Write-Host '2) wait for GitHub Actions to turn green' -ForegroundColor White
Write-Host "3) open $site/#/account" -ForegroundColor White
Write-Host '4) sign out/in once if you changed admin role' -ForegroundColor White
