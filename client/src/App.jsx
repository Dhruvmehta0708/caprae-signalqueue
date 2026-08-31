import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Search,
  ShieldAlert,
  Target,
  UploadCloud,
} from "lucide-react";

import SummaryCard from "./components/SummaryCard";
import LeadTable from "./components/LeadTable";
import { analyzeLeads } from "./services/leadAPI";

const initialCriteria = {
  industries:
    "SaaS, Software, IT Services, Cybersecurity, FinTech",
  locations: "Texas, California, New York",
  minRevenue: "1000000",
  maxRevenue: "30000000",
  minEmployees: "10",
  maxEmployees: "200",
};

const priorityOptions = [
  "All",
  "Contact Now",
  "Verify First",
  "Contact Later",
  "Skip",
];

function App() {
  const [criteria, setCriteria] = useState(initialCriteria);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activePriority, setActivePriority] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

 const filteredLeads = useMemo(() => {
  if (!result) {
    return [];
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  return result.leads.filter((lead) => {
    const matchesPriority =
      activePriority === "All" ||
      lead.priority === activePriority;

    const matchesSearch =
      !normalizedSearch ||
      lead.company.toLowerCase().includes(normalizedSearch) ||
      lead.industry.toLowerCase().includes(normalizedSearch) ||
      lead.location.toLowerCase().includes(normalizedSearch);

    return matchesPriority && matchesSearch;
  });
}, [result, activePriority, searchTerm]);

const displayedLead = useMemo(() => {
  const selectedLeadIsVisible = filteredLeads.find(
    (lead) => lead.company === selectedLead?.company
  );

  return selectedLeadIsVisible || filteredLeads[0] || null;
}, [filteredLeads, selectedLead]);
  function handleCriteriaChange(event) {
    const { name, value } = event.target;

    setCriteria((currentCriteria) => ({
      ...currentCriteria,
      [name]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files[0];

    setSelectedFile(file || null);
    setErrorMessage("");
  }

  async function handleAnalyze(event) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Please choose a CSV file first.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await analyzeLeads(
        selectedFile,
        criteria
      );

      setResult(response);
      setSelectedLead(response.leads[0] || null);
      setActivePriority("All");
      setSearchTerm("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to analyze the CSV file. Check that the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function exportVisibleLeads() {
    if (filteredLeads.length === 0) {
      return;
    }

    const columns = [
      "company",
      "website",
      "industry",
      "location",
      "revenue",
      "employees",
      "contactName",
      "email",
      "phone",
      "linkedin",
      "fitScore",
      "confidenceScore",
      "priority",
      "reasons",
      "issues",
    ];

   function escapeCsvValue(value) {
  let text = Array.isArray(value)
    ? value.join("; ")
    : String(value ?? "");

  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

    const csvRows = [
      columns.join(","),
      ...filteredLeads.map((lead) =>
        columns
          .map((column) => escapeCsvValue(lead[column]))
          .join(",")
      ),
    ];

    const csvFile = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(csvFile);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "signalqueue-prioritized-leads.csv";
    link.click();

    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <div className="min-h-screen text-slate-200">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400 p-2 text-slate-950">
              <Target size={22} strokeWidth={2.5} />
            </div>

            <div>
              <p className="font-semibold tracking-wide text-white">
                SignalQueue
              </p>
              <p className="text-xs text-slate-500">
                Explainable lead prioritization
              </p>
            </div>
          </div>

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Caprae Challenge Prototype
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            From enriched data to clear action
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Prioritize the right leads, with reasons you can
            trust.
          </h1>

          <p className="mt-4 leading-7 text-slate-400">
            Upload an exported lead list, define your ideal
            customer profile, and instantly separate high-fit
            opportunities from leads that need verification.
          </p>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[350px_1fr]">
          <form
            onSubmit={handleAnalyze}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10"
          >
            <div className="mb-5">
              <p className="font-semibold text-white">
                Define your ideal customer
              </p>

              <p className="mt-1 text-sm text-slate-500">
                These values control the transparent Fit Score.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">
                  Target industries
                </span>

                <input
                  name="industries"
                  value={criteria.industries}
                  onChange={handleCriteriaChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">
                  Target locations
                </span>

                <input
                  name="locations"
                  value={criteria.locations}
                  onChange={handleCriteriaChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    Min revenue
                  </span>

                  <input
                    type="number"
                    name="minRevenue"
                    value={criteria.minRevenue}
                    onChange={handleCriteriaChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    Max revenue
                  </span>

                  <input
                    type="number"
                    name="maxRevenue"
                    value={criteria.maxRevenue}
                    onChange={handleCriteriaChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    Min employees
                  </span>

                  <input
                    type="number"
                    name="minEmployees"
                    value={criteria.minEmployees}
                    onChange={handleCriteriaChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    Max employees
                  </span>

                  <input
                    type="number"
                    name="maxEmployees"
                    value={criteria.maxEmployees}
                    onChange={handleCriteriaChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </label>
              </div>

              <label
                htmlFor="lead-file"
                className="block cursor-pointer rounded-xl border border-dashed border-slate-600 bg-slate-950/60 p-5 text-center transition hover:border-cyan-500"
              >
                <UploadCloud
                  className="mx-auto text-cyan-400"
                  size={25}
                />

                <span className="mt-2 block text-sm font-medium text-slate-200">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a CSV file"}
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Maximum file size: 2 MB
                </span>

                <input
                  id="lead-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {errorMessage && (
                <div className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                  <AlertTriangle
                    className="mt-0.5 shrink-0"
                    size={17}
                  />
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      size={18}
                    />
                    Analyzing leads
                  </>
                ) : (
                  <>
                    <Target size={18} />
                    Analyze and prioritize
                  </>
                )}
              </button>
            </div>
          </form>

          <section className="min-w-0">
            {!result ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
                <div className="rounded-2xl bg-slate-800 p-4 text-cyan-400">
                  <Building2 size={32} />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                  Your priority queue will appear here
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Configure your target profile and upload the
                  sample CSV to see explainable Fit and Confidence
                  Scores.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Import completed
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {result.importSummary.totalRows} rows analyzed
                      · {result.importSummary.uniqueLeads} unique
                      leads ·{" "}
                      {result.importSummary.duplicatesRemoved}{" "}
                      duplicate removed
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={exportVisibleLeads}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
                  >
                    <Download size={16} />
                    Export visible leads
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    title="Contact Now"
                    value={result.prioritySummary["Contact Now"]}
                    description="High fit and confidence"
                    icon={Target}
                    iconClasses="bg-emerald-500/10 text-emerald-300"
                  />

                  <SummaryCard
                    title="Verify First"
                    value={result.prioritySummary["Verify First"]}
                    description="High fit, incomplete data"
                    icon={ShieldAlert}
                    iconClasses="bg-amber-500/10 text-amber-300"
                  />

                  <SummaryCard
                    title="Contact Later"
                    value={result.prioritySummary["Contact Later"]}
                    description="Potential future fit"
                    icon={Clock3}
                    iconClasses="bg-blue-500/10 text-blue-300"
                  />

                  <SummaryCard
                    title="Skip"
                    value={result.prioritySummary.Skip}
                    description="Outside target profile"
                    icon={Ban}
                    iconClasses="bg-rose-500/10 text-rose-300"
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {priorityOptions.map((priority) => (
                        <button
                          type="button"
                          key={priority}
                          onClick={() =>
                            setActivePriority(priority)
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                            activePriority === priority
                              ? "bg-cyan-400 text-slate-950"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
                      <Search size={16} className="text-slate-500" />

                      <input
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(event.target.value)
                        }
                        placeholder="Search leads"
                        className="w-full bg-transparent py-2.5 text-sm text-white outline-none xl:w-52"
                      />
                    </label>
                  </div>
                </div>

               <LeadTable
  leads={filteredLeads}
  selectedLead={displayedLead}
  onSelectLead={setSelectedLead}
/>

{displayedLead && (
                  <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Why this lead fits
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {selectedLead.company}
                      </h3>

                      <div className="mt-4 space-y-2">
                        {selectedLead.reasons.map((reason) => (
                          <div
                            key={reason}
                            className="flex items-start gap-2 text-sm text-slate-300"
                          >
                            <CheckCircle2
                              className="mt-0.5 shrink-0 text-emerald-400"
                              size={16}
                            />
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                        Verification notes
                      </p>

                      <div className="mt-4 space-y-2">
                        {selectedLead.issues.length > 0 ? (
                          selectedLead.issues.map((issue) => (
                            <div
                              key={issue}
                              className="flex items-start gap-2 text-sm text-slate-300"
                            >
                              <AlertTriangle
                                className="mt-0.5 shrink-0 text-amber-400"
                                size={16}
                              />
                              {issue}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">
                            No major data-quality issues detected.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;