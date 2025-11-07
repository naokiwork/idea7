# Backend Setup Guide

This document explains how to set up and run the Express.js + MongoDB backend for the Study Hour Calendar application.

## Prerequisites

1. **Node.js** 18+ installed
2. **MongoDB** installed and running, OR MongoDB Atlas account

## MongoDB Setup

### Option 1: Local MongoDB

1. Install MongoDB locally:
   - macOS: `brew install mongodb-community`
   - Windows: Download from [MongoDB website](https://www.mongodb.com/try/download/community)
   - Linux: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

2. Start MongoDB service:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Or run manually
   mongod --config /usr/local/etc/mongod.conf
   ```

3. Verify MongoDB is running:
   ```bash
   mongosh
   # Should connect successfully
   ```

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is sufficient)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/study-calendar`)

## Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your MongoDB connection string:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/study-calendar
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-calendar
   ```

3. For frontend, copy and configure:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

## Installation

1. Install all dependencies (including backend):
   ```bash
   npm install
   ```

## Running the Application

### Development Mode (Frontend + Backend)

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Run Separately

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Study Records
- `GET /api/records` - Get all records (optional query: `?from=YYYY-MM-DD&to=YYYY-MM-DD`)
- `GET /api/records/:date` - Get record for specific date
- `POST /api/records` - Create or add to existing record
  ```json
  {
    "date": "2024-01-15",
    "minutes": 120
  }
  ```
- `PUT /api/records/:date` - Update record for specific date
- `DELETE /api/records/:date` - Delete record for specific date
- `DELETE /api/records` - Delete all records

### Study Plans
- `GET /api/plans` - Get all plans (optional query: `?from=YYYY-MM-DD&to=YYYY-MM-DD`)
- `GET /api/plans/:date` - Get plan for specific date
- `POST /api/plans` - Create or update plan
  ```json
  {
    "date": "2024-01-15",
    "hours": 2,
    "minutes": 30
  }
  ```
- `PUT /api/plans/:date` - Update plan for specific date
- `DELETE /api/plans/:date` - Delete plan for specific date
- `DELETE /api/plans` - Delete all plans

## Database Models

### StudyRecord
```typescript
{
  date: string;        // YYYY-MM-DD format
  minutes: number;      // Total minutes studied
  createdAt: Date;     // Auto-generated
  updatedAt: Date;     // Auto-generated
}
```

### PlanData
```typescript
{
  date: string;        // YYYY-MM-DD format
  hours: number;       // 0-24
  minutes: number;     // 0-59
  createdAt: Date;     // Auto-generated
  updatedAt: Date;     // Auto-generated
}
```

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # macOS
   brew services list
   
   # Or try connecting
   mongosh
   ```

2. **Verify connection string:**
   - Local: `mongodb://localhost:27017/study-calendar`
   - Atlas: Check username, password, and cluster URL

3. **Check firewall/network:**
   - Ensure MongoDB port (27017) is accessible
   - For Atlas, whitelist your IP address

### Port Already in Use

If port 5000 is already in use:
1. Change `PORT` in `.env` file
2. Update `NEXT_PUBLIC_API_URL` in `.env.local` to match

### CORS Issues

The backend is configured to allow CORS from `http://localhost:3000`. If you change the frontend port, update the CORS configuration in `server/index.ts`.

## Production Deployment

For production:

1. Set `NODE_ENV=production` in environment variables
2. Use a production MongoDB instance (Atlas recommended)
3. Set up proper authentication and security
4. Use environment variables for sensitive data
5. Consider adding rate limiting and request validation

## Next Steps

- Add user authentication (JWT tokens)
- Add data validation middleware
- Add rate limiting
- Add request logging
- Set up database backups
- Add API documentation (Swagger/OpenAPI)

