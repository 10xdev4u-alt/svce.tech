import Link from 'next/link';
import Image from 'next/image';
import PushSubscribe from '../PushSubscribe';
import SearchPalette from '../search/search-palette';

const navLinks = [
  { href: '/', label: 'Events' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/resources', label: 'Resources' }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#fbfbf7]/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label="SVCE Tech Hub home">
          <div className="transition-transform duration-300 group-hover:scale-105">
            <Image src="/logo.svg" alt="SVCE Tech Hub logo" width={36} height={36} priority />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            svce<span className="text-aurora-600">.tech</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-aurora-100 hover:text-aurora-800"
            >
              {link.label}
            </Link>
          ))}
          <SearchPalette />
          {/* Single PushSubscribe instance — never render it twice */}
          <PushSubscribe />
          <a
            href="https://github.com/10xdev4u-alt/svce.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          >
            Contribute
          </a>
        </div>
      </nav>
    </header>
  );
}
