# Study Hour Calendar

A beautiful, minimalist web application for tracking and visualizing your study hours. Built with Next.js 14, TypeScript, TailwindCSS, Express.js, and MongoDB.

## Features

### 📅 Plan Function
- Set planned study time per day (hours/minutes)
- Automatic calculation of weekly, monthly, and yearly totals

### 📝 Record Function
- Quick-select buttons (10min, 20min, 30min, 40min, 50min, 1 hour)
- Manual input for custom durations
- Accumulate multiple records per day

### 📊 Achievement Percentage
- Calculate achievement rate = (actual / planned) × 100%
- Display daily, weekly, monthly, yearly achievement percentages
- Custom period filter (from–to date range)

### 🎨 Calendar Visualization
- Color-coded calendar cells based on achievement rates
- Hover tooltips showing plan, record, and achievement percentage

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React hooks

### Backend
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose)
- **Language**: TypeScript

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

**Backend:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/study-calendar
```

**Frontend:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or run manually
mongod
```

**Or use MongoDB Atlas** (cloud) - see [BACKEND_SETUP.md](./BACKEND_SETUP.md) for details.

### 4. Run the Application

**Development (Frontend + Backend):**
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

**Or run separately:**
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### 5. Build for Production

```bash
# Build frontend
npm run build

# Start production servers
npm start              # Frontend
npm run start:backend # Backend
```

## Project Structure

```
idea-5/
├── app/                    # Next.js app directory
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React components
│   ├── CalendarGrid.tsx
│   ├── PlanInputForm.tsx
│   ├── RecordModal.tsx
│   └── AchievementStats.tsx
├── server/                 # Express.js backend
│   ├── index.ts            # Server entry point
│   ├── models/             # MongoDB models
│   │   ├── StudyRecord.ts
│   │   └── PlanData.ts
│   └── routes/             # API routes
│       ├── records.ts
│       └── plans.ts
├── hooks/                  # React hooks
│   ├── useLocalStorage.ts
│   └── useStudyData.ts     # API data hook
├── lib/                    # Utilities
│   ├── api.ts              # API client
│   ├── utils.ts
│   ├── colorMapping.ts
│   └── calculations.ts
├── types/                  # TypeScript types
│   └── index.ts
└── package.json
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Study Records
- `GET /api/records` - Get all records (optional: `?from=YYYY-MM-DD&to=YYYY-MM-DD`)
- `GET /api/records/:date` - Get record for specific date
- `POST /api/records` - Create or add to existing record
- `PUT /api/records/:date` - Update record
- `DELETE /api/records/:date` - Delete record

### Study Plans
- `GET /api/plans` - Get all plans (optional: `?from=YYYY-MM-DD&to=YYYY-MM-DD`)
- `GET /api/plans/:date` - Get plan for specific date
- `POST /api/plans` - Create or update plan
- `PUT /api/plans/:date` - Update plan
- `DELETE /api/plans/:date` - Delete plan

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed API documentation.

## Data Storage

- **Development**: MongoDB (local or Atlas)
- **Production**: MongoDB Atlas recommended
- Data persists across sessions
- Automatic data synchronization between frontend and backend

## Features

### Color Mapping
Achievement rates are color-coded:
- 0–49%: White
- 50–59%: Yellow
- 60–69%: Green
- 70–79%: Brown
- 80–89%: Blue
- 90–99%: Black
- 100%: Purple
- 110–119%: Black
- 120–129%: Purple
- 130–139%: Green
- 140–149%: White
- 150%+: White

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Semantic HTML
- Screen reader friendly

### Responsive Design
- Mobile-first approach
- Works on desktop, tablet, and mobile
- Touch-friendly interface

## Troubleshooting

### Backend won't start
1. Check if MongoDB is running
2. Verify `MONGODB_URI` in `.env`
3. Check if port 5000 is available

### Frontend can't connect to API
1. Ensure backend is running on port 5000
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors

### MongoDB connection issues
See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed troubleshooting.

## Future Enhancements

- User authentication (JWT)
- Multi-user support
- Subject/category tracking
- Consecutive days (strike) feature
- AI-powered plan suggestions
- Data export/import
- Dark mode support
- Charts and graphs

## License

This project is open source and available for personal and educational use.

## Documentation

- [Backend Setup Guide](./BACKEND_SETUP.md) - Detailed backend setup and API documentation
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical implementation details
