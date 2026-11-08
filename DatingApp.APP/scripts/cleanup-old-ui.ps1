# Moves the pre-Figma UI files out of src/ into ..\_backup_pre_figma\
# Run once from the DatingApp.APP folder:
#   powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-old-ui.ps1
$ErrorActionPreference = "Stop"
$app = Split-Path -Parent $PSScriptRoot
$backup = Join-Path (Split-Path -Parent $app) "_backup_pre_figma\DatingApp.APP\src\components"
New-Item -ItemType Directory -Force -Path $backup | Out-Null

$old = @(
  "AuthOnboardingModal.tsx", "CommunityMatches.tsx", "CtaRegisterBanner.tsx",
  "DecorativeHeartBackground.tsx", "FaqSection.tsx", "FeaturedProfiles.tsx",
  "Footer.tsx", "HeroSection.tsx", "Navbar.tsx", "PricingPlans.tsx",
  "ProfileDetailModal.tsx", "RegisterSignInModal.tsx", "RegistrationFlow.tsx",
  "SuccessStories.tsx", "ValueCards.tsx"
)
foreach ($f in $old) {
  $src = Join-Path $app "src\components\$f"
  if (Test-Path $src) {
    Move-Item -Force $src (Join-Path $backup $f)
    Write-Host "moved  src\components\$f"
  }
}
$doc = Join-Path $app "REGISTRATION_UI.md"
if (Test-Path $doc) { Move-Item -Force $doc (Join-Path (Split-Path -Parent $backup) "..\REGISTRATION_UI.md"); Write-Host "moved  REGISTRATION_UI.md (now in README.md)" }
Write-Host "Done. Run: npm install ; npm run check"
