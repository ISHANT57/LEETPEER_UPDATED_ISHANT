#!/bin/bash

echo "🚀 Setting up LeetCode Tracker locally..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file with Neon.tech configuration..."
    cat > .env << EOL
# Neon.tech PostgreSQL Database (REPLACE WITH YOUR ACTUAL CONNECTION STRING)
DATABASE_URL=postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/leetcode_tracker?sslmode=require

# Application Configuration  
NODE_ENV=development
PORT=5000

# SETUP INSTRUCTIONS:
# 1. Go to https://neon.tech and create a free account
# 2. Create a new project named "leetcode-tracker"
# 3. Copy your connection string (starts with postgresql://)
# 4. Replace the DATABASE_URL above with your actual Neon connection string
# 5. Run: npm run db:push
# 6. Run: npm run dev

# Example Neon URL format:
# DATABASE_URL=postgresql://username:password@ep-abc123-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
EOL
    echo "⚠️  Please update the DATABASE_URL in .env with your Neon.tech connection string"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Neon.tech Database Setup (RECOMMENDED - Free & Easy):"
echo ""
echo "✅ Your app is pre-configured for Neon.tech PostgreSQL"
echo "✅ All data will be automatically saved and stored in Neon"
echo ""
echo "Quick Setup Steps:"
echo "  1. Visit: https://neon.tech"
echo "  2. Sign up with GitHub/Google (free account)"
echo "  3. Create new project: 'leetcode-tracker'"
echo "  4. Copy connection string to .env file"
echo "  5. Run: npm run db:push"
echo "  6. Run: npm run dev"
echo ""
echo "📊 Data Storage Features:"
echo "  ✅ CSV import data → Stored permanently in Neon"
echo "  ✅ Real-time LeetCode sync → All progress saved"
echo "  ✅ Analytics & trends → Calculated from stored data"
echo "  ✅ Student badges → Achievement history preserved"
echo "  ✅ Auto-backup → Neon provides daily backups"
echo ""
echo "After setting up the database:"
echo "  1. Run: npm run db:push"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:5000"
echo ""
echo "🎉 Setup complete! Update your .env file and you're ready to go!"