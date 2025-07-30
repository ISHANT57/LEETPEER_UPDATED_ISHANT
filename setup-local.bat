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
    echo 📝 Creating .env file...
    (
        echo # Database Configuration
        echo DATABASE_URL=postgresql://username:password@localhost:5432/leetcode_tracker
        echo.
        echo # Application Configuration
        echo NODE_ENV=development
        echo PORT=5000
        echo.
        echo # Optional: Add your database URL here
        echo # For local PostgreSQL: postgresql://username:password@localhost:5432/leetcode_tracker
        echo # For Neon.tech: postgresql://username:password@hostname/database?sslmode=require
        echo # For Supabase: postgresql://postgres:password@hostname:5432/postgres
    ) > .env
    echo ⚠️  Please update the DATABASE_URL in .env with your actual database credentials
) else (
    echo ✅ .env file already exists
)

echo.
echo 🗄️  Database Setup Instructions:
echo.
echo Choose one of the following options:
echo.
echo Option 1 - Local PostgreSQL:
echo   1. Install PostgreSQL: https://www.postgresql.org/download/
echo   2. Create database using pgAdmin or command line
echo   3. Update .env with: DATABASE_URL=postgresql://username:password@localhost:5432/leetcode_tracker
echo.
echo Option 2 - Cloud Database (Recommended):
echo   1. Visit https://neon.tech/ or https://supabase.com/
echo   2. Create a free PostgreSQL database
echo   3. Copy the connection string to .env
echo.
echo After setting up the database:
echo   1. Run: npm run db:push
echo   2. Run: npm run dev
echo   3. Open: http://localhost:5000
echo.
echo 🎉 Setup complete! Update your .env file and you're ready to go!
pause