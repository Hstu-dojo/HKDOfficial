'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';
import { ProfileCompletionBanner } from '@/components/layout/profile-completion-banner';
import { useCurrentLocale, useScopedI18n } from '@/locales/client';

interface ProgramListProps {
  initialPrograms: any[];
}

export default function ProgramList({ initialPrograms }: ProgramListProps) {
  const locale = useCurrentLocale();
  const t = useScopedI18n('programs') as any;
  const [programs] = useState<any[]>(initialPrograms);
  const dateLocale = locale === 'bn' ? 'bn-BD' : locale === 'ne' ? 'ne-NP' : 'en-US';
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat(dateLocale, { hour: 'numeric', minute: '2-digit' });
  const typeLabels: Record<string, string> = {
    BELT_TEST: t('beltTest'), COMPETITION: t('competition'), WORKSHOP: t('workshop'),
    SEMINAR: t('seminar'), SPECIAL_EVENT: t('specialEvent'),
  };

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground sm:text-4xl">{t('catalog.heading')}</h2>
          <p className="mt-2 text-lg leading-8 text-muted-foreground dark:text-muted-foreground">
            {t('catalog.description')}
          </p>
        </div>

        {/* Profile Completion Banner */}
        <div className="mt-8">
          <ProfileCompletionBanner variant="inline" />
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {programs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground dark:text-muted-foreground">{t('catalog.empty')}</p>
            </div>
          ) : (
            programs.map((program) => (
              <article key={program.id} className="flex flex-col items-start justify-between border border-border dark:border-border rounded-2xl p-6 bg-white dark:bg-card shadow-sm hover:shadow-lg transition duration-300">
                <div className="flex items-center gap-x-4 text-xs">
                  <span className="text-muted-foreground dark:text-muted-foreground">
                     {dateFormatter.format(new Date(program.startDate))}
                  </span>
                  <span className="relative z-10 rounded-full bg-muted dark:bg-slate-700 px-3 py-1.5 font-medium text-muted-foreground dark:text-muted-foreground">
                    {typeLabels[String(program.type).toUpperCase()] || program.type}
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-foreground dark:text-foreground group-hover:text-primary transition-colors">
                    <Link href={`/${locale}/karate/programs/${program.slug}`}>
                      <span className="absolute inset-0" />
                      {program.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">
                    {program.description}
                  </p>
                </div>
                <div className="mt-4 flex w-full flex-col gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                   <div className="flex items-center gap-2">
                     <CalendarIcon className="h-4 w-4" />
                     {timeFormatter.format(new Date(program.startDate))}
                   </div>
                   {program.location && (
                     <div className="flex items-center gap-2">
                       <MapPinIcon className="h-4 w-4" />
                       {program.location}
                     </div>
                   )}
                   <div className="flex items-center gap-2 font-medium text-foreground dark:text-foreground mt-2">
                     <TicketIcon className="h-4 w-4" />
                     {program.fee > 0 ? `৳${new Intl.NumberFormat(dateLocale).format(program.fee)}` : t('catalog.free')}
                   </div>
                </div>

                <div className="mt-6 w-full relative z-20">
                   <Link
                     href={`/${locale}/karate/programs/${program.slug}`}
                     className="block w-full text-center rounded-md bg-gradient-to-r from-primary to-tertiary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                   >
                     {t('catalog.viewDetails')}
                   </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
