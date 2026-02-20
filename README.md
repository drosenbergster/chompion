# Chompion

Track, rate, and rank your favorite eats. Declare your passion food — pizza, tacos, coffee, whatever — then log every experience with customizable ratings, discover patterns in your taste, and share your profile with friends.

## Features

- **Passion Foods** — track one or many food obsessions, each with their own stats
- **Customizable Ratings** — weighted categories (Taste, Value, Presentation, etc.) that you define
- **Entry Logging** — restaurant, city, cost, subtypes, notes, and per-category ratings
- **Dashboard** — stats summary, top rated spots, weekly streak, recent chomps
- **Insights** — top restaurants, monthly activity, order breakdown, spending trends, taste profile radar
- **Public Profiles** — shareable `/u/username` pages with taste profile and top rated
- **Friends** — follow other users and see their recent activity in your feed
- **Direct Entry Sharing** — share individual chomps via public links

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Database**: Supabase (Postgres + Auth + Row Level Security)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Language**: TypeScript
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated routes (dashboard, entries, insights, etc.)
│   ├── u/[username]/    # Public profile pages
│   ├── login/           # Auth pages
│   └── signup/
├── components/          # React components organized by feature
│   ├── entries/
│   ├── insights/
│   ├── layout/
│   ├── profile/
│   ├── tutorial/
│   └── ui/
└── lib/
    ├── supabase/        # Supabase client (server, client, middleware, types)
    ├── constants.ts     # Shared constants (food emojis, popular foods, etc.)
    └── utils.ts         # Utility functions
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## Backlog

Items identified for future implementation:

- **Loading states:** Add `loading.tsx` skeleton screens for dashboard, entries, insights, and friends routes
- **Mobile nav:** Friends page is not accessible from the mobile bottom nav (desktop only via sidebar)
- **Performance:** Pre-compute insights aggregations at scale (database-level materialized views or cached stats)
- **Passion food switcher:** Dashboard and insights currently only show the default food; add a switcher for users with multiple lists
