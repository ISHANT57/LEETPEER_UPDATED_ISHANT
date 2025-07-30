# LeetCode Student Progress Tracker

A comprehensive full-stack web application for tracking LeetCode progress of students in a batch with real-time data synchronization, analytics dashboard, and historical trend analysis.

## Features

- **Real-time LeetCode Data Sync**: Automatic synchronization with LeetCode's GraphQL API
- **Historical Data Import**: Import and process CSV data with weekly progress tracking
- **Analytics Dashboard**: Comprehensive visualizations with multiple chart types
- **Student Management**: Individual student dashboards and batch overview
- **Badge System**: Achievement tracking and motivation system
- **Real-time Updates**: Live data refresh with auto-refresh capabilities

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Local Setup Instructions

### 1. Clone/Download the Project

Make sure you have all the project files in your local directory.

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a new database:
```sql
CREATE DATABASE leetcode_tracker;
```
3. Set the DATABASE_URL environment variable:
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/leetcode_tracker"
```

#### Option B: Cloud Database (Neon, Supabase, etc.)
1. Create a free PostgreSQL database on Neon.tech or Supabase
2. Copy the connection string
3. Set the DATABASE_URL environment variable

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/leetcode_tracker
NODE_ENV=development
PORT=5000
```

### 5. Database Migration

Push the database schema:

```bash
npm run db:push
```

### 6. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### 1. Import Historical Data
- Navigate to the Analytics Dashboard
- Click "Import CSV" to load historical student data
- The system will process the CSV and create weekly trends

### 2. Sync Real-time Data
- Click "Sync Real-time" to fetch current LeetCode statistics
- The system will update all student progress with live data

### 3. View Analytics
- Navigate through different sections:
  - **Student Directory**: Browse all students
  - **Real-Time Tracker**: Live rankings with auto-refresh
  - **Analytics Dashboard**: Comprehensive progress analysis
  - **Leaderboard**: Top performers ranking
  - **Badges**: Achievement system overview

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities and configurations
├── server/                 # Backend Express application
│   ├── services/          # Business logic services
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── db.ts              # Database connection
├── shared/                 # Shared types and schemas
└── attached_assets/        # CSV data files
```

## API Endpoints

- `GET /api/students` - Get all students
- `GET /api/analytics` - Get analytics data
- `POST /api/import/csv` - Import CSV data
- `POST /api/sync/all` - Sync all students with LeetCode
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/leaderboard` - Student rankings

## Technologies Used

### Frontend
- React with TypeScript
- Wouter (routing)
- TanStack Query (state management)
- Radix UI + shadcn/ui (UI components)
- Tailwind CSS (styling)
- Recharts (data visualization)

### Backend
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- Zod (validation)

## Development

### Database Operations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Drizzle Studio (if available)

### Build for Production
```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Import Fails**
   - Check CSV file path in `attached_assets/`
   - Verify CSV format matches expected structure

3. **LeetCode Sync Issues**
   - Check internet connection
   - Verify LeetCode usernames are correct
   - Some users may have privacy settings enabled

### Support

For issues or questions, check the console logs for detailed error messages. The application includes comprehensive error handling and logging.