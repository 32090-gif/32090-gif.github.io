# วิธีแก้ไขปัญหา Login เรียก localhost

## สรุปปัญหา
เว็บ https://getkunlun.me เรียก API Login ไปที่ `localhost:3001` แทนที่จะเรียกไปที่ `https://getkunlun.me/api`

## สิ่งที่แก้ไขแล้ว ✅

### 1. ไฟล์ Source Code
ไฟล์ `src/services/apiClient.ts` ถูกแก้ไขให้ตรวจจับ domain แล้ว:
- ถ้าเป็น `getkunlun.me` จะใช้ `https://getkunlun.me/api`
- ถ้าเป็น localhost จะใช้ `/api` (ผ่าน proxy)

### 2. ลบไฟล์ Build เก่า
ไฟล์ JavaScript ที่มี localhost ฝังอยู่ถูกลบหมดแล้ว:
- app-*.js (ทั้งหมด)
- style-*.css (ทั้งหมด)
- โฟลเดอร์ assets/ (ทั้งหมด)

### 3. Push ไปยัง GitHub
โค้ดที่แก้ไขแล้วถูก commit และ push ไปยัง GitHub repository แล้ว

## ขั้นตอนการ Deploy (บน Server)

### วิธีที่ 1: Build บน Server (แนะนำ)

```bash
# 1. เข้าไปยังโฟลเดอร์โปรเจค
cd /path/to/Kunlun

# 2. Pull โค้ดล่าสุดจาก GitHub
git pull origin main

# 3. ติดตั้ง dependencies
npm install

# 4. Build โปรเจค
npm run build

# 5. คัดลอกไฟล์ที่ build แล้วไปยัง root
cp dist/* ./

# 6. Restart API Server
cd server
pm2 restart server   # ถ้าใช้ PM2
# หรือ
node server.js       # ถ้ารันแบบปกติ
```

### วิธีที่ 2: Build บน Windows และ Upload

```bash
# 1. บน Windows เปิด PowerShell
cd c:\Users\User\Desktop\ProjectCustomer\Kunlun

# 2. Run build script
.\build-production.bat

# 3. Upload ไฟล์เหล่านี้ไปยัง Server:
- index.html
- app-[timestamp].js
- style-[timestamp].css

# 4. บน Server, restart API
pm2 restart server
```

## การตรวจสอบว่าแก้ไขสำเร็จ

1. เปิดเว็บ https://getkunlun.me
2. กด `F12` เปิด Developer Tools
3. ไปที่ Tab **Console**
4. ควรเห็นข้อความ:
   ```
   🔗 API Base URL: https://getkunlun.me/api
   🌐 Current host: getkunlun.me
   ```

5. ไปที่ Tab **Network**
6. ลอง Login
7. ดู Request URL ควรเป็น:
   ```
   https://getkunlun.me/api/login   ✅ ถูกต้อง
   ```
   **ไม่ใช่**:
   ```
   http://localhost:3001/api/login  ❌ ผิด
   ```

## แก้ไขด่วน (ถ้า Build ไม่ได้)

ถ้า `npm run build` ไม่ทำงาน สามารถแก้ไขไฟล์ที่ build แล้วโดยตรง:

### บน Windows:
```powershell
# หาไฟล์ app-*.js ที่กำลังใช้
$file = Get-Content "index.html" | Select-String -Pattern 'app-.*\.js' | ForEach-Object { $_.Matches.Value }

# แทนที่ localhost ด้วย relative URL
(Get-Content $file) -replace '"http://localhost:3001/api"', '"/api"' | Set-Content $file
```

### บน Linux/Server:
```bash
# หาไฟล์ app-*.js ที่กำลังใช้
FILE=$(grep -oP 'app-.*?\.js' index.html)

# แทนที่ localhost ด้วย relative URL
sed -i 's/"http:\/\/localhost:3001\/api"/"\\/api"/g' $FILE
```

⚠️ **หมายเหตุ**: วิธีนี้เป็นการแก้ชั่วคราว ต้องทำใหม่ทุกครั้งที่ build

## สาเหตุของปัญหา

1. **Built Files เก่า**: ไฟล์ JavaScript ที่ build ไว้เมื่อก่อนยังมี `localhost:3001` ฝังอยู่
2. **Browser Cache**: เบราว์เซอร์อาจ cache ไฟล์เก่าไว้
3. **Vite Development Proxy**: ใน development mode, Vite proxy `/api` ไปยัง `localhost:3001`

## การแก้ปัญหาที่ทำไปแล้ว

✅ อัปเดต `apiClient.ts` ให้ตรวจจับ hostname  
✅ ลบไฟล์ build เก่าทั้งหมด  
✅ Commit และ Push ไปยัง GitHub  
✅ สร้างเอกสารคู่มือการแก้ไข  
✅ สร้าง build script สำหรับ Windows  

## ไฟล์ที่สำคัญ

| ไฟล์ | สถานะ | หมายเหตุ |
|------|-------|----------|
| `src/services/apiClient.ts` | ✅ แก้ไขแล้ว | ตรวจจับ getkunlun.me |
| `FIX_LOCALHOST_ISSUE.md` | ✅ สร้างแล้ว | คู่มือภาษาอังกฤษ |
| `DEPLOY_INSTRUCTIONS.md` | ✅ สร้างแล้ว | คู่มือภาษาไทย (ไฟล์นี้) |
| `build-production.bat` | ✅ สร้างแล้ว | Script สำหรับ build บน Windows |
| `app-*.js` (เก่า) | ✅ ลบแล้ว | มี localhost ฝังอยู่ |
| `assets/` (เก่า) | ✅ ลบแล้ว | มี localhost ฝังอยู่ |

## ต้องการความช่วยเหลือ?

### ถ้า Build ไม่สำเร็จ:
```bash
# ลบ node_modules และ install ใหม่
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ถ้า API ยังเรียก localhost อยู่:
1. ตรวจสอบว่า pull โค้ดล่าสุดจาก Git แล้วหรือยัง
2. ตรวจสอบว่า build ใหม่แล้วหรือยัง
3. Clear browser cache (Ctrl+Shift+Del)
4. ตรวจสอบ Network tab ว่าเรียก URL อะไร

### ถ้ายังมีปัญหา:
1. เปิด Developer Console (F12)
2. Screenshot หน้า Console และ Network
3. ส่งให้ Developer ตรวจสอบ

## สรุป

การแก้ไขหลักคือ:
1. ✅ แก้ไข Source Code ให้ตรวจจับ domain
2. 🔄 Build โปรเจคใหม่
3. 🚀 Deploy ไฟล์ที่ build แล้วไปยัง Server
4. ♻️ Restart API Server
5. ✔️ ทดสอบที่ https://getkunlun.me

**ทั้งหมดนี้จะทำให้ API เรียกไปที่ https://getkunlun.me/api แทน localhost**
