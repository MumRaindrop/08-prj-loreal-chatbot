/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const lastQuestion = document.getElementById("lastQuestion");

// ========== Configuration ==========
// Replace this with your deployed Cloudflare Worker URL that proxies to OpenAI.
// Example: const WORKER_URL = "https://your-worker.example.workers.dev/chat";
const WORKER_URL = "https://loreal-worker.salbrecht-228.workers.dev/";

// System prompt: restrict assistant to L'Oréal product knowledge and politely refuse unrelated topics
const systemPrompt = `You are an assistant specialized in L'Oréal products, routines, and recommendations. Answer only questions about L'Oréal brands, products, skin/hair care routines, application tips, product ingredients as publicly documented, and recommendations within the L'Oréal portfolio. If a user asks about topics outside L'Oréal products, beauty routines or related topics (for example politics, unrelated technical help, personal medical diagnosis beyond general skincare guidance), politely refuse and say you can only help with L'Oréal product and routine questions. Be concise, helpful, and cite product names where appropriate.`;

// Conversation history (starts with system message)
const messages = [
  { role: "system", content: systemPrompt }
];

// helper: append a message bubble
function appendMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user" : "assistant"}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "user" : "assistant"}`;
  bubble.textContent = text;

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return row;
}

// initial greeting
appendMessage("assistant", "👋 Bonjour! I'm the L'Oréal Smart Advisor. Ask me about L'Oréal products, routines, or recommendations.");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // show user's question in the meta area and as a bubble
  lastQuestion.textContent = `Your question: ${text}`;
  appendMessage("user", text);

  // add to conversation
  messages.push({ role: "user", content: text });

  // show typing placeholder for assistant
  const typingRow = appendMessage("assistant", "…thinking…");

  // clear input
  userInput.value = "";

  try {
    // POST to Cloudflare Worker which should forward to OpenAI
    const resp = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      throw new Error(`Worker request failed: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();

    // Worker should ideally return the OpenAI response object.
    // Try common shapes: data.choices[0].message.content OR data.message OR data.response
    const assistantText =
      data?.choices?.[0]?.message?.content || data?.message || data?.response || "(No response)";

    // replace typing placeholder with real assistant response
    typingRow.querySelector(".bubble").textContent = assistantText;

    // add assistant to messages for continued context
    messages.push({ role: "assistant", content: assistantText });
  } catch (err) {
    console.error(err);
    // replace typing placeholder with error message
    typingRow.querySelector(".bubble").textContent = "Sorry — I couldn't reach the service. Please try again later.";
  } finally {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

// Accessibility: focus input on load
userInput.focus();
