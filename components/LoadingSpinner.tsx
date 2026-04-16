interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = '#00FF87',
}: LoadingSpinnerProps) {
  const dim = { sm: 20, md: 32, lg: 48 }[size];
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ color }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
