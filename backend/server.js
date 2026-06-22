// ─────────────────────────────────────────────
// server.js — The Express Backend Server
//
// CONCEPT: What does a backend server do?
//
// Your frontend (HTML) runs in the browser.
// Your backend (this file) runs on your computer.
// They talk to each other via HTTP requests.
//
// Frontend says: "Hey backend, analyze this pitch"
// Backend says:  "Sure, let me call Groq and send back results"
//
// WHY do we need a backend?
// 1. API keys stay on the server — users can't steal them
// 2. We can do heavy processing server-side
// 3. Real products need backends — this is industry standard
// ─────────────────────────────────────────────

// ── IMPORTS ──────────────────────────────────
// CONCEPT: require() is Node's way of importing files/libraries
// Like Python's import or JavaScript's import

const express = require('express');  // web framework
const cors    = require('cors');     // allows cross-origin requests
const dotenv  = require('dotenv');   // reads .env file
const Groq    = require('groq-sdk'); // Groq AI client

// Import our 4 agents
const { runInvestorAgent } = require('./agents/investorAgent');
const { runTechAgent }     = require('./agents/techAgent');
const { runUserAgent }     = require('./agents/userAgent');
const { runVerdictAgent }  = require('./agents/verdictAgent');

// ── SETUP ─────────────────────────────────────
// Load .env variables into process.env
// After this line, process.env.GROQ_API_KEY works
dotenv.config();

// Create Express app
const app = express();

// CONCEPT: Middleware
// Middleware = functions that run on EVERY request before your route handler
// Like security checkpoints at an airport

// Middleware 1: CORS — allows your frontend to call this backend
// Without this, browser refuses to connect (security policy)
app.use(cors());

// Middleware 2: JSON parser — automatically parses incoming JSON
// Without this, req.body would be undefined
app.use(express.json());

// Create Groq client with your secret key
// This is why we need a backend — key stays here, never sent to browser
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ── ROUTES ───────────────────────────────────
// CONCEPT: A route = a URL path + what happens when you visit it
// Like pages on a website, but for API calls

// Health check route — useful to test if server is running
// Visit http://localhost:3000/health in browser to test
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Pitch Panel backend is running!',
    timestamp: new Date().toISOString()
  });
});

// ── MAIN ROUTE: POST /api/analyze ────────────
// CONCEPT: POST vs GET
// GET  = fetching data (no body) — like reading a webpage
// POST = sending data to server  — like submitting a form
//
// Frontend will POST to this route with the pitch text
// We process it and send back all 4 agent results
app.post('/api/analyze', async (req, res) => {

  // CONCEPT: req and res
  // req (request)  = what the frontend sent us
  // res (response) = what we send back to frontend

  try {
    // Extract pitch from request body
    // Frontend sends: { pitch: "my startup idea..." }
    const { pitch } = req.body;

    // Validate — don't process empty requests
    if (!pitch || pitch.trim().length < 20) {
      // 400 = Bad Request (standard HTTP status code)
      return res.status(400).json({
        error: 'Pitch must be at least 20 characters long'
      });
    }

    console.log(`\n📨 New pitch received (${pitch.length} chars)`);
    console.log(`📝 Preview: "${pitch.substring(0, 80)}..."`);
    console.log('🚀 Running 3 agents in parallel...\n');

    const startTime = Date.now();

    // ── PHASE 1: PARALLEL AGENTS ──────────────
    // CONCEPT: Promise.all vs Promise.allSettled
    //
    // Promise.all:        fails if ANY one fails
    // Promise.allSettled: always completes, reports each result
    //
    // We use Promise.all here because if one agent fails,
    // we can't give a meaningful verdict anyway
    //
    // All 3 run at the SAME TIME — not one after another
    // This cuts time from ~9 seconds to ~3 seconds
    const [investorReview, techReview, userReview] = await Promise.all([
      runInvestorAgent(groq, pitch),
      runTechAgent(groq, pitch),
      runUserAgent(groq, pitch)
    ]);

    console.log('✅ Phase 1 complete — all 3 agents done');
    console.log('🏆 Running Verdict agent...\n');

    // ── PHASE 2: SEQUENTIAL VERDICT ───────────
    // CONCEPT: Sequential means "one after another"
    // Verdict MUST wait for Phase 1 — it needs all 3 reviews
    // to synthesize a final opinion.
    // This is "agent chaining" — output of agents becomes
    // input to the next agent.
    const verdictReview = await runVerdictAgent(
      groq,
      pitch,
      investorReview,
      techReview,
      userReview
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ All done in ${elapsed}s`);

    // Send all results back to frontend
    // 200 = OK (success)
    res.status(200).json({
      success: true,
      elapsed,
      results: {
        investor: investorReview,
        tech:     techReview,
        user:     userReview,
        verdict:  verdictReview
      }
    });

  } catch (error) {
    // CONCEPT: Error handling
    // Always wrap async operations in try/catch
    // Never let errors crash your server

    console.error('❌ Error in /api/analyze:', error.message);

    // 500 = Internal Server Error
    res.status(500).json({
      error: 'Something went wrong on the server',
      details: error.message
    });
  }
});

// ── START SERVER ──────────────────────────────
// CONCEPT: Port
// A port is like a door number on your computer.
// Port 3000 is a common choice for development servers.
// Your frontend will call http://localhost:3000/api/analyze

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🎯 Pitch Panel Backend Running!      ║
║   http://localhost:${PORT}               ║
║                                        ║
║   Routes:                              ║
║   GET  /health        — test server    ║
║   POST /api/analyze   — analyze pitch  ║
╚════════════════════════════════════════╝
  `);
});
