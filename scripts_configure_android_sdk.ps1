$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$androidProject = Join-Path $root 'android-wrapper'
$localProps = Join-Path $androidProject 'local.properties'

$candidates = @()
if ($env:ANDROID_HOME) { $candidates += $env:ANDROID_HOME }
if ($env:ANDROID_SDK_ROOT) { $candidates += $env:ANDROID_SDK_ROOT }
$candidates += (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
$candidates += (Join-Path $root 'android-sdk')
$candidates += 'C:\Android\Sdk'

$sdkPath = $null
foreach ($path in $candidates | Select-Object -Unique) {
  if ([string]::IsNullOrWhiteSpace($path)) { continue }
  if (Test-Path $path) {
    $sdkPath = (Resolve-Path $path).Path
    break
  }
}

if (-not $sdkPath) {
  Write-Error "Android SDK not found. Install Android Studio SDK first, then run this script again."
}

$normalized = $sdkPath.Replace('\', '/')
"sdk.dir=$normalized" | Set-Content -Path $localProps -Encoding ascii
Write-Output "Configured Android SDK: $sdkPath"
