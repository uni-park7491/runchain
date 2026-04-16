'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/home',       icon: '\u{1F3E0}', label: 'Home' },
  { href: '/challenges', icon: '\u{1F3C6}', label: 'Challenges' },
  { href: '/wallet',     icon: '\u{1F4B0}', label: 'Wallet' },
  { href: '/treasury',   icon: '\u{1F3DB}', label: 'Treasury' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg">
        <div className="glass border-t border-dark-border flex">
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all duration-200 ${
                  active
                    ? 'text-primary'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-semibold tracking-wide ${
                  active ? 'text-primary' : 'text-white/30'
                }`}>
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
