# ❌ Google Login Failure - Complete Fix Guide

## Current Configuration Status
✅ Client ID configured: `54121291680-hdijcj3c5cv5m5hgkkqipvqst7d34jem.apps.googleusercontent.com`
✅ Server ID matches: Same ID in both files
❓ **Issue**: Likely missing **Authorized Origins** in Google Cloud Console

---

## Root Cause
Google OAuth requires you to explicitly allow certain domains/origins. Without proper configuration, the login will fail silently.

---

## STEP 1: Fix Google Cloud Console Configuration

### 1.1 Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (likely "Cognitive" or similar)
3. Go to **APIs & Services** → **Credentials**

### 1.2 Find Your OAuth Client
1. Look for **"OAuth 2.0 Client IDs"** section
2. Click on the client ID: `54121291680-hdijcj3c5cv5m5hgkkqipvqst7d34jem.apps.googleusercontent.com`

### 1.3 Add Authorized Origins
In the **"Authorized JavaScript origins"** section, add BOTH:
```
http://localhost:5173
http://localhost:3000
```

In the **"Authorized redirect URIs"** section, add:
```
http://localhost:5173
http://localhost:5001
```

### 1.4 Save Changes
Click **"Save"** button

---

## STEP 2: Restart Both Servers

Open two terminal windows and run:

**Terminal 1 (Client):**
```bash
cd c:\Project\MiniProject\client
npm run dev
```

**Terminal 2 (Server):**
```bash
cd c:\Project\MiniProject\server
npm start
```

Wait 30 seconds for both to start.

---

## STEP 3: Test Google Login

1. Go to `http://localhost:5173/login`
2. Click the **"Sign in with Google"** button
3. You should see a Google popup (not an error)
4. Select your Google account
5. You should be redirected to the dashboard ✅

---

## If Still Getting "Login Failed" Error

### Check the Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for error messages starting with:
   - `Google authentication popup failed`
   - `Google did not return a credential`
   - Any network errors

### Check the Server Logs
1. Look at the Terminal running `npm start`
2. Look for error messages like:
   - `Google client mismatch`
   - `audience` error
   - `token expired`

### Common Fixes

**If you see "popup failed" error:**
- Check Authorized JavaScript Origins in Google Cloud
- Make sure http://localhost:5173 is added
- Clear browser cache (Ctrl+Shift+Delete)

**If you see "audience mismatch" error:**
- Check that VITE_GOOGLE_CLIENT_ID matches GOOGLE_CLIENT_ID in server/.env
- They should be identical (both are `54121291680-...`)

**If you see "token expired" error:**
- Check system time is correct on your computer
- Try again after 30 seconds

---

## STEP 4: For Production Deployment

When deploying to production, add your production domain:

**In Google Cloud Console, add:**
```
https://yourdomain.com
https://www.yourdomain.com
```

**In client/.env:**
```
VITE_GOOGLE_CLIENT_ID=54121291680-hdijcj3c5cv5m5hgkkqipvqst7d34jem.apps.googleusercontent.com
VITE_API_URL=https://api.yourdomain.com/api  (or your actual API URL)
```

---

## Quick Checklist

- [ ] Added `http://localhost:5173` to Authorized JavaScript Origins
- [ ] Added `http://localhost:5001` to Authorized Redirect URIs (optional but recommended)
- [ ] Saved changes in Google Cloud Console
- [ ] Restarted client (npm run dev)
- [ ] Restarted server (npm start)
- [ ] Cleared browser cache
- [ ] Waited 30 seconds for changes to propagate
- [ ] Tested login on `http://localhost:5173/login`

---

## Still Not Working?

Run the diagnostic script:
```bash
cd c:\Project\MiniProject\server
node -e "console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID); console.log('Status:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing')"
```

Should output your Google Client ID.
