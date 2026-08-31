const validator = require("validator");

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return cleanText(value).toLowerCase();
}

function toNumber(value) {
  const cleanedValue = String(value || "").replace(/[^0-9.-]/g, "");
  return Number(cleanedValue) || 0;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(normalizeText)
    .filter(Boolean);
}

function getDomain(value) {
  if (!value) {
    return "";
  }

  try {
    const url = value.startsWith("http") ? value : `https://${value}`;

    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeLead(row) {
  return {
    company: cleanText(row.company),
    website: cleanText(row.website),
    industry: cleanText(row.industry),
    location: cleanText(row.location),
    revenue: toNumber(row.revenue),
    employees: toNumber(row.employees),
    contactName: cleanText(row.contactName),
    email: normalizeText(row.email),
    phone: cleanText(row.phone),
    linkedin: cleanText(row.linkedin),
  };
}

function getDedupeKey(lead) {
  const websiteDomain = getDomain(lead.website);

  if (websiteDomain) {
    return websiteDomain;
  }

  return `${normalizeText(lead.company)}-${normalizeText(lead.location)}`;
}

function mergeLeadRecords(existingLead, newLead) {
  const mergedLead = { ...existingLead };

  Object.keys(mergedLead).forEach((field) => {
    if (!mergedLead[field] && newLead[field]) {
      mergedLead[field] = newLead[field];
    }
  });

  return mergedLead;
}

function dedupeLeads(rows) {
  const uniqueLeadMap = new Map();
  let duplicatesRemoved = 0;

  rows.forEach((row) => {
    const lead = normalizeLead(row);
    const dedupeKey = getDedupeKey(lead);

    if (uniqueLeadMap.has(dedupeKey)) {
      const existingLead = uniqueLeadMap.get(dedupeKey);

      uniqueLeadMap.set(
        dedupeKey,
        mergeLeadRecords(existingLead, lead)
      );

      duplicatesRemoved += 1;
    } else {
      uniqueLeadMap.set(dedupeKey, lead);
    }
  });

  return {
    uniqueLeads: Array.from(uniqueLeadMap.values()),
    duplicatesRemoved,
  };
}

function matchesAny(value, targetValues) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return false;
  }

  return targetValues.some(
    (target) =>
      normalizedValue.includes(target) ||
      target.includes(normalizedValue)
  );
}

function scoreLead(lead, criteria = {}) {
  const profile = {
    industries: toList(
      criteria.industries ||
        "SaaS, Software, IT Services, Cybersecurity, FinTech"
    ),
    locations: toList(
      criteria.locations ||
        "Texas, California, New York"
    ),
    minRevenue: Number(criteria.minRevenue ?? 1000000),
    maxRevenue: Number(criteria.maxRevenue ?? 30000000),
    minEmployees: Number(criteria.minEmployees ?? 10),
    maxEmployees: Number(criteria.maxEmployees ?? 200),
  };

  let fitScore = 0;
  let confidenceScore = 0;

  const reasons = [];
  const issues = [];

  if (matchesAny(lead.industry, profile.industries)) {
    fitScore += 30;
    reasons.push("Industry matches target");
  } else {
    issues.push("Industry does not match target");
  }

  if (matchesAny(lead.location, profile.locations)) {
    fitScore += 20;
    reasons.push("Location matches target");
  } else {
    issues.push("Location does not match target");
  }

  if (
    lead.revenue >= profile.minRevenue &&
    lead.revenue <= profile.maxRevenue
  ) {
    fitScore += 20;
    reasons.push("Revenue is within target range");
  } else {
    issues.push("Revenue is outside target range");
  }

  if (
    lead.employees >= profile.minEmployees &&
    lead.employees <= profile.maxEmployees
  ) {
    fitScore += 15;
    reasons.push("Employee count is within target range");
  } else {
    issues.push("Employee count is outside target range");
  }

  if (lead.contactName) {
    fitScore += 15;
    reasons.push("Decision-maker contact is available");
    confidenceScore += 10;
  } else {
    issues.push("Contact name is missing");
  }

  const websiteDomain = getDomain(lead.website);

  if (websiteDomain) {
    confidenceScore += 20;
  } else {
    issues.push("Website is missing or invalid");
  }

  const emailIsValid =
    Boolean(lead.email) && validator.isEmail(lead.email);

  if (emailIsValid) {
    confidenceScore += 20;

    const emailDomain = lead.email.split("@")[1];

    if (websiteDomain && emailDomain === websiteDomain) {
      confidenceScore += 10;
    } else if (websiteDomain) {
      issues.push("Email domain does not match website");
    }
  } else {
    issues.push(
      lead.email ? "Email is invalid" : "Email is missing"
    );
  }

  if (lead.phone) {
    confidenceScore += 10;
  } else {
    issues.push("Phone number is missing");
  }

  if (getDomain(lead.linkedin).includes("linkedin.com")) {
    confidenceScore += 10;
  } else {
    issues.push("LinkedIn profile is missing or invalid");
  }

  if (lead.industry) confidenceScore += 5;
  if (lead.location) confidenceScore += 5;
  if (lead.revenue > 0) confidenceScore += 5;
  if (lead.employees > 0) confidenceScore += 5;

  let priority = "Skip";

  if (fitScore >= 75 && confidenceScore >= 70) {
    priority = "Contact Now";
  } else if (fitScore >= 75) {
    priority = "Verify First";
  } else if (fitScore >= 50) {
    priority = "Contact Later";
  }

  return {
    ...lead,
    fitScore,
    confidenceScore,
    priority,
    reasons,
    issues,
  };
}

module.exports = {
  dedupeLeads,
  scoreLead,
};