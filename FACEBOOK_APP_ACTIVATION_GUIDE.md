# คู่มือการเปิดใช้งาน Facebook App

## ปัญหาที่พบ
- "App not active" - แอพยังไม่เปิดใช้งาน
- "URL ของนโยบายความเป็นส่วนตัวไม่ถูกต้อง"

## วิธีแก้ไขแบบทีละขั้นตอน

### ขั้นตอนที่ 1: เข้าสู่ Facebook Developer Console
1. ไปที่ https://developers.facebook.com/apps/
2. เลือกแอพของคุณ (App ID: 1264041048749910)

### ขั้นตอนที่ 2: ตั้งค่าข้อมูลพื้นฐานของแอพ
1. ไปที่ **Settings** → **Basic**
2. กรอกข้อมูลดังนี้:

#### ข้อมูลที่จำเป็น:
- **Display Name**: `Affilitics.me`
- **App Domains**: `localhost` (สำหรับ development)
- **Privacy Policy URL**: `http://localhost:8080/privacy-policy.html`
- **Terms of Service URL**: `http://localhost:8080/terms-of-service.html`
- **App Icon**: อัปโหลดรูปไอคอน 1024x1024 pixels
- **Category**: `Business`

#### สำหรับ Production (เมื่อพร้อมใช้งานจริง):
- **App Domains**: `yourdomain.com`
- **Privacy Policy URL**: `https://yourdomain.com/privacy-policy.html`
- **Terms of Service URL**: `https://yourdomain.com/terms-of-service.html`

3. คลิก **Save Changes**

### ขั้นตอนที่ 3: เพิ่มและตั้งค่า Facebook Login
1. ไปที่ **Products** → คลิก **Add Product**
2. หา **Facebook Login** และคลิก **Set Up**
3. เลือก **Web** platform
4. ไปที่ **Facebook Login** → **Settings**
5. ตั้งค่าดังนี้:

#### OAuth Settings:
- **Valid OAuth Redirect URIs**:
  ```
  http://localhost:8080/auth/facebook/callback
  ```
- **Client OAuth Login**: เปิดใช้งาน (Yes)
- **Web OAuth Login**: เปิดใช้งาน (Yes)
- **Force Web OAuth Reauthentication**: ปิดใช้งาน (No)

6. คลิก **Save Changes**

### ขั้นตอนที่ 4: ตั้งค่าสิทธิ์การเข้าถึง (Permissions)
1. ไปที่ **App Review** → **Permissions and Features**
2. ขอสิทธิ์ดังนี้:
   - **ads_read**: สำหรับอ่านข้อมูลโฆษณา
   - **ads_management**: สำหรับจัดการแคมเปญ

### ขั้นตอนที่ 5: เปิดใช้งานแอพ (App Activation)
1. ไปที่ **Settings** → **Basic**
2. ที่ด้านบนของหน้า จะเห็นสถานะ **"In Development"**
3. คลิกปุ่ม **"Switch to Live"** หรือ **"Make Public"**

⚠️ **หมายเหตุ**: ก่อนเปิดใช้งานจริง ต้องมีข้อมูลครบถ้วน:
- Privacy Policy URL
- Terms of Service URL
- App Icon
- App Description

### ขั้นตอนที่ 6: ตรวจสอบสถานะแอพ
1. ไปที่ **Settings** → **Basic**
2. ตรวจสอบว่าสถานะเป็น **"Live"** แล้ว
3. ตรวจสอบว่าข้อมูลทั้งหมดถูกต้อง

## การทดสอบในโหมด Development

หากยังไม่พร้อมเปิดใช้งานจริง สามารถทดสอบในโหมด Development ได้:

### เพิ่ม Test Users:
1. ไปที่ **Roles** → **Test Users**
2. คลิก **Add Test Users**
3. สร้าง test user และใช้บัญชีนี้ในการทดสอบ

### เพิ่ม App Testers:
1. ไปที่ **Roles** → **Roles**
2. เพิ่มบัญชี Facebook ของคุณเป็น **Administrator** หรือ **Developer**
3. บัญชีที่เพิ่มจะสามารถใช้งานแอพในโหมด Development ได้

## ไฟล์ที่เตรียมไว้ให้แล้ว

ผมได้สร้างไฟล์ที่จำเป็นไว้ให้แล้ว:
- `public/privacy-policy.html` - นโยบายความเป็นส่วนตัว
- `public/terms-of-service.html` - ข้อกำหนดการใช้งาน

URL ที่ใช้:
- Privacy Policy: `http://localhost:8080/privacy-policy.html`
- Terms of Service: `http://localhost:8080/terms-of-service.html`

## การแก้ไขปัญหาเฉพาะ

### ปัญหา: "App not active"
**วิธีแก้:**
1. ตรวจสอบว่ากรอกข้อมูลครบใน Settings → Basic
2. เพิ่มบัญชีของคุณเป็น App Tester
3. หรือเปิดใช้งานแอพเป็น Live Mode

### ปัญหา: "URL ของนโยบายความเป็นส่วนตัวไม่ถูกต้อง"
**วิธีแก้:**
1. ใส่ URL: `http://localhost:8080/privacy-policy.html`
2. ตรวจสอบว่าไฟล์เข้าถึงได้จริง
3. Save Changes ใน Facebook App Settings

### ปัญหา: "Invalid redirect URI"
**วิธีแก้:**
1. ตรวจสอบ OAuth Redirect URI: `http://localhost:8080/auth/facebook/callback`
2. ตรวจสอบว่า URL ตรงกับที่ตั้งค่าในแอพ
3. ไม่มี trailing slash (/)

## การตรวจสอบการตั้งค่า

รันคำสั่งนี้เพื่อตรวจสอบว่าไฟล์ policy เข้าถึงได้:
```bash
curl http://localhost:8080/privacy-policy.html
curl http://localhost:8080/terms-of-service.html
```

## ขั้นตอนสุดท้าย

1. ✅ ตั้งค่าข้อมูลพื้นฐานครบถ้วน
2. ✅ เพิ่ม Facebook Login product
3. ✅ ตั้งค่า OAuth Redirect URI
4. ✅ เพิ่มตัวเองเป็น App Tester (สำหรับ Development)
5. ✅ หรือเปิดใช้งานแอพเป็น Live (สำหรับ Production)

หลังจากทำตามขั้นตอนเหล่านี้แล้ว การเชื่อมต่อ Facebook ควรทำงานได้ปกติ!