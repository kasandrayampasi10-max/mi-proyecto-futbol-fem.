if (sessionStorage.getItem("futbolFemSesion") !== "activa") {
  window.location.href = "../index.html";
}

const getData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
let players = getData("ff_jugadoras");
let matches = getData("ff_partidos");
let attendance = getData("ff_asistencia");
let modalAction = null;

const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function showView(view) {
  document.querySelectorAll(".section-view").forEach(s => s.classList.toggle("active", s.id === view));
  document.querySelectorAll(".nav-link[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const titles = {dashboard:"Panel principal",jugadoras:"Jugadoras",asistencia:"Asistencia",partidos:"Partidos"};
  $("topTitle").textContent = titles[view] || "FUTBOL FEM";
  if (view === "jugadoras") renderPlayers();
  if (view === "asistencia") renderAttendance();
  if (view === "partidos") renderMatches();
}
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showView(b.dataset.go)));
$("logoutBtn").addEventListener("click", () => { sessionStorage.removeItem("futbolFemSesion"); window.location.href = "../index.html"; });

function updateStats() {
  $("statPlayers").textContent = players.length;
  $("statAttendance").textContent = attendance.length;
  $("statMatches").textContent = matches.length;
  $("statWins").textContent = matches.filter(m => Number(m.gf) > Number(m.gc)).length;
}
function renderPlayers() {
  const query = ($("playerSearch").value || "").toLowerCase();
  const list = players.filter(p => (p.name + " " + p.position).toLowerCase().includes(query));
  $("playersTable").innerHTML = list.length ? list.map(p => `<tr><td><strong>${escapeHTML(p.name)}</strong></td><td>${escapeHTML(p.age)}</td><td>${escapeHTML(p.position)}</td><td>${escapeHTML(p.number)}</td><td><span class="status">Activa</span></td><td><button class="action-btn" data-delete-player="${p.id}">Eliminar</button></td></tr>`).join("") : `<tr><td colspan="6" class="empty-state">No hay jugadoras registradas.</td></tr>`;
  document.querySelectorAll("[data-delete-player]").forEach(b => b.addEventListener("click", () => {
    if (confirm("¿Deseas eliminar este registro?")) { players = players.filter(p => p.id !== Number(b.dataset.deletePlayer)); saveData("ff_jugadoras", players); renderPlayers(); updateStats(); }
  }));
}
$("playerSearch").addEventListener("input", renderPlayers);

function openModal(title, fields, action) {
  modalAction = action;
  $("modalTitle").textContent = title;
  $("modalForm").innerHTML = fields.map(f => `<label for="${f.id}">${f.label}</label><input id="${f.id}" type="${f.type || "text"}" ${f.required === false ? "" : "required"} placeholder="${f.placeholder || ""}">`).join("");
  $("modalBackdrop").classList.add("show");
}
function closeModal() { $("modalBackdrop").classList.remove("show"); $("modalForm").innerHTML = ""; modalAction = null; }
$("cancelModal").addEventListener("click", closeModal);
$("confirmModal").addEventListener("click", () => {
  const form = $("modalForm");
  if (!form.reportValidity()) return;
  const values = {};
  form.querySelectorAll("input").forEach(input => values[input.id] = input.value.trim());
  if (modalAction) modalAction(values);
  closeModal();
});
$("addPlayerBtn").addEventListener("click", () => openModal("Registrar jugadora", [
  {id:"name",label:"Nombre completo",placeholder:"Ej. María López"},
  {id:"age",label:"Edad",type:"number",placeholder:"Ej. 19"},
  {id:"position",label:"Posición",placeholder:"Ej. Delantera"},
  {id:"number",label:"Número de camiseta",type:"number",placeholder:"Ej. 10"}
], v => {
  players.push({id:Date.now(), ...v}); saveData("ff_jugadoras", players); renderPlayers(); updateStats();
}));

function renderAttendance() {
  const date = $("attendanceDate").value || new Date().toISOString().slice(0,10);
  $("attendanceDate").value = date;
  $("attendanceTable").innerHTML = players.length ? players.map(p => {
    const old = attendance.find(a => a.playerId === p.id && a.date === date);
    return `<tr><td><strong>${escapeHTML(p.name)}</strong></td><td>${escapeHTML(p.position)}</td><td><select data-attendance="${p.id}"><option value="Presente" ${old?.status === "Presente" ? "selected" : ""}>Presente</option><option value="Ausente" ${old?.status === "Ausente" ? "selected" : ""}>Ausente</option><option value="Justificada" ${old?.status === "Justificada" ? "selected" : ""}>Justificada</option></select></td></tr>`;
  }).join("") : `<tr><td colspan="3" class="empty-state">Primero registra jugadoras en el módulo correspondiente.</td></tr>`;
}
$("attendanceDate").addEventListener("change", renderAttendance);
$("saveAttendance").addEventListener("click", () => {
  const date = $("attendanceDate").value;
  if (!players.length) { $("attendanceMessage").textContent = "No hay jugadoras registradas todavía."; return; }
  const records = [...document.querySelectorAll("[data-attendance]")].map(s => ({playerId:Number(s.dataset.attendance),date,status:s.value}));
  attendance = attendance.filter(a => a.date !== date).concat(records);
  saveData("ff_asistencia", attendance); updateStats();
  $("attendanceMessage").textContent = "La asistencia del " + date + " se guardó correctamente.";
});

function renderMatches() {
  $("matchesTable").innerHTML = matches.length ? matches.map(m => `<tr><td><strong>${escapeHTML(m.rival)}</strong></td><td>${escapeHTML(m.date)}</td><td>${escapeHTML(m.competition)}</td><td>${escapeHTML(m.gf)} - ${escapeHTML(m.gc)}</td><td><span class="status">${Number(m.gf)>Number(m.gc)?"Victoria":Number(m.gf)<Number(m.gc)?"Derrota":"Empate"}</span></td><td><button class="action-btn" data-delete-match="${m.id}">Eliminar</button></td></tr>`).join("") : `<tr><td colspan="6" class="empty-state">Todavía no hay partidos registrados.</td></tr>`;
  document.querySelectorAll("[data-delete-match]").forEach(b => b.addEventListener("click", () => {
    if (confirm("¿Deseas eliminar este partido?")) { matches = matches.filter(m => m.id !== Number(b.dataset.deleteMatch)); saveData("ff_partidos", matches); renderMatches(); updateStats(); }
  }));
}
$("addMatchBtn").addEventListener("click", () => openModal("Registrar partido", [
  {id:"rival",label:"Equipo rival",placeholder:"Nombre del equipo"},
  {id:"date",label:"Fecha",type:"date"},
  {id:"competition",label:"Competición",placeholder:"Ej. Campeonato local"},
  {id:"gf",label:"Goles de nuestro equipo",type:"number"},
  {id:"gc",label:"Goles del equipo rival",type:"number"}
], v => {
  matches.push({id:Date.now(), ...v}); saveData("ff_partidos", matches); renderMatches(); updateStats();
}));

updateStats();
