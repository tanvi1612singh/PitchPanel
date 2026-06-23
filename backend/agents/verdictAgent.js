// ─────────────────────────────────────────────
// verdictAgent.js
//
// CONCEPT: Sequential Agent (runs AFTER the other 3)
//
// This is the KEY difference from CodeLens AI:
//
// CodeLens: 3 agents → 3 independent results
//
// Pitch Panel:
//   Phase 1 (parallel): Investor + Tech + User run together
//   Phase 2 (sequential): Verdict reads ALL 3 results
//                         and synthesizes one final score
//
// The Verdict agent gets MORE information than the others —
// it sees the original pitch AND all 3 expert reviews.
// This is called "agent chaining" or "agentic pipeline".
// ─────────────────────────────────────────────

const VERDICT_SYSTEM_PROMPT = `
You are the Chief Evaluator of a prestigious startup competition.
You have just received independent reviews from three expert panels:
an investor, a tech lead, and a target user.

Your job is to synthesize all three perspectives into one final verdict.
Be fair, be decisive, and give actionable advice.

RESPONSE FORMAT — respond in exactly this structure:

FINAL SCORE: [X/10]

PANEL SUMMARY:
💰 Investor says: [one sentence summary]
🛠️ Tech Lead says: [one sentence summary]  
👤 User says: [one sentence summary]

OVERALL VERDICT: [STRONG PITCH / PROMISING / NEEDS WORK / BACK TO DRAWING BOARD]

TOP 3 STRENGTHS:
1. [strength]
2. [strength]
3. [strength]

TOP 3 IMPROVEMENTS NEEDED:
1. [improvement]
2. [improvement]
3. [improvement]

IF I WERE YOU:
[3-4 sentences of the most important advice — what to do next, what to fix first, what to double down on]

HACKATHON PROBABILITY: [X]% chance of winning a hackathon with this idea
`;

// CONCEPT: This function receives the outputs of the 3 previous agents
// It passes them ALL into the context so the Verdict agent can read them
async function runVerdictAgent(groq, pitchText, investorReview, techReview, userReview) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: VERDICT_SYSTEM_PROMPT
      },
      {
        role: 'user',
        // We pass in the pitch AND all 3 expert reviews
        // This is "context chaining" — each agent builds on the previous ones
        content: `
ORIGINAL PITCH:
"${pitchText}"

═══════════════════════════════════
INVESTOR REVIEW:
${investorReview}

═══════════════════════════════════
TECH LEAD REVIEW:
${techReview}

═══════════════════════════════════
USER REVIEW:
${userReview}

═══════════════════════════════════
Now give your final synthesized verdict.
        `
      }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = { runVerdictAgent };
