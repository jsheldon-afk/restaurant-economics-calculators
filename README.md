# Restaurant Economics Calculators

Interactive, single-page site that turns the *New Guest Restaurant Economics* spreadsheet into live calculators for sales reps — to learn the underlying unit economics and to run on-screen during prospect pitches.

No build step, no dependencies — plain HTML/CSS/JS, deployable as a static site (e.g. GitHub Pages).

## Calculators

1. **How the Math Works** — the core intuition: why a "new" guest dollar nets you money and an "existing" guest dollar costs you the reward fee.
2. **Nightly Profit Margin** — a night of service with vs. without Seated guests, showing total profit lift even as blended margin % shifts.
3. **Empty Seats & Occupancy** — day-by-day covers vs. capacity, missed sales/profit/tips, and a slider showing the payoff from capturing a share of empty seats.
4. **New Guest Economics** — net profit from Seated-driven sales plus the cannibalization breakeven rate (the repeat-guest share above which Seated stops paying for itself).
5. **Profit Margin by Occupancy** — margin at every occupancy level from 10–100%, with a configurable baseline before the Seated fee applies to incremental covers.

All inputs update their outputs live — nothing to submit or recalculate.

## Running locally

Any static file server works, e.g.:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Source

Formulas are ported 1:1 from `New Guest Restaurant Economics 1.15.2026.xlsx` (sheets: Simple Profit Margin Calculator, Occupancy Calculator, New Guest Calculator, A Simple Math Explanation, Profit Margin Table by Table). One correction was made versus the raw sheet: on the New Guest Calculator tab, two output rows ("Total F&B Expense From Seated" / "Total Seated Cost") had swapped labels relative to their formulas in the source file — this site labels them correctly as "Seated reward cost" and "F&B cost."
