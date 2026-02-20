# Kunlun Shop - ร้านค้าสินค้าดิจิทัลและเกมมิ่ง

ร้านค้าออนไลน์สำหรับสินค้าดิจิทัลและเกมมิ่ง ไอดีเกม บัตรเติมเงิน ไอเทมในเกม

## การติดตั้งและใช้งาน

### ความต้องการของระบบ

- Node.js และ npm
- แนะนำให้ใช้ [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) สำหรับการจัดการเวอร์ชัน Node.js

### การติดตั้ง

```sh
# Clone โปรเจกต์
git clone <repository-url>
cd Kunlun

# ติดตั้ง dependencies
npm install

# รัน frontend development server
npm run dev
```

### การรัน Backend Server

```sh
# เข้าไปยังโฟลเดอร์ server
cd server

# รัน backend server
node server.js
```

Server จะทำงานที่:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

## โครงสร้างโปรเจกต์

```
├── src/
│   ├── components/     # React components
│   ├── pages/         # หน้าเว็บต่างๆ
│   ├── services/      # API services
│   └── lib/           # Utilities
├── server/            # Backend server
│   ├── stock/         # ข้อมูลสินค้า
│   ├── server.js      # Main server file
│   └── ...
└── public/           # Static files
```

## คุณสมบัติหลัก

- 🛍️ ระบบจัดการสินค้าแบบ Real-time
- 🏪 หมวดหมู่สินค้าที่ปรับตามสต็อค
- 👤 ระบบผู้ใช้และการเข้าสู่ระบบ
- 💳 ระบบเติมเงินและการชำระเงิน
- 📱 Responsive Design สำหรับมือถือ
- 🎨 UI/UX ที่ทันสมัยด้วย Tailwind CSS

## เทคโนโลยีที่ใช้

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Express.js (Backend)
- Node.js (Server)

## การ Build สำหรับ Production

```sh
npm run build
```

## การ Deploy

### การ Deploy บน VPS

1. **Upload โปรเจค** ไปยัง VPS ของคุณ

2. **ตั้งค่า Environment Variable** (หากจำเป็น):
   ```bash
   # สร้าง .env.production file และตั้งค่า API URL
   echo "VITE_API_BASE_URL=http://YOUR_VPS_IP:3001/api" > .env.production
   
   # หรือใช้ domain name
   echo "VITE_API_BASE_URL=http://yourdomain.com:3001/api" > .env.production
   ```

3. **Build และรันโปรเจค**:
   ```bash
   # Install dependencies
   npm install
   cd server && npm install && cd ..
   
   # Build frontend for production
   npm run build
   
   # Start server (รัน backend และ serve frontend)
   npm start
   ```

4. **เข้าถึงเว็บไซต์**:
   - เว็บไซต์จะทำงานที่: `http://YOUR_VPS_IP:3001`
   - API จะทำงานที่: `http://YOUR_VPS_IP:3001/api`

### Auto-Detection API URL

โปรเจคนี้มีระบบ auto-detect API URL ที่จะ:
- ตรวจสอบ environment variable `VITE_API_BASE_URL` ก่อน
- ถ้าไม่มี จะใช้ current domain + port 3001 อัตโนมัติ
- ใช้งานได้ทั้งบน localhost และ VPS โดยไม่ต้องแก้ไขโค้ด

### การใช้งานบน VPS พร้อม Domain

หากต้องการใช้งานผ่าน domain name และ reverse proxy:

1. ตั้งค่า reverse proxy (nginx/apache) 
2. ตั้งค่า environment variable:
   ```bash
   VITE_API_BASE_URL=https://yourdomain.com/api
   ```

ไฟล์ที่ build แล้วจะอยู่ในโฟลเดอร์ `dist/` พร้อมสำหรับการ deploy บน web server ใดๆ

---

© 2026 Kunlun Shop - ร้านค้าสินค้าดิจิทัลและเกมมิ่ง
