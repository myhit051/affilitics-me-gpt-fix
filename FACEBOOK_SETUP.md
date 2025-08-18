# Facebook API Setup Guide

This guide will help you set up Facebook API integration for your affiliate marketing dashboard.

## Quick Fix for "Authentication failed" Error

The authentication error you're seeing is because the Facebook App ID is not configured. Here's how to fix it:

### Step 1: Get Your Facebook App ID

1. Go to [Facebook Developer Console](https://developers.facebook.com/apps/)
2. Click "Create App" or select an existing app
3. Choose "Business" as the app type
4. Fill in your app details and create the app
5. Copy your **App ID** from the app dashboard

### Step 2: Configure Your Environment

1. Open the `.env.local` file in your project root
2. Replace the empty `VITE_FACEBOOK_APP_ID=` line with your actual App ID:
   ```env
   VITE_FACEBOOK_APP_ID=your_actual_app_id_here
   ```

### Step 3: Configure Facebook App Settings

1. In your Facebook app dashboard, go to **Facebook Login** > **Settings**
2. Add this URL to **Valid OAuth Redirect URIs**:
   ```
   http://localhost:8080/auth/facebook/callback
   ```
3. For production, also add:
   ```
   https://yourdomain.com/auth/facebook/callback
   ```

### Step 4: Restart Your Development Server

```bash
npm run dev
```

## Complete Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Required: Your Facebook App ID
VITE_FACEBOOK_APP_ID=your_actual_app_id_here

# Optional: API Version (default: v19.0)
VITE_FACEBOOK_API_VERSION=v19.0

# Optional: Redirect URI (auto-generated if not set)
VITE_FACEBOOK_REDIRECT_URI=http://localhost:8080/auth/facebook/callback

# Optional: Permissions (default: ads_read,ads_management)
VITE_FACEBOOK_SCOPES=ads_read,ads_management

# Optional: Enable debug mode for development
VITE_DEBUG_FACEBOOK=true
```

### Facebook App Configuration

1. **App Type**: Business
2. **Products**: Add "Facebook Login"
3. **Permissions**: Request `ads_read` and `ads_management`
4. **OAuth Settings**:
   - Valid OAuth Redirect URIs: `http://localhost:8080/auth/facebook/callback`
   - Client OAuth Login: Yes
   - Web OAuth Login: Yes

### Required Permissions

Your app needs these permissions to access advertising data:
- `ads_read`: Read advertising data
- `ads_management`: Manage advertising campaigns

## Testing Your Configuration

1. After setting up, visit your dashboard
2. Click "Connect Facebook"
3. You should see a Facebook login popup
4. Grant the requested permissions
5. You should be redirected back with a successful connection

## Troubleshooting

### "App ID is not configured" Error
- Check that `VITE_FACEBOOK_APP_ID` is set in `.env.local`
- Make sure you've restarted your development server
- Verify the App ID is correct (no extra spaces or characters)

### "Invalid redirect URI" Error
- Check that your redirect URI matches exactly in Facebook app settings
- Make sure the protocol (http/https) matches
- Verify the port number is correct (8080 for development)

### "Permissions denied" Error
- Make sure your Facebook app has the required permissions approved
- Check that you're granting all requested permissions during login
- Verify your app is not in development mode restrictions

### Popup Blocked Error
- Allow popups for your development domain
- Try disabling popup blockers temporarily
- Use a different browser if the issue persists

## Production Setup

For production deployment:

1. Update your `.env.production` file:
   ```env
   VITE_FACEBOOK_APP_ID=your_actual_app_id_here
   VITE_FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/facebook/callback
   VITE_DEBUG_FACEBOOK=false
   ```

2. Add production redirect URI to Facebook app settings

3. Submit your app for review if using advanced permissions

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your App Secret secure (server-side only)
- Use HTTPS in production
- Regularly rotate your app credentials
- Monitor your app's usage in Facebook Developer Console

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify your Facebook app status in Developer Console
3. Make sure your app has the necessary permissions approved
4. Try the configuration checker in the dashboard

The dashboard includes a built-in configuration checker that will help identify and fix common setup issues.