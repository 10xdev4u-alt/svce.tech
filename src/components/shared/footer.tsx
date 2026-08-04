import Link from 'next/link';
import { Heart } from '@phosphor-icons/react/dist/ssr';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line/10 bg-surface">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-ink/60">
          Made with <Heart size={14} weight="fill" className="text-aurora-500" /> for the SVCE
          community
        </div>
        <div className="flex items-center gap-6 text-sm text-ink/60">
          <Link href="/resources" className="transition-colors hover:text-aurora-700">
            Resources
          </Link>
          <Link
            href="https://svce.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-aurora-700"
          >
            svce.ac.in
          </Link>
          <Link
            href="https://github.com/10xdev4u-alt/svce.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-aurora-700"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
