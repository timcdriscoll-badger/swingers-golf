# ⛳ Swingers — Golf Tee Time Marketplace

**Find golfers. Fill your foursome. Tee it up.**

Swingers is a two-sided marketplace for golf tee times. Hosts post their open tee times with group preferences (pace, vibe, skill level), and players browse and request to join. Payment method verification ensures commitment.

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Deploy to Vercel (Free)

### Option 1: GitHub + Vercel (Recommended)

1. Create a GitHub account if you don't have one: https://github.com
2. Create a new repository and push this code:

```bash
git init
git add .
git commit -m "Initial commit - Swingers golf app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/swingers-golf.git
git push -u origin main
```

3. Go to https://vercel.com and sign up with your GitHub account
4. Click "Add New Project"
5. Import your `swingers-golf` repository
6. Click "Deploy" — that's it!

Vercel will give you a URL like `swingers-golf.vercel.app`. You can add a custom domain later.

### Option 2: Vercel CLI (Quick)

```bash
npm install -g vercel
npm run build
vercel --prod
```

## PWA — Install on Phone

Once deployed, open the URL on your iPhone:
1. Tap the Share button (box with arrow)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"

The app will appear on your home screen and run in standalone mode (no browser chrome).

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Inline styles (no dependencies)
- **PWA**: vite-plugin-pwa (service worker, manifest, offline support)
- **Hosting**: Vercel (free tier)
- **Fonts**: Playfair Display, Oswald, Source Sans 3

## What's Next

To make this a real product, you'll need:

1. **Backend / Database**: Firebase, Supabase, or a custom API
   - User authentication (email, Google, Apple Sign-In)
   - Tee time storage & real-time updates
   - Applicant management
   - Push notifications

2. **Payment Verification**: Stripe Connect, Venmo API, or similar
   - Verify users have linked a payment method
   - Optional: deposit holds for no-show protection

3. **Location Services**: Filter tee times by proximity

4. **Notifications**: Firebase Cloud Messaging for push notifications
   - "New applicant for your tee time"
   - "You've been accepted!"
   - "Tee time reminder"

## License

Private — All rights reserved.
