// ─────────────────────────────────────────────
// api.js — Frontend API caller
//
// CONCEPT: Frontend vs Backend API calls
//
// In CodeLens AI, the frontend called Groq directly.
// In Pitch Panel, the frontend calls OUR OWN backend.
//
// Frontend → Our Backend (localhost:3000) → Groq API
//
// This way, the Groq key is NEVER in the browser.
// Users can't open DevTools and steal it.
// ─────────────────────────────────────────────

// The URL of our backend server
// In development: localhost:3000
// In production: you'd change this to your deployed URL
const BACKEND_URL = 'http://localhost:3000';

// ── analyzePitch() ────────────────────────────
// Sends the pitch to our backend and returns results
// Called by app.js when user clicks "Analyze"
async function analyzePitch(pitchText) {

  // fetch() makes an HTTP request
  // We POST because we're sending data (the pitch)
  const response = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: 'POST',

    // Headers tell the server what format our data is in
    headers: {
      'Content-Type': 'application/json'
    },

    // body = the data we're sending
    // JSON.stringify converts JS object → JSON string
    body: JSON.stringify({
      pitch: pitchText
    })
  });

  // Parse the JSON response from server
  const data = await response.json();

  // If server returned an error status, throw it
  if (!response.ok) {
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  // Return the results object:
  // { success, elapsed, results: { investor, tech, user, verdict } }
  return data;
}

// Check if backend is running
async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
