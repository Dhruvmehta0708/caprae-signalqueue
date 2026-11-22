---
name: signalqueue-lead-prioritizer
description: Score an existing enriched company leads CSV against an ideal customer profile, merge duplicates, explain lead quality, and sort leads into Contact Now, Verify First, Contact Later, and Skip queues. Use when the user provides an authorized CSV and asks which leads to contact first.
---

# SignalQueue Lead Prioritizer

Use this skill for **existing, authorized enriched lead CSV files**, not for scraping, email verification, or outreach automation. The deterministic engine does not require an API key or network access.

## Workflow

1. Ask the user for the path to their CSV if not supplied. Never invent input leads. The required headers are `company,website,industry,location,revenue,employees,contactName,email,phone,linkedin`.
2. If no ICP was supplied, explain the default criteria (SaaS/Software/IT Services/Cybersecurity/FinTech; Texas/California/New York; revenue $1M–$30M; 10–200 employees) and ask whether to use or customize them when that affects the user's goal.
3. Run from this skill directory:

```bash
python3 scripts/analyze.py --input /path/to/leads.csv --criteria /path/to/criteria.json --output /path/to/results.json --csv-output /path/to/prioritized.csv
```

`--criteria`, `--output`, and `--csv-output` are optional. On Windows use `py -3` instead of `python3` if needed. Use `examples/criteria.json` as a template.

4. Read the resulting JSON. Report total rows, unique leads, duplicates removed, counts by queue, and highest-priority leads with fit/confidence and reasons. Explicitly distinguish **structurally valid email** from **verified deliverability**.
5. Respect contact-data privacy. Do not upload user CSV data to a third-party service or send outreach without explicit permission.

## Interpretation

- **Fit Score** (0–100): industry 30, location 20, revenue 20, employee range 15, contact name 15.
- **Confidence Score** (0–100): website 20, email structure 20, matching email domain 10, phone 10, LinkedIn 10, contact name 10, four populated firmographic fields 5 each.
- **Contact Now**: fit ≥75 and confidence ≥70.
- **Verify First**: fit ≥75 but confidence <70.
- **Contact Later**: fit 50–74.
- **Skip**: fit <50.

The output includes `reasons` and `issues`. A high fit score does not guarantee the contact is accurate or willing to be contacted. No real-time enrichment is performed.

## Safety and constraints

- CSV size limit: 2 MB; processing is local and stateless.
- This skill does not send emails, access CRMs, scrape websites, or make external API calls.
- The sample CSV is synthetic. Do not commit real personal contact data to a public repository.
- CSV export escapes formula-like cell prefixes to reduce spreadsheet injection risk.
