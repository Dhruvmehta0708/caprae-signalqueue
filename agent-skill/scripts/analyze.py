#!/usr/bin/env python3
"""Standalone SignalQueue CSV lead prioritization. Python 3.9+, stdlib only."""
import argparse
import csv
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

FIELDS = ['company','website','industry','location','revenue','employees','contactName','email','phone','linkedin']
DEFAULTS = {'industries':'SaaS, Software, IT Services, Cybersecurity, FinTech','locations':'Texas, California, New York','minRevenue':1000000,'maxRevenue':30000000,'minEmployees':10,'maxEmployees':200}


def norm(v): return str(v or '').strip().lower()
def number(v):
    try: return float(re.sub(r'[^0-9.\-]', '', str(v or ''))) or 0
    except ValueError: return 0

def domain(value):
    value = str(value or '').strip()
    if not value: return ''
    try:
        parsed = urlparse(value if '://' in value else 'https://' + value)
        host = (parsed.hostname or '').lower().removeprefix('www.')
        return host if '.' in host and ' ' not in host else ''
    except ValueError: return ''

def as_list(v):
    return [norm(x) for x in (v if isinstance(v,list) else str(v).split(',')) if norm(x)]

def matches(v, options):
    v = norm(v)
    return bool(v) and any(v in opt or opt in v for opt in options)

def normalize(row):
    return {key: (number(row.get(key)) if key in ('revenue','employees') else (norm(row.get(key)) if key == 'email' else str(row.get(key) or '').strip())) for key in FIELDS}

def dedupe(rows):
    found = {}; duplicates = 0
    for idx, row in enumerate(rows):
        lead = normalize(row)
        key = domain(lead['website'])
        if not key and (norm(lead['company']) or norm(lead['location'])):
            key = norm(lead['company']) + '|' + norm(lead['location'])
        if not key: key = '__unknown__' + str(idx)  # Don't merge unrelated blank rows
        if key in found:
            duplicates += 1
            for field, value in lead.items():
                if not found[key][field] and value: found[key][field] = value
        else: found[key] = lead
    return list(found.values()), duplicates

def score(lead, criteria):
    p = dict(DEFAULTS); p.update(criteria)
    industries, locations = as_list(p['industries']), as_list(p['locations'])
    fit = conf = 0; reasons = []; issues = []
    def fitcheck(condition, points, good, bad):
        nonlocal fit
        if condition: fit += points; reasons.append(good)
        else: issues.append(bad)
    fitcheck(matches(lead['industry'], industries),30,'Industry matches target','Industry does not match target')
    fitcheck(matches(lead['location'], locations),20,'Location matches target','Location does not match target')
    fitcheck(float(p['minRevenue']) <= lead['revenue'] <= float(p['maxRevenue']),20,'Revenue is within target range','Revenue is outside target range')
    fitcheck(float(p['minEmployees']) <= lead['employees'] <= float(p['maxEmployees']),15,'Employee count is within target range','Employee count is outside target range')
    fitcheck(bool(lead['contactName']),15,'Decision-maker contact is available','Contact name is missing')
    if lead['contactName']: conf += 10
    site = domain(lead['website'])
    if site: conf += 20
    else: issues.append('Website is missing or invalid')
    email = lead['email']
    valid_email = bool(re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email))
    if valid_email:
        conf += 20
        if site and email.rsplit('@',1)[1] == site: conf += 10
        elif site: issues.append('Email domain does not match website')
    else: issues.append('Email is invalid' if email else 'Email is missing')
    if lead['phone']: conf += 10
    else: issues.append('Phone number is missing')
    if domain(lead['linkedin']).endswith('linkedin.com'): conf += 10
    else: issues.append('LinkedIn profile is missing or invalid')
    for k in ['industry','location','revenue','employees']:
        if lead[k]: conf += 5
    priority = 'Contact Now' if fit >= 75 and conf >= 70 else 'Verify First' if fit >= 75 else 'Contact Later' if fit >= 50 else 'Skip'
    return {**lead,'fitScore':fit,'confidenceScore':conf,'priority':priority,'reasons':reasons,'issues':issues}

def analyze(rows, criteria):
    unique, duplicates = dedupe(rows)
    scored = sorted([score(x, criteria) for x in unique], key=lambda x:(-x['fitScore'],-x['confidenceScore']))
    counts = {k:sum(x['priority']==k for x in scored) for k in ['Contact Now','Verify First','Contact Later','Skip']}
    return {'success':True,'importSummary':{'totalRows':len(rows),'uniqueLeads':len(scored),'duplicatesRemoved':duplicates},'prioritySummary':counts,'leads':scored}

def safe_cell(value):
    s = str(value if value is not None else '')
    return "'" + s if s.lstrip().startswith(('=','+','-','@')) else s

def main():
    parser = argparse.ArgumentParser(description='Analyze enriched company leads against an ICP')
    parser.add_argument('--input', required=True, help='CSV file path')
    parser.add_argument('--criteria', help='JSON file with ICP criteria (optional)')
    parser.add_argument('--output', help='JSON output path (default: stdout)')
    parser.add_argument('--csv-output', help='Optional scored CSV output path')
    args = parser.parse_args()
    try:
        source = Path(args.input)
        if source.stat().st_size > 2*1024*1024: raise ValueError('CSV exceeds 2 MB limit')
        with source.open(encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames: raise ValueError('CSV has no header')
            missing = [x for x in FIELDS if x not in reader.fieldnames]
            if missing: raise ValueError('Missing CSV columns: '+', '.join(missing))
            rows = list(reader)
        if not rows: raise ValueError('CSV has no lead rows')
        criteria = json.loads(Path(args.criteria).read_text(encoding='utf-8')) if args.criteria else {}
        if not isinstance(criteria, dict): raise ValueError('Criteria must be a JSON object')
        result = analyze(rows, criteria)
        rendered = json.dumps(result, indent=2, ensure_ascii=False)
        if args.output: Path(args.output).write_text(rendered+'\n', encoding='utf-8')
        else: print(rendered)
        if args.csv_output:
            columns = FIELDS + ['fitScore','confidenceScore','priority','reasons','issues']
            with open(args.csv_output,'w',encoding='utf-8',newline='') as f:
                writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader()
                for lead in result['leads']:
                    writer.writerow({k:safe_cell('; '.join(lead[k]) if isinstance(lead[k],list) else lead[k]) for k in columns})
    except (OSError, ValueError, json.JSONDecodeError, csv.Error) as exc:
        print('SignalQueue error: '+str(exc),file=sys.stderr); sys.exit(1)
if __name__ == '__main__': main()
