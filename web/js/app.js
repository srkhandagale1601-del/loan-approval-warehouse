/* Indian Loan Intelligence Warehouse - Enterprise Web Analytics Application */

// DOM helper and formatters
const $ = id => document.getElementById(id);
const fmt = (n, d = 0) => n == null || !Number.isFinite(Number(n)) ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: d });
const pct = n => n == null || !Number.isFinite(Number(n)) ? '—' : `${Number(n).toFixed(1)}%`;
const money = n => {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  const val = Number(n);
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} Lakh`;
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};
const esc = s => String(s ?? '—').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Plotly default enterprise theme layout
const enterpriseLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, system-ui, sans-serif', size: 11, color: '#475569' },
  margin: { l: 50, r: 20, t: 20, b: 50 },
  xaxis: { gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' },
  yaxis: { gridcolor: '#f1f5f9', zerolinecolor: '#e2e8f0' }
};

function plot(id, data, customLayout = {}) {
  const el = $(id);
  if (!el) return;
  Plotly.newPlot(id, data, { ...enterpriseLayout, ...customLayout }, { responsive: true, displayModeBar: false });
}

function toast(msg) {
  const t = $('toastMsg');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// Global Filter State
const globalFilters = {
  region: 'all',
  loan_product: 'all',
  credit_band: 'all',
  income_band: 'all',
  loan_status: 'all',
  employment_type: 'all'
};

function getFilterParams() {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(globalFilters)) {
    if (v && v !== 'all') p.append(k, v);
  }
  return p.toString();
}

function updateActiveFilterBadge() {
  let count = 0;
  for (const v of Object.values(globalFilters)) {
    if (v && v !== 'all') count++;
  }
  const badge = $('activeFilterCount');
  if (badge) {
    if (count > 0) {
      badge.textContent = `${count} Active`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ---------------- Tab Navigation ----------------
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  const sections = document.querySelectorAll('.section-container');
  const track = $('navTabsTrack');
  const btnLeft = $('btnScrollTabsLeft');
  const btnRight = $('btnScrollTabsRight');
  const mobileSelect = $('mobileTabSelect');

  // Update arrow visibility based on scroll position
  function updateScrollArrows() {
    if (!track || !btnLeft || !btnRight) return;
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    btnLeft.disabled = atStart;
    btnRight.disabled = atEnd;
    btnLeft.setAttribute('aria-hidden', atStart ? 'true' : 'false');
    btnRight.setAttribute('aria-hidden', atEnd ? 'true' : 'false');
  }

  function switchTab(tabId) {
    tabs.forEach(t => {
      const match = t.getAttribute('data-tab') === tabId;
      t.classList.toggle('active', match);
      // Scroll the active tab into view within the nav strip
      if (match && track) {
        t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    });
    sections.forEach(s => {
      const match = s.id === `section-${tabId}`;
      s.classList.toggle('active', match);
    });
    // Sync mobile select
    if (mobileSelect) mobileSelect.value = tabId;
    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger resize on Plotly charts to adapt properly
    window.dispatchEvent(new Event('resize'));

    // Trigger on-demand loads for heavy tabs
    if (tabId === 'warehouse') loadWarehousePreview();
    if (tabId === 'olap' && !olapLoaded) runOlap();
    if (tabId === 'segmentation' && !segmentationLoaded) loadSegmentation();
    if ((tabId === 'models' || tabId === 'predict') && !modelsLoaded) loadModelAnalytics();
    if (tabId === 'quality' && !qualityLoaded) loadDataQuality();
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Scroll arrow handlers
  const SCROLL_AMOUNT = 220;
  if (btnLeft) {
    btnLeft.addEventListener('click', () => {
      track && track.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    });
  }
  if (btnRight) {
    btnRight.addEventListener('click', () => {
      track && track.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    });
  }
  if (track) {
    track.addEventListener('scroll', updateScrollArrows, { passive: true });
    // Initial state
    setTimeout(updateScrollArrows, 100);
  }

  // Mobile dropdown
  if (mobileSelect) {
    mobileSelect.addEventListener('change', e => {
      switchTab(e.target.value);
    });
  }

  // Handle deep-linking via URL hash
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && $(`section-${initialHash}`)) {
    switchTab(initialHash);
  }
}

// ---------------- Section 1: Executive Overview ----------------
async function loadOverview() {
  try {
    const qs = getFilterParams();
    const res = await fetch(`/api/overview${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error(`Overview API error (${res.status})`);
    const data = await res.json();

    // 1. KPIs
    $('kpiTotalApps').textContent = fmt(data.total_applications);
    $('kpiOutcomeSplit').textContent = `${fmt(data.approved_applications)} Approved · ${fmt(data.rejected_applications)} Rejected`;
    $('kpiApprovalRate').textContent = data.approval_rate_pct != null ? `${data.approval_rate_pct}%` : '—';
    $('kpiRejectionTag').textContent = `Rejection: ${data.rejection_rate_pct ?? '—'}%`;
    $('kpiAvgLoan').textContent = money(data.average_loan_amount);
    $('kpiAvgSanctioned').textContent = `Avg Sanctioned: ${money(data.average_sanctioned_amount_inr)}`;
    $('kpiAvgCibil').textContent = fmt(data.average_cibil_score, 1);
    
    const cibilVal = Number(data.average_cibil_score);
    const cibilTierTag = $('kpiCibilTier');
    if (cibilVal >= 750) { cibilTierTag.textContent = 'Excellent Tier'; cibilTierTag.className = 'kpi-tag good'; }
    else if (cibilVal >= 650) { cibilTierTag.textContent = 'Good Tier'; cibilTierTag.className = 'kpi-tag neutral'; }
    else { cibilTierTag.textContent = 'Fair / Watch Tier'; cibilTierTag.className = 'kpi-tag danger'; }

    if (data.repayment_summary) {
      $('kpiRepaymentCount').textContent = fmt(data.repayment_summary.total_instalments);
      $('kpiUniqueLoans').textContent = `Across ${fmt(data.repayment_summary.unique_loans)} unique loans`;
    }

    if (data.pipeline_status) {
      $('kpiPipelineStatus').textContent = data.pipeline_status.status === 'success' ? 'Pipeline Active' : data.pipeline_status.status;
      $('kpiLastEtl').textContent = `Run #${data.pipeline_status.last_run_id}: Ingested ${fmt(data.pipeline_status.accepted_rows)} rows`;
    }

    // 2. Key Findings
    const findingsGrid = $('findingsGrid');
    if (data.key_findings && data.key_findings.length) {
      findingsGrid.innerHTML = data.key_findings.map(f => `
        <div class="finding-card">
          <div>
            <div class="finding-top">
              <span class="finding-title">${esc(f.title)}</span>
              <span class="finding-stat">${esc(f.figure)}</span>
            </div>
            <div class="finding-body">${esc(f.interpretation)}</div>
          </div>
          <div>
            <span style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 4px;">${esc(f.sample_size)}</span>
            <a href="#${f.target_section}" class="finding-link" data-jump="${f.target_section}">Inspect in ${esc(f.target_section)} ➔</a>
          </div>
        </div>
      `).join('');

      // Add jump link handlers
      findingsGrid.querySelectorAll('[data-jump]').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const target = link.getAttribute('data-jump');
          const tabBtn = document.querySelector(`.nav-tab-btn[data-tab="${target}"]`);
          if (tabBtn) tabBtn.click();
        });
      });
    }

    // 3. Overview Charts
    // Outcome Donut
    const statuses = data.statuses || [];
    plot('chartOverviewOutcomes', [{
      labels: statuses.map(s => s.status),
      values: statuses.map(s => s.count),
      type: 'pie',
      hole: 0.6,
      marker: { colors: ['#16a34a', '#dc2626'] },
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent'
    }], { margin: { l: 20, r: 20, t: 20, b: 20 } });

    // Credit Bands
    const credit = data.approval_by_credit_band || [];
    plot('chartOverviewCreditBands', [
      {
        type: 'bar',
        x: credit.map(c => c.band),
        y: credit.map(c => c.applications),
        name: 'Applications',
        marker: { color: '#2563eb' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        x: credit.map(c => c.band),
        y: credit.map(c => c.approval_rate_pct),
        name: 'Approval Rate (%)',
        yaxis: 'y2',
        line: { color: '#16a34a', width: 3 },
        marker: { size: 7 }
      }
    ], {
      yaxis: { title: 'Applications', gridcolor: '#f1f5f9' },
      yaxis2: { title: 'Approval Rate (%)', overlaying: 'y', side: 'right', range: [0, 105], ticksuffix: '%' },
      legend: { orientation: 'h', y: -0.2 }
    });

    // Regional Distribution
    const regions = (data.approval_by_region || []).slice().reverse();
    plot('chartOverviewRegions', [{
      type: 'bar',
      orientation: 'h',
      y: regions.map(r => r.region),
      x: regions.map(r => r.applications),
      marker: { color: '#0284c7' },
      text: regions.map(r => `${r.approval_rate_pct}% Appr · ${fmt(r.applications)} apps`),
      textposition: 'auto',
      hovertemplate: '<b>%{y} Zone</b><br>Applications: %{x}<extra></extra>'
    }], {
      margin: { l: 90, r: 30, t: 20, b: 40 },
      xaxis: { title: 'Application Volume' }
    });

    // Product Portfolio Mix
    const products = data.approval_by_product || [];
    plot('chartOverviewProducts', [{
      type: 'bar',
      x: products.map(p => p.loan_product),
      y: products.map(p => p.applications),
      marker: { color: '#475569' },
      text: products.map(p => `${p.approval_rate_pct}% Appr`),
      textposition: 'outside',
      cliponaxis: false
    }], {
      xaxis: { tickangle: -15 },
      yaxis: { title: 'Applications' },
      margin: { l: 50, r: 20, t: 30, b: 70 }
    });

  } catch (err) {
    console.error('Error loading overview:', err);
    toast(`Failed to load overview: ${err.message}`);
  }
}

// ---------------- Section 2: Application Analytics ----------------
async function loadApplicationsAnalytics() {
  try {
    const qs = getFilterParams();
    const res = await fetch(`/api/applications/analytics${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error(`Applications analytics failed (${res.status})`);
    const data = await res.json();

    // 1. Credit Band × Income Band Heatmap
    const matrix = data.credit_income_matrix || [];
    const creditBands = ['Excellent', 'Good', 'Fair', 'Low'];
    const incomeBands = ['High', 'Upper-middle', 'Lower-middle', 'Low'];
    
    const zValues = incomeBands.map(ib => {
      return creditBands.map(cb => {
        const item = matrix.find(m => m.credit_band === cb && m.income_band === ib);
        return item ? Number(item.approval_rate_pct) : 0;
      });
    });

    plot('chartAppMatrix', [{
      z: zValues,
      x: creditBands,
      y: incomeBands,
      type: 'heatmap',
      colorscale: [
        [0.0, '#fef2f2'],
        [0.3, '#fed7aa'],
        [0.6, '#bfdbfe'],
        [1.0, '#16a34a']
      ],
      texttemplate: '%{z:.1f}%',
      textfont: { color: '#0f172a', size: 12 },
      hovertemplate: 'Credit: %{x}<br>Income: %{y}<br>Approval Rate: %{z:.1f}%<extra></extra>'
    }], {
      margin: { l: 100, r: 20, t: 20, b: 50 },
      xaxis: { title: 'Credit Bureau Band' },
      yaxis: { title: 'Income Band', autorange: 'reversed' }
    });

    // 2. Requested Loan Amount Statistics by Outcome
    const amounts = data.amount_by_outcome || [];
    plot('chartAppAmounts', amounts.map(a => ({
      type: 'box',
      name: a.loan_status,
      q1: [a.p25],
      median: [a.median],
      q3: [a.p75],
      lowerfence: [a.min],
      upperfence: [a.max],
      mean: [a.avg],
      boxpoints: false,
      marker: { color: a.loan_status === 'Approved' ? '#16a34a' : '#dc2626' }
    })), {
      yaxis: { title: 'Loan Amount (₹ INR)' },
      showlegend: true
    });

    // 3. Leverage (Loan-to-Income)
    const lti = data.lti_distribution || [];
    plot('chartAppLti', [{
      type: 'bar',
      x: lti.map(l => l.bucket),
      y: lti.map(l => l.approval_rate_pct),
      marker: { color: '#2563eb' },
      text: lti.map(l => `${l.approval_rate_pct}%`),
      textposition: 'outside'
    }], {
      xaxis: { tickangle: -20 },
      yaxis: { title: 'Approval Rate (%)', range: [0, 100] },
      margin: { l: 45, r: 15, t: 20, b: 80 }
    });

    // 4. Education Comparison
    const edu = data.education_comparison || [];
    plot('chartAppEducation', [{
      type: 'bar',
      x: edu.map(e => e.education),
      y: edu.map(e => e.approval_rate_pct),
      marker: { color: '#0284c7' },
      text: edu.map(e => `${e.approval_rate_pct}%`),
      textposition: 'outside'
    }], {
      xaxis: { tickangle: -15 },
      yaxis: { title: 'Approval Rate (%)', range: [0, 100] },
      margin: { l: 45, r: 15, t: 20, b: 70 }
    });

    // 5. Employment Comparison
    const emp = data.employment_comparison || [];
    plot('chartAppEmployment', [{
      type: 'bar',
      x: emp.map(e => e.employment_type),
      y: emp.map(e => e.approval_rate_pct),
      marker: { color: '#475569' },
      text: emp.map(e => `${e.approval_rate_pct}%`),
      textposition: 'outside'
    }], {
      yaxis: { title: 'Approval Rate (%)', range: [0, 100] },
      margin: { l: 45, r: 15, t: 20, b: 50 }
    });

  } catch (err) {
    console.error('Error loading applications analytics:', err);
  }
}

// ---------------- Section 3: Repayment Analytics ----------------
let repaymentsLoaded = false;
async function loadRepaymentsAnalytics() {
  try {
    const res = await fetch('/api/repayments/analytics');
    if (!res.ok) throw new Error(`Repayment API error (${res.status})`);
    const data = await res.json();

    const sum = data.summary || {};
    $('kpiRepTotalInstalments').textContent = fmt(sum.total_instalment_records);
    $('kpiRepDistinctLoans').textContent = `${fmt(sum.unique_loans)} unique loans`;
    $('kpiRepOutstanding').textContent = money(sum.total_outstanding_principal_inr);
    $('kpiRepNpaLoans').textContent = `${fmt(sum.unique_npa_loans)} accounts`;
    $('kpiRepNpaRate').textContent = `NPA Rate: ${sum.npa_loan_rate_pct}%`;
    $('kpiRepAvgDpd').textContent = `${fmt(data.status_distribution?.[0]?.avg_days_past_due || 0, 1)} days`;

    // 1. Payment Status Distribution Chart
    const statuses = data.status_distribution || [];
    plot('chartRepStatus', [{
      type: 'bar',
      x: statuses.map(s => s.payment_status),
      y: statuses.map(s => s.records),
      marker: { color: ['#16a34a', '#0284c7', '#d97706', '#dc2626'] },
      text: statuses.map(s => `${s.percentage}% (${fmt(s.records)})`),
      textposition: 'outside'
    }], {
      yaxis: { title: 'Instalment Records' },
      margin: { l: 50, r: 20, t: 30, b: 50 }
    });

    // 2. DPD Buckets Chart
    const dpd = data.dpd_buckets || [];
    plot('chartRepDpd', [{
      type: 'bar',
      x: dpd.map(d => d.bucket),
      y: dpd.map(d => d.outstanding_principal_inr),
      marker: { color: ['#16a34a', '#3b82f6', '#f59e0b', '#ea580c', '#dc2626'] },
      text: dpd.map(d => money(d.outstanding_principal_inr)),
      textposition: 'outside'
    }], {
      yaxis: { title: 'Principal Outstanding (₹)' },
      margin: { l: 60, r: 20, t: 30, b: 60 }
    });

    // 3. Time-Series Repayment Trend
    const trend = data.monthly_trend || [];
    plot('chartRepTrend', [
      {
        type: 'bar',
        name: 'Scheduled EMI',
        x: trend.map(t => t.month),
        y: trend.map(t => t.scheduled_emi),
        marker: { color: '#94a3b8' }
      },
      {
        type: 'bar',
        name: 'Amount Collected',
        x: trend.map(t => t.month),
        y: trend.map(t => t.amount_paid),
        marker: { color: '#16a34a' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg Days Past Due',
        x: trend.map(t => t.month),
        y: trend.map(t => t.avg_dpd),
        yaxis: 'y2',
        line: { color: '#dc2626', width: 2 }
      }
    ], {
      barmode: 'group',
      yaxis: { title: 'Cash Flow (₹ INR)' },
      yaxis2: { title: 'Days Past Due', overlaying: 'y', side: 'right', gridcolor: 'rgba(0,0,0,0)' },
      legend: { orientation: 'h', y: -0.2 }
    });

    // 4. Ledger Summary Table
    const tbody = $('tableRepaymentsSummary').querySelector('tbody');
    tbody.innerHTML = statuses.map(s => `
      <tr>
        <td class="strong">${esc(s.payment_status)}</td>
        <td>${fmt(s.records)}</td>
        <td>${pct(s.percentage / 100)}</td>
        <td>${fmt(s.avg_days_past_due, 1)} d</td>
        <td>${money(s.scheduled_emi_inr)}</td>
        <td>${money(s.amount_paid_inr)}</td>
        <td><span class="pill ${s.npa_count > 0 ? 'bad' : 'good'}">${fmt(s.npa_count)}</span></td>
      </tr>
    `).join('');

    repaymentsLoaded = true;
  } catch (err) {
    console.error('Error loading repayments analytics:', err);
  }
}

// ---------------- Section 4: Data Quality & ETL ----------------
let qualityLoaded = false;
async function loadDataQuality() {
  try {
    const res = await fetch('/api/data-quality');
    if (!res.ok) throw new Error(`Data quality failed (${res.status})`);
    const data = await res.json();

    const tbody = $('tableEtlHistory').querySelector('tbody');
    const history = data.etl_history || [];
    tbody.innerHTML = history.map(h => `
      <tr>
        <td class="strong">#${h.run_id}</td>
        <td><span class="pill ${h.status === 'success' ? 'good' : 'bad'}">${esc(h.status)}</span></td>
        <td>${h.started_at ? new Date(h.started_at).toLocaleString() : '—'}</td>
        <td>${h.finished_at ? new Date(h.finished_at).toLocaleString() : '—'}</td>
        <td>${h.duration_seconds != null ? `${h.duration_seconds}s` : '—'}</td>
        <td>${fmt(h.source_rows)}</td>
        <td>${fmt(h.accepted_rows)}</td>
        <td><span class="pill ${h.quarantined_rows > 0 ? 'bad' : 'good'}">${fmt(h.quarantined_rows)}</span></td>
      </tr>
    `).join('') || '<tr><td colspan="8">No ETL runs recorded.</td></tr>';

    qualityLoaded = true;
  } catch (err) {
    console.error('Error loading data quality:', err);
  }
}

// ---------------- Section 5: Warehouse Explorer ----------------
let previewPage = 1;
const previewLimit = 15;
let previewTable = 'fact_loan_application';

async function loadWarehousePreview() {
  try {
    const q = $('previewSearchInput').value.trim();
    const p = new URLSearchParams({
      table: previewTable,
      page: previewPage,
      limit: previewLimit
    });
    if (q) p.append('search', q);

    const res = await fetch(`/api/warehouse/preview?${p.toString()}`);
    if (!res.ok) throw new Error(`Preview error (${res.status})`);
    const data = await res.json();

    const thead = $('tableWarehousePreview').querySelector('thead');
    const tbody = $('tableWarehousePreview').querySelector('tbody');

    const cols = data.columns || [];
    thead.innerHTML = `<tr>${cols.map(c => `<th>${esc(c.name)} <small style="color: var(--text-muted); font-weight: normal;">(${esc(c.type)})</small></th>`).join('')}</tr>`;

    const rows = data.rows || [];
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${cols.length || 1}">No matching records found in ${esc(previewTable)}.</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(r => `
        <tr>
          ${cols.map(c => {
            let val = r[c.name];
            if (val === null || val === undefined) val = '<span style="color:#94a3b8">—</span>';
            else if (typeof val === 'number') val = fmt(val, 2);
            return `<td>${String(val)}</td>`;
          }).join('')}
        </tr>
      `).join('');
    }

    $('previewPageLabel').textContent = `Page ${data.page} of ${data.total_pages} · ${fmt(data.total_records)} total rows`;
    $('btnPreviewPrev').disabled = data.page <= 1;
    $('btnPreviewNext').disabled = data.page >= data.total_pages;

  } catch (err) {
    console.error('Error in warehouse preview:', err);
  }
}

// ---------------- Section 6: SQL & OLAP Analytics ----------------
let olapLoaded = false;
async function runOlap() {
  try {
    const op = $('olapOperation').value;
    const dim = $('olapDimension').value;
    const secDim = $('olapSecDimension').value;
    const measure = $('olapMeasure').value;

    const p = new URLSearchParams({
      operation: op,
      dimension: dim,
      measure: measure
    });
    if (secDim) p.append('secondary_dimension', secDim);

    const res = await fetch(`/api/olap/query?${p.toString()}`);
    if (!res.ok) throw new Error(`OLAP error (${res.status})`);
    const data = await res.json();

    // 1. Executed SQL
    $('sqlQueryText').textContent = data.executed_sql;

    // 2. Explanation
    $('olapFindingText').innerHTML = `<b>Analytical Synthesis:</b> ${esc(data.explanation)}`;

    // 3. Update Chart & Table
    const rows = data.rows || [];
    $('olapChartTitle').textContent = `${data.measure_label} by ${dim}${secDim ? ' × ' + secDim : ''}`;
    $('olapChartSubtitle').textContent = `Grouped aggregation over ${fmt(rows.reduce((acc, r) => acc + (r.applications || 0), 0))} applications`;

    const table = $('tableOlapResult');
    if (secDim) {
      table.querySelector('thead').innerHTML = `<tr><th>${esc(dim)}</th><th>${esc(secDim)}</th><th>Applications</th><th>${esc(data.measure_label)}</th></tr>`;
      table.querySelector('tbody').innerHTML = rows.map(r => `
        <tr>
          <td class="strong">${esc(r.dimension_1)}</td>
          <td>${esc(r.dimension_2)}</td>
          <td>${fmt(r.applications)}</td>
          <td>${fmt(r.metric_value, 2)}${esc(data.unit)}</td>
        </tr>
      `).join('');

      // Render 2D Grouped Bar
      const dim1List = [...new Set(rows.map(r => r.dimension_1))];
      const dim2List = [...new Set(rows.map(r => r.dimension_2))];
      const traces = dim2List.map((d2, idx) => ({
        type: 'bar',
        name: d2,
        x: dim1List,
        y: dim1List.map(d1 => {
          const item = rows.find(r => r.dimension_1 === d1 && r.dimension_2 === d2);
          return item ? item.metric_value : 0;
        })
      }));
      plot('chartOlapResult', traces, { barmode: 'group', legend: { orientation: 'h', y: -0.2 } });

    } else {
      table.querySelector('thead').innerHTML = `<tr><th>${esc(dim)}</th><th>Applications</th><th>${esc(data.measure_label)}</th></tr>`;
      table.querySelector('tbody').innerHTML = rows.map(r => `
        <tr>
          <td class="strong">${esc(r.category)}</td>
          <td>${fmt(r.applications)}</td>
          <td>${fmt(r.metric_value, 2)}${esc(data.unit)}</td>
        </tr>
      `).join('');

      plot('chartOlapResult', [{
        type: 'bar',
        x: rows.map(r => r.category),
        y: rows.map(r => r.metric_value),
        marker: { color: '#2563eb' },
        text: rows.map(r => `${fmt(r.metric_value, 1)}${data.unit}`),
        textposition: 'outside'
      }], {
        yaxis: { title: `${data.measure_label} (${data.unit})` }
      });
    }

    olapLoaded = true;
  } catch (err) {
    console.error('Error executing OLAP:', err);
    toast(`OLAP execution failed: ${err.message}`);
  }
}

// ---------------- Section 7: Customer Segmentation ----------------
let segmentationLoaded = false;
async function loadSegmentation() {
  try {
    const res = await fetch('/api/segmentation');
    if (!res.ok) throw new Error(`Segmentation error (${res.status})`);
    const data = await res.json();

    const segments = data.segments || [];
    $('segmentsGrid').innerHTML = segments.map(s => `
      <div class="segment-card">
        <div>
          <div class="segment-header">
            <h3>${esc(s.segment_name)}</h3>
            <span class="segment-share">${s.percentage_of_portfolio}% of Portfolio</span>
          </div>
          <p class="segment-desc">${esc(s.description)}</p>
          <div class="segment-metrics-list">
            <div class="segment-metric-item">
              <small>Approval Rate</small>
              <strong>${s.approval_rate_pct}%</strong>
            </div>
            <div class="segment-metric-item">
              <small>Average CIBIL</small>
              <strong>${s.avg_cibil_score} pts</strong>
            </div>
            <div class="segment-metric-item">
              <small>Average Income</small>
              <strong>${money(s.avg_income_inr)}</strong>
            </div>
            <div class="segment-metric-item">
              <small>Average Loan</small>
              <strong>${money(s.avg_loan_amount_inr)}</strong>
            </div>
            <div class="segment-metric-item">
              <small>Average Assets</small>
              <strong>${money(s.avg_total_assets_inr)}</strong>
            </div>
            <div class="segment-metric-item">
              <small>Leverage (LTI)</small>
              <strong>${s.avg_loan_to_income}x</strong>
            </div>
          </div>
        </div>
        <div class="segment-action">
          <b>Recommended Strategy:</b> ${esc(s.recommended_action)}
        </div>
      </div>
    `).join('');

    // Segment Approval Chart
    plot('chartSegmentApproval', [{
      type: 'bar',
      x: segments.map(s => s.segment_name.split(' ')[0]),
      y: segments.map(s => s.approval_rate_pct),
      marker: { color: ['#16a34a', '#2563eb', '#dc2626', '#d97706'] },
      text: segments.map(s => `${s.approval_rate_pct}% (${fmt(s.count)} apps)`),
      textposition: 'outside'
    }], {
      yaxis: { title: 'Approval Rate (%)', range: [0, 100] }
    });

    // Segment Financials Comparison
    plot('chartSegmentFinancials', [
      {
        type: 'bar',
        name: 'Annual Income',
        x: segments.map(s => s.segment_name.split(' ')[0]),
        y: segments.map(s => s.avg_income_inr),
        marker: { color: '#0284c7' }
      },
      {
        type: 'bar',
        name: 'Loan Request',
        x: segments.map(s => s.segment_name.split(' ')[0]),
        y: segments.map(s => s.avg_loan_amount_inr),
        marker: { color: '#f59e0b' }
      }
    ], {
      barmode: 'group',
      yaxis: { title: 'INR (₹)' },
      legend: { orientation: 'h', y: -0.2 }
    });

    segmentationLoaded = true;
  } catch (err) {
    console.error('Error loading segmentation:', err);
  }
}

// ---------------- Section 8: Model Analytics ----------------
let modelsLoaded = false;
let predPage = 1;
const predLimit = 12;

async function loadModelAnalytics() {
  try {
    const res = await fetch('/api/models/analytics');
    if (!res.ok) throw new Error(`Model analytics error (${res.status})`);
    const data = await res.json();
    const selectedModelName = data.selected_model || 'Logistic Regression';

    // 0. Update dynamic labels across sections
    const bestTag = $('selectedBestModelTag');
    if (bestTag) bestTag.textContent = `Selected Best Model: ${selectedModelName}`;

    const confHeading = $('headingModelConfusion');
    if (confHeading) confHeading.textContent = `Confusion Matrix (Selected ${selectedModelName})`;

    const subImportance = $('subheadingModelImportance');
    if (subImportance) {
      subImportance.textContent = `Underwriting driver importance from the selected ${selectedModelName} model`;
    }

    const labTag = $('labModelVersion');
    if (labTag) labTag.textContent = `Model: ${selectedModelName}`;

    const labSub = $('labModelSubtitle');
    if (labSub) labSub.textContent = `Live inference output from trained ${selectedModelName} pipeline`;

    // 1. Model Comparison Scorecard
    const models = data.models || [];
    $('tableModelScorecard').querySelector('tbody').innerHTML = models.map((m) => {
      const isSelected = m.model === selectedModelName;
      return `
      <tr>
        <td class="strong"><b>${esc(m.model)}</b></td>
        <td>${pct(m.accuracy * 100)}</td>
        <td>${pct(m.precision_approved * 100)}</td>
        <td>${pct(m.recall_approved * 100)}</td>
        <td><b>${pct(m.f1_approved * 100)}</b></td>
        <td>${pct(m.roc_auc * 100)}</td>
        <td><span class="pill ${isSelected ? 'good' : 'neutral'}">${isSelected ? 'Best (Selected)' : 'Evaluated'}</span></td>
      </tr>
    `}).join('');

    // 2. Confusion Matrix Heatmap (for selected model)
    const selected = models.find(m => m.model === selectedModelName) || models[0];
    if (selected && selected.confusion_matrix) {
      const cm = selected.confusion_matrix;
      plot('chartModelConfusion', [{
        z: cm,
        x: ['Predicted Rejected', 'Predicted Approved'],
        y: ['Actual Rejected', 'Actual Approved'],
        type: 'heatmap',
        colorscale: [
          [0.0, '#f8fafc'],
          [0.5, '#bfdbfe'],
          [1.0, '#1d4ed8']
        ],
        showscale: false,
        text: cm.map(row => row.map(String)),
        texttemplate: '%{text}',
        textfont: { color: '#0f172a', size: 14, family: 'Inter' },
        hovertemplate: '%{y}<br>%{x}<br>Count: %{z}<extra></extra>'
      }], {
        yaxis: { autorange: 'reversed' },
        margin: { l: 140, r: 20, t: 20, b: 60 }
      });
    }

    // 3. Feature Importance Horizontal Bar
    const fi = (data.feature_importance || []).slice(0, 15).reverse();
    plot('chartModelImportance', [{
      type: 'bar',
      orientation: 'h',
      x: fi.map(f => f.importance),
      y: fi.map(f => f.feature.replace(/^num__|cat__/, '')),
      marker: { color: '#2563eb' },
      hovertemplate: '%{y}<br>Importance: %{x:.4f}<extra></extra>'
    }], {
      margin: { l: 150, r: 20, t: 10, b: 40 },
      xaxis: { title: `${selectedModelName} Predictive Weight / Importance` }
    });

    const insImportance = $('insightModelImportance');
    if (insImportance && fi.length) {
      const topDrivers = fi.slice(-3).reverse().map(f => f.feature.replace(/^num__|cat__/, '')).join(', ');
      insImportance.innerHTML = `<b>Underwriting Drivers:</b> Top predictive drivers for ${esc(selectedModelName)} include <b>${esc(topDrivers)}</b>.`;
    }

    modelsLoaded = true;
    loadTestPredictions();
  } catch (err) {
    console.error('Error loading model analytics:', err);
  }
}

async function loadTestPredictions() {
  try {
    const q = $('predSearchInput').value.trim();
    const outcome = $('predFilterOutcome').value;
    const correct = $('predFilterCorrect').value;

    const p = new URLSearchParams({
      page: predPage,
      limit: predLimit,
      outcome: outcome,
      correct: correct
    });
    if (q) p.append('search', q);

    const res = await fetch(`/api/models/predictions?${p.toString()}`);
    if (!res.ok) throw new Error(`Predictions error (${res.status})`);
    const data = await res.json();

    const tbody = $('tableTestPredictions').querySelector('tbody');
    const rows = data.rows || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8">No matching test prediction records found.</td></tr>';
    } else {
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td class="strong">${esc(r.loan_id)}</td>
          <td>${esc(r.region)}</td>
          <td>${esc(r.state)}</td>
          <td>${esc(r.loan_product)}</td>
          <td><span class="pill ${r.actual_outcome === 'Approved' ? 'approved' : 'rejected'}">${esc(r.actual_outcome)}</span></td>
          <td><span class="pill ${r.predicted_outcome === 'Approved' ? 'approved' : 'rejected'}">${esc(r.predicted_outcome)}</span></td>
          <td>${pct(Number(r.approval_probability) * 100)}</td>
          <td><span class="pill ${String(r.prediction_correct).toLowerCase() === 'true' ? 'good' : 'bad'}">${String(r.prediction_correct).toLowerCase() === 'true' ? 'Correct' : 'Incorrect'}</span></td>
        </tr>
      `).join('');
    }

    $('predPageLabel').textContent = `Page ${data.page} of ${data.total_pages} · ${fmt(data.total_records)} matches`;
    $('btnPredPrev').disabled = data.page <= 1;
    $('btnPredNext').disabled = data.page >= data.total_pages;

  } catch (err) {
    console.error('Error loading predictions:', err);
  }
}

function downloadPredictionsCsv() {
  window.open('/web/data/test_predictions.csv', '_blank');
  toast('Downloading test predictions CSV…');
}

// ---------------- Section 9: Interactive Prediction Lab ----------------
function initPredictionLab() {
  // Presets
  $('presetPrimeHome').addEventListener('click', () => {
    $('inpIncome').value = 1800000;
    $('inpLoanAmount').value = 4500000;
    $('inpLoanTerm').value = 180;
    $('inpCibil').value = 810;
    $('inpTotalAssets').value = 12000000;
    $('inpEducation').value = 'Post Graduate';
    $('inpSelfEmployed').value = 'No';
    $('inpDependents').value = 1;
    runPrediction();
  });

  $('presetHighRisk').addEventListener('click', () => {
    $('inpIncome').value = 320000;
    $('inpLoanAmount').value = 1800000;
    $('inpLoanTerm').value = 24;
    $('inpCibil').value = 510;
    $('inpTotalAssets').value = 400000;
    $('inpEducation').value = 'Not Graduate';
    $('inpSelfEmployed').value = 'Yes';
    $('inpDependents').value = 3;
    runPrediction();
  });

  $('presetMsmeGrowth').addEventListener('click', () => {
    $('inpIncome').value = 950000;
    $('inpLoanAmount').value = 2800000;
    $('inpLoanTerm').value = 48;
    $('inpCibil').value = 690;
    $('inpTotalAssets').value = 5500000;
    $('inpEducation').value = 'Graduate';
    $('inpSelfEmployed').value = 'Yes';
    $('inpDependents').value = 2;
    runPrediction();
  });

  $('formPredictionLab').addEventListener('submit', e => {
    e.preventDefault();
    runPrediction();
  });
}

async function runPrediction() {
  try {
    const payload = {
      income_annum: parseFloat($('inpIncome').value) || 0,
      loan_amount: parseFloat($('inpLoanAmount').value) || 0,
      loan_term: parseFloat($('inpLoanTerm').value) || 12,
      cibil_score: parseFloat($('inpCibil').value) || 700,
      total_assets: parseFloat($('inpTotalAssets').value) || 0,
      education: $('inpEducation').value,
      self_employed: $('inpSelfEmployed').value,
      no_of_dependents: parseFloat($('inpDependents').value) || 0
    };

    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    }
    const data = await res.json();

    const isApproved = data.prediction === 'Approved';
    const banner = $('labDecisionBanner');
    banner.className = `result-decision-banner ${isApproved ? 'approved' : 'rejected'}`;
    $('labPredictedClass').textContent = data.prediction;

    const probPct = (data.approval_probability * 100).toFixed(1);
    $('labProbabilityText').textContent = `${probPct}%`;
    $('labProbabilityFill').style.width = `${probPct}%`;
    $('labProbabilityFill').style.backgroundColor = isApproved ? '#16a34a' : '#dc2626';

    if (data.model_version) {
      const lmv = $('labModelVersion');
      if (lmv) lmv.textContent = `Model: ${data.model_version.replace(' (Educational)', '')}`;
    }

    const factors = data.risk_factors || [];
    $('labFactorsList').innerHTML = factors.map(f => `
      <div class="factor-item">
        <span class="factor-badge ${f.status.toLowerCase()}">${esc(f.status)}</span>
        <span><b>${esc(f.factor)}:</b> ${esc(f.detail)}</span>
      </div>
    `).join('');

    toast(`Underwriting complete: ${data.prediction} (${probPct}%)`);
  } catch (err) {
    console.error('Error running prediction:', err);
    toast(`Inference failed: ${err.message}`);
  }
}

// ---------------- Section 10: Methodology Accordions ----------------
function initAccordions() {
  document.querySelectorAll('.accordion-head').forEach(head => {
    head.addEventListener('click', () => {
      const parent = head.parentElement;
      parent.classList.toggle('open');
    });
  });
}

// ---------------- Health & Filter Event Listeners ----------------
async function checkHealth() {
  const dbDot  = $('dbStatusDot');
  const dbText = $('dbStatusText');
  const mlDot  = $('modelStatusDot');
  const mlText = $('modelStatusText');

  // Reset to loading state
  if (dbDot)  { dbDot.className = 'status-dot'; }
  if (mlDot)  { mlDot.className = 'status-dot'; }

  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.database === 'connected') {
      if (dbDot)  dbDot.className  = 'status-dot connected';
      if (dbText) dbText.textContent = `PostgreSQL Connected (${fmt(data.warehouse_applications)} Apps)`;
    } else {
      if (dbDot)  dbDot.className  = 'status-dot degraded';
      if (dbText) dbText.textContent = 'PostgreSQL Degraded';
    }
    if (data.model === 'loaded') {
      if (mlDot)  mlDot.className  = 'status-dot connected';
      if (mlText) mlText.textContent = 'ML Model Active';
    } else {
      if (mlDot)  mlDot.className  = 'status-dot degraded';
      if (mlText) mlText.textContent = 'Model Inactive';
    }
  } catch (e) {
    if (dbDot)  dbDot.className  = 'status-dot degraded';
    if (dbText) dbText.textContent = 'API Unavailable';
    if (mlDot)  mlDot.className  = 'status-dot degraded';
  }
}

function initFilters() {
  const filterMap = [
    ['filterRegion', 'region'],
    ['filterProduct', 'loan_product'],
    ['filterCreditBand', 'credit_band'],
    ['filterIncomeBand', 'income_band'],
    ['filterOutcome', 'loan_status'],
    ['filterEmployment', 'employment_type']
  ];

  filterMap.forEach(([elemId, key]) => {
    const el = $(elemId);
    if (!el) return;
    el.addEventListener('change', () => {
      globalFilters[key] = el.value;
      updateActiveFilterBadge();
      loadOverview();
      loadApplicationsAnalytics();
      toast(`Filters updated`);
    });
  });

  $('btnResetFilters').addEventListener('click', () => {
    filterMap.forEach(([elemId, key]) => {
      const el = $(elemId);
      if (el) el.value = 'all';
      globalFilters[key] = 'all';
    });
    updateActiveFilterBadge();
    loadOverview();
    loadApplicationsAnalytics();
    toast('All filters cleared');
  });
}

function initEventHandlers() {
  const btnRefresh = $('btnRefreshAll');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      btnRefresh.disabled = true;
      btnRefresh.classList.add('loading');
      try {
        await checkHealth();
        await loadOverview();
        loadApplicationsAnalytics();
        if (repaymentsLoaded) loadRepaymentsAnalytics();
        if (qualityLoaded) loadDataQuality();
        loadWarehousePreview();
        if (olapLoaded) runOlap();
        if (segmentationLoaded) loadSegmentation();
        if (modelsLoaded) loadModelAnalytics();
        toast('Warehouse metrics refreshed');
      } finally {
        btnRefresh.disabled = false;
        btnRefresh.classList.remove('loading');
      }
    });
  }

  // Warehouse Preview controls
  $('previewTableSelect').addEventListener('change', e => {
    previewTable = e.target.value;
    previewPage = 1;
    loadWarehousePreview();
  });
  $('previewSearchInput').addEventListener('input', () => {
    previewPage = 1;
    loadWarehousePreview();
  });
  $('btnPreviewPrev').addEventListener('click', () => {
    if (previewPage > 1) { previewPage--; loadWarehousePreview(); }
  });
  $('btnPreviewNext').addEventListener('click', () => {
    previewPage++;
    loadWarehousePreview();
  });

  // OLAP Studio controls
  $('btnExecuteOlap').addEventListener('click', runOlap);
  $('btnCopySql').addEventListener('click', () => {
    const sql = $('sqlQueryText').textContent;
    navigator.clipboard.writeText(sql).then(() => toast('SQL copied to clipboard!'));
  });

  // Test Predictions controls
  $('predSearchInput').addEventListener('input', () => { predPage = 1; loadTestPredictions(); });
  $('predFilterOutcome').addEventListener('change', () => { predPage = 1; loadTestPredictions(); });
  $('predFilterCorrect').addEventListener('change', () => { predPage = 1; loadTestPredictions(); });
  $('btnPredPrev').addEventListener('click', () => { if (predPage > 1) { predPage--; loadTestPredictions(); } });
  $('btnPredNext').addEventListener('click', () => { predPage++; loadTestPredictions(); });
  $('btnDownloadPredCsv').addEventListener('click', downloadPredictionsCsv);
}

// ---------------- Application Boot ----------------
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFilters();
  initEventHandlers();
  initPredictionLab();
  initAccordions();

  checkHealth();
  loadOverview();
  loadApplicationsAnalytics();
  loadRepaymentsAnalytics();
  loadModelAnalytics();
});
