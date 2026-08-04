import { CalendarX } from '@phosphor-icons/react/dist/ssr';

export default function EmptyEventCard({
  message = 'No events scheduled for this period',
  hint = 'Check back later for updates'
}: {
  message?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/10 bg-surface-2/60 px-8 py-16 text-center">
      <CalendarX size={44} weight="light" className="mb-4 text-aurora-400" />
      <p className="text-lg font-medium text-ink">{message}</p>
      <p className="mt-1 text-sm text-ink/50">{hint}</p>
    </div>
  );
}
