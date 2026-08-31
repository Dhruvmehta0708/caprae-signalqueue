const priorityClasses = {
  "Contact Now":
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Verify First":
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "Contact Later":
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Skip:
    "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

function formatRevenue(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function ScoreDisplay({ value, colorClass }) {
  return (
    <div className="min-w-24">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200">
          {value}
        </span>
        <span className="text-slate-500">/100</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LeadTable({ leads, selectedLead, onSelectLead }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-14 text-center">
        <p className="font-medium text-slate-300">
          No leads match the selected filters
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Try another priority category or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4 font-medium">Company</th>
              <th className="px-5 py-4 font-medium">Revenue</th>
              <th className="px-5 py-4 font-medium">Fit</th>
              <th className="px-5 py-4 font-medium">Confidence</th>
              <th className="px-5 py-4 font-medium">Priority</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 bg-slate-950/40">
            {leads.map((lead) => {
              const isSelected =
                selectedLead?.company === lead.company;

              return (
                <tr
                  key={`${lead.company}-${lead.email}`}
                  onClick={() => onSelectLead(lead)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? "bg-cyan-500/10"
                      : "hover:bg-slate-900/80"
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">
                      {lead.company}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {lead.industry} · {lead.location}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                    {formatRevenue(lead.revenue)}
                  </td>

                  <td className="px-5 py-4">
                    <ScoreDisplay
                      value={lead.fitScore}
                      colorClass="bg-cyan-400"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <ScoreDisplay
                      value={lead.confidenceScore}
                      colorClass="bg-violet-400"
                    />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                        priorityClasses[lead.priority]
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeadTable;