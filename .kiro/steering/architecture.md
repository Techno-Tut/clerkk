# Clerkk Architecture

## Sign-Up Strategy: Invest Time, Then Gate

Users enter their financial profile (income, expenses, debt) before signing up. Data stays local until sign-up is complete, then syncs to server. This leverages sunk cost and curiosity to increase conversion.

## Authentication

**Provider:** Auth0
**Social Login:** Google, Apple
**Token:** JWT (validated server-side)
**Free Tier:** 25,000 monthly active users

## User Flow

### Onboarding (Pre-Sign-Up)

1. **Landing**
   - "Get your financial plan in 3 minutes"
   - No sign-up required yet

2. **Profile Form (Local Storage Only)**
   - Step 1/4: Income (gross annual, monthly net)
   - Step 2/4: Expenses (rent, utilities, groceries, misc)
   - Step 3/4: Debt (credit card, mortgage, etc.)
   - Step 4/4: Location (country/region for tax brackets)
   - All data stored locally on device, not sent to server

3. **Sign-Up Gate**
   - After form completion: "Create account to see your plan"
   - Auth0 social login (Google, Apple) - custom UI in-app
   - User signs up to unlock results

4. **Profile Creation & Sync**
   - Server creates authenticated profile
   - App sends form data to server in one batch
   - Server processes tax calculations
   - Returns: surplus, tax optimization, financial health score

### Post-Sign-Up Experience

**Core Features:**
- Monthly surplus calculation
- Tax optimization (RRSP/TFSA suggestions)
- Income logging (weekly/biweekly/monthly + bonuses)
- Expense/debt adjustments
- Financial health score

**AI Chat:**
- Full conversational CFO experience
- Requires authenticated account

## Database Schema

### Core Tables

**users**
- `id` (UUID, PK)
- `auth0_id` (unique, indexed)
- `email` (unique, indexed)
- `country` (ISO 3166-1: 'CA', 'US')
- `region` (Province/State: 'ON', 'BC', 'NY', 'CA')
- `created_at`, `updated_at`

**user_income** (totals - updated monthly)
- `user_id` (FK users, PK)
- `gross_annual_estimate` - for tax brackets, RRSP/TFSA room
- `total_monthly_net` - sum of income_events this month
- `last_updated`

**income_sources** (jobs, gigs)
- `id` (PK)
- `user_id` (FK users)
- `source_name` (e.g., "Tech Job", "Consulting")
- `gross_annual_estimate`
- `monthly_net` - expected baseline (validation anchor)
- `pay_frequency` ('weekly', 'biweekly', 'monthly')
- `is_active`
- `added_at`

**income_events** (all income logs)
- `id` (PK)
- `user_id` (FK users, indexed)
- `source_id` (FK income_sources, nullable)
- `event_type` ('pay', 'bonus', 'rsu', 'other')
- `gross_amount` (nullable)
- `net_amount` - actual cash landed
- `region` - province/state at time of event (for mid-year moves)
- `event_date` (indexed)
- `notes`
- `logged_at` (indexed)

### Income Flow

1. **Onboarding:** User sets up sources with expected `monthly_net`
2. **Monthly ping:** "Log your paycheck" → creates `income_event`
3. **Auto-sum:** `user_income.total_monthly_net` = SUM(events this month)
4. **Validation:** Compare actual vs expected, warn if mismatch > $100

### Key Design Decisions

**Region tracking:**
- Stored on `users` (current location)
- Also stored per `income_event` (historical accuracy for mid-year moves)
- Future-proofs for US state tax complexity

**Pay frequency:**
- Stored on `income_sources` (each source can differ)
- App pings based on source frequency
- Weekly/biweekly handled same as monthly (just more events)

**Event types:**
- Regular pay: `event_type='pay'`, `source_id` present
- One-offs: `event_type='bonus'`, `source_id` nullable
- Enables queries like "show all bonuses this year"

**Cascade deletes:**
- User deletion removes all related income data
- Source deletion sets `income_events.source_id` to NULL (preserves history)

## Data Storage

### Device (Local)

**Pre-Sign-Up:**
- Form data stored in memory/local storage
- No server communication
- Lost if user abandons or closes app

**Post-Sign-Up:**
- Auth token (JWT from Auth0)
- Profile cache for offline display

### Server

**Authenticated Profiles Only:**
- Identified by userId (UUID)
- Contains: income, expenses, debt, location
- Tax calculation history
- AI chat history
- Permanent storage (PostgreSQL)

**No anonymous profiles** - all data requires authentication

## Security Benefits

- No UUID risk (no anonymous server data)
- Financial data only stored after user authentication
- HTTPS for all API calls
- JWT tokens validated server-side (Auth0)
- No orphaned profiles or TTL management
- Cascade deletes prevent data leaks

## Conversion Strategy

**Why users sign up:**
1. Sunk cost: Spent 3 minutes entering data
2. Curiosity: "I need to see my results"
3. Perceived value: App has their data, feels personalized

**Expected conversion:** 60-80% of users who complete form will sign up

**Drop-off handling:**
- If user abandons at sign-up gate, local data is lost
- Acceptable trade-off: uncommitted users filtered out early
