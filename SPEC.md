# Family OS - Product Specification

## Overview
A unified family management system combining:
- **Meal Planner**: AI-powered meal planning with recipe ingestion from YouTube/Instagram
- **Family Task Manager**: Intelligent task scheduling with fairness scoring

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Drizzle ORM
- **AI**: MiniMax-M2.7-highspeed (all features)
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: next-pwa (Workbox)
- **Notifications**: Telegram Bot + PWA Push

## Family Profile
| Member | Age | Portion | Calc Method |
|--------|-----|---------|-------------|
| Adult 1 | Adult | 1.0× | Mifflin-St Jeor |
| Adult 2 | Adult | 1.0× | Mifflin-St Jeor |
| Toddler | 18mo | 0.35× | WHO 1-2yr: 900-1000 kcal |

## Environment Variables
```
MINIMAX_API_KEY=
MINIMAX_BASE_URL=https://v2.aicodee.com/
MINIMAX_MODEL=MiniMax-M2.7-highspeed
RAPIDAPI_KEY=
TELEGRAM_BOT_TOKEN=
DATABASE_PATH=./data/family-os.db
```

## Build Phases
1. Foundation (Days 1-3): Scaffold, DB, Auth
2. Recipe Library (Days 4-6): AI ingestion, nutrition calc
3. Meal Planner (Days 7-10): Grid UI, planning AI, swap engine
4. Task Planner (Days 11-15): Scheduling, AI proposals
5. Integration (Days 16-17): Meal→Task bridge
6. Grocery + Prep (Days 18-20): Lists, timers
7. Notifications (Days 21-24): Telegram, PWA push, cron
8. Dashboard (Days 25-30): ERP dashboard, polish
