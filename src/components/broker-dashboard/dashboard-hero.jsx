import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiSparkling2Line } from 'react-icons/ri';

import * as Button from '@/components/ui/button';
import { cn } from '@/utils/cn';

const DashboardHero = ({
  name = 'there',
  className,
  onSubmitLead,
}) => {
  const navigate = useNavigate();

  const handleSubmit =
    onSubmitLead ??
    (() => {
      navigate('/submit-lead');
    });

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[18px] border border-white/15',
        'bg-[linear-gradient(to_right,#059669,#0d9488,#0891b2)]',
        'shadow-[0_18px_40px_-18px_rgba(2,44,38,0.45)]',
        className,
      )}
    >
      {/* Decorative blobs */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-16 -bottom-28 h-72 w-72 rounded-full bg-black/15 blur-[1px]' />
        <div className='absolute left-10 -bottom-36 h-80 w-80 rounded-full bg-black/10 blur-[1px]' />
        <div className='absolute right-10 -top-14 h-40 w-40 rotate-12 rounded-[28px] bg-white/10' />
        <div className='absolute right-28 top-10 h-16 w-16 rotate-12 rounded-2xl bg-white/10' />
        <div className='absolute right-44 top-20 h-10 w-10 rotate-12 rounded-xl bg-white/10' />
      </div>

      <div className='relative flex flex-col gap-10 p-8 sm:flex-row sm:items-start sm:justify-between'>
        <div className='max-w-2xl'>
          <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/90'>
            <RiSparkling2Line size={14} className='opacity-90' />
            <span className='subheading-2xs tracking-[0.16em]'>
              CHANNEL PARTNER DASHBOARD
            </span>
          </div>

          <h1 className='mt-5 title-h3 text-white sm:title-h2'>
            Welcome back, {name}
          </h1>
          <p className='mt-2 paragraph-medium text-white/85'>
            Track your DevX and Phi submissions in one place.
          </p>
        </div>

        <div className='sm:pt-2'>
          <Button.Root
            variant='neutral'
            mode='stroke'
            size='medium'
            onClick={handleSubmit}
            className={cn(
              'rounded-full px-5',
              'bg-white/90 text-text-main-900 ring-white/40 hover:bg-white',
              'focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_0_0_5px_rgba(255,255,255,0.25)]',
            )}
          >
            <span>Submit New Lead</span>
            <Button.Icon as={RiArrowRightLine} className='ml-1' />
          </Button.Root>
        </div>
      </div>
    </section>
  );
};

export default DashboardHero;

