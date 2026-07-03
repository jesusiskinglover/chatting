const elements = {
  messages: document.querySelector("#messages"),
  messageForm: document.querySelector("#messageForm"),
  profileForm: document.querySelector("#profileForm"),
  messageInput: document.querySelector("#messageInput"),
  nameInput: document.querySelector("#nameInput"),
  roomInput: document.querySelector("#roomInput"),
  colorInput: document.querySelector("#colorInput"),
  roomTitle: document.querySelector("#roomTitle"),
  status: document.querySelector("#connectionStatus"),
  copyLinkButton: document.querySelector("#copyLinkButton"),
  roomButtons: [...document.querySelectorAll(".room-button")]
};

const profileKey = "browser-chat-profile";
const profile = loadProfile();
let activeRoom = getRoomFromUrl() || profile.room || "general";
let messages = [];
let eventSource;

elements.nameInput.value = profile.name;
elements.roomInput.value = activeRoom;
elements.colorInput.value = profile.color;

setRoom(activeRoom, false);
connectStream();

elements.profileForm?.addEventListener("submit", (event) => event.preventDefault());

for (const input of [elements.nameInput, elements.roomInput, elements.colorInput]) {
  input.addEventListener("change", () => {
    const nextRoom = normalizeRoom(elements.roomInput.value);
    saveProfile();
    if (nextRoom !== activeRoom) setRoom(nextRoom);
  });
}

elements.roomInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const nextRoom = normalizeRoom(elements.roomInput.value);
    saveProfile();
    setRoom(nextRoom);
  }
});

for (const button of elements.roomButtons) {
  button.addEventListener("click", () => setRoom(button.dataset.room));
}

elements.copyLinkButton.addEventListener("click", async () => {
  const url = new URL(window.location.href);
  url.searchParams.set("room", activeRoom);
  await navigator.clipboard.writeText(url.toString());
  elements.copyLinkButton.title = "Copied";
  setTimeout(() => {
    elements.copyLinkButton.title = "Copy room link";
  }, 1400);
});

elements.messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = elements.messageInput.value.trim();
  if (!text) return;

  elements.messageInput.value = "";
  saveProfile();

  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: currentName(),
      color: elements.colorInput.value,
      room: activeRoom,
      text
    })
  });

  if (!response.ok) {
    elements.messageInput.value = text;
    elements.status.textContent = "Message did not send";
  }
});

function loadProfile() {
  const fallback = {
    name: `Guest ${Math.floor(Math.random() * 900 + 100)}`,
    room: "general",
    color: randomColor()
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(profileKey)) };
  } catch {
    return fallback;
  }
}

function saveProfile() {
  localStorage.setItem(
    profileKey,
    JSON.stringify({
      name: currentName(),
      room: activeRoom,
      color: elements.colorInput.value
    })
  );
}

function currentName() {
  return elements.nameInput.value.trim() || "Guest";
}

function randomColor() {
  const colors = ["#2563eb", "#0f766e", "#c2410c", "#7c3aed", "#be123c", "#15803d"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRoomFromUrl() {
  return normalizeRoom(new URLSearchParams(window.location.search).get("room") || "");
}

function normalizeRoom(room) {
  return (room || "general").trim().replace(/^#/, "").replace(/\s+/g, "-").slice(0, 40) || "general";
}

async function setRoom(room, updateUrl = true) {
  activeRoom = normalizeRoom(room);
  elements.roomInput.value = activeRoom;
  elements.roomTitle.textContent = `# ${activeRoom}`;
  elements.messageInput.placeholder = `Message #${activeRoom}`;
  elements.roomButtons.forEach((button) => button.classList.toggle("active", button.dataset.room === activeRoom));
  saveProfile();

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("room", activeRoom);
    history.replaceState(null, "", url);
  }

  const response = await fetch(`/api/messages?room=${encodeURIComponent(activeRoom)}`);
  messages = response.ok ? await response.json() : [];
  renderMessages();
}

function connectStream() {
  if (eventSource) eventSource.close();
  eventSource = new EventSource("/api/stream");

  eventSource.addEventListener("ready", () => {
    elements.status.textContent = "Live";
  });

  eventSource.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.room !== activeRoom || messages.some((item) => item.id === message.id)) return;
    messages.push(message);
    renderMessages();
  });

  eventSource.onerror = () => {
    elements.status.textContent = "Reconnecting...";
  };
}

function renderMessages() {
  elements.messages.replaceChildren();

  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No messages here yet. Start the conversation.";
    elements.messages.append(empty);
    return;
  }

  for (const message of messages) {
    elements.messages.append(createMessage(message));
  }

  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function createMessage(message) {
  const row = document.createElement("article");
  row.className = "message";
  if (message.author === currentName()) row.classList.add("mine");

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.style.background = message.color;
  avatar.textContent = initials(message.author);

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "meta";

  const author = document.createElement("span");
  author.className = "author";
  author.textContent = message.author;

  const time = document.createElement("time");
  time.dateTime = message.createdAt;
  time.textContent = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt));

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = message.text;

  meta.append(author, time);
  bubble.append(meta, text);
  row.append(avatar, bubble);
  return row;
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}
