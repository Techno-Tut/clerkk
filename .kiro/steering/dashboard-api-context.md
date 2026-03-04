# Clerkk Dashboard & API Context

## API Architecture

### Base URL
- **Development**: `http://localhost:8000`
- **Android Emulator**: `http://10.0.2.2:8000`
- **Physical Device**: User-configurable via Settings (stored in AsyncStorage)

### Authentication
- **Provider**: Auth0
- **Token Type**: JWT Bearer Token
- **Required Audience**: `https://api.inbriefs.com` (critical - without this, Auth0 returns encrypted ID token instead of JWT)

### Key Endpoints

**Dashboard**
- `GET /dashboard/stats?period=monthly|yearly`
- Returns: surplus, income, post_tax_income, taxes, expenses, effective_tax_rate, marginal_tax_rate, income_percentile

**User**
- `GET /user/me` - Get current user profile
- `POST /user/complete-onboarding` - Mark onboarding complete

**Income**
- `POST /income/` - Create user income profile
- `POST /income/events` - Log income event (paycheck, bonus)

**Expenses**
- `POST /expenses/` - Create expense(s) - accepts single object or array
- `PUT /expenses/{id}` - Update expense
- `GET /expenses/total` - Get total monthly expenses

## Tax Calculations

### Canadian Tax System (2024)

**Basic Personal Amounts (BPA)**
- Federal: $15,705 (phases out $173,205-$246,752)
- Ontario: $11,865 (no phase-out)
- Applied as 15% federal credit, 5.05% Ontario credit
- **Everyone gets this** - it's automatic

**What's Included**
- ✅ Federal progressive tax brackets
- ✅ Provincial progressive tax brackets (Ontario)
- ✅ Basic Personal Amount credits
- ✅ BPA phase-out for high earners

**What's NOT Included (by design)**
- ❌ CPP deductions (~$3,867 max in 2024)
- ❌ EI deductions (~$1,049 max in 2024)
- ❌ Other tax credits (employment amount, etc.)
- ❌ RRSP deductions
- **Reason**: Too variable per individual, would require more user input

### Tax Rate Definitions

**Effective Tax Rate**
- Formula: Total taxes paid / Total income
- What it means: Average tax rate across all income
- Example: $55,790 / $192,000 = 29.06%
- User sees: "Overall tax burden"

**Marginal Tax Rate**
- Formula: Highest tax bracket reached (federal + provincial)
- What it means: Tax on next dollar earned
- Example: 26% federal + 17.41% Ontario = 43.41%
- User sees: "$0.57 / $1 you keep per dollar earned"

### Income Percentiles

**Data Source**: Statistics Canada High Income Canadians Report (Oct 2024)
**Based on**: Individual gross income (pre-tax)
**Update Frequency**: Annually when StatCan releases new data

**Thresholds (2024)**
- Top 1%: $283,200+
- Top 2%: $200,000+
- Top 5%: $150,000+
- Top 10%: $110,000+
- Top 20%: $80,000+

**Why Pre-Tax**: Standard for income comparisons, matches StatCan reporting

## Dashboard UI Decisions

### Hero Card
- **Main Number**: Surplus (what's left after taxes & expenses)
- **Subtitle**: "Out of $X after taxes this month/year"
- **Why**: Users care most about available money, context shows where it came from

### Stat Cards
1. **Income**: Gross income (before taxes)
2. **Expenses**: Fixed monthly expenses
3. **Debt**: Placeholder ($0) for future feature

### Footer Stats
1. **Marginal Tax Rate**: Shows cost of earning more (important for bonuses/RRSP decisions)
2. **Income Ranking**: Percentile vs other Canadians (motivational context)

### Currency Display
- **Whole numbers**: No decimals ($16,000)
- **With cents**: Show decimals ($7,734.78)
- **Why**: Precision where it matters, cleaner where it doesn't

### Wording Decisions

**"Out of $X after taxes"** (not "Left of")
- Clearer ratio relationship
- More natural English

**"you keep per dollar earned"** (not "marginal rate")
- No jargon
- Immediately understandable
- Focus on what you keep, not what you pay

**"of Canadian earners"** (not "earn more than most")
- Neutral and factual
- No interpretation needed
- User can understand their position

## Error Handling

### Standardized Response Format
```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**Error Codes**
- `INPUT_VALIDATION_ERROR` - Bad request data
- `INVALID_REQUEST` - Business logic error
- `INTERNAL_ERROR` - Server error (never exposes DB details)
- `HTTP_ERROR` - FastAPI HTTP exceptions

## Data Flow

### Onboarding → Dashboard
1. User enters income ($192,000 gross annual)
2. User enters expenses ($3,420/month)
3. User selects location (Ontario)
4. Backend calculates:
   - Federal tax with BPA: $38,836
   - Ontario tax with BPA: $16,954
   - Total tax: $55,790 (29.06% effective)
   - Marginal rate: 43.41%
   - Post-tax income: $136,210 annual / $11,351 monthly
   - Surplus: $11,351 - $3,420 = $7,931/month
5. Frontend displays all stats with proper formatting

## Future Considerations

### Tax Calculation Enhancements
- Add other provinces (BC, AB, QC, etc.)
- Optional CPP/EI toggle for more accuracy
- RRSP contribution impact calculator
- Mid-year tax adjustments

### Income Percentile
- Add age-based percentiles (StatCan provides this)
- Provincial percentiles (not just national)
- Historical tracking (show progress over time)

### Currency Component
- Add USD support (for cross-border workers)
- Add EUR, GBP for future expansion
- Currency conversion API integration

## Technical Debt

### Known Limitations
1. Tax calculation assumes full-year employment (no mid-year start/end)
2. No support for multiple income sources yet
3. Percentile data needs manual annual update
4. No provincial tax for provinces other than Ontario

### Performance
- Dashboard stats calculated on-demand (no caching)
- Tax calculation is fast (<10ms) so caching not needed yet
- Consider Redis caching if user base grows significantly

## Testing Notes

### Test User Data
- Income: $192,000/year
- Expenses: $3,420/month (rent $2,300, utilities $120, misc $1,000)
- Location: Ontario
- Expected Results:
  - Effective rate: ~29%
  - Marginal rate: 43.41%
  - Monthly surplus: ~$7,700-7,900
  - Percentile: Top 5%

### Edge Cases to Test
- Income below $40,000 (below median)
- Income above $283,200 (top 1%)
- Income $173,205-$246,752 (BPA phase-out range)
- Zero expenses
- Very high expenses (negative surplus)
