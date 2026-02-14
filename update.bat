@echo off
echo Starting Build and Push process...

:: 1. Run Build
echo Running: npm run build
call npm run build

:: 2. Git Add
echo Running: git add .
git add .

:: 3. Git Commit
echo Running: git commit -m "fix"
git commit -m "fix"

:: 4. Git Push
echo Running: git push -u origin main
git push -u origin main

echo Done!
pause
