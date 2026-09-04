export function ConseilRow({
  icon: Icon,
  label,
  text,
  accentClassName = "text-emerald-600",
  labelClassName = "text-emerald-700",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
  accentClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon className={`mt-0.5 h-3.5 w-3.5 flex-none ${accentClassName}`} />
      <p className="text-sm text-slate-700">
        <span className={`font-semibold ${labelClassName}`}>{label} : </span>
        {text}
      </p>
    </div>
  );
}

export function FeedbackList({
  icon: Icon,
  iconClassName,
  label,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  label: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="flex gap-2">
      <Icon className={`mt-0.5 h-3.5 w-3.5 flex-none ${iconClassName}`} />
      <div className="text-sm text-slate-200">
        <span className={`font-semibold ${iconClassName}`}>{label}</span>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
