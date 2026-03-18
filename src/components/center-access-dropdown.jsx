import React, { useEffect, useMemo, useState } from 'react';
import { RiArrowDownSLine, RiBuilding4Line, RiLoader4Line, RiSearchLine } from 'react-icons/ri';

import * as Button from '@/components/ui/button';
import * as Dropdown from '@/components/ui/dropdown';
import * as Input from '@/components/ui/input';
import { Root as Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/cn';

// --- Helpers ---

const getCityCode = (center) => {
  // Fallback visual helper
  if (center.city) return center.city.slice(0, 3).toUpperCase();
  if (center.center_code) return center.center_code;
  return '';
};

const normalizeCenters = (centers = []) => {
  return centers.map((c) => ({
    id: c.name, // Unique ID (e.g., CTR-01)
    label: c.center_name || 'Unnamed Center',
    zone: c.zone || 'Unassigned',
    center_code: c.center_code || '',
    city: c.city || '',
  }));
};

const CenterAccessDropdown = ({
  centers = [],
  selectedCenters = [], // Array of IDs (e.g. ['CTR-01'])
  onChange,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedZones, setCollapsedZones] = useState({});

  // Internal Draft State (using Set for performance/easier logic)
  const [draftSelected, setDraftSelected] = useState(new Set(selectedCenters));

  // 1. Process Data
  const normalizedCenters = useMemo(() => normalizeCenters(centers), [centers]);

  // 2. Filter Data
  const filteredCenters = useMemo(() => {
    if (!searchTerm.trim()) return normalizedCenters;
    const term = searchTerm.toLowerCase();
    return normalizedCenters.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        c.zone.toLowerCase().includes(term) ||
        c.center_code.toLowerCase().includes(term),
    );
  }, [normalizedCenters, searchTerm]);

  // 3. Group Data
  const groupedCenters = useMemo(() => {
    return filteredCenters.reduce((accumulator, center) => {
      if (!accumulator[center.zone]) accumulator[center.zone] = [];
      accumulator[center.zone].push(center);
      return accumulator;
    }, {});
  }, [filteredCenters]);

  // --- Sync State on Open/Prop Change ---
  useEffect(() => {
    if (isOpen) {
      setDraftSelected(new Set(selectedCenters));
    }
  }, [isOpen, selectedCenters]);

  // --- Handlers ---

  const handleCommit = (open) => {
    setIsOpen(open);
    if (!open && onChange) {
      // Convert Set back to Array for parent
      onChange([...draftSelected]);
    }
  };

  const toggleCenter = (id) => {
    const next = new Set(draftSelected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDraftSelected(next);
  };

  const toggleZone = (centersInZone) => {
    const idsInZone = centersInZone.map((c) => c.id);
    const allSelected = idsInZone.every((id) => draftSelected.has(id));

    const next = new Set(draftSelected);
    if (allSelected) {
      // Deselect all in zone
      idsInZone.forEach((id) => next.delete(id));
    } else {
      // Select all in zone
      idsInZone.forEach((id) => next.add(id));
    }
    setDraftSelected(next);
  };

  const toggleAll = () => {
    const allVisibleIds = filteredCenters.map((c) => c.id);
    const areAllSelected = allVisibleIds.every((id) => draftSelected.has(id));

    if (areAllSelected) {
      setDraftSelected(new Set([]));
    } else {
      setDraftSelected(new Set(normalizedCenters.map((c) => c.id)));
    }
  };

  // --- Derived UI Labels ---

  const getButtonLabel = () => {
    if (isLoading) return 'Loading...';
    if (selectedCenters.length === 0) return 'No centers selected';
    if (selectedCenters.length === normalizedCenters.length && normalizedCenters.length > 0)
      return 'All Centers';

    if (selectedCenters.length === 1) {
      const match = normalizedCenters.find((c) => c.id === selectedCenters[0]);
      return match ? match.label : '1 Center';
    }
    return `${selectedCenters.length} Centers`;
  };

  // --- Render Optimization: Single Center ---
  if (!isLoading && normalizedCenters.length === 1) {
    const center = normalizedCenters[0];
    return (
      <div className='flex items-center gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 shadow-regular-xs min-w-[218px] justify-between'>
        <div className='flex items-center gap-2 overflow-hidden'>
          <RiBuilding4Line className='text-text-sub-600' />
          <span className='truncate text-label-sm text-text-strong-950'>{center.label}</span>
        </div>
      </div>
    );
  }

  // --- Selection Calculations for UI ---
  const totalVisible = filteredCenters.length;
  const selectedVisibleCount = filteredCenters.filter((c) => draftSelected.has(c.id)).length;
  const isAllSelected = totalVisible > 0 && selectedVisibleCount === totalVisible;
  const isAllIndeterminate = selectedVisibleCount > 0 && !isAllSelected;

  return (
    <Dropdown.Root open={isOpen} onOpenChange={handleCommit}>
      <Dropdown.Trigger asChild>
        <Button.Root
          variant='neutral'
          mode='stroke'
          size='small'
          className='min-w-[218px] justify-between gap-2 px-3'
        >
          <div className='flex items-center gap-2 overflow-hidden'>
            <RiBuilding4Line className='text-text-sub-600' />
            <span className='truncate text-label-sm text-text-strong-950'>{getButtonLabel()}</span>
          </div>
          {isLoading ? (
            <RiLoader4Line className='size-4 animate-spin text-text-sub-600' />
          ) : (
            <RiArrowDownSLine className='size-4 text-text-strong-950' />
          )}
        </Button.Root>
      </Dropdown.Trigger>

      <Dropdown.Content align='end' sideOffset={8} className='w-[300px]'>
        <div className='flex flex-col gap-3'>
          {/* Search */}
          <Input.Root>
            <Input.Wrapper>
              <Input.Icon>
                <RiSearchLine />
              </Input.Icon>
              <Input.Input
                placeholder='Search centers...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Input.Wrapper>
          </Input.Root>

          {/* Select All Option */}
          <Dropdown.Item
            className='flex items-center gap-3 rounded-lg px-2 py-2'
            onSelect={(e) => {
              e.preventDefault();
              toggleAll();
            }}
          >
            <Checkbox
              checked={isAllSelected ? true : isAllIndeterminate ? 'indeterminate' : false}
              readOnly
            />
            <div className='flex flex-row items-center gap-2'>
              <span className='text-paragraph-sm text-text-strong-950'>All Centers</span>
              <span className='text-paragraph-xs text-text-soft-400'>
                ({normalizedCenters.length})
              </span>
            </div>
          </Dropdown.Item>

          {/* Zones List */}
          <div className='flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1'>
            {Object.entries(groupedCenters).map(([zoneName, items]) => {
              const idsInZone = items.map((c) => c.id);
              const selectedInZone = idsInZone.filter((id) => draftSelected.has(id)).length;
              const zoneChecked = selectedInZone === idsInZone.length;
              const zoneIndeterminate = selectedInZone > 0 && !zoneChecked;
              const isCollapsed = collapsedZones[zoneName];

              return (
                <div key={zoneName} className='flex flex-col gap-1'>
                  {/* Zone Header */}
                  <Dropdown.Item
                    className='flex items-center gap-2 rounded-lg px-2 py-2 text-text-soft-400 hover:bg-bg-weak-50'
                    onSelect={(e) => {
                      e.preventDefault();
                      setCollapsedZones((previous) => ({
                        ...previous,
                        [zoneName]: !previous[zoneName],
                      }));
                    }}
                  >
                    <div
                      className='flex items-center'
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleZone(items);
                      }}
                    >
                      <Checkbox
                        checked={zoneChecked ? true : zoneIndeterminate ? 'indeterminate' : false}
                        readOnly
                      />
                    </div>
                    <span className='text-[11px] font-medium uppercase tracking-[0.08em] flex-1 cursor-pointer'>
                      {zoneName}
                    </span>
                    <RiArrowDownSLine
                      className={cn(
                        'size-4 transition-transform',
                        isCollapsed ? '-rotate-90' : 'rotate-0',
                      )}
                    />
                  </Dropdown.Item>

                  {/* Center Items */}
                  {!isCollapsed &&
                    items.map((center) => {
                      const isSelected = draftSelected.has(center.id);
                      return (
                        <Dropdown.Item
                          key={center.id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-2 py-2 pl-6',
                            isSelected ? 'bg-bg-weak-100' : '',
                          )}
                          onSelect={(e) => {
                            e.preventDefault();
                            toggleCenter(center.id);
                          }}
                        >
                          <Checkbox checked={isSelected} readOnly />
                          <div className='flex flex-1 items-center justify-between gap-2'>
                            <span className='truncate text-paragraph-sm text-text-strong-950'>
                              {center.label}
                            </span>
                            <span className='text-paragraph-xs text-text-soft-400'>
                              {getCityCode(center)}
                            </span>
                          </div>
                        </Dropdown.Item>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

export default CenterAccessDropdown;
