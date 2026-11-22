# SignalQueue — AI Agent Skill

Standalone, offline, deterministic lead prioritization skill adapted from the [SignalQueue prototype](https://github.com/Dhruvmehta0708/caprae-signalqueue). It preserves the original fit/confidence weighting and four action queues, while improving duplicate handling for completely blank records. Python 3.9+ (Python 3.10+ recommended); no third-party packages or API keys.

## Quick start

```bash
python3 scripts/analyze.py --input examples/leads.csv --criteria examples/criteria.json --output results.json --csv-output prioritized.csv
python3 -m unittest discover -s tests -v
```

On Windows use `py -3` instead of `python3` if necessary. The command works from this directory. Provide your own permitted CSV for real analysis. No live lead enrichment or mailbox verification is included.

## Packaging / publishing

This directory can be zipped as an agent skill with `SKILL.md` at the archive root. Review the marketplace's current requirements, permissions, commercial terms, and security review before submission. No claim is made that Agensi has approved or certified this skill. No paid API usage is included.

## License

This package is provided as a proposed adaptation for the repository owner to review. Confirm the rights to distribute code and any imported data before commercial publication.
