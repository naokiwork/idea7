# Study Hour Calendar

A minimalist study-tracking dashboard built with **Next.js 14**, **TypeScript**, and **TailwindCSS**. The app runs entirely in the browser, persisting data with `localStorage`, and now includes timestamped backups, localization, chart controls, and bulk data entry tools.

## Features

### ✅ Planning & Recording
- Set planned study time per day (hours/minutes)
- Record study sessions via quick-select buttons or custom input
- Bulk create past records with validation and automatic formatting

### 📈 Achievement Insights
- Daily/weekly/monthly/yearly statistics with memoized calculations
- Custom date range analyzer
- Dual-line charts (achievement % and planned vs actual) with toggleable series and CSV export

### 🗓️ Calendar Visualization
- Color-coded calendar cells based on achievement rates
- Hover tooltips summarizing plan, actual, and achievement
- Keyboard-accessible navigation and date selection

### 🔄 Backup & Recovery
- Manual and automatic snapshots stored with ISO timestamps
- Relative time display, optional notes, and bulk deletion safeguards
- One-click restore with undo banner (persisted across reloads)

### 🌐 Localization & Accessibility
- Language selector (English, 日本語) for dates and labels
- ARIA-labelled controls, `aria-live` notifications, and responsive layouts
- High-contrast themes with dark mode support

## Tech Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State & Persistence**: React hooks + `localStorage`
- **Charts**: Recharts
- **Testing**: Vitest

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev:frontend
   ```
   The app will be available at http://localhost:3000.
3. **Run the unit tests (optional)**
   ```bash
   npm test
   ```
4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Data & Backups

- All study data is stored in the browser under the keys `study-records`, `study-plans`, and `study-backups`.
- Use the **Backup Manager** (Settings → Backups) to create manual snapshots, restore previous states, download archives, or delete entries.
- Snapshots persist across reloads and include an undo banner that remains active for five minutes.
- Import/export tools support JSON and CSV formats and automatically sanitize incoming data.

## Project Structure

```
idea-5/
├── app/                    # Next.js app directory
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React components (calendar, backup manager, modals, etc.)
├── hooks/                  # Custom hooks (localStorage, backups manager, dark mode)
├── lib/                    # Utilities (calculations, validation, exports, color mapping)
├── tests/                  # Vitest unit tests
├── context/                # Locale context
└── package.json
```

## Testing & Quality

- **Unit tests**: `npm test`
- **Linting**: `npm run lint`
- **Build verification**: `npm run build`

## Color Mapping Reference

| Achievement % | Color |
|---------------|-------|
| 0–49%         | White |
| 50–59%        | Yellow |
| 60–69%        | Green |
| 70–79%        | Brown |
| 80–119%       | Black |
| 120–129%      | Brown |
| 130–139%      | Green |
| 140%+         | White |
| Exactly 100%  | Purple |

## Troubleshooting

- **Data looks incorrect**: Restore from a recent backup or clear `localStorage` keys (`study-*`).
- **Undo banner disappeared**: Each restore remains undoable for five minutes; create a manual snapshot before experimenting.
- **Charts look empty**: Confirm the date range and toggle switches in the chart toolbar.

## Future Enhancements

- User authentication and multi-device sync
- Subject/category tagging
- Streak tracking and reminders
- AI-powered study planning suggestions

## License

This project is open source and available for personal and educational use.

## Documentation

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical implementation details and historical notes
