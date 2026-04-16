interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, unit, icon, highlight }: StatCardProps) {
  return (
    <div className={`glass rounded-2xl p-4 flex flex-col gap-1 ${
      highlight ? 'border-primary/30 glow-green' : ''
    }`}>
      {icon && <span className="text-xl mb-1">{icon}</span>}
      <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-bold ${
          highlight ? 'text-primary' : 'text-white'
        }`}>
          {value}
        </span>
        {unit && <span className="text-white/40 text-sm">{unit}</span>}
      </div>
    </div>
  );
}
