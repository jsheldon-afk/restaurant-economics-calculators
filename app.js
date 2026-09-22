(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const on = (el, ev, fn) => el.addEventListener(ev, fn);

  const fmtUSD = (n, opts = {}) => {
    const sign = n < 0 ? "-" : "";
    const v = Math.abs(n);
    return sign + "$" + v.toLocaleString("en-US", { maximumFractionDigits: opts.decimals ?? 0, minimumFractionDigits: opts.decimals ?? 0 });
  };
  const fmtPct = (n, decimals = 1) => (n * 100).toFixed(decimals) + "%";
  const fmtNum = (n) => Math.round(n).toLocaleString("en-US");
  const num = (id) => {
    const v = parseFloat($(id).value);
    return isNaN(v) ? 0 : v;
  };
  const pctInput = (id) => num(id) / 100;

  const negClass = (n) => (n < 0 ? "neg" : n > 0 ? "pos" : "");

  // ---------- small purpose-built SVG line chart, reused by a couple
  // of "why this happens" visuals below each calculator ----------
  function svgLineChart({ width = 560, height = 200, xDomain, yDomain, xTicks = [], yTicks = [], series = [], vLines = [], dots = [] }) {
    const pad = { top: 16, right: 16, bottom: 26, left: 46 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const sx = (x) => pad.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotW;
    const sy = (y) => pad.top + (1 - (y - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

    if (yDomain[0] < 0 && yDomain[1] > 0) {
      const zy = sy(0).toFixed(1);
      svg += `<line class="zero-line" x1="${pad.left}" y1="${zy}" x2="${width - pad.right}" y2="${zy}" />`;
    }
    svg += `<line class="axis-line" x1="${pad.left}" y1="${(height - pad.bottom).toFixed(1)}" x2="${width - pad.right}" y2="${(height - pad.bottom).toFixed(1)}" />`;

    series.forEach((s) => {
      if (!s.points || s.points.length < 2) return;
      const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
      svg += `<path class="${s.className}" d="${d}" />`;
    });

    vLines.forEach((v) => {
      const x = sx(v.x).toFixed(1);
      svg += `<line class="${v.className}" x1="${x}" y1="${pad.top}" x2="${x}" y2="${(height - pad.bottom).toFixed(1)}" />`;
    });

    dots.forEach((d) => {
      const x = sx(d.x), y = sy(d.y);
      svg += `<circle class="${d.className}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" />`;
      if (d.label) {
        const anchor = d.anchor || "middle";
        const ly = d.labelBelow ? y + 16 : y - 10;
        svg += `<text class="callout-label" x="${x.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}">${d.label}</text>`;
      }
    });

    xTicks.forEach((t) => {
      svg += `<text class="axis-label" x="${sx(t.x).toFixed(1)}" y="${(height - pad.bottom + 16).toFixed(1)}" text-anchor="middle">${t.label}</text>`;
    });
    yTicks.forEach((t) => {
      svg += `<text class="axis-label" x="${pad.left - 8}" y="${(sy(t.y) + 3).toFixed(1)}" text-anchor="end">${t.label}</text>`;
    });

    svg += `</svg>`;
    return svg;
  }

  // ---------- small waterfall/bridge chart: a starting bar, one or more
  // cost steps subtracted from it, and a final bar landing on the
  // result — a direct picture of "revenue minus costs equals profit" ----------
  function buildWaterfall(steps, heightPx = 150) {
    let running = 0;
    const bars = steps.map((s) => {
      if (s.kind === "start") {
        running = s.value;
        return { label: s.label, top: s.value, bottom: 0, display: s.value };
      }
      if (s.kind === "end") {
        return { label: s.label, top: Math.max(running, 0), bottom: Math.min(running, 0), display: running, isEnd: true };
      }
      const prev = running;
      running += s.value;
      return { label: s.label, top: Math.max(prev, running), bottom: Math.min(prev, running), display: s.value };
    });

    const allVals = bars.flatMap((b) => [b.top, b.bottom, 0]);
    const maxVal = Math.max(...allVals);
    const minVal = Math.min(...allVals);
    const range = maxVal - minVal || 1;
    const toPx = (v) => ((v - minVal) / range) * heightPx;

    const cols = bars.map((b) => {
      const barBottomPx = toPx(b.bottom);
      const barHeightPx = Math.max(toPx(b.top) - barBottomPx, 2);
      const kind = b.isEnd ? (b.display >= 0 ? "profit-pos" : "profit-neg") : b.display >= 0 ? "revenue" : "cost";
      return `<div class="waterfall-col">
        <div class="waterfall-value" style="bottom:${(barBottomPx + barHeightPx + 6).toFixed(0)}px;">${fmtUSD(b.display)}</div>
        <div class="waterfall-bar ${kind}" style="bottom:${barBottomPx.toFixed(0)}px; height:${barHeightPx.toFixed(0)}px;"></div>
        <div class="waterfall-label">${b.label}</div>
      </div>`;
    });
    return `<div class="waterfall">${cols.join("")}</div>`;
  }

  // ---------- tabs ----------
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".panel");
  tabButtons.forEach((btn) => {
    on(btn, "click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $("panel-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ==============================================================
  // HOW THE MATH WORKS (lives inside the New Guest Economics panel,
  // driven by that panel's F&B / Seated reward inputs)
  // ==============================================================
  function renderHow() {
    const avgCheck = num("n-avgcheck");
    const seatedGuests = num("n-seatedguests");
    const newPct = pctInput("n-newpct");
    const fb = pctInput("n-fb");
    const reward = pctInput("n-reward");

    const newGuestFbCost = avgCheck * fb;
    const newGuestRewardCost = avgCheck * reward;
    const newGainPerGuest = avgCheck - newGuestFbCost - newGuestRewardCost; // $ gain from one new guest
    const existLossPerGuest = avgCheck * reward; // $ loss from one regular guest

    const newGuests = seatedGuests * newPct;
    const existingGuests = seatedGuests * (1 - newPct);
    const lossTotal = existingGuests * existLossPerGuest;
    const gainTotal = newGuests * newGainPerGuest;
    const net = gainTotal - lossTotal;

    $("how-bullets").innerHTML = `
      <li>If a guest is <strong>new</strong> — you wouldn't have had them otherwise — you profit on the whole visit.</li>
      <li>If a guest is <strong>a regular</strong> who would've come in anyway, you just lose the reward you paid for them.</li>
      <li>Out of the <strong>${fmtNum(seatedGuests)} Seated guests</strong> above, that's roughly <strong>${fmtNum(newGuests)} new</strong> and <strong>${fmtNum(existingGuests)} regulars</strong>.</li>
    `;

    $("how-chart").innerHTML = buildWaterfall([
      { label: `${fmtNum(newGuests)} new guests`, value: gainTotal, kind: "start" },
      { label: `${fmtNum(existingGuests)} regulars`, value: -lossTotal, kind: "delta" },
      { label: "Net result", kind: "end" },
    ]);
    $("how-math-note").innerHTML = `Each new guest gains <strong style="color:var(--green);">+${fmtUSD(newGainPerGuest, { decimals: 2 })}</strong> (${fmtUSD(avgCheck)} check &minus; ${fmtUSD(newGuestFbCost)} F&amp;B &minus; ${fmtUSD(newGuestRewardCost)} Seated fee). Each regular guest loses <strong style="color:var(--red);">&minus;${fmtUSD(existLossPerGuest, { decimals: 2 })}</strong> (${fmtPct(reward, 0)} Seated fee on their ${fmtUSD(avgCheck)} check).`;
  }

  // ==============================================================
  // 1. NIGHTLY PROFIT MARGIN
  // ==============================================================
  function renderMargin() {
    const avgSpend = num("m-avgspend");
    const guests = num("m-guests");
    const seated = num("m-seated");
    const fb = pctInput("m-fb");
    const reward = pctInput("m-reward");
    const fixed = num("m-fixed");

    // Without Seated
    const noS_revenue = avgSpend * guests;
    const noS_fbcost = noS_revenue * fb;
    const noS_fixed = fixed;
    const noS_profit = noS_revenue - noS_fbcost - noS_fixed;
    const noS_margin = noS_revenue ? noS_profit / noS_revenue : 0;

    // Seated guests column
    const s_revenue = avgSpend * seated;
    const s_fbcost = s_revenue * fb;
    const s_fixed = 0;
    const s_seatedcost = s_revenue * reward;
    const s_profit = s_revenue - s_fbcost - s_fixed - s_seatedcost;
    const s_margin = s_revenue ? s_profit / s_revenue : 0;

    // Total (with Seated)
    const t_guests = guests + seated;
    const t_revenue = noS_revenue + s_revenue;
    const t_fbcost = noS_fbcost + s_fbcost;
    const t_fixed = noS_fixed;
    const t_seatedcost = s_seatedcost;
    const t_profit = noS_profit + s_profit;
    const t_margin = t_revenue ? t_profit / t_revenue : 0;
    const t_avgspend = t_guests ? t_revenue / t_guests : 0;

    const rows = [
      ["Diners", fmtNum(guests), fmtNum(seated), fmtNum(t_guests)],
      ["Avg. spend / guest", fmtUSD(avgSpend), fmtUSD(avgSpend), fmtUSD(t_avgspend)],
      ["Revenue", fmtUSD(noS_revenue), fmtUSD(s_revenue), fmtUSD(t_revenue)],
      ["F&amp;B cost", fmtUSD(-noS_fbcost), fmtUSD(-s_fbcost), fmtUSD(-t_fbcost)],
      ["Fixed costs", fmtUSD(-noS_fixed), fmtUSD(-s_fixed), fmtUSD(-t_fixed)],
      ["Seated reward cost", "—", fmtUSD(-s_seatedcost), fmtUSD(-t_seatedcost)],
    ];
    let html = rows.map(([label, a, b, c]) =>
      `<tr><td>${label}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`
    ).join("");
    html += `<tr class="total"><td>Profit</td><td class="${negClass(noS_profit)}">${fmtUSD(noS_profit)}</td><td class="${negClass(s_profit)}">${fmtUSD(s_profit)}</td><td class="${negClass(t_profit)}">${fmtUSD(t_profit)}</td></tr>`;
    html += `<tr><td>Profit margin</td><td>${fmtPct(noS_margin)}</td><td>${fmtPct(s_margin)}</td><td>${fmtPct(t_margin)}</td></tr>`;
    $("m-table").innerHTML = html;

    const liftPct = t_profit && noS_profit ? (t_profit - noS_profit) / Math.abs(noS_profit) : 0;

    $("m-totalprofit").textContent = fmtUSD(t_profit);
    $("m-totalprofit-sub").textContent = `${fmtPct(t_margin)} blended margin on ${fmtUSD(t_revenue)} revenue tonight`;
    $("m-liftprofit").textContent = fmtUSD(s_profit);
    $("m-liftprofit-sub").textContent = `from ${fmtNum(seated)} Seated guests tonight`;

    const marginDelta = t_margin - noS_margin;
    const marginClause = marginDelta < -0.0005
      ? `even though blended margin dips slightly, from ${fmtPct(noS_margin)} to ${fmtPct(t_margin)} — because the Seated reward rate outweighs what spreading fixed costs over more covers saves you`
      : marginDelta > 0.0005
      ? `and blended margin actually improves, from ${fmtPct(noS_margin)} to ${fmtPct(t_margin)} — because those covers carry none of your fixed costs`
      : `while blended margin holds steady at ${fmtPct(t_margin)}`;

    $("m-callout").innerHTML = `Adding <strong>${fmtNum(seated)} Seated guests</strong> tonight adds <strong>${fmtUSD(s_profit)}</strong> in pure incremental profit — total profit goes from ${fmtUSD(noS_profit)} to <strong>${fmtUSD(t_profit)}</strong> (${liftPct >= 0 ? "+" : ""}${fmtPct(liftPct)}), ${marginClause}.`;

    renderMarginChart(noS_revenue, noS_fbcost, noS_fixed, s_revenue, s_fbcost, s_seatedcost);
  }

  // Draws the table above as two waterfalls: revenue steps down for each
  // cost and lands on profit. Directly shows the tab's core contrast —
  // current business economics pays fixed costs, new guest economics
  // pays the reward fee instead — using the same numbers as the table.
  function renderMarginChart(noS_revenue, noS_fbcost, noS_fixed, s_revenue, s_fbcost, s_seatedcost) {
    const wfNoSeated = buildWaterfall([
      { label: "Revenue", value: noS_revenue, kind: "start" },
      { label: "F&amp;B cost", value: -noS_fbcost, kind: "delta" },
      { label: "Fixed costs", value: -noS_fixed, kind: "delta" },
      { label: "Profit", kind: "end" },
    ]);
    const wfSeated = buildWaterfall([
      { label: "Revenue", value: s_revenue, kind: "start" },
      { label: "F&amp;B cost", value: -s_fbcost, kind: "delta" },
      { label: "Seated fee", value: -s_seatedcost, kind: "delta" },
      { label: "Profit", kind: "end" },
    ]);
    $("m-chart").innerHTML = `
      <div class="waterfall-row">
        <div><div class="waterfall-title">Current Business Economics</div>${wfNoSeated}</div>
        <div><div class="waterfall-title">New Guest Economics</div>${wfSeated}</div>
      </div>
    `;
  }
  ["m-avgspend", "m-guests", "m-seated", "m-fb", "m-reward", "m-fixed"].forEach((id) => on($(id), "input", renderMargin));

  // ==============================================================
  // 2. OCCUPANCY / EMPTY SEATS
  // ==============================================================
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  function buildDayInputs() {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>Covers by day</h3>` + DAYS.map((d, i) => `
      <div class="field" style="${i === 0 ? "margin-top:14px;" : ""}">
        <label>${d}</label>
        <div class="input-wrap"><input type="number" id="o-day-${i}" value="${i < 4 ? 50 : 100}" min="0" step="1"></div>
      </div>
    `).join("");
    const inputsCard = document.querySelector("#panel-occupancy .inputs-card");
    inputsCard.appendChild(card);
    DAYS.forEach((_, i) => on($("o-day-" + i), "input", renderOccupancy));
  }

  function renderOccupancy() {
    const max = num("o-max");
    const check = num("o-check");
    const fb = pctInput("o-fb");
    const reward = pctInput("o-reward");

    let totalCovers = 0, totalEmpty = 0, totalMissedSales = 0, totalMissedProfit = 0, totalMissedTips = 0;
    const perDay = DAYS.map((d, i) => {
      const covers = num("o-day-" + i);
      const occ = max ? covers / max : 0;
      const empty = Math.max(max - covers, 0);
      const missedSales = empty * check;
      const missedProfit = empty * check * (1 - fb);
      const missedTips = empty * check * 0.18;
      totalCovers += covers;
      totalEmpty += empty;
      totalMissedSales += missedSales;
      totalMissedProfit += missedProfit;
      totalMissedTips += missedTips;
      return { d, covers, occ, empty, missedSales, missedProfit, missedTips };
    });

    const overallOcc = max ? totalCovers / (7 * max) : 0;

    // table
    let html = perDay.map((r) => `
      <tr>
        <td>${r.d}</td>
        <td>${fmtNum(r.covers)}</td>
        <td>${fmtPct(r.occ)}</td>
        <td>${fmtNum(r.empty)}</td>
        <td>${fmtUSD(r.missedSales)}</td>
        <td>${fmtUSD(r.missedProfit)}</td>
        <td>${fmtUSD(r.missedTips)}</td>
      </tr>
    `).join("");
    html += `<tr class="total">
      <td>Weekly total</td>
      <td>${fmtNum(totalCovers)}</td>
      <td>${fmtPct(overallOcc)}</td>
      <td>${fmtNum(totalEmpty)}</td>
      <td>${fmtUSD(totalMissedSales)}</td>
      <td>${fmtUSD(totalMissedProfit)}</td>
      <td>${fmtUSD(totalMissedTips)}</td>
    </tr>`;
    $("o-table").innerHTML = html;

    // stat cards (annualized = x52 weeks)
    const WEEKS = 52;
    $("o-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Weekly occupancy</div>
        <div class="stat-value">${fmtPct(overallOcc)}</div>
        <div class="stat-sub">${fmtNum(totalCovers)} of ${fmtNum(max * 7)} possible covers</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Empty seats / week</div>
        <div class="stat-value">${fmtNum(totalEmpty)}</div>
        <div class="stat-annual">${fmtNum(totalEmpty * WEEKS)}/year</div>
        <div class="stat-sub">seats that went unfilled</div>
      </div>
      <div class="stat-card emphasis">
        <div class="stat-label">Gross profit left on the table</div>
        <div class="stat-value">${fmtUSD(totalMissedProfit)}</div>
        <div class="stat-unit-line">per week</div>
        <div class="stat-annual">${fmtUSD(totalMissedProfit * WEEKS)}/year</div>
        <div class="stat-sub">after F&amp;B cost</div>
      </div>
    `;

    // bars
    $("o-bars").innerHTML = perDay.map((r) => {
      const h = Math.max(Math.min(r.occ, 1) * 128, 2);
      const warn = r.occ < 0.5;
      return `<div class="bar-col">
        <div class="bar-value">${fmtPct(r.occ, 0)}</div>
        <div class="bar ${warn ? "warn" : ""}" style="height:${h}px;"></div>
        <div class="bar-label">${r.d.slice(0, 3)}</div>
      </div>`;
    }).join("");

    // capture slider
    const capturePct = num("o-capture") / 100;
    $("o-capture-label").textContent = Math.round(capturePct * 100) + "%";
    const seatsFilled = totalEmpty * capturePct;
    const gainSales = seatsFilled * check;
    const gainProfit = seatsFilled * check * (1 - fb);
    const gainTips = seatsFilled * check * 0.18;
    const seatedCost = seatsFilled * check * reward;
    const netAddedProfit = gainProfit - seatedCost;
    $("o-capture-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Seats filled</div>
        <div class="stat-value">${fmtNum(seatsFilled)}</div>
        <div class="stat-unit-line">per week</div>
        <div class="stat-annual">${fmtNum(seatsFilled * WEEKS)}/year</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Added gross sales</div>
        <div class="stat-value">${fmtUSD(gainSales)}</div>
        <div class="stat-unit-line">per week</div>
        <div class="stat-annual">${fmtUSD(gainSales * WEEKS)}/year</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Added gross profit</div>
        <div class="stat-value">${fmtUSD(gainProfit)}</div>
        <div class="stat-unit-line">per week</div>
        <div class="stat-annual">${fmtUSD(gainProfit * WEEKS)}/year</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Added tips for staff</div>
        <div class="stat-value">${fmtUSD(gainTips)}</div>
        <div class="stat-unit-line">per week</div>
        <div class="stat-annual">${fmtUSD(gainTips * WEEKS)}/year</div>
      </div>
    `;

    // 100-square grid: a literal picture of the week, 1% per square.
    // Gray = already served, gold = the slice Seated fills, pale = still
    // empty even after that — moves live as the capture slider moves.
    const servedSquares = Math.round(Math.max(0, Math.min(1, overallOcc)) * 100);
    const weeklyCapacity = max * 7;
    const seatedSquares = weeklyCapacity ? Math.round(Math.max(0, Math.min(1, seatsFilled / weeklyCapacity)) * 100) : 0;
    const cappedSeated = Math.min(seatedSquares, 100 - servedSquares);
    $("o-seatgrid").innerHTML = Array.from({ length: 100 }, (_, i) => {
      let cls = "";
      if (i < servedSquares) cls = "baseline";
      else if (i < servedSquares + cappedSeated) cls = "filled";
      return `<div class="seat ${cls}"></div>`;
    }).join("");
    $("o-seatgrid-caption").innerHTML = `<strong>${fmtNum(totalCovers)}</strong> served &middot; <strong>${fmtNum(seatsFilled)}</strong> filled by Seated &middot; <strong>${fmtNum(Math.max(totalEmpty - seatsFilled, 0))}</strong> still empty, out of <strong>${fmtNum(weeklyCapacity)}</strong> possible.`;

    // Profit at current occupancy vs. profit with Seated's help, net of
    // what Seated actually charges for filling those seats
    const baselineProfit = totalCovers * check * (1 - fb);
    const profitWithSeated = baselineProfit + netAddedProfit;
    $("o-profit-current").textContent = fmtUSD(baselineProfit);
    $("o-profit-current-sub").textContent = `from ${fmtNum(totalCovers)} covers served this week`;
    $("o-profit-withseated").textContent = fmtUSD(profitWithSeated);
    $("o-profit-withseated-sub").textContent = `+${fmtUSD(gainProfit)} gross − ${fmtUSD(seatedCost)} Seated fee = +${fmtUSD(netAddedProfit)} net`;
  }

  ["o-max", "o-check", "o-fb", "o-reward"].forEach((id) => on($(id), "input", renderOccupancy));
  on($("o-capture"), "input", renderOccupancy);

  // ==============================================================
  // 3. NEW GUEST ECONOMICS
  // ==============================================================
  function renderNewGuest() {
    renderHow();
    const avgCheck = num("n-avgcheck");
    const nonSeatedGuests = num("n-nonseated");
    const seatedGuests = num("n-seatedguests");
    const newPct = pctInput("n-newpct");
    const reward = pctInput("n-reward");
    const fb = pctInput("n-fb");

    const restaurantSales = avgCheck * nonSeatedGuests;

    // Split Seated guests into the new (incremental) and regular (repeat)
    // share, since they have very different economics: new guests bring
    // real incremental sales, regulars only cost the reward.
    const newGuests = seatedGuests * newPct;
    const regularGuests = seatedGuests * (1 - newPct);

    const newSales = newGuests * avgCheck;
    const regularSales = 0; // no incremental sales — they'd have come anyway

    const newReward = -(newGuests * avgCheck * reward);
    const regularReward = -(regularGuests * avgCheck * reward);

    const newFbCost = -(newSales * fb);
    const regularFbCost = 0;

    const newNet = newSales + newReward + newFbCost;
    const regularNet = regularSales + regularReward + regularFbCost;

    const noS_sales = restaurantSales;
    const noS_fbCost = -(noS_sales * fb);
    const noS_net = noS_sales + noS_fbCost;

    // Seated total = new + regular
    const s_sales = newSales + regularSales;
    const s_rewardCost = newReward + regularReward;
    const s_fbCost = newFbCost + regularFbCost;
    const s_net = newNet + regularNet;

    // Grand total = without Seated + Seated total
    const total_sales = noS_sales + s_sales;
    const total_fbCost = noS_fbCost + s_fbCost;
    const total_net = noS_net + s_net;

    const breakeven = fb < 1 ? 1 - reward / (1 - fb) : 0;
    const repeatRate = 1 - newPct;
    const safe = repeatRate <= breakeven;

    $("n-netprofit").textContent = fmtUSD(s_net);
    $("n-netprofit-sub").textContent = `+${fmtUSD(newNet)} from new guests, ${fmtUSD(regularNet)} from regulars`;
    $("n-breakeven").textContent = fmtPct(breakeven, 1);

    $("n-callout").className = "callout " + (safe ? "" : "negative");
    $("n-callout").innerHTML = safe
      ? `At an assumed <strong>${fmtPct(newPct, 0)} new-guest rate</strong> (${fmtPct(repeatRate, 0)} repeat), you're well inside the breakeven line of ${fmtPct(breakeven, 1)} — Seated is net-positive by <strong>${fmtUSD(s_net)}</strong>.`
      : `At an assumed <strong>${fmtPct(newPct, 0)} new-guest rate</strong> (${fmtPct(repeatRate, 0)} repeat), you're past the breakeven line of ${fmtPct(breakeven, 1)} — Seated is currently net-negative by <strong>${fmtUSD(Math.abs(s_net))}</strong>.`;

    const usdOrDash = (v) => (v ? fmtUSD(v) : "—");
    const rows = [
      ["Guests", fmtNum(nonSeatedGuests), fmtNum(newGuests), fmtNum(regularGuests), fmtNum(seatedGuests), fmtNum(nonSeatedGuests + seatedGuests)],
      ["Sales", fmtUSD(noS_sales), fmtUSD(newSales), usdOrDash(regularSales), fmtUSD(s_sales), fmtUSD(total_sales)],
      ["Seated reward cost", "—", fmtUSD(newReward), fmtUSD(regularReward), fmtUSD(s_rewardCost), fmtUSD(s_rewardCost)],
      ["F&amp;B cost", fmtUSD(noS_fbCost), fmtUSD(newFbCost), usdOrDash(regularFbCost), fmtUSD(s_fbCost), fmtUSD(total_fbCost)],
    ];
    let html = rows.map(([l, a, b, c, d, e]) => `<tr><td>${l}</td><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td><td>${e}</td></tr>`).join("");
    html += `<tr class="total"><td>Net profit</td><td class="${negClass(noS_net)}">${fmtUSD(noS_net)}</td><td class="${negClass(newNet)}">${fmtUSD(newNet)}</td><td class="${negClass(regularNet)}">${fmtUSD(regularNet)}</td><td class="${negClass(s_net)}">${fmtUSD(s_net)}</td><td class="${negClass(total_net)}">${fmtUSD(total_net)}</td></tr>`;
    $("n-table").innerHTML = html;

    renderNewGuestChart(seatedGuests, avgCheck, fb, reward, repeatRate, s_net, breakeven);
  }

  // Net new profit is linear in the repeat-guest rate: 100% new guests
  // at one end, 100% regulars at the other. Visualizes the breakeven
  // stat as an actual crossing point instead of just a number.
  function renderNewGuestChart(seatedGuests, avgCheck, fb, reward, repeatRate, currentNet, breakeven) {
    const gainPerNew = avgCheck * (1 - fb - reward);
    const lossPerRegular = avgCheck * reward;
    const yAt0 = seatedGuests * gainPerNew; // 0% repeat = all new guests
    const yAt1 = -seatedGuests * lossPerRegular; // 100% repeat = all regulars

    const allY = [yAt0, yAt1, 0];
    let yMin = Math.min(...allY);
    let yMax = Math.max(...allY);
    const yPad = (yMax - yMin || 1) * 0.12;
    yMin -= yPad;
    yMax += yPad;

    const dots = [{ x: repeatRate, y: currentNet, className: "dot-current" }];
    if (breakeven >= 0 && breakeven <= 1) {
      dots.push({ x: breakeven, y: 0, className: "dot-crossover", label: `breakeven ${fmtPct(breakeven, 0)}`, labelBelow: yAt0 < 0 });
    }

    $("n-chart").innerHTML = `
      <div class="chart-legend">
        <span><span class="swatch" style="background:var(--gold);"></span>Net new profit from Seated</span>
        <span><span class="swatch" style="background:var(--muted); height:1px;"></span>Your current repeat rate</span>
      </div>
      ${svgLineChart({
        xDomain: [0, 1],
        yDomain: [yMin, yMax],
        series: [{ points: [{ x: 0, y: yAt0 }, { x: 1, y: yAt1 }], className: "line-profit" }],
        vLines: [{ x: repeatRate, className: "current-marker" }],
        dots,
        xTicks: [0, 0.5, 1].map((x) => ({ x, label: fmtPct(x, 0) })),
        yTicks: [yMin, 0, yMax].map((y) => ({ y, label: fmtUSD(y) })),
      })}
    `;
  }
  ["n-avgcheck", "n-nonseated", "n-seatedguests", "n-newpct", "n-reward", "n-fb"].forEach((id) => on($(id), "input", renderNewGuest));

  // ==============================================================
  // 4. PROFIT MARGIN BY OCCUPANCY TABLE
  // ==============================================================
  function renderOccTable() {
    const spend = num("t-spend");
    const fb = pctInput("t-fb");
    const seatedPct = pctInput("t-seated");
    const cap = num("t-cap");
    const baseline = num("t-baseline") / 100;
    const fixed = num("t-fixed");

    $("t-baseline-label").textContent = Math.round(baseline * 100) + "%";

    const steps = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const baselineSales = Math.round(baseline * cap) * spend;

    const cols = steps.map((occPct) => {
      const guests = Math.round(occPct * cap);
      const sales = guests * spend;
      const seatedSales = sales > baselineSales ? sales - baselineSales : 0;
      const nonSeatedSales = sales - seatedSales;
      const fbCost = -(sales * fb);
      const seatedCost = seatedSales ? -(seatedSales * seatedPct) : 0;
      const profit = sales + fbCost + seatedCost - fixed;
      const margin = sales ? profit / sales : 0;
      return { occPct, guests, sales, seatedSales, nonSeatedSales, fbCost, seatedCost, profit, margin };
    });

    // Headline stats: where profit crosses from negative to positive
    // (interpolated between the two nearest columns for precision), and
    // the margin once every seat is filled.
    const firstProfitableIdx = cols.findIndex((c) => c.profit >= 0);
    if (firstProfitableIdx === 0) {
      $("t-breakeven").textContent = "< 10%";
      $("t-breakeven-sub").textContent = "profitable even at your lowest occupancy shown";
    } else if (firstProfitableIdx === -1) {
      $("t-breakeven").textContent = "> 100%";
      $("t-breakeven-sub").textContent = "not profitable even at full occupancy — try lower fixed costs or a higher baseline";
    } else {
      const prev = cols[firstProfitableIdx - 1];
      const cur = cols[firstProfitableIdx];
      const breakevenOcc = prev.occPct + ((0 - prev.profit) / (cur.profit - prev.profit)) * (cur.occPct - prev.occPct);
      $("t-breakeven").textContent = fmtPct(breakevenOcc, 0);
      $("t-breakeven-sub").textContent = "occupancy where profit turns positive";
    }
    $("t-margin100").textContent = fmtPct(cols[cols.length - 1].margin, 1);

    // Which columns are filled on the restaurant's own (at/below baseline)
    // vs. filled by Seated (above baseline) — used to group + divide the
    // header and mark the transition column in every row.
    const firstSeatedIdx = cols.findIndex((c) => c.seatedCost !== 0);
    const inHouseCount = firstSeatedIdx === -1 ? cols.length : firstSeatedIdx;
    const seatedCount = cols.length - inHouseCount;

    // td()/th() add a divider class on the first "Seated" column so every
    // row (including both header rows) breaks visually at the same spot.
    const cellClass = (i, extraClass = "") => [extraClass, i === firstSeatedIdx ? "col-divider" : ""].filter(Boolean).join(" ");
    const td = (content, i, extraClass = "") => {
      const cls = cellClass(i, extraClass);
      return `<td${cls ? ` class="${cls}"` : ""}>${content}</td>`;
    };
    const th = (content, i, extraClass = "") => {
      const cls = cellClass(i, extraClass);
      return `<th${cls ? ` class="${cls}"` : ""}>${content}</th>`;
    };

    // grouped header row: "Your occupancy" vs "Seated fills the rest"
    let groupRow = `<th></th>`;
    if (inHouseCount > 0) groupRow += `<th colspan="${inHouseCount}" class="group-inhouse">Your occupancy</th>`;
    if (seatedCount > 0) groupRow += `<th colspan="${seatedCount}" class="group-seated col-divider">Seated fills the rest</th>`;
    $("t-group-row").innerHTML = groupRow;

    // occupancy % header row
    $("t-thead").innerHTML = `<th style="text-align:left;">Occupancy</th>` + cols.map((c, i) => th(fmtPct(c.occPct, 0), i)).join("");

    // Bar-chart row, built from the same <td> grid as the data rows below
    // it so the columns are guaranteed to line up pixel-for-pixel.
    //
    // Diverging design: profit grows UP from a shared zero line, loss
    // grows DOWN from it — so direction, not just color, tells you which
    // side of breakeven a column is on. The scale is genuinely linear
    // (no lie-factor from a log/sqrt trick); instead, the loss side is
    // capped at a sane multiple of the largest profit margin and any bar
    // beyond that cap is visibly hatched to say "goes further than this,
    // see the exact number above" — the true value is always printed on
    // the bar regardless of whether it's clipped.
    // Each area's flex-basis is a hard cap (min-height:0 in CSS stops
    // content from forcing it wider) — so the bar's own max height must
    // leave room for the value label + gap within that same fixed box,
    // or the label/bar overflow and push the zero line off-level per
    // column, which is exactly what broke it last time.
    const LABEL_H = 15;
    const GAP = 4;
    const POS_AREA = 56;
    const NEG_AREA = 92;
    const POS_BAR_MAX = POS_AREA - LABEL_H - GAP;
    const NEG_BAR_MAX = NEG_AREA - LABEL_H - GAP;
    const maxPosMargin = Math.max(0.05, ...cols.map((c) => Math.max(c.margin, 0)));
    const posCap = Math.min(maxPosMargin, 1);
    const negCap = Math.max(Math.min(maxPosMargin * 4, 1), 0.5);

    const chartRow = `<tr class="chart-row"><td></td>${cols.map((c, i) => {
      let inner;
      if (c.margin >= 0) {
        const clipped = c.margin > posCap;
        const h = c.margin > 0 ? Math.max((Math.min(c.margin, posCap) / posCap) * POS_BAR_MAX, 3) : 0;
        inner = `
          <div class="diverge-pos">
            ${clipped ? `<span class="clip-chevron top">&#9650;</span>` : ""}
            ${c.margin !== 0 ? `<div class="cell-value">${fmtPct(c.margin, 0)}</div>` : ""}
            <div class="diverge-bar pos${clipped ? " clipped" : ""}" style="height:${h}px;"></div>
          </div>
          <div class="diverge-zero"></div>
          <div class="diverge-neg"></div>
        `;
      } else {
        const mag = Math.abs(c.margin);
        const clipped = mag > negCap;
        const h = Math.max((Math.min(mag, negCap) / negCap) * NEG_BAR_MAX, 3);
        inner = `
          <div class="diverge-pos"></div>
          <div class="diverge-zero"></div>
          <div class="diverge-neg">
            <div class="diverge-bar neg${clipped ? " clipped" : ""}" style="height:${h}px;"></div>
            <div class="cell-value">${fmtPct(c.margin, 0)}</div>
            ${clipped ? `<span class="clip-chevron bottom">&#9660;</span>` : ""}
          </div>
        `;
      }
      const crossing = i === firstProfitableIdx ? " crossing" : "";
      return td(`<div class="diverge-cell${crossing}">${inner}</div>`, i);
    }).join("")}</tr>`;

    const salesRows = [
      ["Sales (non-Seated)", (c) => fmtUSD(c.nonSeatedSales)],
      ["Seated sales", (c) => (c.seatedSales ? fmtUSD(c.seatedSales) : "—")],
    ];
    const costRows = [
      ["F&amp;B cost", (c) => fmtUSD(c.fbCost)],
      ["Seated cost", (c) => (c.seatedCost ? fmtUSD(c.seatedCost) : "—")],
      ["Fixed cost", () => fmtUSD(-fixed)],
    ];
    const spacerRow = `<tr class="spacer"><td colspan="${cols.length + 1}"></td></tr>`;
    const dataRow = (label, fn) => `<tr><td>${label}</td>${cols.map((c, i) => td(fn(c), i)).join("")}</tr>`;

    let html = chartRow;
    html += dataRow("Guests", (c) => fmtNum(c.guests));
    html += salesRows.map(([label, fn]) => dataRow(label, fn)).join("");
    html += `<tr class="total"><td>Total sales</td>${cols.map((c, i) => td(fmtUSD(c.sales), i)).join("")}</tr>`;
    html += spacerRow;
    html += costRows.map(([label, fn]) => dataRow(label, fn)).join("");
    html += `<tr class="total"><td>Profit</td>${cols.map((c, i) => td(fmtUSD(c.profit), i, negClass(c.profit))).join("")}</tr>`;
    html += `<tr><td>Profit margin</td>${cols.map((c, i) => td(fmtPct(c.margin), i, negClass(c.margin))).join("")}</tr>`;
    $("t-table").innerHTML = html;

    // 100-square grid: at full capacity, how many seats are "yours"
    // (baseline) vs. Seated's to fill
    const baselineSquares = Math.round(Math.max(0, Math.min(1, baseline)) * 100);
    $("t-seatgrid-intro").textContent = `At ${fmtNum(cap)} covers (100% occupancy), ${fmtPct(baseline, 0)} of those seats are ones you'd fill on your own — the rest is what Seated is actually responsible for.`;
    $("t-seatgrid").innerHTML = Array.from({ length: 100 }, (_, i) =>
      `<div class="seat ${i < baselineSquares ? "baseline" : "filled"}"></div>`
    ).join("");
    const baselineGuests = Math.round(baseline * cap);
    $("t-seatgrid-caption").innerHTML = `<strong>${fmtNum(baselineGuests)}</strong> covers filled at your baseline &middot; <strong>${fmtNum(cap - baselineGuests)}</strong> covers are Seated's to fill.`;

    // profit if the restaurant stopped at its own baseline (no Seated
    // cost at all, since none of that sales is Seated's) vs. profit at
    // full occupancy once Seated has filled the rest
    const baselineProfit = baselineSales * (1 - fb) - fixed;
    const fullProfit = cols[cols.length - 1].profit;
    const fullSeatedCost = cols[cols.length - 1].seatedCost;
    $("t-profit-baseline").textContent = fmtUSD(baselineProfit);
    $("t-profit-baseline-sub").textContent = `from ${fmtNum(baselineGuests)} covers, no Seated involved`;
    $("t-profit-full").textContent = fmtUSD(fullProfit);
    $("t-profit-full-sub").textContent = fullSeatedCost ? `after a ${fmtUSD(Math.abs(fullSeatedCost))} Seated fee on the top ${fmtNum(cap - baselineGuests)} covers` : `Seated isn't filling any covers at this baseline`;
  }
  ["t-spend", "t-fb", "t-seated", "t-cap", "t-fixed"].forEach((id) => on($(id), "input", renderOccTable));
  on($("t-baseline"), "input", renderOccTable);

  // ---------- init ----------
  buildDayInputs();
  renderHow();
  renderMargin();
  renderOccupancy();
  renderNewGuest();
  renderOccTable();
})();
