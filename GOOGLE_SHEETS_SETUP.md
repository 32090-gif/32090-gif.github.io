# คู่มือการตั้งค่าระบบ Register เชื่อมต่อ Google Sheets

## ขั้นตอนการตั้งค่า

### 1. สร้าง Google Sheets
1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้างใหม่ (Create new spreadsheet)
3. ตั้งชื่อ Sheet ว่า "Users"
4. ใส่ Header ใน row แรก:
   - A1: First Name
   - B1: Last Name  
   - C1: Email
   - D1: Phone
   - E1: Password
   - F1: Registration Date
   - G1: Status

### 2. แชร์ Google Sheets
1. คลิก "Share" ปุ่มสีเขียวมุมขวาบน
2. เปลี่ยน "Restricted" เป็น "Anyone with the link"
3. เลือก "Viewer" permissions
4. คลิก "Done"

### 3. รับ Spreadsheet ID
1. คัดลอก URL ของ Google Sheets
2. URL จะมีรูปแบบ: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. เอาส่วน [SPREADSHEET_ID] มาใช้

### 4. สร้าง Google API Key
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง Project ใหม่หรือเลือก Project ที่มี
3. ไปที่ "APIs & Services" > "Library"
4. ค้นหาและเปิดใช้งาน "Google Sheets API"
5. ไปที่ "APIs & Services" > "Credentials"
6. คลิก "Create Credentials" > "API Key"
7. คัดลอก API Key ที่ได้

### 5. ตั้งค่า Environment Variables
1. สร้างไฟล์ `.env` ใน root directory
2. เพิ่มข้อมูล:
```
VITE_GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

### 6. รีสตาร์ทเซิร์ฟเวอร์
```bash
npm run dev
```

## การใช้งาน

### สมัครสมาชิก
1. ไปที่ `/register`
2. กรอกข้อมูล
3. ข้อมูลจะถูกบันทึกลง Google Sheets

### เข้าสู่ระบบ
1. ไปที่ `/login`
2. ใส่ email และ password
3. ระบบจะตรวจสอบจาก Google Sheets

## หมายเหตุความปลอดภัย

⚠️ **คำเตือน**: ระบบนี้เป็น Demo เท่านั้น
- รหัสผ่านถูกเก็บแบบ Plain Text (ไม่ปลอดภัย)
- ใช้สำหรับทดสอบเท่านั้น
- สำหรับการใช้งานจริง ควรใช้ Database และเข้ารหัสรหัสผ่าน

## การทดสอบโดยไม่มี Google Sheets

หากไม่ต้องการตั้งค่า Google Sheets:
- ระบบจะใช้ localStorage เพื่อจำลองการทำงาน
- ข้อมูลจะเก็บในเบราว์เซอร์เท่านั้น
- เหมาะสำหรับการทดสอบ

## โครงสร้างข้อมูลใน Google Sheets

| Column | Field | Description |
|--------|--------|-------------|
| A | First Name | ชื่อ |
| B | Last Name | นามสกุล |
| C | Email | อีเมล (ใช้เป็น Username) |
| D | Phone | เบอร์โทร (Optional) |
| E | Password | รหัสผ่าน |
| F | Registration Date | วันที่สมัคร |
| G | Status | สถานะ (Active/Inactive) |

## ปัญหาที่อาจพบ

### CORS Error
- Google Sheets API อาจมีปัญหา CORS
- แก้ไขโดยใช้ Proxy หรือ Backend API

### API Quota
- Google API มี Quota จำกัด
- สำหรับ Production ควรใช้ Service Account

### Performance
- การอ่าน Google Sheets อาจช้า
- เหมาะสำหรับข้อมูลไม่เยอะ