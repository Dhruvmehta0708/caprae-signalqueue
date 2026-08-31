function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClasses,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClasses}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;