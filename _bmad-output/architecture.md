# Passion Food -- Technical Architecture Document

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Vercel (Hosting)               │
│  ┌───────────────────────────────────────────┐   │
│  │           Next.js App (App Router)        │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐  │   │
│  │  │  Pages  │ │   API    │ │  Server   │  │   │
│  │  │  (RSC)  │ │  Routes  │ │  Actions  │  │   │
│  │  └─────────┘ └──────────┘ └───────────┘  │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Supabase (Backend)                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐   │
│  │   Auth   │ │ Postgres │ │  Row Level     │   │
│  │  (Email  │ │    DB    │ │  Security      │   │
│  │ + Google)│ │          │ │  (RLS)         │   │
│  └──────────┘ └──────────┘ └────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 2. Project Structure

```
passion_food/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (auth provider, theme)
│   │   ├── page.tsx                  # Landing page (unauthenticated)
│   │   ├── globals.css               # Global styles + Tailwind
│   │   │
│   │   ├── (auth)/                   # Auth group (no layout nesting)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts     # OAuth callback handler
│   │   │
│   │   ├── (app)/                    # Authenticated app group
│   │   │   ├── layout.tsx            # App shell (nav, sidebar, theme provider)
│   │   │   ├── dashboard/page.tsx    # Main dashboard (default passion food)
│   │   │   ├── entries/
│   │   │   │   ├── page.tsx          # Entry list/timeline
│   │   │   │   ├── new/page.tsx      # New entry form
│   │   │   │   └── [id]/page.tsx     # Entry detail / edit
│   │   │   ├── passion-foods/
│   │   │   │   ├── page.tsx          # Manage passion foods
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Passion food dashboard
│   │   │   │       └── settings/page.tsx  # Subtypes, rating categories
│   │   │   ├── friends/
│   │   │   │   └── page.tsx          # Friends feed + follow management
│   │   │   ├── settings/
│   │   │   │   └── page.tsx          # Account settings
│   │   │   └── onboarding/page.tsx   # First-time setup flow
│   │   │
│   │   └── u/[username]/             # Public shared profile (no auth required)
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components (buttons, inputs, cards)
│   │   ├── auth/                     # Auth forms, guards
│   │   ├── entries/                  # Entry card, entry form, rating input
│   │   ├── dashboard/               # Chart components, stats cards
│   │   ├── passion-foods/           # Passion food selector, theme switcher
│   │   ├── social/                  # Follow button, friends list
│   │   └── layout/                  # Nav, sidebar, mobile nav
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   ├── server.ts            # Server-side Supabase client
│   │   │   ├── middleware.ts         # Auth middleware
│   │   │   └── types.ts             # Generated DB types
│   │   ├── utils.ts                 # Shared utilities
│   │   ├── constants.ts             # App constants, theme mappings
│   │   └── themes.ts                # Food theme definitions (colors, patterns)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-passion-food.ts
│   │   ├── use-entries.ts
│   │   └── use-theme.ts
│   │
│   └── types/                       # TypeScript type definitions
│       └── index.ts
│
├── public/
│   ├── food-themes/                 # SVG patterns/illustrations per food
│   │   ├── pizza/
│   │   ├── burritos/
│   │   ├── tacos/
│   │   └── ...
│   └── favicon.ico
│
├── supabase/                        # Supabase local config (if using CLI)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                       # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 3. Database Schema (Detailed)

### 3.1 Tables

#### `profiles` (extends Supabase auth.users)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, FK → auth.users.id | Matches auth user ID |
| display_name | text | NOT NULL | |
| username | text | UNIQUE, NOT NULL | For shareable URL `/u/{username}` |
| avatar_url | text | nullable | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

#### `passion_foods`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| user_id | uuid | FK → profiles.id, NOT NULL | |
| name | text | NOT NULL | e.g., "Burritos" |
| theme_key | text | DEFAULT 'generic' | Maps to visual theme |
| is_default | boolean | DEFAULT false | Which one shows on login |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

#### `subtypes`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| passion_food_id | uuid | FK → passion_foods.id, ON DELETE CASCADE | |
| name | text | NOT NULL | e.g., "Al Pastor" |
| sort_order | integer | DEFAULT 0 | |
| created_at | timestamptz | DEFAULT now() | |

#### `rating_categories`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| passion_food_id | uuid | FK → passion_foods.id, ON DELETE CASCADE | |
| name | text | NOT NULL | e.g., "Taste" |
| weight | numeric(3,2) | NOT NULL, CHECK (weight > 0 AND weight <= 1) | Decimal weight |
| sort_order | integer | DEFAULT 0 | |
| created_at | timestamptz | DEFAULT now() | |

#### `entries`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| passion_food_id | uuid | FK → passion_foods.id, ON DELETE CASCADE | |
| user_id | uuid | FK → profiles.id, NOT NULL | Denormalized for RLS perf |
| restaurant_name | text | NOT NULL | |
| city | text | NOT NULL | |
| address | text | nullable | |
| phone_number | text | nullable | |
| location_notes | text | nullable | Hours, tips, etc. |
| subtype_id | uuid | FK → subtypes.id, ON DELETE SET NULL, nullable | |
| quantity | integer | nullable, CHECK (quantity > 0) | |
| cost | numeric(8,2) | nullable, CHECK (cost >= 0) | |
| composite_score | numeric(3,2) | nullable | Calculated weighted average |
| notes | text | nullable | |
| eaten_at | timestamptz | NOT NULL, DEFAULT now() | User-adjustable |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

#### `entry_ratings`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| entry_id | uuid | FK → entries.id, ON DELETE CASCADE | |
| rating_category_id | uuid | FK → rating_categories.id, ON DELETE CASCADE | |
| score | integer | NOT NULL, CHECK (score >= 1 AND score <= 5) | 1-5 stars |

#### `follows`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| follower_id | uuid | FK → profiles.id, ON DELETE CASCADE | |
| following_id | uuid | FK → profiles.id, ON DELETE CASCADE | |
| created_at | timestamptz | DEFAULT now() | |
| | | PK (follower_id, following_id) | |
| | | CHECK (follower_id != following_id) | Can't follow yourself |

### 3.2 Row-Level Security (RLS) Policies

Every table has RLS enabled. Key policies:

| Table | Operation | Policy |
|-------|-----------|--------|
| profiles | SELECT | Anyone can read any profile (for shared profiles & friends) |
| profiles | UPDATE | Users can only update their own profile |
| passion_foods | SELECT | Owner can read their own; anyone can read if they follow the owner OR via public profile |
| passion_foods | INSERT/UPDATE/DELETE | Owner only |
| subtypes | SELECT | Same as parent passion_food |
| subtypes | INSERT/UPDATE/DELETE | Owner of parent passion_food only |
| rating_categories | SELECT/INSERT/UPDATE/DELETE | Same pattern as subtypes |
| entries | SELECT | Owner can read own; followers can read; public profile viewers can read |
| entries | INSERT/UPDATE/DELETE | Owner only |
| entry_ratings | SELECT/INSERT/UPDATE/DELETE | Same as parent entry |
| follows | SELECT | Either party can see the follow relationship |
| follows | INSERT | Any authenticated user can follow another |
| follows | DELETE | Only the follower can unfollow |

### 3.3 Database Functions

- **`calculate_composite_score(entry_id uuid)`** -- Trigger function that recalculates composite_score on entry_ratings INSERT/UPDATE/DELETE
- **`handle_new_user()`** -- Trigger on auth.users INSERT that creates a profiles row
- **`update_updated_at()`** -- Generic trigger to set updated_at on row modification

### 3.4 Indexes

- `entries(user_id, passion_food_id, eaten_at DESC)` -- Dashboard queries
- `entries(passion_food_id, composite_score DESC)` -- Top-rated queries
- `profiles(username)` -- UNIQUE index for profile lookups
- `follows(follower_id)` and `follows(following_id)` -- Follow queries

## 4. Authentication Flow

```
Sign Up (Email)          Sign Up (Google)
     │                        │
     ▼                        ▼
Supabase Auth            OAuth Redirect
     │                        │
     ▼                        ▼
auth.users row created ◄──────┘
     │
     ▼
DB Trigger: handle_new_user()
     │
     ▼
profiles row created (display_name from auth metadata)
     │
     ▼
Redirect to /onboarding
     │
     ▼
User declares first passion food + sets up rating categories
     │
     ▼
Redirect to /dashboard
```

## 5. API Design

Using **Next.js Server Actions** for mutations and **Server Components** for data fetching. No separate REST API needed.

### Server Actions (src/app/actions/)
- `createPassionFood(name, themeKey)`
- `updatePassionFood(id, data)`
- `deletePassionFood(id)`
- `createSubtype(passionFoodId, name)`
- `updateSubtype(id, name)`
- `deleteSubtype(id)`
- `createRatingCategory(passionFoodId, name, weight)`
- `updateRatingCategories(passionFoodId, categories[])` -- Bulk update weights
- `deleteRatingCategory(id)`
- `createEntry(data)` -- Includes nested entry_ratings
- `updateEntry(id, data)`
- `deleteEntry(id)`
- `followUser(userId)`
- `unfollowUser(userId)`
- `updateProfile(data)`

## 6. Feature Build Order

| Phase | Feature | Depends On |
|-------|---------|------------|
| 1 | Project setup (Next.js, Supabase, Tailwind) | -- |
| 2 | Database schema + RLS | Phase 1 |
| 3 | Auth (signup, login, logout, OAuth) | Phase 2 |
| 4 | Onboarding (declare passion food, rating setup) | Phase 3 |
| 5 | Entry logging (full form with ratings) | Phase 4 |
| 6 | Entry list + detail + edit/delete | Phase 5 |
| 7 | Dashboard + visualizations | Phase 6 |
| 8 | Social (shareable profiles, follow, friends feed) | Phase 7 |
| 9 | Food theming + polish | Phase 8 |

## 7. Key Libraries

| Package | Purpose |
|---------|---------|
| `next` | Framework (App Router) |
| `react` / `react-dom` | UI |
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Server-side Supabase helpers for Next.js |
| `tailwindcss` | Styling |
| `recharts` | Charts and data visualization |
| `lucide-react` | Icons |
| `clsx` + `tailwind-merge` | Conditional classnames |
| `zod` | Form/data validation |

## 8. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

No secret server-side keys needed for MVP (RLS handles security). Google OAuth is configured in Supabase dashboard, not in env vars.

---

*Passion Food Architecture v1.0 -- February 2026*
