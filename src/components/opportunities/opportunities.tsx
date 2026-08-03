import { Briefcase } from '@phosphor-icons/react/dist/ssr';
import opportunities from '@/data/opportunities.json';

type Opportunity = {
  title: string;
  type: 'internship' | 'hackathon' | 'job' | 'research' | 'scholarship';
  organization: string;
  description: string;
  link: string;
  deadline?: string;
  postedDate: string;
};

const typeStyles: Record<Opportunity['type'], string> = {
  internship: 'bg-aurora-100 text-aurora-800',
  hackathon: 'bg-sunrise-100 text-sunrise-800',
  job: 'bg-blue-50 text-blue-800',
  research: 'bg-purple-50 text-purple-800',
  scholarship: 'bg-pink-50 text-pink-800'
};

export default function Opportunities() {
  const list = opportunities as Opportunity[];

  return (
    <div className='container-page py-16'>
      <header className='mb-10 max-w-2xl'>
        <h1 className='font-display text-4xl font-bold tracking-tight text-ink md:text-5xl'>
          Opportunities
        </h1>
        <p className='mt-3 text-lg text-ink/60'>
          Internships, hackathons, jobs and research openings shared by the community. Newest
          first.
        </p>
      </header>

      {list.length > 0 ? (
        <div className='flex flex-col gap-4'>
          {list.map((opp, i) => (
            <a
              key={`${opp.title}-${i}`}
              href={opp.link}
              target='_blank'
              rel='noopener noreferrer'
              className='group flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-aurora-400/40 hover:shadow-card-hover md:flex-row md:items-center'
            >
              <div className='flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className={`chip ${typeStyles[opp.type]}`}>{opp.type}</span>
                  {opp.deadline && (
                    <span className='chip bg-red-50 text-red-700'>due {opp.deadline}</span>
                  )}
                </div>
                <h2 className='font-display mt-3 text-xl font-semibold text-ink transition-colors group-hover:text-aurora-700'>
                  {opp.title}
                </h2>
                <p className='mt-1 text-sm font-medium text-ink/50'>{opp.organization}</p>
                <p className='mt-2 line-clamp-2 text-sm text-ink/60'>{opp.description}</p>
              </div>
              <span className='text-sm text-ink/40'>posted {opp.postedDate}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/10 bg-white/60 px-8 py-20 text-center'>
          <Briefcase size={48} weight='light' className='mb-4 text-aurora-400' />
          <p className='text-lg font-medium text-ink'>No opportunities listed yet</p>
          <p className='mt-1 max-w-sm text-sm text-ink/50'>
            Found an internship, hackathon or opening worth sharing? Add it in 2 minutes via a pull
            request.
          </p>
        </div>
      )}
    </div>
  );
}
