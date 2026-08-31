const test = require("node:test");
const assert = require("node:assert/strict");

const {
  dedupeLeads,
  scoreLead,
} = require("../src/services/leadScoring");

test("merges duplicate companies using website domain", () => {
  const rows = [
    {
      company: "NimbusFlow",
      website: "https://nimbusflow.example",
      industry: "SaaS",
      location: "Austin, Texas",
      email: "amanda@nimbusflow.example",
      phone: "",
    },
    {
      company: "NimbusFlow",
      website: "https://nimbusflow.example",
      industry: "SaaS",
      location: "Austin, Texas",
      email: "",
      phone: "+1-555-0101",
    },
  ];

  const result = dedupeLeads(rows);

  assert.equal(result.uniqueLeads.length, 1);
  assert.equal(result.duplicatesRemoved, 1);
  assert.equal(
    result.uniqueLeads[0].email,
    "amanda@nimbusflow.example"
  );
  assert.equal(
    result.uniqueLeads[0].phone,
    "+1-555-0101"
  );
});

test("classifies a complete high-fit lead as Contact Now", () => {
  const lead = {
    company: "CloudAxis",
    website: "https://cloudaxis.example",
    industry: "IT Services",
    location: "Dallas, Texas",
    revenue: 24000000,
    employees: 150,
    contactName: "Michael Scott",
    email: "michael@cloudaxis.example",
    phone: "+1-555-0102",
    linkedin: "https://linkedin.com/in/michael-scott",
  };

  const result = scoreLead(lead);

  assert.equal(result.fitScore, 100);
  assert.equal(result.confidenceScore, 100);
  assert.equal(result.priority, "Contact Now");
});

test("sends a high-fit incomplete lead to Verify First", () => {
  const lead = {
    company: "DataNest",
    website: "",
    industry: "Software",
    location: "Austin, Texas",
    revenue: 8000000,
    employees: 55,
    contactName: "",
    email: "contact@datanest.example",
    phone: "",
    linkedin: "",
  };

  const result = scoreLead(lead);

  assert.equal(result.fitScore, 85);
  assert.equal(result.confidenceScore, 40);
  assert.equal(result.priority, "Verify First");
  assert.ok(result.issues.includes("Contact name is missing"));
  assert.ok(
    result.issues.includes("Website is missing or invalid")
  );
});