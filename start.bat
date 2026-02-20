@echo off
echo Building Kunlun...
npm run build

echo Starting Kunlun Server...
cd server
node server.js

pause