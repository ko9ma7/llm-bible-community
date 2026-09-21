$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
function Read-DotEnv($path){ $map=@{}; if(Test-Path $path){ Get-Content $path | ForEach-Object { $line=$_.Trim(); if($line -and !$line.StartsWith('#') -and $line.Contains('=')){ $i=$line.IndexOf('='); $map[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim() } } }; return $map }
function Header($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }

$manifestPath=Join-Path $ProjectRoot 'supabase/seed-parts/MANIFEST.json'
if(!(Test-Path $manifestPath)){ throw 'seed-parts are missing. Run npm run data first.' }
$manifest=Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$config=Read-DotEnv (Join-Path $ProjectRoot '.env')
if(!$config.Count){ $config=Read-DotEnv (Join-Path $ProjectRoot '.env.example') }
$url=$config['VITE_SUPABASE_URL']; if(!$url){$url=$config['SUPABASE_URL']}
$projectRef=$null
if($url -and $url -match '^https://([a-z0-9-]+)\.supabase\.co'){ $projectRef=$matches[1] }
$sqlUrl=if($projectRef){"https://supabase.com/dashboard/project/$projectRef/sql/new"}else{'https://supabase.com/dashboard'}

$groups=[ordered]@{
  '1'='sources'
  '2'='prompts'
  '3'='skills'
  '4'='mcp'
  '5'='recipes'
  '6'='failures'
}

while($true){
  Header 'LLM Bible category seed helper'
  Write-Host 'DB mirror는 선택 사항입니다. 정적 웹의 지식 데이터는 JSON shard에서 바로 동작합니다.' -ForegroundColor DarkGray
  Write-Host '1. Sources / provenance (먼저 1회 권장)'
  Write-Host '2. Prompt Library (12개 파트)'
  Write-Host '3. Skills / Plugins (12개 파트)'
  Write-Host '4. MCP / Tool Calling starters (6개 파트)'
  Write-Host '5. Agent / Practical Recipes (7개 파트)'
  Write-Host '6. Failure / Troubleshooting (6개 파트)'
  Write-Host 'Q. 종료'
  $g=(Read-Host '선택').Trim().ToUpper()
  if($g -eq 'Q'){ break }
  if(!$groups.Contains($g)){ Warn '잘못된 선택입니다.'; continue }
  $collection=$groups[$g]
  $parts=@($manifest.parts | Where-Object {$_.collection -eq $collection})
  if(!$parts.Count){ Warn '해당 파트가 없습니다.'; continue }
  if($collection -eq 'sources'){
    $part=$parts[0]
  } else {
    Header "$collection category list"
    for($i=0;$i -lt $parts.Count;$i++){
      $kb=[math]::Round($parts[$i].bytes/1KB,1)
      Write-Host ("{0,2}. {1}  ({2} records, {3} KB)" -f ($i+1),$parts[$i].file,$parts[$i].count,$kb)
    }
    Write-Host 'B. 뒤로'
    $pick=(Read-Host '한 파트 선택').Trim().ToUpper()
    if($pick -eq 'B'){continue}
    $n=0
    if(-not [int]::TryParse($pick,[ref]$n) -or $n -lt 1 -or $n -gt $parts.Count){Warn '잘못된 번호입니다.'; continue}
    $part=$parts[$n-1]
  }
  $file=Join-Path $ProjectRoot ('supabase/seed-parts/'+$part.file)
  $sql=Get-Content $file -Raw -Encoding UTF8
  if(Get-Command Set-Clipboard -ErrorAction SilentlyContinue){Set-Clipboard $sql; Ok ("클립보드 복사: {0} ({1} records)" -f $part.file,$part.count)}
  else {Warn 'Set-Clipboard를 사용할 수 없습니다. SQL 파일을 직접 여세요.'}
  Start-Process $sqlUrl
  Write-Host 'Supabase SQL Editor에서 Ctrl+V → Run 하세요. 이 파트는 재실행해도 안전합니다.' -ForegroundColor Yellow
  Write-Host ("파일: {0}" -f $file) -ForegroundColor DarkGray
  [void](Read-Host '실행 후 Enter를 눌러 메뉴로 돌아가기')
}
