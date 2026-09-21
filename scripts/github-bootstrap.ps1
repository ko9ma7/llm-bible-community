param(
  [string]$RepoName = "llm-bible-community",
  [ValidateSet('public','private')][string]$Visibility = 'public'
)
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Need($cmd,$help){ if(-not (Get-Command $cmd -ErrorAction SilentlyContinue)){ throw "$cmd not found. $help" } }
function Read-DotEnv($path){
  $map=@{}
  if(Test-Path $path){
    Get-Content $path | ForEach-Object {
      $line=$_.Trim(); if(!$line -or $line.StartsWith('#') -or !$line.Contains('=')){ return }
      $i=$line.IndexOf('='); $map[$line.Substring(0,$i).Trim()]=$line.Substring($i+1).Trim()
    }
  }
  return $map
}
function Set-DotEnv($path,$key,$value){
  $lines=@(); if(Test-Path $path){ $lines=Get-Content $path }
  $found=$false
  $out=@($lines | ForEach-Object { if($_ -match "^$([regex]::Escape($key))="){ $found=$true; "$key=$value" } else { $_ } })
  if(!$found){ $out += "$key=$value" }
  Set-Content -LiteralPath $path -Value $out -Encoding UTF8
}
function Run($label,[scriptblock]$block){
  Step $label
  & $block
  $code = $LASTEXITCODE
  if($code -ne 0){ throw "$label failed (exit $code)" }
}
function Test-Native([scriptblock]$block){
  # Expected non-zero exit codes (404/not configured/not found) are probes, not fatal errors.
  # Windows PowerShell can promote native stderr to an ErrorRecord when ErrorActionPreference=Stop,
  # so temporarily relax it and return only the process exit status.
  $previous = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    & $block
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previous
  }
  return ($code -eq 0)
}

Step 'Checking required tools'
Need git 'Install Git for Windows: https://git-scm.com/'
Need node 'Install Node.js LTS: https://nodejs.org/'
Need npm 'Install Node.js LTS: https://nodejs.org/'
Need gh 'Install GitHub CLI: winget install --id GitHub.cli'
Ok (git --version)
Ok (node --version)
Ok (npm --version)

$envPath = Join-Path $ProjectRoot '.env'
if(-not (Test-Path $envPath)){
  Copy-Item (Join-Path $ProjectRoot '.env.example') $envPath
  Warn '.env was created from .env.example. Add Supabase URL/publishable key when ready; GitHub Pages can deploy in static preview mode without them.'
}
$config = Read-DotEnv $envPath

Step 'Checking GitHub authentication'
if(-not (Test-Native { gh auth status *> $null })){ Run 'GitHub CLI login' { gh auth login } }
$owner=(gh api user --jq .login).Trim()
if(!$owner){ throw 'Could not determine GitHub username.' }
$fullRepo="$owner/$RepoName"
$deployUrl = if($RepoName -ieq "$owner.github.io"){ "https://$owner.github.io" } else { "https://$owner.github.io/$RepoName" }
Set-DotEnv $envPath 'VITE_SITE_URL' $deployUrl
Set-DotEnv $envPath 'VITE_REPO_NAME' $RepoName
$config = Read-DotEnv $envPath
Ok "Repository: $fullRepo"
Ok "Pages URL: $deployUrl"

if(-not (Test-Path (Join-Path $ProjectRoot '.git'))){ Run 'Initializing Git' { git init } }
Run 'Selecting main branch' { git branch -M main }

# Ensure a fresh Windows machine can create the first commit without requiring global Git identity.
$localGitName = (git config --get user.name 2>$null)
$localGitEmail = (git config --get user.email 2>$null)
if(!$localGitName){ git config user.name $owner; Ok "Local Git user.name set to $owner" }
if(!$localGitEmail){
  $githubId = (gh api user --jq .id).Trim()
  $noreply = "$githubId+$owner@users.noreply.github.com"
  git config user.email $noreply
  Ok "Local Git user.email set to GitHub noreply address"
}
if(Test-Path package-lock.json){ Run 'Installing dependencies' { npm ci } } else { Run 'Installing dependencies' { npm install } }
Run 'Running checks and production build' { npm run build }

Step 'Creating or reusing GitHub repository'
if(-not (Test-Native { gh api "repos/$fullRepo" *> $null })){
  if($Visibility -eq 'private'){ Run 'Creating private repository' { gh repo create $fullRepo --private --description 'LLM Bible - evidence-first AI/LLM knowledge base and moderated prompt community' } }
  else { Run 'Creating public repository' { gh repo create $fullRepo --public --description 'LLM Bible - evidence-first AI/LLM knowledge base and moderated prompt community' } }
} else { Ok 'Existing repository detected.' }

$remote="https://github.com/$fullRepo.git"
$origin=''
if((git remote) -contains 'origin'){ $origin=(git remote get-url origin).Trim() }
if(!$origin){ Run 'Adding origin' { git remote add origin $remote } }
elseif($origin.Trim() -ne $remote){ Run 'Updating origin' { git remote set-url origin $remote } }

Step 'Applying repository About / Homepage / Topics'
& gh repo edit $fullRepo --description 'LLM Bible - evidence-first AI/LLM knowledge base and moderated prompt/result community' --homepage "$deployUrl/" --enable-issues --enable-wiki=false --enable-projects=false
foreach($topic in @('github-pages','llm','prompt-engineering','supabase','ai','rag','community','webp','webm')){ & gh repo edit $fullRepo --add-topic $topic *> $null }
Ok 'Repository presentation configured.'

Step 'Setting GitHub Actions variables'
$vars=@('VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','VITE_SITE_URL','VITE_REPO_NAME')
foreach($name in $vars){
  $value=$config[$name]
  if($value -and !$value.Contains('REPLACE_ME') -and !$value.Contains('YOUR_PROJECT')){ $value | gh variable set $name --repo $fullRepo; Ok "Variable $name set." }
  else { Warn "Variable $name is not configured; skipped." }
}

Step 'Committing project'
git add -A
& git diff --cached --quiet
if($LASTEXITCODE -ne 0){ Run 'Creating commit' { git commit -m 'Build LLM Bible community service' } } else { Ok 'No local changes to commit.' }

Step 'Reconciling remote history without force push'
if(Test-Native { git fetch origin main *> $null }){
  if(-not (Test-Native { git merge-base HEAD origin/main *> $null })){
    Warn 'Remote main has unrelated history. Creating a non-destructive merge while keeping this project files.'
    & git merge origin/main --allow-unrelated-histories -s ours -m 'Reconcile existing remote history'
    if($LASTEXITCODE -ne 0){ throw 'Could not reconcile existing remote history.' }
  } else {
    & git merge origin/main --no-edit
    if($LASTEXITCODE -ne 0){ throw 'Remote main contains conflicting changes. Resolve them manually and rerun.' }
  }
}
Run 'Pushing main branch' { git push -u origin main }

Step 'Enabling GitHub Pages with Actions'
if(Test-Native { gh api -X POST "repos/$fullRepo/pages" -f build_type=workflow *> $null }){ Ok 'GitHub Pages enabled.' } else { Warn 'Pages may already be enabled; continuing.' }
if(Test-Native { gh workflow run deploy.yml --repo $fullRepo *> $null }){ Ok 'Deploy workflow dispatched.' } else { Warn 'Workflow dispatch did not start; the push event will still trigger deployment.' }

Step 'Creating release tag if missing'
$tag='v2.0.3'
if(-not (Test-Native { gh release view $tag --repo $fullRepo *> $null })) {
  Run "Creating release $tag" { gh release create $tag --repo $fullRepo --title 'LLM Bible Community v2.0.3' --notes 'Fix curated knowledge schema mismatch, add static corpus validation, and cache-bust deployed app assets.' }
} else { Ok "Release $tag already exists." }

Write-Host "`nDONE" -ForegroundColor Green
Write-Host "Repository: https://github.com/$fullRepo"
Write-Host "Pages:      $deployUrl/"
Write-Host "`nIf Supabase is not configured yet, run backend-bootstrap.cmd after creating the project." -ForegroundColor Yellow
