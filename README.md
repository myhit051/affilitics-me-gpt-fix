# 🚀 Affilitics.me

**Advanced Affiliate Marketing Analytics Platform**

Affilitics.me เป็นแพลตฟอร์มวิเคราะห์ข้อมูล affiliate marketing ที่ทรงพลัง ช่วยให้คุณติดตาม วิเคราะห์ และเพิ่มประสิทธิภาพแคมเปญโฆษณาได้อย่างมืออาชีพ

## ✨ Features

### 📊 Dashboard & Analytics
- **Real-time Performance Tracking** - ติดตามผลการดำเนินงานแบบเรียลไทม์
- **ROI Analysis** - วิเคราะห์ผลตอบแทนการลงทุน
- **Campaign Comparison** - เปรียบเทียบประสิทธิภาพแคมเปญ
- **Interactive Charts** - กราฟแสดงผลแบบโต้ตอบ

### 🔗 Facebook Ads Integration
- **Seamless Connection** - เชื่อมต่อกับ Facebook Ads Manager
- **Auto Data Sync** - ซิงค์ข้อมูลอัตโนมัติ
- **Multi-Account Support** - รองรับหลายบัญชีโฆษณา
- **Campaign Insights** - ข้อมูลเชิงลึกของแคมเปญ

### 📈 Data Management
- **Excel Import/Export** - นำเข้า/ส่งออกข้อมูล Excel
- **Data Validation** - ตรวจสอบความถูกต้องของข้อมูล
- **Automated Reports** - รายงานอัตโนมัติ
- **Historical Data** - ข้อมูลย้อนหลัง

### 🎯 Advanced Analytics
- **Sub-ID Tracking** - ติดตาม Sub-ID แบบละเอียด
- **Platform Filtering** - กรองข้อมูลตามแพลตฟอร์ม
- **Performance Metrics** - เมตริกประสิทธิภาพครบถ้วน
- **Trend Analysis** - วิเคราะห์แนวโน้ม

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Modern UI components

### State Management
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Charts & Visualization
- **Recharts** - Chart library
- **Lucide React** - Icon library

### Facebook Integration
- **Facebook Graph API** - Data access
- **OAuth 2.0 + PKCE** - Secure authentication
- **Token Encryption** - Secure token storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Facebook Developer Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd affilitics-me
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
   VITE_FACEBOOK_API_VERSION=v19.0
   VITE_FACEBOOK_REDIRECT_URI=http://localhost:8080/auth/facebook/callback
   VITE_FACEBOOK_SCOPES=ads_read,ads_management
   ```

4. **Configure Facebook App**
   - Go to [Facebook Developer Console](https://developers.facebook.com/apps/)
   - Create or select your app
   - Add Facebook Login product
   - Set OAuth Redirect URI: `http://localhost:8080/auth/facebook/callback`
   - Add Privacy Policy URL: `http://localhost:8080/privacy-policy.html`
   - Add Terms of Service URL: `http://localhost:8080/terms-of-service.html`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:8080
   ```

## 📖 Documentation

### Setup Guides
- [Facebook App Setup](./FACEBOOK_APP_ACTIVATION_GUIDE.md) - Complete Facebook App configuration
- [Quick Fix Guide](./FACEBOOK_QUICK_FIX.md) - Solve common issues quickly
- [Configuration Guide](./FACEBOOK_CONFIG.md) - Detailed configuration options

### API Documentation
- [Facebook Integration](./src/lib/facebook-api-service.ts) - Facebook API integration
- [Data Models](./src/types/facebook.ts) - TypeScript type definitions
- [Configuration](./src/config/facebook.ts) - App configuration

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── FacebookConnectionPanel.tsx
│   ├── CampaignTable.tsx
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Route components
├── types/              # TypeScript definitions
├── utils/              # Helper functions
└── config/             # Configuration files
```

## 🔐 Security

### Authentication
- **OAuth 2.0 with PKCE** - Industry standard security
- **Token Encryption** - Encrypted token storage
- **Session Management** - Secure session handling
- **CSRF Protection** - Cross-site request forgery protection

### Data Protection
- **Local Storage Encryption** - Encrypted local data
- **Secure API Calls** - HTTPS only
- **Rate Limiting** - API rate limit protection
- **Error Handling** - Secure error messages

## 🌐 Deployment

### GitHub Pages (Live Demo)
The application is automatically deployed to GitHub Pages:
- **Live URL**: https://myhit051.github.io/affilitics-me-2.5.57/
- **Auto-deployment**: Triggered on every push to `main` branch
- **Build process**: GitHub Actions workflow handles build and deployment

### Production Build
```bash
npm run build:pages    # Build for GitHub Pages
npm run build          # Standard build
```

### Environment Variables (Production)
```env
VITE_FACEBOOK_APP_ID=your_production_app_id
VITE_FACEBOOK_REDIRECT_URI=https://myhit051.github.io/affilitics-me-2.5.57/auth/facebook/callback
VITE_DEBUG_FACEBOOK=false
```

### Facebook App (Production)
- Switch app to Live mode
- Update redirect URIs to production URLs:
  - `https://myhit051.github.io/affilitics-me-2.5.57/auth/facebook/callback`
- Submit for App Review if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- [Facebook Setup Issues](./FACEBOOK_QUICK_FIX.md)
- [Configuration Problems](./FACEBOOK_CONFIG.md)
- [API Connection Issues](./FACEBOOK_APP_ACTIVATION_GUIDE.md)

### Getting Help
- Check the [Setup Complete Guide](./SETUP_COMPLETE.md)
- Use the built-in Configuration Checker
- Review Browser Console for errors
- Check Facebook App Settings

---

**Made with ❤️ for Affiliate Marketers**

Transform your affiliate marketing with powerful analytics and insights!