#!/bin/bash

# Kunlun VPS Deployment Script
echo "🚀 Starting Kunlun deployment on VPS..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Creating .env.production file..."
    echo "# Production Environment - Auto-detect API URL" > .env.production
    echo "VITE_API_BASE_URL=" >> .env.production
    echo "✅ .env.production created (using auto-detection)"
else
    echo "✅ .env.production already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Build frontend for production
echo "🏗️  Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Deployment completed!"
    echo ""
    echo "To start the server:"
    echo "  npm start"
    echo ""
    echo "The website will be available at:"
    echo "  http://$(hostname -I | cut -d' ' -f1):3001"
    echo ""
    echo "API will be available at:"
    echo "  http://$(hostname -I | cut -d' ' -f1):3001/api"
else
    echo "❌ Build failed!"
    exit 1
fi