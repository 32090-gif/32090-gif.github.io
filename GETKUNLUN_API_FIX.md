# การแก้ไข API สำหรับ getkunlun.me

## ปัญหาที่พบ
เมื่อเข้าเว็บผ่าน https://getkunlun.me/login แต่ API ยังคง request ไปที่ localhost

## การแก้ไขที่ทำไป

### 1. อัปเดต API Detection Logic
ปรับปรุง `apiClient.ts` ให้รองรับ domain getkunlun.me โดยเฉพาะ:
- ตรวจจับ hostname `getkunlun.me` 
- ใช้ `https://getkunlun.me/api` แทน `https://getkunlun.me:3001/api`

### 2. ตั้งค่า Environment Variable
สร้าง `.env.production` with:
```
VITE_API_BASE_URL=https://getkunlun.me/api
```

### 3. Build โปรเจคใหม่
```bash
npm run build
```

## วิธีตรวจสอบ

1. เปิด browser และไป https://getkunlun.me/login
2. เปิด Developer Console (F12)
3. ดูข้อความ debug:
   ```
   🔗 API Base URL: https://getkunlun.me/api
   🌐 Current host: getkunlun.me
   🏗️ Build mode: production
   ```

## หาก API ยังใช้ไม่ได้

### ตัวเลือกที่ 1: API อยู่ใน subdomain
หาก API อยู่ที่ subdomain เช่น api.getkunlun.me:
```bash
# อัปเดต .env.production
VITE_API_BASE_URL=https://api.getkunlun.me/api
```

### ตัวเลือกที่ 2: API อยู่ใน port 3001
หาก API server รันอยู่ที่ port 3001:
```bash
# อัปเดต .env.production  
VITE_API_BASE_URL=https://getkunlun.me:3001/api
```

### ตัวเลือกที่ 3: API อยู่ใน path อื่น
หาก API อยู่ใน path อื่น:
```bash
# อัปเดต .env.production
VITE_API_BASE_URL=https://getkunlun.me/backend/api
```

## การ Rebuild หลังแก้ไข

หลังจากแก้ไข `.env.production` แล้ว:
```bash
npm run build
```

## ตรวจสอบ Network Tab

1. เปิด Developer Tools (F12)
2. ไปที่ Network tab  
3. ลอง login
4. ดู request URL ที่เกิดขึ้น - ควรเป็น `https://getkunlun.me/api/login`

## การแก้ปัญหา CORS

หาก API server อยู่คนละ domain/port อาจต้องตั้งค่า CORS ใน server:
```javascript
app.use(cors({
  origin: ['https://getkunlun.me', 'https://www.getkunlun.me'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```