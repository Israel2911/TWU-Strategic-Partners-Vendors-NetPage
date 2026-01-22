const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Mock data to get UI working
let regions = [
  { id: 1, name: "South East Asia", description: "Thailand, Myanmar, Vietnam, etc." },
  { id: 2, name: "India", description: "India regional card" }
];

let institutions = [
  { id: 1, regionId: 1, name: "Thai Partner University", notes: "Main Thailand/Myanmar campus." },
  { id: 2, regionId: 2, name: "Indian Partner University", notes: "Pilot campus in India." }
];

let projects = [
  { id: 1, institutionId: 1, title: "TWU–Thailand Exchange", description: "Short programs and student exchange.", status: "running" },
  { id: 2, institutionId: 1, title: "Joint Leadership Program", description: "Joint/twinning degree concept.", status: "scoping" },
  { id: 3, institutionId: 2, title: "India Pathway Pilot", description: "Pathway for Indian students.", status: "idea" }
];

let risks = [
  { id: 1, projectId: 1, title: "Visa delays", category: "operational", likelihood: 3, impact: 3 },
  { id: 2, projectId: 1, title: "Political instability", category: "geo", likelihood: 4, impact: 4 },
  { id: 3, projectId: 2, title: "Low initial enrolment", category: "financial", likelihood: 3, impact: 4 }
];

function addComputedFields(risk) {
  return { ...risk, score: risk.likelihood * risk.impact };
}

// Routes

app.get("/api/regions", (req, res) => {
  res.json(regions);
});

app.get("/api/regions/:id/institutions", (req, res) => {
  const regionId = Number(req.params.id);
  res.json(institutions.filter((i) => i.regionId === regionId));
});

app.get("/api/institutions/:id/projects", (req, res) => {
  const instId = Number(req.params.id);
  res.json(projects.filter((p) => p.institutionId === instId));
});

app.get("/api/projects/:id/risks", (req, res) => {
  const projectId = Number(req.params.id);
  const projectRisks = risks.filter((r) => r.projectId === projectId).map(addComputedFields);
  res.json(projectRisks);
});

// Naive SWOT generator stub (AI-like behaviour)
app.post("/api/projects/:id/swot/generate", (req, res) => {
  const projectId = Number(req.params.id);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const projectRisks = risks.filter((r) => r.projectId === projectId).map(addComputedFields);

  let strengths = [];
  let weaknesses = [];
  let opportunities = [];
  let threats = [];

  if (project.status === "running" || project.status === "approved") {
    strengths.push("Project has institutional approval and is in operation, showing existing commitment.");
  } else {
    weaknesses.push("Project is not yet fully approved or launched, which may delay impact.");
  }

  const highRisks = projectRisks.filter((r) => r.score >= 9);
  if (highRisks.length) {
    threats.push(`There are ${highRisks.length} high-scoring risks that require mitigation.`);
  }

  if (projectRisks.length === 0) {
    weaknesses.push("No risks are documented yet, which may hide unassessed exposure.");
  }

  opportunities.push("Project can strengthen TWU presence and collaboration in this region.");

  res.json({
    strengths: strengths.join("\n") || "TBD",
    weaknesses: weaknesses.join("\n") || "TBD",
    opportunities: opportunities.join("\n") || "TBD",
    threats: threats.join("\n") || "TBD"
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
