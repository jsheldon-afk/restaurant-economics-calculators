# Restaurant Economics — Reference Guide

Source material for training content, quizzes, and tests on the economics behind adding Seated to a restaurant. This document explains the concepts, formulas, and worked examples independent of the calculator site's code — use it to generate questions, not the HTML/JS.

Live tool: https://jsheldon-afk.github.io/restaurant-economics-calculators/
Source: https://github.com/jsheldon-afk/restaurant-economics-calculators

---

## Glossary

| Term | Meaning |
|---|---|
| **F&B cost %** | Cost of food & beverage as a percentage of sales (ingredients, prep). |
| **Seated reward rate** | The fee/reward rate Seated charges on the sales it drives. |
| **New guest** | A guest who wouldn't have visited without Seated — genuinely incremental business. |
| **Regular guest** | A guest who would have come in anyway; Seated didn't create this visit, but you still pay the reward on it. |
| **Blended margin** | Overall profit margin combining Seated and non-Seated business. |
| **Fixed costs** | Rent, labor, etc. — costs that don't change with covers/guest count. |
| **Baseline occupancy** | The occupancy a restaurant would hit on its own, without Seated. |
| **Breakeven repeat rate** | The share of Seated guests that could be repeat customers before Seated stops being profitable. |
| **Breakeven occupancy** | The occupancy level at which profit crosses from negative to positive. |

---

## 1. Nightly Profit Margin — With vs. Without Seated

**Question it answers:** Does adding Seated guests to a night of service help or hurt, both in dollars and in margin %?

**Inputs:** average check, guests without Seated, Seated guests, F&B cost %, Seated reward rate, fixed costs (rent/labor for the night).

**Formulas:**
- Without Seated: `revenue = avgCheck × guests`; `profit = revenue − (revenue × F&B%) − fixedCosts`
- Seated guests only: `revenue = avgCheck × seatedGuests`; `profit = revenue − (revenue × F&B%) − (revenue × rewardRate)` — **no fixed costs are allocated to this column**, because fixed costs don't grow just because Seated added covers.
- Total = sum of both columns.

**Worked example (defaults):** $50 check, 100 guests without Seated, 10 Seated guests, 30% F&B, 25% Seated reward, $2,500 fixed costs.
- Without Seated: $5,000 revenue → $1,000 profit → 20.0% margin
- Seated guests only: $500 revenue → $225 profit → 45.0% margin
- Total: $5,500 revenue → $1,225 profit → 22.3% margin

**Key teaching point (a common misconception to test on):** Blended margin does **not** always dip when you add Seated guests. It depends on whether the Seated reward rate is bigger or smaller than what you save by *not* allocating fixed costs to those covers. In the example above, margin actually **improves** (20.0% → 22.3%) because Seated guests carry none of the $2,500 fixed cost — their 45% margin pulls the blended average up. Margin only dips when the reward rate is high enough to outweigh that fixed-cost dilution benefit.

---

## 2. The Cost of an Empty Table (Occupancy)

**Question it answers:** What is an empty seat actually costing the restaurant, and what would filling some of them be worth — per week and per year?

**Inputs:** max covers per day (capacity), average check, F&B cost %, covers for each of the 7 days.

**Per-day formulas:**
- `occupancy = covers / maxCovers`
- `emptySeats = maxCovers − covers`
- `missedSales = emptySeats × avgCheck`
- `missedGrossProfit = emptySeats × avgCheck × (1 − F&B%)`
- `missedTips = emptySeats × avgCheck × 18%` (assumed tip rate)

Weekly totals are the sum across all 7 days. Annual figures are the weekly figure × 52.

**"If Seated filled a share of those empty seats" scenario:** pick a capture % (e.g. 30%) → `seatsFilled = totalEmptySeats × capture%`, then the same sales/profit/tips math applied to just those recovered seats.

**Worked example (defaults):** 200 max covers/day, $50 check, 30% F&B, Mon–Thu at 50 covers, Fri–Sun at 100 covers.
- Weekly occupancy: 35.7% (500 of 1,400 possible covers)
- Empty seats: 900/week → 46,800/year
- Gross profit left on the table: $31,500/week → **$1,638,000/year**
- Capturing 30% of those empty seats: 270 seats/week → $9,450/week added gross profit → $491,400/year

**Key teaching point:** Every empty seat is lost profit *whether or not anyone notices* — it's not a hypothetical, it happened every single service period. Annualizing the number (×52) is what makes the scale of the opportunity land for an owner.

---

## 3. New Guest Economics

**Question it answers:** Is Seated actually bringing incremental business, or just serving people who'd have come anyway — and where's the tipping point where it stops being worth it?

**Inputs:** average check, guests without Seated, Seated guests, new guest rate % (of Seated guests who are genuinely incremental), Seated reward rate, F&B cost %.

**Core formulas:**
- `newGuests = seatedGuests × newGuestRate%`; `regularGuests = seatedGuests × (1 − newGuestRate%)`
- Each **new** guest gains you: `avgCheck − (avgCheck × F&B%) − (avgCheck × rewardRate)` — i.e., the check minus food cost minus the reward fee.
- Each **regular** guest loses you: `avgCheck × rewardRate` — pure cost, no offsetting gain, since that sale wasn't incremental.
- `netNewProfit = (newGuests × gainPerNewGuest) − (regularGuests × lossPerRegularGuest)`
- **Breakeven repeat rate** = `1 − rewardRate / (1 − F&B%)` — above this share of repeat guests, Seated stops paying for itself.

**Worked example (defaults):** $50 check, 200 non-Seated guests, 20 Seated guests, 88% new-guest rate, 20% reward, 30% F&B.
- New guests: 18 → gain $25.00 each ($50 − $15 F&B − $10 reward) → +$440
- Regular guests: 2 → lose $10.00 each (20% of $50) → −$24
- **Net new profit: +$416**
- Breakeven repeat rate: 71.4% — since the actual repeat rate here is only 12%, Seated is comfortably profitable.

**Key teaching point (the core intuition of the whole site):** A new guest's dollar is worth far more than a regular guest's dollar costs you, so it only takes a modest share of genuinely new guests to outweigh a much larger share of regulars. This is why the "cannibalization" fear (worrying Seated is just serving existing customers) is usually overstated — the breakeven line is typically much higher than people assume.

---

## 4. Profit Margin by Occupancy

**Question it answers:** How does margin trend as occupancy climbs from empty to full, where Seated is specifically responsible for filling the seats above what the restaurant would do on its own?

**Inputs:** per-person spend, F&B cost %, total capacity (covers at 100%), baseline occupancy % (what you'd hit without Seated), Seated cost % (charged only above baseline), fixed costs.

**Formulas, per occupancy step (10% through 100%):**
- `sales = guests × spend`
- `seatedSales = max(sales − baselineSales, 0)` — sales above what the baseline occupancy would produce
- `F&B cost = −sales × F&B%` (applies to all sales)
- `Seated cost = −seatedSales × rewardRate` (**only** applies to the portion above baseline — the seats Seated is actually responsible for filling)
- `profit = sales − F&B cost − Seated cost − fixedCosts`
- `margin = profit / sales`

**Breakeven occupancy** is found by interpolating between the two occupancy steps where profit crosses from negative to positive.

**Worked example (defaults):** $50 spend, 30% F&B, 100 capacity, 80% baseline, 20% Seated cost, $2,400 fixed costs.
- At 10% occupancy: −410% margin (fixed costs dominate almost-empty sales)
- At 80% occupancy (baseline): 10.0% margin, no Seated cost yet
- At 90–100% occupancy (Seated-filled): 14.4% → 18.0% margin, despite paying the Seated fee on that slice
- **Breakeven occupancy: ~69%**

**Key teaching point:** Margin at very low occupancy looks alarmingly negative — that's fixed costs being spread over almost no sales, not a flaw in the model. As occupancy climbs, margin improves steadily even *after* Seated's fee kicks in on the top slice, because fixed costs are now spread over far more covers. The fee never applies to seats the restaurant would have filled on its own.

---

## Suggested quiz/test topics

1. **Conceptual:** Why can blended margin *improve* when adding Seated guests, even though Seated charges a fee? (Answer: fixed-cost dilution — Seated guests carry none of the fixed costs.)
2. **Conceptual:** What's the difference in economics between a "new" Seated guest and a "regular" Seated guest?
3. **Formula recall:** What's the breakeven repeat-rate formula, and what does each term mean?
4. **Formula recall:** Why does Seated's fee on the "Profit Margin by Occupancy" view only apply above the baseline occupancy?
5. **Applied/calculation:** Given a check size, F&B%, and reward rate, compute the gain from one new guest and the loss from one regular guest.
6. **Applied/calculation:** Given weekly missed gross profit, compute the annualized figure.
7. **Myth-busting:** True/false — "Seated always hurts your margin." (False — depends on reward rate vs. fixed-cost dilution.)
8. **Myth-busting:** True/false — "If even a few Seated guests are repeat customers, Seated isn't worth it." (False — the breakeven repeat rate is usually well above 50%.)
9. **Scenario-based:** Given inputs, identify whether a restaurant is above or below its breakeven occupancy/repeat rate, and what that means for profitability.
