'use client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}

export default function Header({ title, back = false, right }: HeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 safe-top">
      <div className="mx-auto max-w-lg">
        <div className="glass border-b border-dark-border flex items-center h-14 px-4 gap-3">
          {back && (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl flex items-center justify-center glass glass-hover text-white/70 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          )}
          <h1 className="flex-1 text-base font-bold text-white tracking-tight">{title}</h1>
          {right && <div>{right}</div>}
        </div>
      </div>
    </header>
  );
}
