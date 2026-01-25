'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPublicPrograms } from '@/actions/program-actions';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';
import { ProfileCompletionBanner } from '@/components/layout/profile-completion-banner';

export default function ProgramList() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getPublicPrograms();
        if (res.success && res.data) {
          setPrograms(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
       <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Upcoming Events & Programs</h2>
          <p className="mt-2 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Join our special training sessions, belt tests, and competitions.
          </p>
        </div>
        
        {/* Profile Completion Banner */}
        <div className="mt-8">
          <ProfileCompletionBanner variant="inline" />
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {programs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No upcoming programs scheduled at the moment.</p>
            </div>
          ) : (
            programs.map((program) => (
              <article key={program.id} className="flex flex-col items-start justify-between border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition duration-300">
                <div className="flex items-center gap-x-4 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                     {format(new Date(program.startDate), 'MMM d, yyyy')}
                  </span>
                  <span className="relative z-10 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                    {program.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                    <Link href={`/karate/programs/${program.slug}`}>
                      <span className="absolute inset-0" />
                      {program.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {program.description}
                  </p>
                </div>
                <div className="mt-4 flex w-full flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
                   <div className="flex items-center gap-2">
                     <CalendarIcon className="h-4 w-4" />
                     {format(new Date(program.startDate), 'h:mm a')}
                   </div>
                   {program.location && (
                     <div className="flex items-center gap-2">
                       <MapPinIcon className="h-4 w-4" />
                       {program.location}
                     </div>
                   )}
                   <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100 mt-2">
                     <TicketIcon className="h-4 w-4" />
                     {program.fee > 0 ? `৳${program.fee}` : 'Free'}
                   </div>
                </div>
                
                <div className="mt-6 w-full relative z-20">
                   <Link 
                     href={`/karate/programs/${program.slug}`}
                     className="block w-full text-center rounded-md bg-gradient-to-r from-primary to-tertiary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                   >
                     View Details
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
