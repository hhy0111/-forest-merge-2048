$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $repoRoot 'image'
$outputRoot = Join-Path $repoRoot 'assets\images\store_listing'
$brandingDir = Join-Path $outputRoot 'branding'
$screenshotsDir = Join-Path $outputRoot 'phone_screenshots'

foreach ($dir in @($outputRoot, $brandingDir, $screenshotsDir)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

function Get-ImageFiles {
  return Get-ChildItem -Path $sourceDir -File -Filter '*.png'
}

function Get-ImageSize {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $image = [System.Drawing.Image]::FromFile($Path)
  try {
    return [pscustomobject]@{ Width = $image.Width; Height = $image.Height }
  }
  finally {
    $image.Dispose()
  }
}

function Find-SourceImage {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Width,

    [Parameter(Mandatory = $true)]
    [int]$Height
  )

  foreach ($file in Get-ImageFiles) {
    $size = Get-ImageSize -Path $file.FullName
    if ($size.Width -eq $Width -and $size.Height -eq $Height) {
      return $file.FullName
    }
  }

  throw "Could not find source image ${Width}x${Height} in $sourceDir"
}

$iconSource = Find-SourceImage -Width 1024 -Height 1024
$featureSource = Find-SourceImage -Width 1536 -Height 1024

$screenshots = @(
  @{ SourceWidth = 468; SourceHeight = 880; Output = '01_lobby_home_1080x1920.jpg'; Label = 'Lobby / Home' }
  @{ SourceWidth = 401; SourceHeight = 840; Output = '02_upgrade_1080x1920.jpg'; Label = 'Upgrade' }
  @{ SourceWidth = 462; SourceHeight = 957; Output = '03_main_game_1080x1920.jpg'; Label = 'Main Game' }
  @{ SourceWidth = 394; SourceHeight = 788; Output = '04_bonus_mode_1080x1920.jpg'; Label = 'Bonus Mode' }
  @{ SourceWidth = 407; SourceHeight = 789; Output = '05_result_reward_1080x1920.jpg'; Label = 'Result / Reward' }
)

function Get-JpegEncoder {
  return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } |
    Select-Object -First 1
}

function Save-Jpeg {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Bitmap]$Bitmap,

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [int]$Quality = 92
  )

  $encoder = Get-JpegEncoder
  $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $qualityParam = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality,
    [long]$Quality
  )
  $encoderParams.Param[0] = $qualityParam
  $Bitmap.Save($Path, $encoder, $encoderParams)
  $qualityParam.Dispose()
  $encoderParams.Dispose()
}

function New-Graphics {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Bitmap]$Bitmap
  )

  $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return $graphics
}

function Draw-ImageCover {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Graphics]$Graphics,

    [Parameter(Mandatory = $true)]
    [System.Drawing.Image]$Image,

    [Parameter(Mandatory = $true)]
    [System.Drawing.RectangleF]$TargetRect
  )

  $scale = [Math]::Max($TargetRect.Width / $Image.Width, $TargetRect.Height / $Image.Height)
  $drawWidth = $Image.Width * $scale
  $drawHeight = $Image.Height * $scale
  $drawX = $TargetRect.X + (($TargetRect.Width - $drawWidth) / 2)
  $drawY = $TargetRect.Y + (($TargetRect.Height - $drawHeight) / 2)

  $Graphics.DrawImage($Image, [System.Drawing.RectangleF]::new($drawX, $drawY, $drawWidth, $drawHeight))
}

function Draw-ImageContain {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Graphics]$Graphics,

    [Parameter(Mandatory = $true)]
    [System.Drawing.Image]$Image,

    [Parameter(Mandatory = $true)]
    [System.Drawing.RectangleF]$TargetRect
  )

  $scale = [Math]::Min($TargetRect.Width / $Image.Width, $TargetRect.Height / $Image.Height)
  $drawWidth = $Image.Width * $scale
  $drawHeight = $Image.Height * $scale
  $drawX = $TargetRect.X + (($TargetRect.Width - $drawWidth) / 2)
  $drawY = $TargetRect.Y + (($TargetRect.Height - $drawHeight) / 2)

  $Graphics.DrawImage($Image, [System.Drawing.RectangleF]::new($drawX, $drawY, $drawWidth, $drawHeight))
}

function New-RoundedRectPath {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.RectangleF]$Rect,

    [float]$Radius = 32
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-PlayIcon {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $image = [System.Drawing.Image]::FromFile($SourcePath)
  $bitmap = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = New-Graphics -Bitmap $bitmap

  try {
    $graphics.Clear([System.Drawing.Color]::White)
    Draw-ImageCover -Graphics $graphics -Image $image -TargetRect ([System.Drawing.RectangleF]::new(0, 0, 512, 512))
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $image.Dispose()
  }
}

function Save-FeatureGraphic {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $image = [System.Drawing.Image]::FromFile($SourcePath)
  $bitmap = New-Object System.Drawing.Bitmap(1024, 500, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = New-Graphics -Bitmap $bitmap

  try {
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0E2E22'))
    Draw-ImageCover -Graphics $graphics -Image $image -TargetRect ([System.Drawing.RectangleF]::new(0, 0, 1024, 500))
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $image.Dispose()
  }
}

function Save-PhoneScreenshot {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [Parameter(Mandatory = $true)]
    [string]$Label
  )

  $image = [System.Drawing.Image]::FromFile($SourcePath)
  $bitmap = New-Object System.Drawing.Bitmap(1080, 1920, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = New-Graphics -Bitmap $bitmap

  $backgroundRect = [System.Drawing.RectangleF]::new(0, 0, 1080, 1920)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    [System.Drawing.ColorTranslator]::FromHtml('#163B2B'),
    [System.Drawing.ColorTranslator]::FromHtml('#7CA163'),
    90
  )

  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(54, 255, 245, 214))
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 0, 0, 0))
  $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $strokePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(28, 20, 45, 33), 4)
  $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 250, 242))
  $subtitleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, 244, 236, 210))
  $titleFont = New-Object System.Drawing.Font('Segoe UI', 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $stringFormat = New-Object System.Drawing.StringFormat
  $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  try {
    $graphics.FillRectangle($gradient, 0, 0, 1080, 1920)
    $graphics.FillEllipse($glowBrush, 120, 170, 840, 840)

    $graphics.DrawString('Forest Merge 2048', $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(90, 74, 900, 58), $stringFormat)
    $graphics.DrawString($Label, $subtitleFont, $subtitleBrush, [System.Drawing.RectangleF]::new(90, 142, 900, 44), $stringFormat)

    $cardRect = [System.Drawing.RectangleF]::new(170, 250, 740, 1460)
    $shadowRect = [System.Drawing.RectangleF]::new(188, 270, 740, 1460)
    $innerRect = [System.Drawing.RectangleF]::new($cardRect.X + 26, $cardRect.Y + 26, $cardRect.Width - 52, $cardRect.Height - 52)

    $shadowPath = New-RoundedRectPath -Rect $shadowRect -Radius 34
    $cardPath = New-RoundedRectPath -Rect $cardRect -Radius 34

    $graphics.FillPath($shadowBrush, $shadowPath)
    $graphics.FillPath($cardBrush, $cardPath)
    $graphics.DrawPath($strokePen, $cardPath)

    $previousClip = $graphics.Clip
    try {
      $graphics.SetClip($cardPath)
      Draw-ImageContain -Graphics $graphics -Image $image -TargetRect $innerRect
    }
    finally {
      $graphics.Clip = $previousClip
      $previousClip.Dispose()
    }

    Save-Jpeg -Bitmap $bitmap -Path $OutputPath -Quality 92

    $shadowPath.Dispose()
    $cardPath.Dispose()
  }
  finally {
    $gradient.Dispose()
    $glowBrush.Dispose()
    $shadowBrush.Dispose()
    $cardBrush.Dispose()
    $strokePen.Dispose()
    $titleBrush.Dispose()
    $subtitleBrush.Dispose()
    $titleFont.Dispose()
    $subtitleFont.Dispose()
    $stringFormat.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
    $image.Dispose()
  }
}

$iconOutput = Join-Path $brandingDir 'play_store_icon_512.png'
$featureOutput = Join-Path $brandingDir 'play_feature_graphic_1024x500.png'

Save-PlayIcon -SourcePath $iconSource -OutputPath $iconOutput
Save-FeatureGraphic -SourcePath $featureSource -OutputPath $featureOutput

foreach ($item in $screenshots) {
  $sourcePath = Find-SourceImage -Width $item.SourceWidth -Height $item.SourceHeight
  $outputPath = Join-Path $screenshotsDir $item.Output
  Save-PhoneScreenshot -SourcePath $sourcePath -OutputPath $outputPath -Label $item.Label
}

Write-Output "Generated store listing assets in: $outputRoot"
