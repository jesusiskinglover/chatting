const people = [
  { name: "Ari Ortega", initials: "AO", role: "Design partner", color: "mint" },
  { name: "Maya Chen", initials: "MC", role: "Frontend friend", color: "rose" },
  { name: "Jordan Lee", initials: "JL", role: "Study buddy", color: "blue" },
  { name: "Sam Rivera", initials: "SR", role: "Music chat", color: "amber" },
  { name: "Nina Patel", initials: "NP", role: "Project lead", color: "violet" }
];

let conversations = [
  {
    id: "dm-ari",
    type: "dm",
    name: "Ari Ortega",
    initials: "AO",
    status: "Active 2m ago",
    color: "mint",
    members: ["Michael", "Ari Ortega"],
    messages: [
      { from: "Ari Ortega", text: "Did you want the group chat to feel more like a school club or a close friends space?", time: "10:12 AM" },
      { from: "me", text: "Close friends first. Easy to make groups, easy to jump back into DMs.", time: "10:14 AM" },
      { from: "Ari Ortega", text: "Perfect. I’ll keep the side list clean and make the active chat feel roomy.", time: "10:15 AM" }
    ]
  },
  {
    id: "group-weekend",
    type: "group",
    name: "Weekend Plans",
    initials: "WP",
    status: "4 members",
    color: "blue",
    invite: "WEEKEND-82",
    members: ["Michael", "Maya Chen", "Jordan Lee", "Sam Rivera"],
    messages: [
      { from: "Maya Chen", text: "Movie first or food first?", time: "Yesterday" },
      { from: "Jordan Lee", text: "Food. Nobody makes brave decisions hungry.", time: "Yesterday" },
      { from: "me", text: "I made the group so we can vote here.", time: "9:06 AM" }
    ]
  },
  {
    id: "group-project",
    type: "group",
    name: "Launch Room",
    initials: "LR",
    status: "5 members",
    color: "violet",
    invite: "LAUNCH-19",
    members: ["Michael", "Ari Ortega", "Maya Chen", "Nina Patel", "Sam Rivera"],
    messages: [
      { from: "Nina Patel", text: "Drop updates here when the homepage polish is ready.", time: "Mon" },
      { from: "Ari Ortega", text: "I’ll handle the visual QA notes.", time: "Mon" }
    ]
  }
];

let activeId = conversations[0].id;
let dialogMode = "dm";

const conversationList = document.querySelector("#conversationList");
const messagesEl = document.querySelector("#messages");
const activeAvatar = document.querySelector("#activeAvatar");
const activeName = document.querySelector("#activeName");
const activeStatus = document.querySelector("#activeStatus");
const detailsAvatar = document.querySelector("#detailsAvatar");
const detailsName = document.querySelector("#detailsName");
const detailsMeta = document.querySelector("#detailsMeta");
const detailsStats = document.querySelector("#detailsStats");
const memberList = document.querySelector("#memberList");
const searchInput = document.querySelector("#searchInput");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const dialog = document.querySelector("#chatDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogSubtitle = document.querySelector("#dialogSubtitle");
const dialogName = document.querySelector("#dialogName");
const dialogMembers = document.querySelector("#dialogMembers");
const dialogCode = document.querySelector("#dialogCode");
const membersField = document.querySelector("#membersField");
const codeField = document.querySelector("#codeField");
const nameLabel = document.querySelector("#nameLabel");
const submitDialogBtn = document.querySelector("#submitDialogBtn");
const sidebar = document.querySelector(".sidebar");

function getActiveConversation() {
  return conversations.find((conversation) => conversation.id === activeId);
}

function initialsFor(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function avatarClass(color = "mint") {
  return `avatar ${color}`;
}

function renderConversations() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(query) ||
    conversation.members.join(" ").toLowerCase().includes(query)
  );

  conversationList.innerHTML = "";

  filtered.forEach((conversation) => {
    const latest = conversation.messages.at(-1);
    const button = document.createElement("button");
    button.className = `conversation-item ${conversation.id === activeId ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <div class="${avatarClass(conversation.color)}">${conversation.initials}</div>
      <div class="conversation-copy">
        <strong>${conversation.name}</strong>
        <span>${latest ? latest.text : "No messages yet"}</span>
      </div>
      <small>${conversation.type === "group" ? conversation.members.length : "DM"}</small>
    `;
    button.addEventListener("click", () => {
      activeId = conversation.id;
      sidebar.classList.remove("open");
      render();
    });
    conversationList.appendChild(button);
  });
}

function renderMessages() {
  const conversation = getActiveConversation();
  messagesEl.innerHTML = "";

  conversation.messages.forEach((message) => {
    const bubble = document.createElement("article");
    bubble.className = `message ${message.from === "me" ? "mine" : ""}`;
    const sender = message.from === "me" ? "You" : message.from;
    bubble.innerHTML = `
      <div class="message-meta">
        <span>${sender}</span>
        <time>${message.time}</time>
      </div>
      <p>${message.text}</p>
    `;
    messagesEl.appendChild(bubble);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderDetails() {
  const conversation = getActiveConversation();
  activeAvatar.className = `${avatarClass(conversation.color)} lg`;
  activeAvatar.textContent = conversation.initials;
  activeName.textContent = conversation.name;
  activeStatus.textContent = conversation.type === "group" ? `${conversation.members.length} members · Invite ${conversation.invite}` : conversation.status;

  detailsAvatar.className = `${avatarClass(conversation.color)} xl`;
  detailsAvatar.textContent = conversation.initials;
  detailsName.textContent = conversation.name;
  detailsMeta.textContent = conversation.type === "group" ? `Invite code ${conversation.invite}` : people.find((p) => p.name === conversation.name)?.role || "Direct message";

  detailsStats.innerHTML = `
    <div><strong>${conversation.messages.length}</strong><span>Messages</span></div>
    <div><strong>${conversation.members.length}</strong><span>People</span></div>
  `;

  memberList.innerHTML = "";
  conversation.members.forEach((member) => {
    const person = people.find((item) => item.name === member);
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML = `
      <div class="${avatarClass(person?.color || "slate")} small">${person?.initials || initialsFor(member)}</div>
      <div>
        <strong>${member}</strong>
        <span>${member === "Michael" ? "You" : person?.role || "Member"}</span>
      </div>
    `;
    memberList.appendChild(row);
  });
}

function render() {
  renderConversations();
  renderMessages();
  renderDetails();
}

function openDialog(mode) {
  dialogMode = mode;
  dialogName.value = "";
  dialogMembers.value = "";
  dialogCode.value = "";

  const config = {
    dm: {
      title: "Start a direct message",
      subtitle: "Open a private conversation with someone.",
      label: "Person",
      placeholder: "Maya Chen",
      submit: "Start DM",
      members: false,
      code: false
    },
    group: {
      title: "Create a group chat",
      subtitle: "Name the room and invite a few people.",
      label: "Group name",
      placeholder: "Basketball Team",
      submit: "Create group",
      members: true,
      code: false
    },
    join: {
      title: "Join a group",
      subtitle: "Enter an invite code or group name.",
      label: "Group name",
      placeholder: "Study Hall",
      submit: "Join group",
      members: false,
      code: true
    },
    member: {
      title: "Add a member",
      subtitle: "Invite someone into this group.",
      label: "Person",
      placeholder: "Nina Patel",
      submit: "Add member",
      members: false,
      code: false
    }
  }[mode];

  dialogTitle.textContent = config.title;
  dialogSubtitle.textContent = config.subtitle;
  nameLabel.textContent = config.label;
  dialogName.placeholder = config.placeholder;
  submitDialogBtn.textContent = config.submit;
  membersField.hidden = !config.members;
  codeField.hidden = !config.code;
  dialog.showModal();
  dialogName.focus();
}

function closeDialog() {
  dialog.close();
}

function addConversationFromDialog(event) {
  event.preventDefault();
  const name = dialogName.value.trim();
  if (!name) return;

  if (dialogMode === "member") {
    const conversation = getActiveConversation();
    if (!conversation.members.includes(name)) {
      conversation.members.push(name);
      conversation.messages.push({
        from: "me",
        text: `${name} was added to ${conversation.name}.`,
        time: "Now"
      });
    }
    closeDialog();
    render();
    return;
  }

  const id = `${dialogMode}-${Date.now()}`;
  const members = dialogMode === "group"
    ? ["Michael", ...dialogMembers.value.split(",").map((item) => item.trim()).filter(Boolean)]
    : ["Michael", name];

  const conversation = {
    id,
    type: dialogMode === "dm" ? "dm" : "group",
    name,
    initials: initialsFor(name),
    status: dialogMode === "dm" ? "New direct message" : `${members.length} members`,
    color: dialogMode === "join" ? "amber" : dialogMode === "group" ? "rose" : "slate",
    invite: dialogCode.value.trim() || `${name.toUpperCase().replace(/\W+/g, "").slice(0, 8)}-${Math.floor(Math.random() * 90 + 10)}`,
    members,
    messages: [
      {
        from: "me",
        text: dialogMode === "join" ? `Joined ${name}.` : `Started ${dialogMode === "dm" ? "a chat" : "the group"} with ${name}.`,
        time: "Now"
      }
    ]
  };

  conversations = [conversation, ...conversations];
  activeId = id;
  closeDialog();
  render();
}

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  getActiveConversation().messages.push({ from: "me", text, time: "Now" });
  messageInput.value = "";
  render();
});

searchInput.addEventListener("input", renderConversations);
document.querySelector("#newDmBtn").addEventListener("click", () => openDialog("dm"));
document.querySelector("#newGroupBtn").addEventListener("click", () => openDialog("group"));
document.querySelector("#joinGroupBtn").addEventListener("click", () => openDialog("join"));
document.querySelector("#addMemberBtn").addEventListener("click", () => openDialog("member"));
document.querySelector("#closeDialogBtn").addEventListener("click", closeDialog);
document.querySelector("#cancelDialogBtn").addEventListener("click", closeDialog);
document.querySelector("#dialogForm").addEventListener("submit", addConversationFromDialog);
document.querySelector("#menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));

render();
