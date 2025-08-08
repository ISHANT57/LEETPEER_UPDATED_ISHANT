# LeetCode Student Progress Tracker

## Overview

This full-stack web application tracks LeetCode progress for student batches, automatically syncing data from LeetCode, monitoring daily/weekly performance, awarding achievement badges, and providing comprehensive dashboards for students and administrators. The project aims to provide a real-time, engaging platform for student progress and competitive analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI**: Radix UI components styled with shadcn/ui
- **Styling**: Tailwind CSS with custom CSS variables
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon Database configured)
- **API**: RESTful JSON APIs

### Core Components and Features
- **Database Schema**: Includes tables for students, daily progress, weekly trends, badges, and app settings.
- **Services**: LeetCode data fetching, automated scheduling for daily sync, and database abstraction.
- **Dashboards**: Student directory, individual student progress dashboards, real-time rankings, admin panel for management and sync control, leaderboards, and progress visualizations (charts, heatmaps).
- **Data Flow**: LeetCode API data ingestion, automated daily syncing, real-time frontend updates, automatic badge awarding, and analytics processing.
- **Key Features**: 100% student data coverage with real-time tracking, individual and batch-specific dashboards, comprehensive search, automated data sync, responsive design, end-to-end type safety, and robust error handling.
- **Authentication**: Complete JWT authentication with bcrypt hashing, role-based access control (Student/Admin), secure API endpoints, and a modern authentication UI.
- **Weekly Progress**: Enhanced weekly tracking with increment calculations and a weekly increment leaderboard system.
- **CSV Import System**: Flexible CSV import for weekly progress, supporting various formats and intelligent student matching.
- **Batch Separation**: Full support for distinct student batches with batch-specific APIs, dashboards, and leaderboards.
- **Profile Photo Integration**: Syncs LeetCode profile photos for display across the application.
- **Activity Tracking**: GitHub-style activity heatmap, total active days, and maximum streak tracking.

## External Dependencies

- **UI Components**: Radix UI
- **Charts**: Recharts
- **Database**: Neon Database (serverless PostgreSQL)
- **Date Handling**: date-fns
- **Validation**: Zod
- **LeetCode Integration**: Uses LeetCode's GraphQL API for user statistics, handling rate limiting and error recovery.
- **Database Tools**: Drizzle Kit for schema migrations.