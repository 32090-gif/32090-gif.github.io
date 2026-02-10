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
cd Slumzick

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

ไฟล์ที่ build แล้วจะอยู่ในโฟลเดอร์ `dist/` พร้อมสำหรับการ deploy บน web server ใดๆ

---

© 2026 Kunlun Shop - ร้านค้าสินค้าดิจิทัลและเกมมิ่ง
