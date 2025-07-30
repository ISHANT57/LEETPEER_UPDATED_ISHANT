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
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/leetcode_tracker

# Application Configuration
NODE_ENV=development
PORT=5000

# Optional: Add your database URL here
# For local PostgreSQL: postgresql://username:password@localhost:5432/leetcode_tracker
# For Neon.tech: postgresql://username:password@hostname/database?sslmode=require
# For Supabase: postgresql://postgres:password@hostname:5432/postgres
EOL
    echo "⚠️  Please update the DATABASE_URL in .env with your actual database credentials"
else
    echo "✅ .env file already exists"
fi

echo "🗄️  Database Setup Instructions:"
echo ""
echo "Choose one of the following options:"
echo ""
echo "Option 1 - Local PostgreSQL:"
echo "  1. Install PostgreSQL: https://www.postgresql.org/download/"
echo "  2. Create database: createdb leetcode_tracker"
echo "  3. Update .env with: DATABASE_URL=postgresql://username:password@localhost:5432/leetcode_tracker"
echo ""
echo "Option 2 - Cloud Database (Recommended):"
echo "  1. Visit https://neon.tech/ or https://supabase.com/"
echo "  2. Create a free PostgreSQL database"
echo "  3. Copy the connection string to .env"
echo ""
echo "After setting up the database:"
echo "  1. Run: npm run db:push"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:5000"
echo ""
echo "🎉 Setup complete! Update your .env file and you're ready to go!"