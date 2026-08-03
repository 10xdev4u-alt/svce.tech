import Link from 'next/link';
import { House } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className='container-page flex flex-col items-center justify-center py-32 text-center'>
      <p className='font-display bg-gradient-to-r from-sunrise-500 to-aurora-600 bg-clip-text text-8xl font-bold text-transparent'>
        404
      </p>
      <h1 className='font-display mt-4 text-2xl font-bold text-ink'>Page not found</h1>
      <p className='mt-2 max-w-sm text-ink/60'>
        The page you&apos;re looking for doesn&apos;t exist — maybe it was moved, or never was.
      </p>
      <Link
        href='/'
        className='mt-8 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg'
      >
        <House size={16} />
        Back to home
      </Link>
    </div>
  );
}
