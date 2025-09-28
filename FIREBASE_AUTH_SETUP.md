# Firebase Authentication Setup - Fix redirect_uri_mismatch

## Problem
You're getting a `redirect_uri_mismatch` error when trying to sign in with Google.

## Solution Steps

### 1. ✅ Updated Firebase Config
The `authDomain` in `src/firebase/config.jsx` has been updated to match your hosting domain:
```javascript
authDomain: "jomach-f6258.web.app"
```

### 2. 🔧 Configure Firebase Console (REQUIRED)

#### A. Authorized Domains
1. Go to [Firebase Console - Authentication Settings](https://console.firebase.google.com/project/jomach-f6258/authentication/settings)
2. Click on the "Authorized domains" tab
3. Make sure these domains are added:
   - ✅ `jomach-f6258.web.app` (production)
   - ✅ `localhost` (local development)
   - ✅ `127.0.0.1` (alternative localhost)

#### B. Google Sign-In Configuration
1. Go to [Firebase Console - Sign-in Methods](https://console.firebase.google.com/project/jomach-f6258/authentication/providers)
2. Click on "Google" provider
3. Make sure it's enabled
4. Verify the authorized redirect URIs include:
   - `https://jomach-f6258.web.app/__/auth/handler`
   - `http://localhost:5173/__/auth/handler`
   - `http://localhost:3000/__/auth/handler`

#### C. OAuth Consent Screen (Google Cloud Console)
1. Go to [Google Cloud Console - OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=jomach-f6258)
2. Add authorized domains:
   - `jomach-f6258.web.app`
   - `localhost`

### 3. ✅ App Deployed
Your app has been built and deployed to: https://jomach-f6258.web.app

### 4. Test Authentication
1. Visit: https://jomach-f6258.web.app
2. Try signing in with Google
3. The error should be resolved

## Common Issues

### If you still get redirect_uri_mismatch:
1. Clear browser cache and cookies
2. Wait 5-10 minutes for Firebase changes to propagate
3. Check that all domains are correctly configured in Firebase Console
4. Verify your app is using the correct authDomain in the config

### For local development:
1. Run `npm run dev` 
2. Note the localhost port (usually 5173)
3. Add `http://localhost:[PORT]` to authorized domains
4. Add `http://localhost:[PORT]/__/auth/handler` to OAuth redirect URIs

## Current Configuration
- **Project ID**: jomach-f6258
- **Auth Domain**: jomach-f6258.web.app
- **Hosting URL**: https://jomach-f6258.web.app
- **App ID**: 1:232881354767:web:1edfc1dece5d736dbacb7a
