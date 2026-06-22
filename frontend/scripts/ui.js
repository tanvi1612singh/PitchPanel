// ─────────────────────────────────────────────
// ui.js — All DOM manipulation
// Rule: this file ONLY touches the screen.
//       No API calls, no business logic.
// ─────────────────────────────────────────────

// Set a card to loading state
function setCardLoading(type) {
  document.getElementById(`card-${type}`).classList.add('active');
  const status = document.getElementById(`status-${type}`);
  status.className = 'card-status s-loading';
  status.textContent = 'thinking...';
  document.getElementById(`body-${type}`).innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-label">Consulting ${getAgentName(type)}...</div>
    </div>`;
}

// Parse and display result in card
function setCardResult(type, rawText) {
  const card = document.getElementById(`card-${type}`);
  card.className = `agent-card done-${type}`;

  const status = document.getElementById(`status-${type}`);
  status.className = 'card-status s-done';
  status.textContent = 'done';

  document.getElementById(`body-${type}`).innerHTML = formatAgentResult(rawText, type);
}

function setCardError(type, msg) {
  const card = document.getElementById(`card-${type}`);
  card.className = 'agent-card';
  const status = document.getElementById(`status-${type}`);
  status.className = 'card-status s-error';
  status.textContent = 'error';
  document.getElementById(`body-${type}`).innerHTML = `
    <div class="error-box">⚠ ${msg}</div>`;
}

// Show the verdict card (full width)
function setVerdictResult(rawText) {
  const card = document.getElementById('verdict-card');
  card.classList.add('visible');
  document.getElementById('verdict-body').innerHTML = formatVerdictResult(rawText);
}

// Reset everything to idle
function resetAll() {
  ['investor', 'tech', 'user'].forEach(type => {
    document.getElementById(`card-${type}`).className = 'agent-card';
    const status = document.getElementById(`status-${type}`);
    status.className = 'card-status s-idle';
    status.textContent = 'idle';
  });

  document.getElementById('body-investor').innerHTML = emptyState('💰', 'Market size, revenue model, fundability');
  document.getElementById('body-tech').innerHTML     = emptyState('🛠️', 'Feasibility, tech stack, what breaks first');
  document.getElementById('body-user').innerHTML     = emptyState('👤', 'Real-world usability, habit change, delight');

  document.getElementById('verdict-card').classList.remove('visible');
  document.getElementById('stats-row').classList.remove('visible');
  document.getElementById('progress-section').classList.remove('visible');
}

// Show/update progress steps
function setStep(stepId, state) {
  // state: 'active' | 'done' | 'idle'
  const step = document.getElementById(stepId);
  if (!step) return;
  step.className = `step ${state}`;
  const icon = step.querySelector('.step-icon');
  const spinner = step.querySelector('.step-spinner');
  if (state === 'active') {
    if (icon)    icon.style.display = 'none';
    if (spinner) spinner.style.display = 'block';
  } else {
    if (icon)    icon.style.display = 'block';
    if (spinner) spinner.style.display = 'none';
    if (state === 'done' && icon) icon.textContent = '✅';
  }
}

function showStats(elapsed) {
  document.getElementById('stats-row').classList.add('visible');
  document.getElementById('stat-time').textContent = elapsed + 's';
}

function updateCharCount() {
  const len = document.getElementById('pitchInput').value.length;
  document.getElementById('charCount').textContent = `${len} chars`;
}

// ── HELPERS ──────────────────────────────────

function getAgentName(type) {
  return { investor: 'The Investor', tech: 'The Tech Lead', user: 'The User' }[type] || type;
}

function emptyState(icon, desc) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><span>${desc}</span></div>`;
}

// Format individual agent results into clean HTML
function formatAgentResult(text, type) {
  // Extract score
  const scoreMatch = text.match(/SCORE:\s*(\d+)\/10/i);
  const score = scoreMatch ? scoreMatch[1] : null;

  // Extract verdict line (INVEST/PASS/BUILDABLE/WOULD USE etc)
  const verdictMatch = text.match(/VERDICT:\s*([^\n]+)/i);
  const verdict = verdictMatch ? verdictMatch[1].trim() : null;

  // Extract bottom line
  const bottomMatch = text.match(/BOTTOM LINE:\s*([\s\S]*?)(?=\n[A-Z]|$)/i);
  const bottomLine = bottomMatch ? bottomMatch[1].trim() : null;

  // Determine chip color
  const positiveWords = ['invest', 'buildable', 'would use', 'strong', 'yes'];
  const negativeWords  = ['pass', 'not feasible', 'would not', 'no'];
  const isPositive = positiveWords.some(w => verdict?.toLowerCase().includes(w));
  const isNegative = negativeWords.some(w => verdict?.toLowerCase().includes(w));
  const chipClass = isPositive ? 'chip-positive' : isNegative ? 'chip-negative' : 'chip-neutral';

  // Score color
  const scoreNum = parseInt(score);
  const scoreColor = scoreNum >= 7 ? 'var(--green)' : scoreNum >= 5 ? 'var(--amber)' : 'var(--red)';

  let html = '';
  if (verdict) html += `<span class="verdict-chip ${chipClass}">${verdict}</span><br/>`;
  if (score)   html += `<div class="score-badge" style="color:${scoreColor}">${score}<span>/10</span></div>`;
  if (bottomLine) {
    html += `<div class="result-section">
      <div class="result-section-title">Bottom Line</div>
      <div class="result-section-body">${bottomLine}</div>
    </div>`;
  }

  // Append remaining sections (strengths, concerns, etc.)
  const sections = text
    .split('\n')
    .filter(l => l.match(/^[A-Z][A-Z\s]+:/) && !l.match(/^VERDICT:|^SCORE:|^BOTTOM LINE:/))
    .slice(0, 2); // show max 2 extra sections to keep cards clean

  sections.forEach(section => {
    const colonIdx = section.indexOf(':');
    const title = section.substring(0, colonIdx).trim();
    const content = section.substring(colonIdx + 1).trim();
    if (content) {
      html += `<div class="result-section">
        <div class="result-section-title">${title}</div>
        <div class="result-section-body">${content}</div>
      </div>`;
    }
  });

  return `<div class="result-content">${html}</div>`;
}

// Format the full verdict result
function formatVerdictResult(text) {
  // Extract final score — handles many formats the AI might use:
  // "FINAL SCORE: 7/10" or "**FINAL SCORE:** 7.5/10" or just "7/10" anywhere
  const scoreMatch = text.match(/FINAL SCORE[:\*\s]+(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i)
                  || text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const score = scoreMatch ? Math.round(parseFloat(scoreMatch[1])) : null;

  // Extract win probability — handles "60%" or "~60%" or "60 percent"
  const winMatch = text.match(/HACKATHON PROBABILITY[:\*\s~]+(\d+)\s*%?/i)
                || text.match(/(\d+)\s*%\s*chance/i);
  const winProb = winMatch ? winMatch[1] : null;

  // Extract overall verdict — strip any markdown bold markers
  const overallMatch = text.match(/OVERALL VERDICT[:\*\s]+([^\n]+)/i);
  const overall = overallMatch ? overallMatch[1].replace(/\*/g, '').trim() : null;

  // Extract IF I WERE YOU section
  const adviceMatch = text.match(/IF I WERE YOU[:\*\s]+([\s\S]*?)(?=\nHACKATHON|\nTOP 3|$)/i);
  const advice = adviceMatch ? adviceMatch[1].trim() : null;

  // Extract top improvements
  const improvMatch = text.match(/TOP 3 IMPROVEMENTS[^:]*:\s*([\s\S]*?)(?=\nIF I WERE|$)/i);
  const improvements = improvMatch ? improvMatch[1].trim() : null;

  const scoreColor = score >= 7 ? 'var(--green)' : score >= 5 ? 'var(--amber)' : 'var(--red)';
  const scoreDisplay = score !== null ? score : '—';

  let html = `
    <div style="display:flex; align-items:flex-end; gap:1.5rem; margin-bottom:1.25rem; flex-wrap:wrap;">
      <div>
        <div class="final-score" style="color:${scoreColor}">${scoreDisplay}<span>/10</span></div>
        ${winProb ? `<div class="win-probability">Hackathon win probability: <strong>${winProb}%</strong></div>` : ''}
      </div>
      ${overall ? `<div style="flex:1; min-width:200px;">
        <div style="font-size:11px; font-family:var(--mono); color:var(--muted); margin-bottom:4px;">OVERALL VERDICT</div>
        <div style="font-size:1.1rem; font-weight:500; color:var(--text);">${overall}</div>
      </div>` : ''}
    </div>`;

  if (advice) {
    html += `<div class="result-section">
      <div class="result-section-title">💡 If I Were You</div>
      <div class="result-section-body">${advice.replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  if (improvements) {
    html += `<div class="result-section" style="margin-top:1rem;">
      <div class="result-section-title">🔧 Top Improvements Needed</div>
      <div class="result-section-body" style="white-space:pre-line">${improvements}</div>
    </div>`;
  }

  return html;
}
