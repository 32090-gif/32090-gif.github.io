@echo off
echo Building Slumzick...
npm run build

echo Starting Slumzick Server...
cd server
node server.js

pause