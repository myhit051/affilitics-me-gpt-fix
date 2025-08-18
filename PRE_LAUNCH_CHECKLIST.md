# 📋 Pre-Launch Checklist - Affilitics.me

## ✅ การตรวจสอบก่อนใช้งาน

### 🔧 Environment Setup
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)
- [ ] App accessible at http://localhost:8080

### 📱 Facebook App Configuration
- [ ] Facebook Developer Account created
- [ ] Facebook App created (ID: 1264041048749910)
- [ ] App basic information completed:
  - [ ] Display Name: `Affilitics.me`
  - [ ] App Domains: `localhost`
  - [ ] Category: `Business`
  - [ ] Privacy Policy URL: `http://localhost:8080/privacy-policy.html`
  - [ ] Terms of Service URL: `http://localhost:8080/terms-of-service.html`
  - [ ] App Icon uploaded (1024x1024px)

### 🔐 Facebook Login Setup
- [ ] Facebook Login product added
- [ ] OAuth Redirect URI configured: `http://localhost:8080/auth/facebook/callback`
- [ ] Client OAuth Login: Enabled
- [ ] Web OAuth Login: Enabled

### 👥 App Access
- [ ] Your Facebook account added as Administrator/Developer
- [ ] Role invitation accepted
- [ ] OR App switched to Live mode (for production)

### 🌐 Environment Variables
- [ ] `.env.local` file created
- [ ] `VITE_FACEBOOK_APP_ID=1264041048749910` set
- [ ] `VITE_FACEBOOK_API_VERSION=v19.0` set
- [ ] `VITE_FACEBOOK_REDIRECT_URI=http://localhost:8080/auth/facebook/callback` set
- [ ] `VITE_FACEBOOK_SCOPES=ads_read,ads_management` set

### 📄 Policy Files
- [ ] Privacy Policy accessible: http://localhost:8080/privacy-policy.html
- [ ] Terms of Service accessible: http://localhost:8080/terms-of-service.html
- [ ] Both files load without errors

### 🧪 Functionality Testing
- [ ] Dashboard loads successfully
- [ ] Configuration checker shows "Ready" status
- [ ] "Connect Facebook" button appears
- [ ] Clicking "Connect Facebook" opens popup
- [ ] Facebook login page loads in popup
- [ ] Can login and authorize permissions
- [ ] Popup closes and shows connection success
- [ ] Ad accounts list appears
- [ ] Can select ad accounts for sync
- [ ] "Sync Data" button works

### 🔍 Error Handling
- [ ] No console errors in browser
- [ ] Error messages are user-friendly
- [ ] Popup blocker warnings work
- [ ] Network error handling works
- [ ] Invalid token handling works

### 📊 Data Integration
- [ ] Campaign data syncs successfully
- [ ] Performance metrics display correctly
- [ ] Charts and graphs render properly
- [ ] Data export functionality works
- [ ] Real-time updates function

### 🎨 UI/UX
- [ ] Responsive design works on mobile
- [ ] Dark/light theme toggle works
- [ ] Loading states display properly
- [ ] Success/error notifications appear
- [ ] Navigation works smoothly

### 🚀 Performance
- [ ] Page load time < 3 seconds
- [ ] API calls complete within reasonable time
- [ ] No memory leaks in browser
- [ ] Smooth scrolling and interactions

## 🔧 Pre-Production Checklist

### 🌍 Production Environment
- [ ] Production domain configured
- [ ] HTTPS certificate installed
- [ ] Environment variables updated for production
- [ ] Facebook App redirect URIs updated
- [ ] Policy URLs updated to production domain

### 📱 Facebook App Production
- [ ] App information completed
- [ ] App icon and description added
- [ ] Privacy Policy and Terms updated
- [ ] App switched to Live mode
- [ ] App Review submitted (if required)

### 🔒 Security
- [ ] All API keys secured
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting implemented

### 📈 Analytics & Monitoring
- [ ] Error tracking setup
- [ ] Performance monitoring enabled
- [ ] User analytics configured
- [ ] Logging system implemented

## 🚨 Common Issues & Solutions

### "App not active"
- ✅ Add yourself as App Tester
- ✅ Or switch app to Live mode
- ✅ Complete all required app information

### "Invalid redirect URI"
- ✅ Check exact URL match in Facebook settings
- ✅ Ensure no trailing slashes
- ✅ Verify protocol (http vs https)

### "Policy URL not accessible"
- ✅ Ensure development server is running
- ✅ Check file exists in public folder
- ✅ Test URL in browser directly

### Popup blocked
- ✅ Allow popups for localhost
- ✅ Try incognito/private mode
- ✅ Check browser popup settings

### Connection fails
- ✅ Check browser console for errors
- ✅ Verify Facebook App ID is correct
- ✅ Ensure all permissions granted

## ✅ Final Verification

### Quick Test Sequence
1. [ ] Open http://localhost:8080
2. [ ] Click "Connect Facebook"
3. [ ] Complete Facebook authorization
4. [ ] Verify connection success
5. [ ] Select ad accounts
6. [ ] Sync data successfully
7. [ ] View campaign data
8. [ ] Export data to Excel

### Success Criteria
- [ ] No errors in browser console
- [ ] Facebook connection established
- [ ] Data syncs without issues
- [ ] UI responds smoothly
- [ ] All features work as expected

---

## 🎉 Ready to Launch!

When all items are checked ✅, your Affilitics.me platform is ready for use!

**Next Steps:**
1. Start analyzing your affiliate marketing campaigns
2. Set up automated data sync schedules
3. Create custom reports and dashboards
4. Scale your affiliate marketing operations

**Happy Marketing! 🚀**