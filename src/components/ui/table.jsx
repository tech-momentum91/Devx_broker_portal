// AlignUI Table v0.0.0 (JavaScript Version)

import * as React from 'react';

import * as Divider from '@/components/ui/divider';
import { cn } from '@/utils/cn';
import { RiArrowUpSFill, RiArrowDownSFill, RiExpandUpDownFill } from 'react-icons/ri';

// Table Context
const TableContext = React.createContext({ variant: 'default' });

// Root Table
const Table = React.forwardRef(({ className, variant = 'default', ...rest }, forwardedRef) => {
  return (
    <TableContext.Provider value={{ variant }}>
      <div className={cn('w-full overflow-x-auto', className)}>
        <table ref={forwardedRef} className='w-full' {...rest} />
      </div>
    </TableContext.Provider>
  );
});
Table.displayName = 'Table';

// Table Header
const TableHeader = React.forwardRef(({ ...rest }, forwardedRef) => {
  return <thead ref={forwardedRef} {...rest} />;
});
TableHeader.displayName = 'TableHeader';

// Table Head Cell
const TableHead = React.forwardRef(({ className, ...rest }, forwardedRef) => {
  const { variant } = React.useContext(TableContext);
  const paddingClass = variant === 'compact' ? 'px-4 py-1.5' : 'px-4 py-3';

  return (
    <th
      ref={forwardedRef}
      className={cn(
        'bg-bg-weak-50 text-left text-paragraph-sm text-text-sub-600 first:rounded-l-lg last:rounded-r-lg',
        paddingClass,
        className,
      )}
      {...rest}
    />
  );
});
TableHead.displayName = 'TableHead';

// Table Body
const TableBody = React.forwardRef(({ spacing = 8, ...rest }, forwardedRef) => {
  return (
    <>
      {/* gap between thead and tbody */}
      <tbody
        aria-hidden='true'
        className='table-row'
        style={{
          height: spacing,
        }}
      />

      <tbody ref={forwardedRef} {...rest} />
    </>
  );
});
TableBody.displayName = 'TableBody';

// Table Row
const TableRow = React.forwardRef(({ className, ...rest }, forwardedRef) => {
  return <tr ref={forwardedRef} className={cn('group/row', className)} {...rest} />;
});
TableRow.displayName = 'TableRow';

// Divider Row
function TableRowDivider({ className, dividerClassName, ...rest }) {
  return (
    <tr aria-hidden='true' className={className}>
      <td colSpan={999} className='py-1'>
        <Divider.Root variant='line-spacing' className={dividerClassName} {...rest} />
      </td>
    </tr>
  );
}
TableRowDivider.displayName = 'TableRowDivider';

// Table Cell
const TableCell = React.forwardRef(({ className, ...rest }, forwardedRef) => {
  const { variant } = React.useContext(TableContext);
  const heightClass = variant === 'compact' ? 'h-10' : 'h-16';

  return (
    <td
      ref={forwardedRef}
      className={cn(
        heightClass,
        'px-4 text-[var(--color-text-sub-500)] transition duration-200 ease-out first:rounded-l-xl last:rounded-r-xl group-hover/row:bg-bg-weak-50',
        className,
      )}
      {...rest}
    />
  );
});
TableCell.displayName = 'TableCell';

// Caption
const TableCaption = React.forwardRef(({ className, ...rest }, forwardedRef) => (
  <caption
    ref={forwardedRef}
    className={cn('mt-4 text-paragraph-sm text-text-sub-600', className)}
    {...rest}
  />
));
TableCaption.displayName = 'TableCaption';

export const getSortingIcon = (state) => {
  if (state === 'asc') return <RiArrowUpSFill className='size-5 text-text-sub-600' />;
  if (state === 'desc') return <RiArrowDownSFill className='size-5 text-text-sub-600' />;
  return <RiExpandUpDownFill className='size-5 text-text-sub-600' />;
};

export {
  Table as Root,
  TableHeader as Header,
  TableBody as Body,
  TableHead as Head,
  TableRow as Row,
  TableRowDivider as RowDivider,
  TableCell as Cell,
  TableCaption as Caption,
};

// Export variant toggle component for convenience
export { default as VariantToggle } from './table-variant-toggle';
