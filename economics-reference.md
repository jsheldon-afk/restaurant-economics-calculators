# Restaurant Economics — Reference Guide

Source material for training content, quizzes, and tests on the economics behind adding Seated to a restaurant. This document explains the concepts, formulas, and worked examples independent of the calculator site's code — use it to generate questions, not the HTML/JS.

**Design intent for the quiz/test:** this should send reps *into the live tool*, not just test recall. Each tab has its own "go play with it" exercises below (change an input, read off a number, explain why it moved) — build the quiz around those, then layer in the conceptual questions to check they understood *why*, not just that they can follow steps. A rep should finish having actually used all four tabs, not just read about them.

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

**Interactive exercise — go to the "Nightly Profit Margin" tab:**
1. With the default numbers untouched, read off the callout: does blended margin go up or down when Seated guests are added? By how much?
2. Slowly raise the "Seated reward rate" input. Find the point where the callout flips from "margin improves" to "margin dips." What rate did that happen at, and why did crossing it change the direction? (Hint: compare that rate to fixed costs ÷ revenue.)
3. Set "Guests without Seated" to 0, leaving Seated guests at 10. What happens to the "Without Seated" column's profit and margin — and why does that make sense given fixed costs don't disappear?

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

**Interactive exercise — go to "The Cost of an Empty Table" tab:**
1. Enter a realistic week (or use the defaults): max covers, average check, and covers for each of the 7 days. What's the weekly gross profit left on the table? What's that annualized?
2. Look at the "Occupancy by day" bars. Which day is weakest, and by how much (in missed gross profit) compared to the strongest day?
3. Drag the "Share of empty seats captured" slider. At roughly what % capture does the added annual gross profit cross $500,000? Note the seats-filled and gross-sales figures at that point too.

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

**Interactive exercise — go to the "New Guest Economics" tab:**
1. With defaults, read the breakeven repeat-guest rate from the stat card. Scroll to "The simple way to think about it" — does the net result shown there match "Net new profit from Seated" above? (It should, always.)
2. Lower "New guest rate" until "Net new profit from Seated" turns negative. What rate caused it, and how does that compare to the breakeven rate the tool calculated at the default reward rate?
3. In your own words (not by quoting the tool), explain to a partner why a "regular" guest still costs money even though they generate zero incremental sales.

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

**Interactive exercise — go to the "Profit Margin by Occupancy" tab:**
1. With defaults, read the "Breakeven occupancy" stat card. Then find that same crossing point in the chart/table below — which occupancy column is the first with a positive (gold) margin?
2. Drag "Baseline occupancy" down to 50%. Does breakeven occupancy go up or down? Explain why in terms of how much of the chart is now "Seated fills the rest" territory.
3. Look at the chart's leftmost bars (very low occupancy, deep red, hatched). Why does a -410% margin not mean the model is broken — what's actually going on at that occupancy level?

---

## Conceptual quiz bank (layer these on top of the interactive exercises)

Use these *after* a rep has done the hands-on exercise for that tab — they check whether the exercise actually landed, not just whether it was completed.

1. **Conceptual (Tab 1):** Why can blended margin *improve* when adding Seated guests, even though Seated charges a fee? (Answer: fixed-cost dilution — Seated guests carry none of the fixed costs.)
2. **Myth-busting (Tab 1):** True/false — "Seated always hurts your margin." (False — depends on reward rate vs. fixed-cost dilution; a rep should be able to say *which* is bigger determines the direction.)
3. **Applied (Tab 2):** Given weekly missed gross profit, compute the annualized figure without the tool. (× 52)
4. **Conceptual (Tab 2):** Why does an empty seat cost money even if no one else was asking for a table that night?
5. **Conceptual (Tab 3):** What's the difference in economics between a "new" Seated guest and a "regular" Seated guest?
6. **Formula recall (Tab 3):** What's the breakeven repeat-rate formula, and what does each term mean?
7. **Myth-busting (Tab 3):** True/false — "If even a few Seated guests are repeat customers, Seated isn't worth it." (False — the breakeven repeat rate is usually well above 50%.)
8. **Formula recall (Tab 4):** Why does Seated's fee on the "Profit Margin by Occupancy" view only apply above the baseline occupancy?
9. **Scenario-based (any tab):** Given a restaurant's inputs, identify whether it's above or below its breakeven occupancy/repeat rate, and state what that means for profitability in one sentence.
10. **Synthesis:** In your own words, connect Tab 1 and Tab 3 — why does the "new guest gain / regular guest loss" math from Tab 3 explain the margin behavior seen in Tab 1?

## Suggested overall structure

A 4-part quiz, one part per tab, each part = the tab's interactive exercise (above) immediately followed by its matching conceptual question(s). Close with the synthesis question (#10) to check the rep can connect the tabs, not just complete each in isolation.
