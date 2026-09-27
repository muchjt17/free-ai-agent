const state = {
  userId: localStorage.getItem("ai_agent_user_id") || crypto.randomUUID(),
  conversationId: localStorage.getItem("ai_agent_conversation_id") || null,
  conversations: [],
  busy: false
};
localStorage.setItem("ai_agent_user_id", state.userId);

const $ = (s) => document.querySelector(s);
const chat = $("#chat");
const input = $("#messageInput");
const sendBtn = $("#sendBtn");
const currentTitle = $("#currentTitle");
const conversationList = $("#conversationList");
const welcome = $("#welcome");
const sidebar = $("#sidebar");

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}

function scrollBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(role, content, isTyping = false) {
  welcome?.remove();
  const row = document.createElement("div");
  row.className = `message-row ${role}`;
  row.innerHTML = `
    <div class="avatar">${role === "assistant" ? "✦" : "You"}</div>
    <div class="message-content">
      <div class="bubble">${isTyping ? '<span class="typing"><i></i><i></i><i></i></span>' : escapeHtml(content)}</div>
    </div>`;
  chat.appendChild(row);
  scrollBottom();
  return row;
}

function renderConversations() {
  conversationList.innerHTML = "";
  if (!state.conversations.length) {
    conversationList.innerHTML = '<div style="color:#686e7a;font-size:11px;padding:10px">No conversations yet.</div>';
    return;
  }
  for (const c of state.conversations) {
    const b = document.createElement("button");
    b.className = "conversation-item" + (c.id === state.conversationId ? " active" : "");
    b.textContent = c.title || "New chat";
    b.onclick = () => loadConversation(c.id);
    conversationList.appendChild(b);
  }
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function loadConversations() {
  try {
    const data = await api(`/api/conversations?user_id=${encodeURIComponent(state.userId)}`);
    state.conversations = data.conversations || [];
    renderConversations();
    if (state.conversationId && state.conversations.some(c => c.id === state.conversationId)) {
      await loadConversation(state.conversationId, false);
    }
  } catch (e) {
    toast(e.message);
  }
}

async function loadConversation(id, closeMenu = true) {
  try {
    const data = await api(`/api/messages?conversation_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(state.userId)}`);
    state.conversationId = id;
    localStorage.setItem("ai_agent_conversation_id", id);
    chat.innerHTML = "";
    currentTitle.textContent = state.conversations.find(c => c.id === id)?.title || "Chat";
    for (const m of data.messages || []) addMessage(m.role, m.content);
    renderConversations();
    if (closeMenu) sidebar.classList.remove("open");
  } catch (e) {
    toast(e.message);
  }
}

function newChat() {
  state.conversationId = null;
  localStorage.removeItem("ai_agent_conversation_id");
  currentTitle.textContent = "New chat";
  chat.innerHTML = `
    <div class="welcome" id="welcome">
      <div class="welcome-icon">✦</div>
      <h1>How can I help?</h1>
      <p>I can chat with you and remember useful facts you explicitly ask me to remember.</p>
      <div class="suggestions">
        <button data-prompt="What can you do?">What can you do?</button>
        <button data-prompt="Remember that I like simple explanations.">Remember something</button>
        <button data-prompt="Give me three ideas for a small web project.">Give me ideas</button>
      </div>
    </div>`;
  bindSuggestions();
  renderConversations();
  sidebar.classList.remove("open");
  input.focus();
}

async function sendMessage(text) {
  if (!text || state.busy) return;
  state.busy = true;
  sendBtn.disabled = true;
  input.value = "";
  input.style.height = "auto";

  addMessage("user", text);
  const typingRow = addMessage("assistant", "", true);

  try {
    const data = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        user_id: state.userId,
        conversation_id: state.conversationId,
        message: text
      })
    });

    typingRow.remove();
    addMessage("assistant", data.reply);
    state.conversationId = data.conversation_id;
    localStorage.setItem("ai_agent_conversation_id", state.conversationId);
    currentTitle.textContent = data.title || "Chat";
    await loadConversations();
  } catch (e) {
    typingRow.remove();
    addMessage("assistant", `Sorry, something went wrong.\n\n${e.message}`);
  } finally {
    state.busy = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

function bindSuggestions() {
  document.querySelectorAll("[data-prompt]").forEach(btn => {
    btn.onclick = () => sendMessage(btn.dataset.prompt);
  });
}

$("#composer").addEventListener("submit", e => {
  e.preventDefault();
  sendMessage(input.value.trim());
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 170) + "px";
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("#composer").requestSubmit();
  }
});

$("#newChatBtn").onclick = newChat;
$("#menuBtn").onclick = () => sidebar.classList.toggle("open");

$("#clearChatBtn").onclick = async () => {
  if (!state.conversationId) return newChat();
  if (!confirm("Delete this conversation?")) return;
  try {
    await api("/api/conversations", {
      method: "DELETE",
      body: JSON.stringify({ id: state.conversationId, user_id: state.userId })
    });
    newChat();
    await loadConversations();
    toast("Conversation deleted");
  } catch (e) { toast(e.message); }
};

$("#clearLocalBtn").onclick = () => {
  if (!confirm("Reset this browser's anonymous identity? This will hide its existing conversations from this browser.")) return;
  localStorage.removeItem("ai_agent_user_id");
  localStorage.removeItem("ai_agent_conversation_id");
  location.reload();
};

bindSuggestions();
loadConversations();
