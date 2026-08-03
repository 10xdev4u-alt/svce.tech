'use client';

import { ArrowRight } from '@phosphor-icons/react';

export default function CallToAction() {
  return (
    <section className='container-page pb-4'>
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-aurora-600 via-aurora-500 to-sunrise-500 p-10 md:p-14'>
        <div className='pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl' />
        <div className='pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-2xl' />

        <div className='relative z-10 max-w-2xl'>
          <h2 className='font-display text-3xl font-bold text-white md:text-4xl'>
            Know a tech event or opportunity?
          </h2>
          <p className='mt-3 text-lg text-white/85'>
            Add it to svce.tech in 2 minutes. Anyone can contribute — no complex setup, just edit a
            JSON file and open a pull request.
          </p>
          <a
            href='https://github.com/10xdev4u-alt/svce.tech/blob/main/CONTRIBUTING.md'
            target='_blank'
            rel='noopener noreferrer'
            className='mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-aurora-800 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl'
          >
            Contribute now
            <ArrowRight size={18} weight='bold' />
          </a>
        </div>
      </div>
    </section>
  );
}
