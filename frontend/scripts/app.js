// ─────────────────────────────────────────────
// app.js — Main controller
// Ties together: user input → api.js → ui.js
// ─────────────────────────────────────────────

// Example pitches to demo the app
const EXAMPLES = {
  codelens: `CodeLens AI is a multi-model code review tool that analyzes your code using three AI models simultaneously — one for security vulnerabilities, one for performance issues, and one for readability. Developers paste their code and get structured feedback with line numbers and severity ratings in under 3 seconds. Built for developer teams doing code reviews.`,

  food: `FoodBridge connects households that have surplus homemade food with nearby people who are hungry or want affordable home-cooked meals. Cooks list what they've made, buyers order and pick up. We take 15% commission. Targeting Indian cities where home cooking is cultural and food waste is high.`,

  study: `StudyBuddy AI is a WhatsApp bot for Indian college students. You forward your PDF notes to the bot and it instantly generates MCQ questions, summaries, and flashcards in both English and Hindi. Students pay Rs 99/month. No app download needed — works on any phone with WhatsApp.`
};

// Load example pitch into textarea
function loadExample(key) {
  document.getElementById('pitchInput').value = EXAMPLES[key];
  updateCharCount();
}

// Wire up char counter
document.getElementById('pitchInput').addEventListener('input', updateCharCount);

// Clear button
function clearAll() {
  document.getElementById('pitchInput').value = '';
  updateCharCount();
  resetAll();
}

// ── MAIN FUNCTION ─────────────────────────────
async function analyzePitchHandler() {
  const pitch = document.getElementById('pitchInput').value.trim();

  if (!pitch || pitch.length < 20) {
    alert('Please enter a pitch of at least 20 characters!');
    return;
  }

  // Reset UI
  resetAll();

  // Show progress section
  document.getElementById('progress-section').classList.add('visible');

  // Disable button
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Consulting the panel...';

  // ── PHASE 1: Show parallel agents loading ──
  setStep('step-agents', 'active');
  setCardLoading('investor');
  setCardLoading('tech');
  setCardLoading('user');

  try {
    // Call our backend — this triggers all 3 agents + verdict
    // The backend handles the parallel/sequential logic
    const data = await analyzePitch(pitch);

    // ── Show agent results ──
    setStep('step-agents', 'done');
    setCardResult('investor', data.results.investor);
    setCardResult('tech',     data.results.tech);
    setCardResult('user',     data.results.user);

    // ── Phase 2: Show verdict loading ──
    setStep('step-verdict', 'active');

    // Small delay so user sees the transition
    await new Promise(r => setTimeout(r, 400));

    // Show verdict
    setStep('step-verdict', 'done');
    setVerdictResult(data.results.verdict);
    showStats(data.elapsed);

  } catch (err) {
    // Handle errors gracefully
    console.error('Analysis failed:', err);
    setCardError('investor', err.message);
    setCardError('tech',     err.message);
    setCardError('user',     err.message);
    setStep('step-agents', 'idle');
  } finally {
    // Always re-enable button, even if error occurred
    btn.disabled = false;
    btn.textContent = '⚡ Pitch to the Panel';
  }
}

// Check backend on page load
window.addEventListener('DOMContentLoaded', async () => {
  const isAlive = await checkBackendHealth();
  const indicator = document.getElementById('backend-status');
  if (indicator) {
    indicator.textContent = isAlive ? '● Backend connected' : '● Backend offline — run: npm run dev';
    indicator.style.color = isAlive ? 'var(--green)' : 'var(--red)';
  }
});
