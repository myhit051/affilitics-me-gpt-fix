# การตั้งค่า Facebook API แบบเร็ว

## ขั้นตอนที่ 1: สร้าง Facebook App

1. ไปที่ [Facebook Developer Console](https://developers.facebook.com/apps/)
2. คลิก "Create App"
3. เลือก "Business" เป็นประเภทแอป
4. กรอกชื่อแอปและอีเมล
5. คลิก "Create App"

## ขั้นตอนที่ 2: เพิ่ม Facebook Login

1. ในหน้า Dashboard ของแอป คลิก "Add Product"
2. หา "Facebook Login" และคลิก "Set Up"
3. เลือก "Web" platform

## ขั้นตอนที่ 3: ตั้งค่า OAuth Redirect URIs

1. ไปที่ Facebook Login > Settings
2. ใน "Valid OAuth Redirect URIs" เพิ่ม:
   ```
   http://localhost:8080/auth/facebook/callback
   ```
3. คลิก "Save Changes"

## ขั้นตอนที่ 4: คัดลอก App ID

1. ไปที่ Settings > Basic
2. คัดลอก "App ID"

## ขั้นตอนที่ 5: ตั้งค่าในโปรเจค

1. เปิดไฟล์ `.env.local`
2. แทนที่:
   ```env
   VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
   ```
   ด้วย App ID ที่คัดลอกมา เช่น:
   ```env
   VITE_FACEBOOK_APP_ID=123456789012345
   ```

## ขั้นตอนที่ 6: รีสตาร์ทเซิร์ฟเวอร์

```bash
npm run dev
```

## ทดสอบการเชื่อมต่อ

1. ไปที่หน้าแดชบอร์ด
2. คลิก "Connect Facebook"
3. จะเปิด popup ขึ้นมาให้ล็อกอิน Facebook
4. อนุญาตสิทธิ์ที่ขอ
5. popup จะปิดและแสดงสถานะเชื่อมต่อสำเร็จ

## หากมีปัญหา

- ตรวจสอบว่า popup ไม่ถูกบล็อก
- ตรวจสอบ App ID ในไฟล์ `.env.local`
- ตรวจสอบ Redirect URI ใน Facebook App Settings
- ดูข้อผิดพลาดใน Browser Console

## สิทธิ์ที่ต้องการ

แอปจะขอสิทธิ์:
- `ads_read`: อ่านข้อมูลโฆษณา
- `ads_management`: จัดการแคมเปญโฆษณา

สิทธิ์เหล่านี้จำเป็นสำหรับการดึงข้อมูลแคมเปญและสถิติจาก Facebook Ads Manager