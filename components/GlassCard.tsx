interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'green' | 'blue' | 'gold' | 'none';
}

export default function GlassCard({
  children,
  className = '',
  onClick,
  glow = 'none',
}: GlassCardProps) {
  const glowClass = {
    green: 'glow-green',
    blue:  'glow-blue',
    gold:  'glow-gold',
    none:  '',
  }[glow];

  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl p-4 ${
        onClick ? 'cursor-pointer glass-hover active:scale-[0.98] transition-transform' : ''
      } ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}
