export default function ProgressBar({ value = 0, max = 100, color = 'var(--accent-primary)', label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
    </div>
  );
}
