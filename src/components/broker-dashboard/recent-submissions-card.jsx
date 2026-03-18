import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowRightUpLine } from 'react-icons/ri';

import * as Avatar from '@/components/ui/avatar';
import * as Button from '@/components/ui/button';
import * as Table from '@/components/ui/table';
import LeadStatusBadge from '@/components/dashboard/lead-status-badge';
import { cn } from '@/utils/cn';

const ServiceTypePill = ({ value }) => {
  const label = String(value ?? '').trim() || '—';
  return (
    <span className='inline-flex rounded-full bg-success-lighter px-3 py-1 text-label-xs font-medium text-success-darker'>
      {label}
    </span>
  );
};

const RecentSubmissionsCard = ({
  items = [],
  isLoading = false,
  error = null,
  className,
  limit = 7,
}) => {
  const navigate = useNavigate();

  const handleViewAll = useCallback(() => {
    navigate('/submissions');
  }, [navigate]);

  const handleRowView = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/submissions/${id}`);
    },
    [navigate],
  );

  const rows = Array.isArray(items) ? items.slice(0, limit) : [];

  return (
    <section
      className={cn(
        'rounded-2xl border border-stroke-soft-200 bg-bg-white-0 shadow-[var(--shadow-custom-sm)]',
        className,
      )}
    >
      <div className='flex items-start justify-between gap-4 px-6 pt-6'>
        <div>
          <h2 className='text-label-lg font-semibold text-text-main-900'>
            Recent Submissions
          </h2>
          <p className='mt-1 text-paragraph-sm text-text-sub-500'>
            Latest leads across all services
          </p>
        </div>

        <button
          type='button'
          onClick={handleViewAll}
          className='inline-flex items-center gap-2 text-label-sm text-success-darker hover:underline'
        >
          <span>View all</span>
          <RiArrowRightUpLine className='size-4' />
        </button>
      </div>

      <div className='px-4 pb-4 pt-4'>
        <Table.Root>
          <Table.Header>
            <tr>
              <Table.Head className='uppercase tracking-[0.14em] text-[11px]'>
                Client Name
              </Table.Head>
              <Table.Head className='uppercase tracking-[0.14em] text-[11px]'>
                Service Type
              </Table.Head>
              <Table.Head className='uppercase tracking-[0.14em] text-[11px]'>City</Table.Head>
              <Table.Head className='uppercase tracking-[0.14em] text-[11px]'>
                Status
              </Table.Head>
              <Table.Head className='uppercase tracking-[0.14em] text-[11px]'>
                Last Updated
              </Table.Head>
              <Table.Head className='uppercase tracking-[0.14em] text-[11px] text-right'>
                &nbsp;
              </Table.Head>
            </tr>
          </Table.Header>

          <Table.Body spacing={0}>
            {isLoading && (
              <Table.Row>
                <Table.Cell colSpan={6} className='py-10 text-center text-text-sub-500'>
                  Loading recent submissions…
                </Table.Cell>
              </Table.Row>
            )}

            {!isLoading && error && (
              <Table.Row>
                <Table.Cell colSpan={6} className='py-10 text-center text-error-base'>
                  {error}
                </Table.Cell>
              </Table.Row>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6} className='py-10 text-center text-text-sub-500'>
                  No recent submissions yet.
                </Table.Cell>
              </Table.Row>
            )}

            {!isLoading &&
              !error &&
              rows.map((row) => {
                const name = row.companyName ?? '—';
                const initial =
                  String(name).trim() && String(name).trim() !== '—'
                    ? String(name).trim().charAt(0).toUpperCase()
                    : '?';

                return (
                  <React.Fragment key={row.id}>
                    <Table.Row className='hover:bg-bg-weak-50'>
                      <Table.Cell className='py-4'>
                        <div className='flex items-center gap-3'>
                          <Avatar.Root size={32} color='gray' className='bg-bg-soft-200'>
                            <span className='text-label-sm font-semibold text-text-main-900'>
                              {initial}
                            </span>
                          </Avatar.Root>
                          <div className='min-w-0'>
                            <p className='truncate text-label-sm font-semibold text-text-main-900'>
                              {name}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell className='py-4'>
                        <ServiceTypePill value={row.serviceType} />
                      </Table.Cell>

                      <Table.Cell className='py-4 text-text-sub-500'>{row.city ?? '—'}</Table.Cell>

                      <Table.Cell className='py-4'>
                        <LeadStatusBadge status={row.status} className='rounded-full px-3' />
                      </Table.Cell>

                      <Table.Cell className='py-4 text-text-sub-500'>
                        {row.lastUpdated ?? row.date ?? '—'}
                      </Table.Cell>

                      <Table.Cell className='py-4'>
                        <div className='flex justify-end'>
                          <Button.Root
                            variant='neutral'
                            mode='ghost'
                            size='small'
                            onClick={() => handleRowView(row.id)}
                            className='inline-flex items-center gap-2 text-success-darker hover:bg-bg-weak-50'
                          >
                            <span>View</span>
                            <Button.Icon as={RiArrowRightUpLine} className='size-4' />
                          </Button.Root>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  </React.Fragment>
                );
              })}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
};

export default RecentSubmissionsCard;

