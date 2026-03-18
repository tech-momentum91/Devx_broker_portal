import React from 'react';
import * as Label from '@/components/ui/label';
import { cn } from '@/utils/cn';
import * as Button from '@/components/ui/button';
import { RiPencilLine } from 'react-icons/ri';

const FieldRow = ({
  icon: Icon,
  label,
  required,
  children,
  alignTop = false,
  editable = false,
}) => {
  return (
    <div className='grid grid-cols-[180px_1fr] items-start gap-1.5'>
      <div className='flex h-full w-[180px] items-center gap-2 min-h-8 pl-3'>
        {Icon && <Icon className='size-5 text-neutral-500' />}
        <Label.Root className='flex items-center gap-px label-small text-text-main-900'>
          <span>{label}</span>
          {required && <span className='text-neutral-400'>*</span>}
        </Label.Root>
      </div>
      <div
        className={cn(
          'min-h-8 flex-1 pl-1.5 pr-1 pb-1 pt-1 border-l border-stroke-soft-200 relative group/field',
          alignTop ? 'pt-1' : 'flex flex-col items-start justify-center',
        )}
      >
        {children}
        {editable && (
          <div className='absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover/field:opacity-100 group-focus-within/field:opacity-0! transition-opacity duration-200 z-10 pointer-events-none'>
            <Button.Root
              variant='neutral'
              mode='ghost'
              size='small'
              className='pointer-events-none'
            >
              <RiPencilLine className='size-4' />
            </Button.Root>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldRow;
