# แก้ไขปัญหา Facebook "App not active" แบบเร็ว

## ปัญหาที่พบ
- ✅ Facebook App ID: 1264041048749910 (ตั้งค่าแล้ว)
- ❌ "App not active" - แอพยังไม่เปิดใช้งาน
- ❌ "URL ของนโยบายความเป็นส่วนตัวไม่ถูกต้อง"

## วิธีแก้ไขเร็ว (5 นาที)

### 1. เปิด Facebook Developer Console
```
https://developers.facebook.com/apps/1264041048749910/
```

### 2. ไปที่ Settings → Basic
กรอกข้อมูลเหล่านี้:

**Display Name:**
```
Affilitics.me
```

**App Domains:**
```
localhost
```

**Privacy Policy URL:**
```
http://localhost:8080/privacy-policy.html
```

**Terms of Service URL:**
```
http://localhost:8080/terms-of-service.html
```

**Category:** เลือก `Business`

### 3. เพิ่ม Facebook Login (ถ้ายังไม่มี)
1. ไปที่ Products → Add Product
2. เลือก Facebook Login → Set Up
3. เลือก Web platform

### 4. ตั้งค่า OAuth Redirect URI
1. ไปที่ Facebook Login → Settings
2. เพิ่ม Valid OAuth Redirect URI:
```
http://localhost:8080/auth/facebook/callback
```

### 5. เพิ่มตัวเองเป็น App Tester (วิธีเร็วที่สุด)
1. ไปที่ Roles → Roles
2. คลิก Add People
3. เพิ่มบัญชี Facebook ของคุณเป็น Administrator
4. Accept invitation ใน Facebook notifications

### 6. Save Changes และทดสอบ
1. Save Changes ในทุกหน้า
2. กลับมาที่แดชบอร์ด
3. คลิก "Connect Facebook" อีกครั้ง

## ไฟล์ที่เตรียมไว้ให้แล้ว ✅
- `public/privacy-policy.html` - นโยบายความเป็นส่วนตัว
- `public/terms-of-service.html` - ข้อกำหนดการใช้งาน

## ตรวจสอบไฟล์ Policy
เปิดลิงก์เหล่านี้ในเบราว์เซอร์:
- http://localhost:8080/privacy-policy.html
- http://localhost:8080/terms-of-service.html

ถ้าเปิดไม่ได้ = เซิร์ฟเวอร์ไม่ทำงาน → รัน `npm run dev`

## หลังจากแก้ไขแล้ว
1. ✅ Popup Facebook จะเปิดได้
2. ✅ สามารถล็อกอินและอนุญาตสิทธิ์ได้
3. ✅ เชื่อมต่อสำเร็จและแสดงรายการ Ad Accounts

## หากยังมีปัญหา
1. ตรวจสอบว่า popup ไม่ถูกบล็อก
2. ลองใช้ Incognito/Private browsing
3. Clear browser cache และ cookies
4. ตรวจสอบ Browser Console สำหรับ error messages

## สำหรับ Production
เมื่อพร้อมใช้งานจริง:
1. เปลี่ยน App Domains เป็น domain จริง
2. เปลี่ยน URLs เป็น https://yourdomain.com/...
3. Switch app เป็น Live mode
4. Submit for App Review (ถ้าต้องการ advanced permissions)