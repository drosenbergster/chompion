# Passion Food -- Product Requirements Document

## 1. Overview

### 1.1 Product Name
**Passion Food**

### 1.2 Elevator Pitch
Passion Food is a playful, mobile-responsive web app that lets people obsessively track the one food they love most -- their "passion food." Whether it's burritos, pizza, ramen, or hot dogs, users log every encounter with detailed entries, build a customizable weighted rating system, and see their eating habits come to life through beautiful data visualizations. Share your passion food journey with friends via profile links and follow each other's delicious data.

### 1.3 Target Audience
- Food enthusiasts who have a particular obsession with one (or a few) specific foods
- Friend groups who want to compare and share their food adventures
- Casual data nerds who enjoy tracking personal habits in a fun, visual way

### 1.4 Core Value Proposition
No other app focuses on tracking a single food type with this depth and personality. Passion Food turns a quirky personal habit ("I rate every taco I eat") into a shareable, visual, social experience.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Frontend | React, Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Hosting | Vercel |
| Charts / Viz | Recharts or Chart.js (TBD) |
| Maps Links | Google Maps search URLs (free, no API key) |

### 2.1 Platform
Mobile-responsive web application. No native mobile app required for MVP -- the responsive design will provide a near-native feel on phones and tablets.

---

## 3. User Accounts & Authentication

### 3.1 Sign Up / Login
- **Email + password** registration and login
- **Google OAuth** for low-friction sign-up (single click)
- Supabase Auth handles sessions, tokens, and password resets

### 3.2 Onboarding Flow
1. User signs up / logs in
2. Prompted to declare their first **passion food** (e.g., "Burritos")
3. Optionally define subtypes and customize rating categories
4. Taken to their dashboard -- ready to log their first entry

### 3.3 Profile
- Display name
- Avatar (optional)
- List of passion foods being tracked
- Shareable profile URL

---

## 4. Core Features

### 4.1 Passion Food Declaration

Users declare what food(s) they are tracking. Each passion food is its own "space" with separate entries, charts, and data.

- **Multiple passion foods** supported per account (e.g., Burritos AND Pizza)
- Each passion food has its own dedicated page/tab
- User-defined **subtypes** per passion food:
  - Example: Passion food = "Pizza" → Subtypes: "Neapolitan," "NY-style," "Deep Dish," "Detroit"
  - Example: Passion food = "Burritos" → Subtypes: "Carne Asada," "Al Pastor," "Breakfast Burrito"
- Subtypes are fully user-defined (free text, add/edit/delete)
- The level of specificity is up to the user (could track "Mexican Food" broadly or "Burritos" specifically)

### 4.2 Entry Logging

Each entry captures one instance of eating the passion food. The entry form includes:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| **Restaurant / Spot Name** | Text input | Yes | Where the food was eaten |
| **City** | Text input | Yes | City/location |
| **Address** | Text input | No | Street address (manually entered) |
| **Phone Number** | Text input | No | Restaurant phone number (manually entered) |
| **Hours / Notes on Location** | Text input | No | Any useful info about the spot (hours, reservations, etc.) |
| **Map Link** | Auto-generated | Auto | Free Google Maps search link generated from name + city (see below) |
| **Subtype** | Dropdown (user-defined list) | No | Which variant of the passion food |
| **Quantity** | Number | No | How many consumed |
| **Cost** | Currency ($) | No | How much was spent |
| **Date & Time** | Datetime picker | Yes | **Auto-defaults to current date/time** on entry creation; user can manually adjust |
| **Rating** | Multi-category star rating | Yes | See section 4.3 below |
| **Notes** | Text area | No | Free-form comments about the experience |

**Map Link Generation**: When a user enters a restaurant name and city, the app auto-generates a clickable Google Maps search link using the format: `https://www.google.com/maps/search/?api=1&query={restaurant_name}+{city}`. **This is a plain URL -- completely free, no API key, no Google account, zero cost.** It simply opens a Google Maps search in the browser.

**Location Details -- Manual Entry Only**: Additional location info (address, phone number, hours) is entered manually by the user. **No paid APIs** (Google Places, Yelp, etc.) are used in MVP. This keeps costs at zero while still allowing users to capture useful location details if they choose.

> **Cost principle for MVP**: The app must incur **no third-party API costs**. All features use free tiers or zero-cost approaches only.

### 4.3 Customizable Weighted Rating System

This is a standout feature. Users define their own rating criteria and weights.

**Setup (in Settings, per passion food):**
1. User creates rating categories (e.g., "Taste," "Presentation," "Value," "Portion Size")
2. User assigns a **weight** (percentage) to each category
3. Weights must sum to 100%
4. Default starter template: Taste (40%), Value (30%), Presentation (30%) -- user can modify

**On Each Entry:**
1. Each rating category is displayed with a **1-5 star** selector
2. User rates each category independently
3. App calculates a **weighted composite score** displayed prominently
4. Example: Taste (4 stars × 40%) + Value (5 stars × 30%) + Presentation (3 stars × 30%) = **4.0 composite**

**Display:**
- Individual category scores shown alongside composite
- Composite score is the primary "rating" displayed on entry cards and charts

### 4.4 Entry Management
- **Edit** any existing entry (all fields)
- **Delete** entries
- **Entry list view** -- scrollable, chronological list of all entries for a passion food
  - Each entry shown as a card: restaurant name, date, composite score, subtype
  - Tappable to expand/view full details
  - Sortable by date, rating, cost
  - Filterable by subtype, city, date range

### 4.5 Category / Settings Management
- **Add / Edit / Remove** subtypes at any time
- **Add / Edit / Remove / Reweight** rating categories at any time
- Changes to rating weights apply to **new entries only** (historical entries retain their original composite calculation)
- Option to **recalculate** historical entries with new weights (with confirmation prompt)

---

## 5. Data Visualization & Dashboard

Each passion food has its own dashboard with the following visualizations:

### 5.1 Stats Summary Bar
- Total entries count
- Average composite rating
- Total spent
- Total quantity consumed
- Most-visited restaurant
- Highest-rated entry
- Fun headline: *"You've eaten 147 burritos across 23 cities"*

### 5.2 Charts & Visualizations

| Visualization | Description |
|---------------|-------------|
| **Location Heat Map** | Map showing where entries are concentrated by city (bubble/dot sizes by frequency) |
| **Frequency Over Time** | Line/bar chart showing how often the user eats their passion food over weeks/months |
| **Subtype Breakdown** | Pie/donut chart showing distribution of subtypes |
| **Spending Over Time** | Line chart of cumulative or periodic spending |
| **Top Restaurants** | Bar chart ranking restaurants by frequency, average rating, or total visits |
| **Rating Distribution** | Histogram of composite scores |
| **Rating Category Breakdown** | Radar/spider chart showing average scores per rating category |

### 5.3 Entry Timeline
- Chronological feed of entries (most recent first)
- Card-based layout showing key info at a glance
- Quick-scroll with lazy loading

---

## 6. Social & Sharing

### 6.1 Shareable Profile Link
- Each user gets a unique profile URL: `passionfood.app/u/{username}`
- Profile page shows:
  - User's passion food(s)
  - Dashboard visualizations (read-only)
  - Recent entries
- **Not publicly discoverable** -- only accessible if someone has the link
- No login required to view a shared profile

### 6.2 Friends / Follow System
- Users can **follow** other users by entering their username or profile link
- Following adds that user's updates to a **"Friends Feed"** tab
- Followers can view each other's dashboards and entries
- Follow requests are automatic (no approval needed for MVP)

### 6.3 Individual Entry Sharing
- Any entry can be shared via a direct link
- Link shows the entry details in a clean, standalone view
- Suitable for sharing on social media or messaging

---

## 7. Themed Design System

### 7.1 Design Philosophy
**Playful but clean.** The app should feel fun and personal without being cluttered. Think bold food illustrations with clean data presentation.

### 7.2 Dynamic Food Theming
This is a signature design feature. The app's visual theme adapts to the user's passion food:

- **Background patterns**: Subtle, stylized doodle/illustration patterns of the passion food
  - Pizza → scattered pizza slice doodles, cheese drips, Italian flag accents
  - Burritos → wrapped burrito sketches, pepper patterns, warm color palette
  - Ramen → noodle swirl patterns, chopstick accents, steam wisps
  - Hot Dogs → mustard squiggle patterns, ballpark vibes
  - Tacos → taco shell patterns, lime wedge accents, vibrant colors
- **Color palette**: Shifts to complement the food theme (warm oranges/reds for burritos, reds/greens for pizza, etc.)
- **Empty states**: Fun illustrated characters ("Your burrito journey starts here!")

### 7.3 Pre-built Themes
Ship with **8-10 pre-built food themes** for common passion foods:
- Pizza, Burritos, Tacos, Ramen, Sushi, Hot Dogs, Burgers, Ice Cream, Wings, Pho

### 7.4 Fallback/Generic Theme
- For less common passion foods, use a **generic food-themed** playful pattern
- Warm, inviting color palette with general food doodles

### 7.5 UI Components
- Rounded cards with soft shadows
- Generous whitespace
- Large, readable typography
- Satisfying micro-animations on entry submission (e.g., burrito bounce, star fill)
- Mobile-first responsive layout

---

## 8. Information Architecture

### 8.1 Navigation Structure

```
├── Dashboard (home -- default passion food)
│   ├── Stats Summary
│   ├── Charts/Viz
│   └── Recent Entries
├── Entries (list/timeline view)
│   ├── Sort & Filter
│   └── Entry Detail (expand)
├── New Entry (+ button, always accessible)
├── My Passion Foods (switcher/tabs)
│   ├── [Passion Food 1]
│   ├── [Passion Food 2]
│   └── + Add New Passion Food
├── Friends Feed
│   ├── Following list
│   └── Friend activity
├── Profile / Settings
│   ├── Account settings
│   ├── Passion food settings (subtypes, rating categories)
│   └── Share profile link
└── Shared Profile View (public, no auth)
```

### 8.2 Key User Flows

**Flow 1: Log a New Entry**
1. Tap "+" button (persistent in nav)
2. Select which passion food (if multiple)
3. Enter restaurant name and city → map link auto-generates
4. Select subtype from dropdown
5. Rate each category (stars)
6. See composite score calculate in real-time
7. Optionally add quantity, cost, notes
8. Date/time pre-filled, adjustable
9. Submit → satisfying animation → entry appears in timeline

**Flow 2: View Dashboard**
1. Open app → lands on default passion food dashboard
2. See stats summary at top
3. Scroll through charts
4. Tap any chart for expanded view
5. Switch passion foods via tab/selector

**Flow 3: Share Profile**
1. Go to Profile
2. Tap "Share My Profile"
3. Copy link or share directly
4. Recipient opens link → sees read-only dashboard

---

## 9. Database Schema (High-Level)

### Tables

**users**
- id (UUID, PK)
- email
- display_name
- username (unique, for profile URL)
- avatar_url
- created_at

**passion_foods**
- id (UUID, PK)
- user_id (FK → users)
- name (e.g., "Burritos")
- theme_key (e.g., "burritos", "pizza", "generic")
- is_default (boolean)
- created_at

**subtypes**
- id (UUID, PK)
- passion_food_id (FK → passion_foods)
- name (e.g., "Al Pastor")
- created_at

**rating_categories**
- id (UUID, PK)
- passion_food_id (FK → passion_foods)
- name (e.g., "Taste")
- weight (decimal, 0-1, all must sum to 1.0)
- sort_order (integer)
- created_at

**entries**
- id (UUID, PK)
- passion_food_id (FK → passion_foods)
- user_id (FK → users)
- restaurant_name
- city
- address (text, nullable)
- phone_number (text, nullable)
- location_notes (text, nullable -- hours, reservations, etc.)
- subtype_id (FK → subtypes, nullable)
- quantity (integer, nullable)
- cost (decimal, nullable)
- composite_score (decimal, calculated)
- notes (text, nullable)
- eaten_at (timestamp)
- created_at

**entry_ratings**
- id (UUID, PK)
- entry_id (FK → entries)
- rating_category_id (FK → rating_categories)
- score (integer, 1-5)

**follows**
- follower_id (FK → users)
- following_id (FK → users)
- created_at
- PK: (follower_id, following_id)

---

## 10. MVP Scope

### In Scope (MVP)
- [x] User registration & login (email + Google)
- [x] Declare passion food(s) with user-defined subtypes
- [x] Customizable weighted rating system (categories + weights)
- [x] Full entry logging (restaurant, city, map link, subtype, quantity, cost, date, ratings, notes)
- [x] Entry list with sort/filter
- [x] Entry edit and delete
- [x] Dashboard with stats summary and core charts (frequency, subtype breakdown, top restaurants, spending, rating distribution)
- [x] Dynamic food-themed backgrounds and color palettes
- [x] Shareable profile link (read-only, no auth to view)
- [x] Follow system (follow other users, see their dashboards)
- [x] Friends feed
- [x] Mobile-responsive design
- [x] Settings management (subtypes, rating categories, weights)

### Out of Scope (Post-MVP)
- Photo uploads on entries
- Native mobile app (iOS/Android)
- Comments / reactions on entries
- Leaderboards / competitive features
- Google Places API auto-complete for location details (paid)
- Any paid third-party API integrations
- Push notifications
- Export data (CSV/PDF)
- Advanced analytics (AI-powered insights)
- Custom theme builder
- Public discoverability / search

---

## 11. Success Metrics
- Users complete onboarding (declare first passion food)
- Average entries per user per week
- Profile share link generation rate
- Return visits (weekly active users)
- Follow connections made

---

## 12. Open Questions
1. Should historical entries auto-recalculate when rating weights change, or keep original scores? (Current decision: keep original, offer optional recalculate)
2. Maximum number of passion foods per user? (Suggest: no hard limit for MVP, monitor usage)
3. Should the friends feed show individual entries or just dashboard summaries?
4. Character limits for notes field?
5. Should there be a "favorites" or "bookmark" feature for standout entries?

---

*Generated by BMAD Workflow -- Passion Food PRD v1.0*
*Date: February 16, 2026*
