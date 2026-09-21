$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
function Read-DotEnv($path){ $map=@{}; if(Test-Path $path){ Get-Content $path | ForEach-Object { $line=$_.Trim(); if($line -and !$line.StartsWith('#') -and $line.Contains('=')){ $i=$line.IndexOf('='); $map[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim() } } }; return $map }
function Ok($m){Write-Host "[OK] $m" -ForegroundColor Green}
function Warn($m){Write-Host "[WARN] $m" -ForegroundColor Yellow}
function Fail($m){Write-Host "[FAIL] $m" -ForegroundColor Red}
$config=Read-DotEnv (Join-Path $ProjectRoot '.env')
if(!$config.Count){$config=Read-DotEnv (Join-Path $ProjectRoot '.env.example')}
$url=$config['VITE_SUPABASE_URL']; if(!$url){$url=$config['SUPABASE_URL']}
$key=$config['VITE_SUPABASE_PUBLISHABLE_KEY']; if(!$key){$key=$config['SUPABASE_PUBLISHABLE_KEY']}; if(!$key){$key=$config['SUPABASE_ANON_KEY']}
if(!$url -or !$key){Fail 'Supabase URL/publishable key not found.'; exit 1}
$headers=@{apikey=$key}
Write-Host "Project: $url"
try { $r=Invoke-WebRequest -UseBasicParsing -Uri "$url/auth/v1/settings" -Headers $headers -Method Get -TimeoutSec 20; if($r.StatusCode -eq 200){Ok 'Supabase Auth endpoint is reachable.'} else {Warn "Auth returned HTTP $($r.StatusCode)."} } catch { Fail "Auth endpoint failed: $($_.Exception.Message)" }
try { $r=Invoke-WebRequest -UseBasicParsing -Uri "$url/rest/v1/sources?select=id&limit=1" -Headers $headers -Method Get -TimeoutSec 20; if($r.StatusCode -eq 200){Ok 'LLM Bible schema is installed (public.sources reachable).'; $data=$r.Content|ConvertFrom-Json; if($data.Count -gt 0){Ok 'Research seed data is present.'} else {Warn 'Schema exists but research seed is empty. Run supabase/research_seed.sql.'} } else {Warn "Research table returned HTTP $($r.StatusCode)."} } catch { Warn 'LLM Bible research tables are not reachable yet. Run backend-bootstrap.cmd and schema.sql.' }
Write-Host "`nBrowser login page: https://ko9ma7.github.io/llm-bible-community/#/account"
