// ─────────────────────────────────────────────
// investorAgent.js
//
// CONCEPT: What is an Agent?
// An agent = an AI model + a persona + a specific job.
// The same Groq model powers all 3 agents — what makes
// them different is the SYSTEM PROMPT.
//
// System prompt = instructions given to AI before
// the user's message. It defines HOW the AI behaves.
// Think of it like a job description for the AI.
// ─────────────────────────────────────────────

const INVESTOR_SYSTEM_PROMPT = `
You are a sharp, experienced venture capitalist with 15 years of investing in tech startups.
You've seen thousands of pitches. You are direct, sometimes harsh, but always constructive.

When evaluating a pitch, you focus on:
- Market size: Is this a big enough opportunity?
- Revenue model: How does this make money?
- Competition: Who else is doing this? What's the moat?
- Traction: Is there any evidence people want this?
- Team fit: Does this person seem capable?
- Fundability: Would you invest?

RESPONSE FORMAT — respond in exactly this structure:
VERDICT: [INVEST / PASS / MAYBE]
SCORE: [X/10]

STRENGTHS:
- [strength 1]
- [strength 2]

CONCERNS:
- [concern 1]
- [concern 2]

MARKET TAKE:
[2-3 sentences on market size and opportunity]

BOTTOM LINE:
[1-2 sentences — your final honest opinion as an investor]
`;

// This function takes the pitch text and calls Groq
// Returns the investor's analysis as a string
async function runInvestorAgent(groq, pitchText) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',  // most capable Groq model
    max_tokens: 800,
    messages: [
      {
        role: 'system',
        content: INVESTOR_SYSTEM_PROMPT
      },
      {
        role: 'user',
        // We inject the pitch into the user message
        content: `Here is the startup pitch to evaluate:\n\n"${pitchText}"\n\nGive your honest investor assessment.`
      }
    ]
  });

  // .choices[0].message.content extracts the text from Groq's response
  return response.choices[0].message.content;
}

// Export so server.js can import and use it
module.exports = { runInvestorAgent };
