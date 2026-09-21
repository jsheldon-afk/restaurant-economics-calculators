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

    const newGainPerGuest = avgCheck * (1 - fb - reward); // $ gain from one new guest
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

    $("how-math-box").innerHTML = `
      <div class="math-row"><span>Each new guest gains you</span><span class="val pos">+${fmtUSD(newGainPerGuest, { decimals: 2 })} <span style="color:var(--muted); font-weight:400;">(${fmtUSD(avgCheck)} check &times; (1 &minus; ${fmtPct(fb, 0)} F&amp;B &minus; ${fmtPct(reward, 0)} Seated rate))</span></span></div>
      <div class="math-row"><span>Each regular guest loses you</span><span class="val neg">&minus;${fmtUSD(existLossPerGuest, { decimals: 2 })} <span style="color:var(--muted); font-weight:400;">(${fmtUSD(avgCheck)} check &times; ${fmtPct(reward, 0)} Seated rate)</span></span></div>
      <div class="math-row"><span>${fmtNum(existingGuests)} regular guests loses you</span><span class="val neg">&minus;${fmtUSD(lossTotal)}</span></div>
      <div class="math-row"><span>${fmtNum(newGuests)} new guests gains you</span><span class="val pos">+${fmtUSD(gainTotal)}</span></div>
      <div class="math-row" style="border-top:2px solid var(--ink); margin-top:4px; padding-top:12px; font-weight:700;">
        <span>Net result</span><span class="val ${net >= 0 ? "pos" : "neg"}">${net >= 0 ? "+" : ""}${fmtUSD(net)}</span>
      </div>
    `;
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
    $("m-callout").innerHTML = `Adding <strong>${fmtNum(seated)} Seated guests</strong> tonight adds <strong>${fmtUSD(s_profit)}</strong> in pure incremental profit — total profit goes from ${fmtUSD(noS_profit)} to <strong>${fmtUSD(t_profit)}</strong> (${liftPct >= 0 ? "+" : ""}${fmtPct(liftPct)}), even though blended margin moves from ${fmtPct(noS_margin)} to ${fmtPct(t_margin)}.`;
  }
  ["m-avgspend", "m-guests", "m-seated", "m-fb", "m-reward", "m-fixed"].forEach((id) => on($(id), "input", renderMargin));

  // ==============================================================
  // 2. OCCUPANCY / EMPTY SEATS
  // ==============================================================
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayInputsWrap = document.createElement("div");

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

    // stat cards
    $("o-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Weekly occupancy</div>
        <div class="stat-value">${fmtPct(overallOcc)}</div>
        <div class="stat-sub">${fmtNum(totalCovers)} of ${fmtNum(max * 7)} possible covers</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Empty seats / week</div>
        <div class="stat-value">${fmtNum(totalEmpty)}</div>
        <div class="stat-sub">seats that went unfilled</div>
      </div>
      <div class="stat-card emphasis">
        <div class="stat-label">Gross profit left on the table</div>
        <div class="stat-value">${fmtUSD(totalMissedProfit)}</div>
        <div class="stat-sub">per week, after F&amp;B cost</div>
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
    const gainProfit = seatsFilled * check * (1 - fb);
    const gainTips = seatsFilled * check * 0.18;
    $("o-capture-stats").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Seats filled</div>
        <div class="stat-value">${fmtNum(seatsFilled)}</div>
        <div class="stat-sub">per week</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Added gross profit</div>
        <div class="stat-value">${fmtUSD(gainProfit)}</div>
        <div class="stat-sub">per week</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Added tips for staff</div>
        <div class="stat-value">${fmtUSD(gainTips)}</div>
        <div class="stat-sub">per week</div>
      </div>
    `;
  }

  ["o-max", "o-check", "o-fb"].forEach((id) => on($(id), "input", renderOccupancy));
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
    const seatedSales = avgCheck * seatedGuests;
    const incrementalSeatedGuests = seatedGuests * newPct;
    const incrementalSeatedSales = seatedSales * newPct;

    const noS_sales = restaurantSales;
    const s_sales = incrementalSeatedSales;
    const total_sales = noS_sales + s_sales;

    const s_rewardCost = -(seatedSales * reward);
    const noS_fbCost = -(noS_sales * fb);
    const s_fbCost = -(s_sales * fb);

    const noS_net = noS_sales + noS_fbCost;
    const s_net = s_sales + s_rewardCost + s_fbCost;
    const total_net = noS_net + s_net;

    const breakeven = reward < 1 ? 1 - reward / (1 - fb) : 0;
    const repeatRate = 1 - newPct;
    const safe = repeatRate <= breakeven;

    $("n-netprofit").textContent = fmtUSD(s_net);
    $("n-netprofit-sub").textContent = `from ${fmtUSD(s_sales)} in incremental sales`;
    $("n-breakeven").textContent = fmtPct(breakeven, 1);

    $("n-callout").className = "callout " + (safe ? "" : "negative");
    $("n-callout").innerHTML = safe
      ? `At an assumed <strong>${fmtPct(newPct, 0)} new-guest rate</strong> (${fmtPct(repeatRate, 0)} repeat), you're well inside the breakeven line of ${fmtPct(breakeven, 1)} — Seated is net-positive by <strong>${fmtUSD(s_net)}</strong>.`
      : `At an assumed <strong>${fmtPct(newPct, 0)} new-guest rate</strong> (${fmtPct(repeatRate, 0)} repeat), you're past the breakeven line of ${fmtPct(breakeven, 1)} — Seated is currently net-negative by <strong>${fmtUSD(Math.abs(s_net))}</strong>.`;

    const rows = [
      ["Guests", fmtNum(nonSeatedGuests), fmtNum(incrementalSeatedGuests), fmtNum(nonSeatedGuests + incrementalSeatedGuests), fmtNum(incrementalSeatedGuests)],
      ["Sales", fmtUSD(noS_sales), fmtUSD(s_sales), fmtUSD(total_sales), fmtUSD(total_sales - noS_sales)],
      ["Seated reward cost", "—", fmtUSD(s_rewardCost), fmtUSD(s_rewardCost), fmtUSD(s_rewardCost)],
      ["F&amp;B cost", fmtUSD(noS_fbCost), fmtUSD(s_fbCost), fmtUSD(noS_fbCost + s_fbCost), fmtUSD(s_fbCost)],
    ];
    let html = rows.map(([l, a, b, c, d]) => `<tr><td>${l}</td><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`).join("");
    html += `<tr class="total"><td>Net profit</td><td class="${negClass(noS_net)}">${fmtUSD(noS_net)}</td><td class="${negClass(s_net)}">${fmtUSD(s_net)}</td><td class="${negClass(total_net)}">${fmtUSD(total_net)}</td><td class="${negClass(s_net)}">${fmtUSD(s_net)}</td></tr>`;
    $("n-table").innerHTML = html;
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
      const fbCost = -(sales * fb);
      const seatedCost = sales > baselineSales ? -((sales - baselineSales) * seatedPct) : 0;
      const profit = sales + fbCost + seatedCost - fixed;
      const margin = sales ? profit / sales : 0;
      return { occPct, guests, sales, fbCost, seatedCost, profit, margin };
    });

    // header
    $("t-thead").innerHTML = `<th style="text-align:left;">Occupancy</th>` + cols.map((c) => `<th>${fmtPct(c.occPct, 0)}</th>`).join("");

    const rowsDef = [
      ["Guests", (c) => fmtNum(c.guests)],
      ["Sales", (c) => fmtUSD(c.sales)],
      ["F&amp;B cost", (c) => fmtUSD(c.fbCost)],
      ["Seated cost", (c) => (c.seatedCost ? fmtUSD(c.seatedCost) : "—")],
      ["Fixed cost", () => fmtUSD(-fixed)],
    ];
    let html = rowsDef.map(([label, fn]) => `<tr><td>${label}</td>${cols.map((c) => `<td>${fn(c)}</td>`).join("")}</tr>`).join("");
    html += `<tr class="total"><td>Profit</td>${cols.map((c) => `<td class="${negClass(c.profit)}">${fmtUSD(c.profit)}</td>`).join("")}</tr>`;
    html += `<tr><td>Profit margin</td>${cols.map((c) => `<td class="${negClass(c.margin)}">${fmtPct(c.margin)}</td>`).join("")}</tr>`;
    $("t-table").innerHTML = html;

    // bars (margin, can be negative)
    const maxAbs = Math.max(...cols.map((c) => Math.abs(c.margin)), 0.05);
    $("t-bars").innerHTML = cols.map((c) => {
      const h = Math.max((Math.abs(c.margin) / maxAbs) * 128, 2);
      const isBaseline = Math.abs(c.occPct - baseline) < 0.001;
      return `<div class="bar-col">
        <div class="bar-value">${fmtPct(c.margin, 0)}</div>
        <div class="bar ${c.margin < 0 ? "warn" : ""}" style="height:${h}px; ${isBaseline ? "outline:2px solid var(--ink); outline-offset:2px;" : ""}"></div>
        <div class="bar-label">${fmtPct(c.occPct, 0)}</div>
      </div>`;
    }).join("");
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
