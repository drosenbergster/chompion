# Chompion

Track, rate, and rank your favorite eats. Pick your food obsession — pizza, tacos, coffee, whatever — then log every chomp with customizable ratings, discover patterns in your taste, and share your profile with friends.

## Features

- **Food Collections** — track one or many food obsessions, each with their own stats and tailored rating categories
- **Per-Food Rating Categories** — each collection gets categories tuned to its food type (e.g., Broth/Noodles/Toppings for Ramen, Flavor/Body/Aroma for Coffee), with 12 built-in presets and full customization in Settings
- **Entry Logging** — restaurant, city, dishes with per-dish star ratings, per-category experience ratings, cost, notes
- **Dashboard** — stats summary, top rated spots, weekly streak, recent chomps, smart rankings by cuisine
- **Insights** — top restaurants, monthly activity, dish breakdown, spending trends, behavioral personality radar
- **Public Profiles** — shareable `/u/username` pages with personality radar and top rated entries
- **Friends** — follow other users and see their recent activity in your feed
- **Direct Entry Sharing** — share individual chomps via public links with full dish and rating breakdown

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
    ├── constants.ts     # Food emojis, popular foods, per-food category presets
    ├── themes.ts        # Per-food color themes for charts and UI
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

## Rating Category Presets

When you add a new food collection, Chompion seeds it with tailored rating categories:

| Food | Categories |
| --- | --- |
| Pizza | Taste, Crust, Toppings, Value, Ambiance |
| Coffee | Flavor, Body, Aroma, Presentation, Value |
| Sushi | Freshness, Taste, Presentation, Rice Quality, Value |
| Ramen | Broth, Noodles, Toppings, Taste, Value |
| Wine | Flavor, Aroma, Balance, Finish, Value |
| ... | 12 presets total, plus a generic fallback |

All categories are fully customizable in Settings (rename, reweight, add, remove).

## Backlog

Items identified for future implementation:

- **Performance:** Pre-compute insights aggregations at scale (database-level materialized views or cached stats)
- **Dynamic food theming:** SVG doodle patterns and visual personality (PRD Section 7)
- **Additional visualizations:** Rating distribution histogram and location-based analysis
