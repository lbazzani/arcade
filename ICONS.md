# Bazzani Arcade - Icons & Branding

## Generated Icons

All app icons have been automatically generated using the script in `scripts/generate-icons.js`.

### Icon Files

- **icon.png** (1024x1024) - Main app icon for iOS
- **splash-icon.png** (800x800) - Splash screen logo
- **android-icon-foreground.png** (1024x1024) - Android adaptive icon foreground
- **android-icon-background.png** (1024x1024) - Android adaptive icon background (black)
- **android-icon-monochrome.png** (1024x1024) - Android monochrome icon for themed icons
- **favicon.png** (48x48) - Web favicon

## Branding Colors

- **Primary Cyan**: `#00D4FF` - Logo background, accents
- **Orange**: `#FF6600` - "ARCADE" text, secondary accent
- **Black**: `#000000` - Background, text on cyan
- **White**: `#FFFFFF` - Primary text on dark backgrounds

## Logo Design

The logo consists of:
- A cyan square with rounded corners
- Bold black letter "B" in the center
- Typography: Heavy weight, sans-serif

## Regenerating Icons

If you need to regenerate the icons:

```bash
node scripts/generate-icons.js
```

This will recreate all icon files in `assets/images/`.

## App Configuration

The icons are configured in `app.json`:
- App name: "Bazzani Arcade"
- Bundle ID (iOS): `com.bazzani.arcade`
- Package (Android): `com.bazzani.arcade`
- UI Style: Dark mode
- Splash background: Black (#000000)

## Testing

After generating icons, restart the Expo development server to see the changes:

```bash
npm start
```

Then clear the app cache if needed:
- Press `shift + r` in the terminal to reload
- Or close and reopen the app on your device
