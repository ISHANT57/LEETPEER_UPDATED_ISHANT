# LeetCode Student Progress Tracker

## Overview

This is a full-stack web application for tracking LeetCode progress of students in a batch. The system automatically syncs student data from LeetCode, tracks daily/weekly progress, awards badges for achievements, and provides comprehensive dashboards for both students and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **API Pattern**: RESTful APIs with JSON responses

### Key Components

#### Database Schema
- **Students Table**: Core student information with LeetCode usernames
- **Daily Progress Table**: Tracks daily problem-solving statistics
- **Weekly Trends Table**: Aggregated weekly performance data
- **Badges Table**: Achievement system for student motivation
- **App Settings Table**: System configuration and sync settings

#### Core Services
- **LeetCode Service**: Fetches student data from LeetCode's GraphQL API
- **Scheduler Service**: Handles automated daily syncing of student progress
- **Storage Service**: Abstraction layer for database operations (currently in-memory, ready for database integration)

#### Dashboard Features
- **Student Dashboard**: Personal progress tracking, badges, weekly trends
- **Admin Dashboard**: Batch overview, student management, sync controls
- **Leaderboard**: Competitive ranking system
- **Progress Visualization**: Charts and heatmaps for activity tracking

## Data Flow

1. **Data Ingestion**: LeetCode API → Backend Service → Database
2. **Automated Sync**: Scheduler runs daily to update all student progress
3. **Real-time Updates**: Frontend uses React Query for efficient data fetching
4. **Badge System**: Automatic badge awarding based on achievement criteria
5. **Analytics**: Weekly trend calculation and ranking system

## External Dependencies

### Production Dependencies
- **UI Components**: Extensive Radix UI component library
- **Charts**: Recharts for data visualization
- **Database**: Neon Database (serverless PostgreSQL)
- **Date Handling**: date-fns for date manipulation
- **Validation**: Zod schemas with Drizzle integration

### LeetCode Integration
- Uses LeetCode's GraphQL endpoint for fetching user statistics
- Handles rate limiting and error recovery
- Parses difficulty-based problem counts (Easy, Medium, Hard)

### Database Configuration
- Drizzle Kit for schema migrations
- PostgreSQL with UUID primary keys
- Connection via DATABASE_URL environment variable

## Deployment Strategy

### Development
- **Dev Server**: Express with Vite middleware for HMR
- **Database**: Local PostgreSQL or Neon Database
- **Environment**: NODE_ENV=development

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Assets**: Served by Express in production
- **Database**: Neon Database (serverless PostgreSQL)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)

### Key Features
- **Automated Data Sync**: Daily background jobs to update student progress
- **Real-time UI**: Optimistic updates with React Query
- **Responsive Design**: Mobile-first approach with Tailwind
- **Type Safety**: End-to-end TypeScript with shared schema definitions
- **Error Handling**: Comprehensive error boundaries and API error handling

The application is designed to be easily deployable on platforms like Replit, with automatic database provisioning and a single-command deployment process.