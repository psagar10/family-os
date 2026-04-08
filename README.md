# Family OS

A unified family management system combining **Meal Planner** and **Family Task Manager** built with Next.js 14.

## Features

### Meal Planner
- 🤖 AI-powered recipe ingestion from YouTube, Instagram, blogs, or pasted text
- 📅 Weekly meal planning with drag-and-drop
- 🔄 Smart swap engine (nutrition fit, waste reduction, family favorites)
- 🥗 Personalized nutrition targets (Mifflin-St Jeor for adults, WHO for children)
- 🛒 Automated grocery list with pantry integration
- 🍱 Toddler meal tracking with portion multipliers

### Task Manager
- 📋 80+ household task templates
- 👨‍👩‍👧‍👦 Fairness-aware task distribution
- 🤖 AI-powered weekly task planning
- 🔔 Telegram + PWA push notifications
- 📱 Mobile-optimized task view

### Integration
- 🍳 Meal prep tasks automatically flow into task planner
- 📊 Unified dashboard for both modules

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Drizzle ORM
- **AI**: MiniMax-M2.7-highspeed
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: next-pwa (Workbox)
- **Notifications**: Telegram Bot + PWA Push
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd family-os
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Initialize the database and seed data:
```bash
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Database
DATABASE_PATH=./data/family-os.db

# MiniMax AI (required for all AI features)
MINIMAX_API_KEY=your_api_key
MINIMAX_BASE_URL=https://v2.aicodee.com/
MINIMAX_MODEL=MiniMax-M2.7-highspeed

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token

# RapidAPI (optional - for Instagram extraction)
RAPIDAPI_KEY=your_rapidapi_key
```

## Family Profile

Default family includes:
- **2 Adults** - Full portions, Mifflin-St Jeor nutrition calculation
- **1 Toddler (18 months)** - 0.35× portion multiplier, WHO toddler guidelines

Default PINs:
- Parent 1: `1234`
- Parent 2: `5678`
- Toddler: `0000`

## Project Structure

```
family-os/
├── app/                    # Next.js App Router pages
│   ├── (auth)/login/      # Authentication
│   ├── (app)/             # Main app routes
│   │   ├── dashboard/     # ERP dashboard
│   │   ├── meal/          # Meal planner
│   │   └── tasks/         # Task manager
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Core logic
│   ├── ai/               # AI integrations
│   ├── db/               # Database schema & queries
│   └── meal/             # Meal planning logic
└── public/               # Static assets
```

## Build Phases

| Phase | Description |
|-------|-------------|
| 1 | Foundation - Scaffold, DB, Auth |
| 2 | Recipe Library - AI ingestion |
| 3 | Meal Planner - Grid, planning AI |
| 4 | Task Planner - Scheduling |
| 5 | Integration - Meal→Task bridge |
| 6 | Grocery + Prep - Lists, timers |
| 7 | Notifications - Telegram, PWA push |
| 8 | Dashboard - ERP overview, polish |

## Development

```bash
# Generate Drizzle migrations
npm run db:generate

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Open Drizzle Studio
npm run db:studio

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
