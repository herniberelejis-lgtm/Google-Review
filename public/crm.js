const ESTADOS = [
  { v: "a-contactar", l: "A contactar" },
  { v: "contactado", l: "Contactado — esperando respuesta" },
  { v: "en-conversacion", l: "En conversación" },
  { v: "visita-agendada", l: "Visita agendada" },
  { v: "vendido", l: "Cerrado — vendido" },
  { v: "rechazado", l: "Rechazado / no le interesó" },
];

function blank() {
  return {
    id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    local: "",
    zona: "",
    contacto: "",
    redes: "",
    web: "",
    resenas: "",
    producto: "",
    precio: "",
    estado: "a-contactar",
    segFecha: "",
    segTexto: "",
    notas: "",
    shots: [],
  };
}

let data = [];
let query = "";
let saveTimer = null;

async function loadFromServer() {
  const el = document.getElementById("syncNote");
  try {
    const res = await fetch("/api/leads");
    if (!res.ok) throw new Error("HTTP " + res.status);
    data = await res.json();
    el.textContent = "Sincronizado con el servidor — todos ven lo mismo.";
    el.classList.remove("error");
  } catch (err) {
    data = [];
    el.textContent = "No se pudo conectar con /api/leads. Revisá que el backend esté corriendo.";
    el.classList.add("error");
  }
  renderSummary();
  renderCards();
}

function saveToServer() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const el = document.getElementById("syncNote");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      el.textContent = "Sincronizado con el servidor — todos ven lo mismo.";
      el.classList.remove("error");
    } catch (err) {
      el.textContent = "No se pudo guardar en el servidor. El cambio quedó solo en esta pantalla.";
      el.classList.add("error");
    }
  }, 500);
}

function waLink(contacto) {
  const digits = (contacto || "").replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return "https://wa.me/" + digits;
}

function renderSummary() {
  const el = document.getElementById("summary");
  const total = data.length;
  const enCurso = data.filter((d) => ["contactado", "en-conversacion", "visita-agendada"].includes(d.estado)).length;
  const vendidos = data.filter((d) => d.estado === "vendido").length;
  el.innerHTML = `
    <div class="stat"><span class="num mono">${total}</span><span class="lbl">Locales</span></div>
    <div class="stat"><span class="num mono">${enCurso}</span><span class="lbl">En curso</span></div>
    <div class="stat"><span class="num mono">${vendidos}</span><span class="lbl">Cerrados</span></div>
  `;
}

function matchesQuery(lead) {
  if (!query) return true;
  const estadoLabel = (ESTADOS.find((e) => e.v === lead.estado) || {}).l || "";
  const haystack = [lead.local, lead.zona, lead.contacto, lead.redes, lead.producto, lead.notas, estadoLabel]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function renderCards() {
  const el = document.getElementById("cards");
  el.innerHTML = "";

  data.filter(matchesQuery).forEach((lead) => {
    const card = document.createElement("div");
    card.className = "card";

    const wa = waLink(lead.contacto);
    const waHtml = wa ? `<a class="wa-quick" href="${wa}" target="_blank" rel="noreferrer">WhatsApp ↗</a>` : "";

    const optionsHtml = ESTADOS.map(
      (e) => `<option value="${e.v}" ${e.v === lead.estado ? "selected" : ""}>${e.l}</option>`
    ).join("");

    const shotsHtml = (lead.shots || [])
      .map(
        (src, i) =>
          `<div class="shot-thumb"><img src="${src}" alt="Captura ${i + 1}"><button data-remove-shot="${i}" aria-label="Quitar captura">✕</button></div>`
      )
      .join("");

    card.innerHTML = `
      <div class="card-head">
        <div class="name-zona">
          <input class="name-input" data-field="local" placeholder="Nombre del local" value="${esc(lead.local)}">
          <input class="zona-input" data-field="zona" placeholder="Zona / dirección" value="${esc(lead.zona)}">
        </div>
        <div class="head-right">
          ${waHtml}
          <select class="status" data-field="estado">${optionsHtml}</select>
        </div>
      </div>

      <div class="grid-fields">
        <div>
          <span class="field-label">Contacto</span>
          <input class="field-inline" data-field="contacto" placeholder="Nombre y/o teléfono" value="${esc(lead.contacto)}">
        </div>
        <div>
          <span class="field-label">Redes</span>
          <input class="field-inline" data-field="redes" placeholder="Instagram, Facebook…" value="${esc(lead.redes)}">
        </div>
        <div>
          <span class="field-label">Página web</span>
          <input class="field-inline" data-field="web" placeholder="https://…" value="${esc(lead.web)}">
        </div>
        <div>
          <span class="field-label">Página de reseñas (Google)</span>
          <input class="field-inline" data-field="resenas" placeholder="Link para dejar reseña" value="${esc(lead.resenas)}">
        </div>
        <div class="full">
          <span class="field-label">Producto ofrecido</span>
          <textarea class="field" data-field="producto" rows="2" placeholder="Qué le ofrecimos">${esc(lead.producto)}</textarea>
        </div>
        <div>
          <span class="field-label">Precio ofrecido</span>
          <input class="field-inline" data-field="precio" placeholder="$35.000" value="${esc(lead.precio)}">
        </div>
        <div>
          <span class="field-label">Próximo seguimiento</span>
          <div class="seguimiento-row">
            <input type="date" data-field="segFecha" value="${esc(lead.segFecha)}">
            <input type="text" data-field="segTexto" placeholder="Qué hay que hacer" value="${esc(lead.segTexto)}">
          </div>
        </div>
        <div class="full">
          <span class="field-label">Notas</span>
          <textarea class="field" data-field="notas" rows="2" placeholder="Cualquier otra cosa a recordar">${esc(lead.notas)}</textarea>
        </div>
        <div class="full">
          <span class="field-label">Capturas de la conversación</span>
          <div class="shots">
            ${shotsHtml}
            <button class="add-shot" data-add-shot>
              <span class="plus">+</span>
              <span>Adjuntar</span>
            </button>
          </div>
          <input type="file" accept="image/*" multiple style="display:none" data-file-input>
        </div>
      </div>

      <div class="card-foot">
        <button class="delete-link" data-delete>Eliminar local</button>
      </div>
    `;

    card.querySelectorAll("[data-field]").forEach((input) => {
      const evt = input.tagName === "SELECT" || input.type === "date" ? "change" : "input";
      input.addEventListener(evt, () => {
        lead[input.dataset.field] = input.value;
        saveToServer();
        if (input.dataset.field === "estado" || input.dataset.field === "local") {
          renderSummary();
        }
      });
    });

    const fileInput = card.querySelector("[data-file-input]");
    card.querySelector("[data-add-shot]").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      lead.shots = lead.shots || [];
      let pending = files.length;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          lead.shots.push(reader.result);
          pending -= 1;
          if (pending === 0) {
            saveToServer();
            renderCards();
          }
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = "";
    });

    card.querySelectorAll("[data-remove-shot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        lead.shots.splice(Number(btn.dataset.removeShot), 1);
        saveToServer();
        renderCards();
      });
    });

    card.querySelector("[data-delete]").addEventListener("click", () => {
      if (!confirm(`¿Eliminar "${lead.local || "este local"}" del CRM?`)) return;
      data = data.filter((d) => d.id !== lead.id);
      saveToServer();
      renderSummary();
      renderCards();
    });

    el.appendChild(card);
  });
}

function exportCsv() {
  const estadoLabel = (v) => (ESTADOS.find((e) => e.v === v) || {}).l || v;
  const header = [
    "Nombre del local", "Zona", "Contacto", "Redes", "Página web",
    "Página de reseñas", "Producto ofrecido", "Precio ofrecido",
    "Estatus", "Próximo seguimiento (fecha)", "Próximo seguimiento (qué)",
    "Notas", "Capturas adjuntas",
  ];
  const rows = [
    header,
    ...data.map((d) => [
      d.local, d.zona, d.contacto, d.redes, d.web, d.resenas,
      d.producto.replace(/\n/g, " "), d.precio, estadoLabel(d.estado),
      d.segFecha, d.segTexto, d.notas.replace(/\n/g, " "), (d.shots || []).length,
    ]),
  ];
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crm-locales.csv";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("exportBtn").addEventListener("click", exportCsv);
document.getElementById("addBtn").addEventListener("click", () => {
  data.unshift(blank());
  saveToServer();
  renderSummary();
  renderCards();
  const firstInput = document.querySelector(".card .name-input");
  if (firstInput) firstInput.focus();
});
document.getElementById("search").addEventListener("input", (e) => {
  query = e.target.value;
  renderCards();
});

loadFromServer();
