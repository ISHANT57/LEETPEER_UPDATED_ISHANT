@echo off
echo 🚀 Setting up LeetCode Tracker locally...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

:: Install dependencies
echo 📦 Installing dependencies...
npm install

:: Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file with Neon.tech configuration...
    (
        echo # Your Neon.tech PostgreSQL Database (CONFIGURED)
        echo DATABASE_URL=postgresql://neondb_owner:npg_iUAJg7HPzhn5@ep-bold-wind-a27odj2x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
        echo.
        echo # Application Configuration
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # SETUP INSTRUCTIONS:
        echo # 1. Go to https://neon.tech and create a free account
        echo # 2. Create a new project named "leetcode-tracker"
        echo # 3. Copy your connection string (starts with postgresql://)
        echo # 4. Replace the DATABASE_URL above with your actual Neon connection string
        echo # 5. Run: npm run db:push
        echo # 6. Run: npm run dev
        echo.
        echo # Example Neon URL format:
        echo # DATABASE_URL=postgresql://username:password@ep-abc123-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
    ) > .env
    echo ⚠️  Please update the DATABASE_URL in .env with your Neon.tech connection string
) else (
    echo ✅ .env file already exists
)

echo.
echo 🗄️  Neon.tech Database Setup (RECOMMENDED - Free & Easy):
echo.
echo ✅ Your app is pre-configured for Neon.tech PostgreSQL
echo ✅ All data will be automatically saved and stored in Neon
echo.
echo Quick Setup Steps:
echo   1. Visit: https://neon.tech
echo   2. Sign up with GitHub/Google (free account)
echo   3. Create new project: 'leetcode-tracker'
echo   4. Copy connection string to .env file
echo   5. Run: npm run db:push
echo   6. Run: npm run dev
echo.
echo 📊 Data Storage Features:
echo   ✅ CSV import data → Stored permanently in Neon
echo   ✅ Real-time LeetCode sync → All progress saved
echo   ✅ Analytics & trends → Calculated from stored data
echo   ✅ Student badges → Achievement history preserved
echo   ✅ Auto-backup → Neon provides daily backups
echo.
echo After setting up the database:
echo   1. Run: npm run db:push
echo   2. Run: npm run dev
echo   3. Open: http://localhost:5000
echo.
echo 🎉 Setup complete! Update your .env file and you're ready to go!
pause