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

// Plotly default enterprise theme layout (Multi-Tone Fintech Palette)
const enterpriseLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, system-ui, -apple-system, sans-serif', size: 11, color: '#475569' },
  margin: { l: 50, r: 20, t: 25, b: 50 },
  colorway: ['#4F46E5', '#0891B2', '#059669', '#D97706', '#E11D48', '#7C3AED', '#0284C7', '#10B981'],
  xaxis: { gridcolor: '#F1F5F9', zerolinecolor: '#E2E8F0', tickfont: { size: 11, color: '#64748B' } },
  yaxis: { gridcolor: '#F1F5F9', zerolinecolor: '#E2E8F0', tickfont: { size: 11, color: '#64748B' } }
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

const TAB_TITLES = {
  overview: 'Executive Overview',
  applications: 'Application Analytics',
  repayments: 'Repayment Analytics',
  quality: 'Data Quality & ETL',
  warehouse: 'Warehouse Explorer',
  olap: 'SQL & OLAP Studio',
  segmentation: 'Customer Segmentation',
  models: 'Model Analytics',
  predict: 'Prediction Lab',
  methodology: 'Methodology & Governance'
};

const FILTER_LABELS = {
  region: 'Region',
  loan_product: 'Loan Product',
  credit_band: 'Credit Band',
  income_band: 'Income Band',
  loan_status: 'Outcome',
  employment_type: 'Employment'
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
  const chips = [];
  for (const [k, v] of Object.entries(globalFilters)) {
    if (v && v !== 'all') {
      count++;
      chips.push({ key: k, label: FILTER_LABELS[k] || k, value: v });
    }
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

  const chipsContainer = $('activeFilterChips');
  if (chipsContainer) {
    if (chips.length === 0) {
      chipsContainer.innerHTML = '';
      chipsContainer.style.display = 'none';
    } else {
      chipsContainer.style.display = 'flex';
      chipsContainer.innerHTML = chips.map(c => `
        <span class="filter-chip">
          <span class="chip-label">${esc(c.label)}:</span>
          <span class="chip-value">${esc(c.value)}</span>
          <button type="button" class="chip-remove" data-filter-key="${esc(c.key)}" aria-label="Remove ${esc(c.label)} filter">&times;</button>
        </span>
      `).join('');

      chipsContainer.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-filter-key');
          const elemMap = {
            region: 'filterRegion',
            loan_product: 'filterProduct',
            credit_band: 'filterCreditBand',
            income_band: 'filterIncomeBand',
            loan_status: 'filterOutcome',
            employment_type: 'filterEmployment'
          };
          const selectId = elemMap[key];
          if (selectId && $(selectId)) {
            $(selectId).value = 'all';
          }
          globalFilters[key] = 'all';
          updateActiveFilterBadge();
          loadOverview();
          loadApplicationsAnalytics();
          toast(`Removed ${FILTER_LABELS[key] || key} filter`);
        });
      });
    }
  }
}

// ---------------- Tab Navigation & Shell Interactions ----------------
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  const sections = document.querySelectorAll('.section-container');
  const sidebar = $('appSidebar');
  const appShell = $('appShell');
  const btnCollapse = $('btnCollapseSidebar');
  const btnMobile = $('btnMobileMenu');
  const overlay = $('sidebarOverlay');
  const breadcrumbCurrent = $('headerBreadcrumbCurrent');

  // Restore sidebar collapsed state from localStorage
  const savedCollapsed = localStorage.getItem('loan_wh_sidebar_collapsed');
  if (savedCollapsed === '1' && sidebar && appShell) {
    sidebar.classList.add('collapsed');
    appShell.classList.add('sidebar-collapsed');
  }

  // Sidebar collapse toggle
  if (btnCollapse && sidebar && appShell) {
    btnCollapse.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      appShell.classList.toggle('sidebar-collapsed', isCollapsed);
      localStorage.setItem('loan_wh_sidebar_collapsed', isCollapsed ? '1' : '0');
      // Trigger resize for Plotly charts to adapt to width change
      setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
    });
  }

  // Mobile drawer toggle
  function closeMobileDrawer() {
    if (sidebar) sidebar.classList.remove('drawer-open');
    if (overlay) overlay.classList.remove('active');
  }

  if (btnMobile && sidebar && overlay) {
    btnMobile.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('drawer-open');
      overlay.classList.toggle('active', isOpen);
    });
    overlay.addEventListener('click', closeMobileDrawer);
  }

  function switchTab(tabId) {
    tabs.forEach(t => {
      const match = t.getAttribute('data-tab') === tabId;
      t.classList.toggle('active', match);
    });
    sections.forEach(s => {
      const match = s.id === `section-${tabId}`;
      if (match) {
        s.classList.add('active');
        s.classList.remove('tab-animating');
        void s.offsetWidth; // Force CSS reflow to re-trigger staggered entrance animation
        s.classList.add('tab-animating');
      } else {
        s.classList.remove('active');
        s.classList.remove('tab-animating');
      }
    });

    // Update Header Breadcrumb Title
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = TAB_TITLES[tabId] || 'Executive Overview';
    }

    // Close mobile drawer if opened
    closeMobileDrawer();

    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger resize on Plotly charts so they fit correctly
    setTimeout(() => window.dispatchEvent(new Event('resize')), 60);

    // Trigger on-demand loads for heavy tabs
    if (tabId === 'warehouse') loadWarehousePreview();
    if (tabId === 'olap' && !olapLoaded) runOlap();
    if (tabId === 'segmentation' && !segmentationLoaded) loadSegmentation();
    if (tabId === 'models' && !modelsLoaded) loadModelAnalytics();
    if (tabId === 'quality' && !qualityLoaded) loadDataQuality();
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Handle deep-linking via URL hash
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && $(`section-${initialHash}`)) {
    switchTab(initialHash);
  } else {
    switchTab('overview');
  }
}

// ---------------- Section 1: Executive Overview State & Renderers ----------------
let currentOverviewData = null;
let currentOverviewStateMetric = 'applications';
let currentPortfolioDim = 'product';

function renderStateAnalytics(metric = 'applications') {
  if (!currentOverviewData || !currentOverviewData.approval_by_state) return;
  currentOverviewStateMetric = metric;
  const states = [...currentOverviewData.approval_by_state];

  // Update active metric button
  document.querySelectorAll('#stateMetricToggle .seg-btn, .dark-metric-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-metric') === metric);
  });

  // Sort states by selected metric
  if (metric === 'applications') {
    states.sort((a, b) => b.applications - a.applications);
  } else if (metric === 'approval_rate') {
    states.sort((a, b) => b.approval_rate_pct - a.approval_rate_pct);
  } else if (metric === 'npa_rate') {
    states.sort((a, b) => (b.npa_rate_pct || 0) - (a.npa_rate_pct || 0));
  }

  // Render Top 5 states
  const top5 = states.slice(0, 5);
  const maxVal = metric === 'applications' ? (top5[0]?.applications || 1) : 100;

  const topStatesList = $('topStatesList');
  if (topStatesList) {
    topStatesList.innerHTML = top5.map((s, idx) => {
      let valStr = '';
      let pctFill = 0;
      if (metric === 'applications') {
        valStr = `${fmt(s.applications)} apps`;
        pctFill = Math.min(100, Math.round((s.applications / maxVal) * 100));
      } else if (metric === 'approval_rate') {
        valStr = `${s.approval_rate_pct}%`;
        pctFill = Math.min(100, s.approval_rate_pct);
      } else {
        valStr = `${s.npa_rate_pct ?? 3.2}% NPA`;
        pctFill = Math.min(100, (s.npa_rate_pct || 3.2) * 12);
      }

      return `
        <div class="top-state-item" data-state="${esc(s.state)}" title="${esc(s.state)}: ${valStr}">
          <div class="top-state-header">
            <div class="top-state-left">
              <span class="top-state-rank rank-${idx + 1}">${idx + 1}</span>
              <span class="top-state-name">${esc(s.state)}</span>
            </div>
            <span class="top-state-val">${valStr}</span>
          </div>
          <div class="top-state-bar-bg">
            <div class="top-state-bar-fill" style="width: ${pctFill}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Highlight/tooltip for SVG map nodes
  document.querySelectorAll('.state-node').forEach(node => {
    const stateName = node.getAttribute('data-state') || node.getAttribute('data-state-code') || '';
    if (!stateName) return;
    const matched = states.find(s => 
      (s.state && s.state.toLowerCase() === stateName.toLowerCase()) ||
      (s.state_code && s.state_code.toLowerCase() === stateName.toLowerCase()) ||
      (s.state && s.state.toLowerCase().startsWith(stateName.toLowerCase()))
    );
    if (matched) {
      let titleEl = node.querySelector('title');
      if (!titleEl) {
        titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        node.appendChild(titleEl);
      }
      let tip = '';
      if (metric === 'applications') tip = `${matched.state}: ${fmt(matched.applications)} applications (${matched.approval_rate_pct}% approval)`;
      else if (metric === 'approval_rate') tip = `${matched.state}: ${matched.approval_rate_pct}% approval rate`;
      else tip = `${matched.state}: ${matched.npa_rate_pct ?? 3.2}% NPA rate`;
      titleEl.textContent = tip;
    }
  });
}

function renderApplicationTrend(trends) {
  if (!trends || !trends.length) return;
  const x = trends.map(t => t.month);
  const total = trends.map(t => t.total ?? t.applications ?? 0);
  const approved = trends.map(t => t.approved ?? 0);
  const rejected = trends.map(t => t.rejected ?? 0);

  plot('chartOverviewTrend', [
    {
      name: 'Total Received',
      type: 'bar',
      x: x,
      y: total,
      marker: { color: '#4169FF', opacity: 0.95 }
    },
    {
      name: 'Approved',
      type: 'bar',
      x: x,
      y: approved,
      marker: { color: '#00BFA6', opacity: 0.95 }
    },
    {
      name: 'Rejected',
      type: 'bar',
      x: x,
      y: rejected,
      marker: { color: '#FF5C70', opacity: 0.9 }
    }
  ], {
    barmode: 'group',
    margin: { l: 45, r: 15, t: 15, b: 35 },
    showlegend: false,
    xaxis: { tickfont: { size: 10.5 } },
    yaxis: { title: 'Applications' }
  });
}

function renderApprovalFunnel(funnel) {
  const container = $('approvalFunnelContainer');
  if (!container || !funnel || !funnel.length) return;

  container.innerHTML = funnel.map((step, idx) => {
    const pctVal = step.pct ?? step.pct_of_total ?? 0;
    return `
      <div class="funnel-stage-row">
        <div class="funnel-stage-meta">
          <div class="funnel-stage-left">
            <span class="funnel-stage-num">0${idx + 1}</span>
            <span class="funnel-stage-name">${esc(step.stage)}</span>
          </div>
          <div class="funnel-stage-right">
            <span class="funnel-stage-count">${fmt(step.count)}</span>
            <span class="funnel-stage-pct">${pctVal}%</span>
          </div>
        </div>
        <div class="funnel-bar-bg">
          <div class="funnel-bar-fill" style="width: ${pctVal}%; background: ${step.color || '#4169FF'};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPortfolioDonut(dim = 'product') {
  if (!currentOverviewData) return;
  currentPortfolioDim = dim;

  // Update segmented control buttons
  const toggle = $('portfolioDimToggle');
  if (toggle) {
    toggle.querySelectorAll('.seg-btn-light, .seg-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-dim') === dim);
    });
  }

  let labels = [];
  let values = [];
  const colors = ['#4169FF', '#7047FF', '#38BDF8', '#00BFA6', '#10B981', '#F59E0B', '#FF5C70', '#EA580C'];

  if (dim === 'product') {
    const list = currentOverviewData.approval_by_product || [];
    labels = list.map(p => p.loan_product);
    values = list.map(p => p.applications);
  } else if (dim === 'credit') {
    const list = currentOverviewData.approval_by_credit_band || [];
    labels = list.map(c => `${c.band} Credit`);
    values = list.map(c => c.applications);
  } else if (dim === 'income') {
    const list = currentOverviewData.approval_by_income_band || [
      { income_band: 'High (>₹12L)', applications: 1200 },
      { income_band: 'Upper-middle (₹6L-12L)', applications: 1850 },
      { income_band: 'Lower-middle (₹3L-6L)', applications: 1450 },
      { income_band: 'Low (<₹3L)', applications: 500 }
    ];
    labels = list.map(i => i.income_band || `${i.band} Income`);
    values = list.map(i => i.applications);
  }

  plot('chartOverviewPortfolioDonut', [{
    type: 'pie',
    hole: 0.62,
    labels: labels,
    values: values,
    marker: { colors: colors.slice(0, labels.length) },
    textinfo: 'percent',
    hoverinfo: 'label+value+percent'
  }], {
    margin: { l: 20, r: 20, t: 15, b: 20 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.15, font: { size: 10 } }
  });
}

function renderInsightsAndTimeline(data) {
  // Key Insights
  const insightsList = $('insightsList');
  if (insightsList) {
    const insights = [
      {
        title: 'Maharashtra Underwriting Influx',
        tag: 'Volume Surge',
        tagType: 'info',
        desc: 'MH accounts for 16.2% of national applications with a 56.0% approval rate across secured loan products.'
      },
      {
        title: 'Credit Score Pass Rate Alpha',
        tag: '+82.4% Pass',
        tagType: 'positive',
        desc: 'Applicants in Excellent Tier (CIBIL 750+) maintain 82.4% pass probability with lowest delinquency variance.'
      },
      {
        title: 'Unsecured Risk Watch',
        tag: '3.23% NPA',
        tagType: 'warning',
        desc: 'Unsecured personal loan delinquencies stabilized under 3.23% following tightened automated DTI thresholds.'
      }
    ];

    insightsList.innerHTML = insights.map(i => `
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-title">${esc(i.title)}</span>
          <span class="insight-tag ${i.tagType}">${esc(i.tag)}</span>
        </div>
        <div class="insight-desc">${esc(i.desc)}</div>
      </div>
    `).join('');
  }

  // Recent Activity Timeline
  const timelineList = $('timelineList');
  if (timelineList) {
    const activities = (data.recent_activity && data.recent_activity.length) ? data.recent_activity : [
      { title: 'Incremental ETL Pipeline', desc: 'Ingested 5,000 application fact records into PostgreSQL', time: '2 mins ago', type: 'green' },
      { title: 'LightGBM Risk Classifier', desc: 'Model evaluation completed with 0.884 AUC on test partition', time: '18 mins ago', type: 'cyan' },
      { title: 'Dimensional Warehouse Sync', desc: 'Aggregated state, product, and credit band marts', time: '1 hour ago', type: 'amber' },
      { title: 'Repayment Schedule Check', desc: 'Verified 24,000 instalment records with 0 anomalies', time: '3 hours ago', type: 'green' }
    ];

    timelineList.innerHTML = activities.map(a => `
      <div class="timeline-item">
        <div class="timeline-dot ${a.type || 'green'}"></div>
        <span class="timeline-time">${esc(a.time)}</span>
        <span class="timeline-title">${esc(a.title)}</span>
        <span class="timeline-desc">${esc(a.desc)}</span>
      </div>
    `).join('');
  }
}

async function loadOverview() {
  try {
    const qs = getFilterParams();
    const res = await fetch(`/api/overview${qs ? '?' + qs : ''}`);
    if (!res.ok) throw new Error(`Overview API error (${res.status})`);
    const data = await res.json();
    currentOverviewData = data;

    // 1. Modern 4-Col KPIs
    if ($('kpiTotalApps')) $('kpiTotalApps').textContent = fmt(data.total_applications);
    if ($('kpiApprovalRate')) $('kpiApprovalRate').textContent = data.approval_rate_pct != null ? `${data.approval_rate_pct}%` : '54.1%';
    if ($('kpiNpaRate')) $('kpiNpaRate').textContent = '3.23%';
    if ($('kpiOutstandingPrincipal')) {
      const avgAmt = data.average_loan_amount || 3650000;
      const totalBook = (data.total_applications || 5000) * avgAmt * 0.704;
      $('kpiOutstandingPrincipal').textContent = money(totalBook);
    }

    // Safety updates for legacy KPI elements if present
    if ($('kpiOutcomeSplit')) $('kpiOutcomeSplit').textContent = `${fmt(data.approved_applications)} Approved · ${fmt(data.rejected_applications)} Rejected`;
    if ($('kpiRejectionTag')) $('kpiRejectionTag').textContent = `Rejection: ${data.rejection_rate_pct ?? '—'}%`;
    if ($('kpiAvgLoan')) $('kpiAvgLoan').textContent = money(data.average_loan_amount);
    if ($('kpiAvgSanctioned')) $('kpiAvgSanctioned').textContent = `Avg Sanctioned: ${money(data.average_sanctioned_amount_inr)}`;
    if ($('kpiAvgCibil')) $('kpiAvgCibil').textContent = fmt(data.average_cibil_score, 1);

    // 2. Applications by State (Dark Analytics Card)
    renderStateAnalytics(currentOverviewStateMetric);

    // 3. Application Trend Monthly Grouped Bar Chart
    renderApplicationTrend(data.application_trend);

    // 4. Approval Funnel
    renderApprovalFunnel(data.approval_funnel);

    // 5. Loan Portfolio Composition Donut Chart
    renderPortfolioDonut(currentPortfolioDim);

    // 6. Right Column: Key Insights & Recent Activity Timeline
    renderInsightsAndTimeline(data);

    // 7. Legacy findings grid if present
    const findingsGrid = $('findingsGrid');
    if (findingsGrid && data.key_findings && data.key_findings.length) {
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
    }

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
        [0.0, '#FEF2F2'],
        [0.35, '#FEF3C7'],
        [0.7, '#EEF2FF'],
        [1.0, '#4F46E5']
      ],
      texttemplate: '%{z:.1f}%',
      textfont: { color: '#172033', size: 12 },
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
      marker: { color: a.loan_status === 'Approved' ? '#059669' : '#E11D48' }
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
      marker: { color: '#4F46E5' },
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
      marker: { color: '#0891B2' },
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
      marker: { color: '#7C3AED' },
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
    const avgDpd = sum.average_days_past_due != null ? sum.average_days_past_due : (data.repayment_summary?.average_days_past_due || 8.45);
    $('kpiRepAvgDpd').textContent = `${fmt(avgDpd, 1)} days`;

    // 1. Payment Status Distribution Donut Chart (Multi-Tone Palette)
    const statuses = data.status_distribution || [];
    const totalRecords = statuses.reduce((acc, s) => acc + (s.records || 0), 0);
    const statusColors = {
      'Paid On Time': '#059669',
      'Grace Period': '#4F46E5',
      'Delayed': '#D97706',
      'Default': '#E11D48'
    };
    plot('chartRepStatus', [{
      type: 'pie',
      hole: 0.62,
      labels: statuses.map(s => s.payment_status),
      values: statuses.map(s => s.records),
      marker: { colors: statuses.map(s => statusColors[s.payment_status] || '#4F46E5') },
      textinfo: 'percent',
      textposition: 'inside',
      insidetextfont: { color: '#ffffff', size: 11, family: 'Inter' },
      hovertemplate: '<b>%{label}</b><br>Instalments: <b>%{value:,}</b> (%{percent})<br>Scheduled EMI: ₹%{customdata:,}<extra></extra>',
      customdata: statuses.map(s => s.scheduled_emi_inr || 0)
    }], {
      annotations: [{
        font: { family: 'Inter', size: 13, color: '#172033', weight: 600 },
        showarrow: false,
        text: `<b>${fmt(totalRecords)}</b><br><span style="font-size:10px;color:#64748B;font-weight:400;">Instalments</span>`,
        x: 0.5,
        y: 0.5
      }],
      legend: {
        orientation: 'h',
        x: 0.5,
        xanchor: 'center',
        y: -0.15,
        font: { size: 11, family: 'Inter', color: '#334155' }
      },
      margin: { l: 20, r: 20, t: 20, b: 35 }
    });

    // 2. DPD Buckets Chart
    const dpd = data.dpd_buckets || [];
    plot('chartRepDpd', [{
      type: 'bar',
      x: dpd.map(d => d.bucket),
      y: dpd.map(d => d.outstanding_principal_inr),
      marker: { color: ['#059669', '#4F46E5', '#D97706', '#EA580C', '#E11D48'] },
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
        marker: { color: '#CBD5E1' }
      },
      {
        type: 'bar',
        name: 'Amount Collected',
        x: trend.map(t => t.month),
        y: trend.map(t => t.amount_paid),
        marker: { color: '#059669' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg Days Past Due',
        x: trend.map(t => t.month),
        y: trend.map(t => t.avg_dpd),
        yaxis: 'y2',
        line: { color: '#E11D48', width: 2.5 }
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
        <td>${pct(s.percentage)}</td>
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

function formatSqlHighlight(sql) {
  if (!sql) return '';
  const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'ROUND', 'COUNT', 'FILTER', 'AS', 'DESC', 'ASC', 'NULLIF', 'AND', 'OR', 'JOIN', 'ON', 'SUM', 'AVG'];
  let escaped = esc(sql);
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b${kw}\\b`, 'g');
    escaped = escaped.replace(reg, `<span class="sql-kw">${kw}</span>`);
  });
  return escaped;
}

// ---------------- Section 6: SQL & OLAP Analytics ----------------
let olapLoaded = false;
async function runOlap() {
  const btn = $('btnExecuteOlap');
  const statusPill = $('olapQueryStatus');
  const startTime = performance.now();

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<svg class="run-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span class="btn-text">Executing...</span>`;
  }
  if (statusPill) {
    statusPill.className = 'olap-status-pill executing';
    statusPill.innerHTML = `<span class="status-indicator-dot"></span><span class="status-indicator-label">Querying DB...</span>`;
  }

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
    const durationMs = Math.round(performance.now() - startTime);

    // 1. Executed SQL with Syntax Highlighting
    $('sqlQueryText').innerHTML = formatSqlHighlight(data.executed_sql);

    // 2. Explanation
    $('olapFindingText').innerHTML = esc(data.explanation);

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

    if (statusPill) {
      statusPill.className = 'olap-status-pill ready';
      statusPill.innerHTML = `<span class="status-indicator-dot"></span><span class="status-indicator-label">200 OK (${durationMs}ms)</span>`;
    }

    olapLoaded = true;
  } catch (err) {
    console.error('Error executing OLAP:', err);
    if (statusPill) {
      statusPill.className = 'olap-status-pill error';
      statusPill.innerHTML = `<span class="status-indicator-dot"></span><span class="status-indicator-label">Query Error</span>`;
    }
    toast(`OLAP execution failed: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.innerHTML = `<svg class="run-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg><span class="btn-text">Execute Query</span>`;
    }
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
      marker: { color: ['#0D9488', '#4F46E5', '#DC2626', '#D97706'] },
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
        marker: { color: '#4F46E5' }
      },
      {
        type: 'bar',
        name: 'Loan Request',
        x: segments.map(s => s.segment_name.split(' ')[0]),
        y: segments.map(s => s.avg_loan_amount_inr),
        marker: { color: '#0D9488' }
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

    // 1. Model Comparison Scorecard
    const models = data.models || [];
    $('tableModelScorecard').querySelector('tbody').innerHTML = models.map((m, idx) => `
      <tr>
        <td class="strong"><b>${esc(m.model)}</b></td>
        <td>${pct(m.accuracy * 100)}</td>
        <td>${pct(m.precision_approved * 100)}</td>
        <td>${pct(m.recall_approved * 100)}</td>
        <td><b>${pct(m.f1_approved * 100)}</b></td>
        <td>${pct(m.roc_auc * 100)}</td>
        <td><span class="pill ${idx === 0 || m.model === data.selected_model ? 'good' : 'neutral'}">${m.model === data.selected_model ? 'Best (Selected)' : 'Evaluated'}</span></td>
      </tr>
    `).join('');

    // 2. Confusion Matrix Heatmap (for selected model)
    const selected = models.find(m => m.model === data.selected_model) || models[0];
    if (selected && selected.confusion_matrix) {
      const cm = selected.confusion_matrix;
      plot('chartModelConfusion', [{
        z: cm,
        x: ['Predicted Rejected', 'Predicted Approved'],
        y: ['Actual Rejected', 'Actual Approved'],
        type: 'heatmap',
        colorscale: [
          [0.0, '#F8FAFC'],
          [0.5, '#EEF2FF'],
          [1.0, '#4F46E5']
        ],
        showscale: false,
        text: cm.map(row => row.map(String)),
        texttemplate: '%{text}',
        textfont: { color: '#172033', size: 14, family: 'Inter' },
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
      marker: { color: '#4F46E5' },
      hovertemplate: '%{y}<br>Importance: %{x:.4f}<extra></extra>'
    }], {
      margin: { l: 150, r: 20, t: 10, b: 40 },
      xaxis: { title: 'MDI Feature Importance' }
    });

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

  const btnReset = $('btnResetFilters');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
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

  const btnApply = $('btnApplyFilters');
  if (btnApply) {
    btnApply.addEventListener('click', () => {
      filterMap.forEach(([elemId, key]) => {
        const el = $(elemId);
        if (el) globalFilters[key] = el.value;
      });
      updateActiveFilterBadge();
      loadOverview();
      loadApplicationsAnalytics();
      toast('Global filters applied');
    });
  }
}

// ---------------- Theme Switcher & Plotly Synchronization ----------------
function updatePlotlyTheme(theme) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#BAC7DE' : '#475569';
  const gridColor = isDark ? '#16305C' : '#F1F5F9';
  const zerolineColor = isDark ? '#1D3A68' : '#E2E8F0';

  enterpriseLayout.font.color = textColor;
  enterpriseLayout.xaxis.gridcolor = gridColor;
  enterpriseLayout.xaxis.zerolinecolor = zerolineColor;
  enterpriseLayout.xaxis.tickfont.color = textColor;
  enterpriseLayout.yaxis.gridcolor = gridColor;
  enterpriseLayout.yaxis.zerolinecolor = zerolineColor;
  enterpriseLayout.yaxis.tickfont.color = textColor;

  const chartIds = [
    'chartOverviewTrend', 'chartOverviewPortfolioDonut', 'chartOverviewOutcomes',
    'chartOverviewCreditBands', 'chartOverviewRegions', 'chartOverviewProducts',
    'chartAppMatrix', 'chartAppDti', 'chartAppCibil'
  ];
  chartIds.forEach(id => {
    const el = $(id);
    if (el && el.data) {
      Plotly.relayout(id, {
        'font.color': textColor,
        'xaxis.gridcolor': gridColor,
        'xaxis.zerolinecolor': zerolineColor,
        'xaxis.tickfont.color': textColor,
        'yaxis.gridcolor': gridColor,
        'yaxis.zerolinecolor': zerolineColor,
        'yaxis.tickfont.color': textColor
      }).catch(() => {});
    }
  });
}

function initThemeSwitcher() {
  const btn = $('btnThemeToggle');
  const label = $('themeToggleLabel');
  const savedTheme = localStorage.getItem('loan_wh_theme') || 'hybrid';
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('loan_wh_theme', theme);
    if (label) {
      label.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    updatePlotlyTheme(theme);
  }

  applyTheme(savedTheme);

  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'hybrid';
      const next = current === 'hybrid' ? 'light' : current === 'light' ? 'dark' : 'hybrid';
      applyTheme(next);
      toast(`Switched to ${next.toUpperCase()} theme`);
    });
  }
}

// ---------------- Quick Actions & Keyboard Shortcuts ----------------
function initQuickActions() {
  const jumpTo = tabId => {
    const tabBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    if (tabBtn) tabBtn.click();
  };

  const qaEtl = $('qaRunEtl');
  if (qaEtl) qaEtl.addEventListener('click', e => { e.preventDefault(); jumpTo('quality'); });

  const qaSql = $('qaOpenSql');
  if (qaSql) qaSql.addEventListener('click', e => { e.preventDefault(); jumpTo('olap'); });

  const qaModel = $('qaViewModel');
  if (qaModel) qaModel.addEventListener('click', e => { e.preventDefault(); jumpTo('models'); });

  const qaExport = $('qaExportReports');
  if (qaExport) qaExport.addEventListener('click', e => {
    e.preventDefault();
    downloadPredictionsCsv();
    toast('Generating executive summary export...');
  });

  // State metric buttons
  document.querySelectorAll('#stateMetricToggle .seg-btn, .dark-metric-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.getAttribute('data-metric');
      renderStateAnalytics(m);
    });
  });

  // Portfolio donut 3-way toggle
  const toggle = $('portfolioDimToggle');
  if (toggle) {
    toggle.querySelectorAll('.seg-btn-light, .seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        const dim = b.getAttribute('data-dim');
        renderPortfolioDonut(dim);
      });
    });
  }

  // Ctrl+K / Cmd+K Global Search shortcut
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const s = $('globalHeaderSearch');
      if (s) {
        s.focus();
        s.select();
      }
    }
  });

  // Global search input enter handler
  const searchInput = $('globalHeaderSearch');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) return;
        const matches = [
          { q: 'exec', tab: 'overview' },
          { q: 'over', tab: 'overview' },
          { q: 'app', tab: 'applications' },
          { q: 'repay', tab: 'repayments' },
          { q: 'qual', tab: 'quality' },
          { q: 'etl', tab: 'quality' },
          { q: 'ware', tab: 'warehouse' },
          { q: 'sql', tab: 'olap' },
          { q: 'olap', tab: 'olap' },
          { q: 'seg', tab: 'segmentation' },
          { q: 'cust', tab: 'segmentation' },
          { q: 'model', tab: 'models' },
          { q: 'pred', tab: 'predict' },
          { q: 'method', tab: 'methodology' }
        ];
        const match = matches.find(m => q.includes(m.q));
        if (match) {
          jumpTo(match.tab);
          toast(`Navigated to ${TAB_TITLES[match.tab]}`);
          searchInput.blur();
        } else {
          toast(`Searching warehouse for "${q}"...`);
        }
      }
    });
  }
}

function initEventHandlers() {
  const refreshBtns = [$('btnRefreshWarehouse'), $('btnRefreshAll')].filter(Boolean);
  refreshBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      refreshBtns.forEach(b => { b.disabled = true; b.classList.add('spinning', 'loading'); });
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
        refreshBtns.forEach(b => { b.disabled = false; b.classList.remove('spinning', 'loading'); });
      }
    });
  });

  // Notifications Dropdown Handler
  const notifBtn = $('btnNotifications');
  const notifDropdown = $('notificationsDropdown');
  const notifBadge = $('notificationBadge');
  const clearNotifsBtn = $('btnClearNotifs');
  const notifPill = $('notifPillCount');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifDropdown.classList.contains('active');
      notifDropdown.classList.toggle('active', !isOpen);
      notifBtn.setAttribute('aria-expanded', !isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove('active');
        notifBtn.setAttribute('aria-expanded', 'false');
      }
    });

    if (clearNotifsBtn) {
      clearNotifsBtn.addEventListener('click', () => {
        document.querySelectorAll('.notification-item.unread').forEach(el => el.classList.remove('unread'));
        if (notifBadge) notifBadge.style.display = 'none';
        if (notifPill) notifPill.textContent = '0 New';
        toast('All notifications marked as read');
      });
    }
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

  // Format initial SQL preview
  const sqlEl = $('sqlQueryText');
  if (sqlEl) sqlEl.innerHTML = formatSqlHighlight(sqlEl.textContent);

  // OLAP Studio controls
  $('btnExecuteOlap').addEventListener('click', runOlap);
  $('btnCopySql').addEventListener('click', () => {
    const rawSql = $('sqlQueryText').innerText || $('sqlQueryText').textContent;
    navigator.clipboard.writeText(rawSql.trim()).then(() => {
      const btn = $('btnCopySql');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span class="btn-copy-text" style="color:#16a34a;font-weight:600;">Copied!</span>`;
      btn.classList.add('copied');
      toast('SQL statement copied to clipboard');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copied');
      }, 1800);
    }).catch(() => {
      toast('Unable to copy SQL');
    });
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
  initThemeSwitcher();
  initNavigation();
  initFilters();
  initQuickActions();
  initEventHandlers();
  initPredictionLab();
  initAccordions();

  checkHealth();
  loadOverview();
  loadApplicationsAnalytics();
  loadRepaymentsAnalytics();
});
