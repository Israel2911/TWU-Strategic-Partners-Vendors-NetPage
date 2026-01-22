// CHANGE this to your Render backend URL after deploy
const API_BASE = "http://localhost:4000/api";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return await res.json();
}

async function apiPost(path, body = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return await res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") node.className = v;
    else if (k === "onClick") node.addEventListener("click", v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child === null || child === undefined) return;
    if (typeof child === "string") node.appendChild(document.createTextNode(child));
    else node.appendChild(child);
  });
  return node;
}

// ---- Regions list ----

async function loadRegions() {
  const container = document.getElementById("regions-container");
  container.innerHTML = "Loading regions…";
  try {
    const regions = await apiGet("/regions");
    if (!regions.length) {
      container.innerHTML = "<p>No regions yet.</p>";
      return;
    }
    const list = el("ul");
    regions.forEach((r) => {
      const btn = el("button", { onClick: () => showRegion(r) }, r.name);
      const li = el("li", {}, btn);
      list.appendChild(li);
    });
    container.innerHTML = "";
    container.appendChild(list);
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading regions.</p>";
  }
}

// ---- Region → Institutions → Projects → Risks + SWOT ----

async function showRegion(region) {
  const main = document.getElementById("hierarchy");
  main.innerHTML = "";
  main.appendChild(el("h2", {}, `Region: ${region.name}`));
  main.appendChild(el("p", {}, region.description || "No description."));

  const section = el("div");
  section.appendChild(el("h3", {}, "Institutions"));
  section.appendChild(el("p", {}, "Loading institutions…"));
  main.appendChild(section);

  try {
    const institutions = await apiGet(`/regions/${region.id}/institutions`);
    if (!institutions.length) {
      section.innerHTML = "<p>No institutions yet.</p>";
      return;
    }
    const list = el("ul");
    institutions.forEach((inst) => {
      const btn = el(
        "button",
        { onClick: () => showInstitution(inst) },
        inst.name
      );
      const li = el("li", {}, btn);
      list.appendChild(li);
    });
    section.innerHTML = "";
    section.appendChild(el("h3", {}, "Institutions"));
    section.appendChild(list);
  } catch (err) {
    console.error(err);
    section.innerHTML = "<p>Error loading institutions.</p>";
  }
}

async function showInstitution(inst) {
  const main = document.getElementById("hierarchy");
  main.innerHTML = "";
  main.appendChild(el("h2", {}, `Institution: ${inst.name}`));
  main.appendChild(el("p", {}, inst.notes || "No notes."));

  const section = el("div");
  section.appendChild(el("h3", {}, "Projects"));
  section.appendChild(el("p", {}, "Loading projects…"));
  main.appendChild(section);

  try {
    const projects = await apiGet(`/institutions/${inst.id}/projects`);
    if (!projects.length) {
      section.innerHTML = "<p>No projects yet.</p>";
      return;
    }
    const list = el("ul");
    projects.forEach((p) => {
      const btn = el(
        "button",
        { onClick: () => showProject(p) },
        `${p.title}`
      );
      const badge = el("span", { className: "badge" }, p.status);
      const li = el("li", {}, [btn, " ", badge]);
      list.appendChild(li);
    });
    section.innerHTML = "";
    section.appendChild(el("h3", {}, "Projects"));
    section.appendChild(list);
  } catch (err) {
    console.error(err);
    section.innerHTML = "<p>Error loading projects.</p>";
  }
}

async function showProject(project) {
  const main = document.getElementById("hierarchy");
  main.innerHTML = "";
  main.appendChild(el("h2", {}, `Project: ${project.title}`));
  main.appendChild(el("p", {}, `Status: ${project.status}`));
  main.appendChild(el("p", {}, project.description || "No description."));

  // Risks
  const risksSection = el("div");
  risksSection.appendChild(el("h3", {}, "Risks"));
  risksSection.appendChild(el("p", {}, "Loading risks…"));
  main.appendChild(risksSection);

  // SWOT
  const swotSection = el("div");
  swotSection.appendChild(el("h3", {}, "SWOT"));
  const swotButton = el(
    "button",
    {
      className: "primary",
      onClick: async () => {
        swotButton.disabled = true;
        swotButton.textContent = "Generating…";
        try {
          const swot = await apiPost(`/projects/${project.id}/swot/generate`);
          swotSection.innerHTML = "";
          swotSection.appendChild(renderSwot(swot));
        } catch (err) {
          console.error(err);
          swotSection.innerHTML = "<p>Error generating SWOT.</p>";
        } finally {
          swotButton.disabled = false;
          swotButton.textContent = "AI Generate SWOT";
        }
      },
    },
    "AI Generate SWOT"
  );
  swotSection.appendChild(swotButton);
  main.appendChild(swotSection);

  // Load risks
  try {
    const risks = await apiGet(`/projects/${project.id}/risks`);
    risksSection.innerHTML = "";
    risksSection.appendChild(el("h3", {}, "Risks"));
    risksSection.appendChild(renderRisks(risks));
  } catch (err) {
    console.error(err);
    risksSection.innerHTML = "<p>Error loading risks.</p>";
  }
}

function renderRisks(risks) {
  if (!risks.length) return el("p", {}, "No risks yet.");
  const list = el("ul");
  risks.forEach((r) => {
    const text = `${r.title} – ${r.category} – score ${r.score}`;
    list.appendChild(el("li", {}, text));
  });
  return list;
}

function renderSwot(swot) {
  if (!swot) return el("p", {}, "No SWOT yet.");
  return el("div", {}, [
    el("h4", {}, "Strengths"),
    el("pre", {}, swot.strengths || ""),
    el("h4", {}, "Weaknesses"),
    el("pre", {}, swot.weaknesses || ""),
    el("h4", {}, "Opportunities"),
    el("pre", {}, swot.opportunities || ""),
    el("h4", {}, "Threats"),
    el("pre", {}, swot.threats || ""),
  ]);
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadRegions();
});
