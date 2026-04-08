#!/bin/bash

# Family OS - Vercel Deployment Script
# Run this script to deploy Family OS to Vercel

set -e

echo "🚀 Family OS Deployment Script"
echo "=============================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local found."
    echo "   Copy .env.example to .env.local and add your API keys:"
    echo "   - MINIMAX_API_KEY"
    echo "   - TELEGRAM_BOT_TOKEN"
    echo "   - RAPIDAPI_KEY (optional, for Instagram)"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo ""
echo "📋 Environment variables check:"
if grep -q "your_minimax_api_key_here" .env.local; then
    echo "   ⚠️  MINIMAX_API_KEY not set!"
fi
if grep -q "your_telegram_bot_token_here" .env.local; then
    echo "   ⚠️  TELEGRAM_BOT_TOKEN not set!"
fi
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Go to Vercel Dashboard → Project → Settings → Environment Variables"
echo "   2. Add your API keys there (not in .env.local for production)"
echo "   3. Set up Telegram webhook:"
echo ""
echo "   curl -X POST \"https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook\" \\"
echo '     -d "url=https://<YOUR_VERCEL_APP>.vercel.app/api/telegram/webhook"'
echo ""
echo "   4. Add your Telegram Chat ID to TELEGRAM_ALLOWED_IDS in Vercel env vars"
