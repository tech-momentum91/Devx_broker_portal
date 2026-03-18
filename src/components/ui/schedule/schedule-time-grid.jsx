import React from 'react';
import * as Schedule from '@/components/ui/schedule';
import {
  calculateEventPosition,
  areTimesAdjacent,
  isGridLine,
} from '@/components/ui/schedule/schedule-utils';
import { SCHEDULE_DIMENSIONS } from '@/components/ui/schedule/schedule-constants';
import { cn } from '@/lib/utils';
import { useScheduleGridLogic } from '@/hooks/use-schedule-grid-logic';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

export const ScheduleTimeGrid = ({
  resources = [],
  events = [],
  renderResourceHeader,
  renderEvent,
  renderTimeLabel,
  renderEmptySlot,
  slotHeight = SCHEDULE_DIMENSIONS.HOUR_HEIGHT,
  resourceColumnWidth = SCHEDULE_DIMENSIONS.RESOURCE_COLUMN_WIDTH,
  timeLabelWidth = SCHEDULE_DIMENSIONS.TIME_LABEL_WIDTH,
  resourceHeaderHeight = SCHEDULE_DIMENSIONS.RESOURCE_HEADER_HEIGHT,
  gutterTimeSlotHeight = SCHEDULE_DIMENSIONS.GUTTER_TIME_SLOT_HEIGHT,
  className,
  classNames = {},
  ...rest
}) => {
  const {
    viewDate,
    startHour,
    endHour,
    showCurrentTime,
    enableDragToCreate,
    allowPastEventCreation,
    onSlotMouseUp,
    onEventClick,
    onSlotClick,
  } = Schedule.useScheduleContext();
  const orientation = 'vertical';
  const {
    scrollRef,
    timeSlots,
    eventsByResource,
    currentTimePos,
    isSlotInPast,
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    getCreationPreview,
    onSlotClickWrapper,
    currentTime,
  } = useScheduleGridLogic({
    resources,
    events,
    viewDate,
    startHour,
    endHour,
    slotSize: slotHeight,
    gutterSize: gutterTimeSlotHeight,
    orientation,
    enableDragToCreate,
    allowPastEventCreation,
    onSlotMouseUp,
    showCurrentTime,
  });

  // Navigation handlers for resources
  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -resourceColumnWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: resourceColumnWidth,
        behavior: 'smooth',
      });
    }
  };

  const gridHeight = (endHour - startHour + 1) * slotHeight + gutterTimeSlotHeight * 2;
  const preview = getCreationPreview();

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex h-full bg-white relative overflow-auto booking-calendar-scroll',
        className,
      )}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      {...rest}
    >
      {/* --- Time Axis (Sticky Left) --- */}
      <div
        className={cn('shrink-0 bg-white sticky left-0 z-30', classNames.timeLabelColumn)}
        style={{ width: timeLabelWidth, height: gridHeight + resourceHeaderHeight }}
      >
        {/* Corner cell with navigation buttons */}
        <div
          className='border-b border-r border-stroke-soft-200 bg-white sticky top-0 z-40 flex items-center justify-center gap-0'
          style={{ height: resourceHeaderHeight }}
        >
          <button
            onClick={handleScrollLeft}
            className='flex items-center justify-center flex-1 h-full hover:bg-gray-50 transition-colors'
            aria-label='Scroll left'
          >
            <RiArrowLeftSLine className='w-5 h-5 text-text-sub-500' />
          </button>
          <button
            onClick={handleScrollRight}
            className='flex items-center justify-center flex-1 h-full hover:bg-gray-50 transition-colors border-l border-stroke-soft-200'
            aria-label='Scroll right'
          >
            <RiArrowRightSLine className='w-5 h-5 text-text-sub-500' />
          </button>
        </div>
        <div className='relative bg-white' style={{ height: gridHeight }}>
          {/* Top Gutter Line */}
          <div
            className='absolute top-0 w-full border-r border-stroke-soft-200'
            style={{ height: gutterTimeSlotHeight }}
          />

          {timeSlots.map((slot, i) => (
            <div
              key={slot.hour}
              className='absolute w-full border-r border-stroke-soft-200'
              style={{ top: i * slotHeight + gutterTimeSlotHeight, height: slotHeight }}
            >
              <div className='absolute inset-0 flex items-start justify-center px-3 pt-8 pointer-events-none'>
                {renderTimeLabel ? (
                  renderTimeLabel(slot.hour)
                ) : (
                  <Schedule.TimeLabel hour={slot.hour} orientation={orientation} />
                )}
              </div>
            </div>
          ))}

          {/* Bottom Gutter Line */}
          <div
            className='absolute bottom-0 w-full border-r border-stroke-soft-200'
            style={{ height: gutterTimeSlotHeight }}
          />

          {currentTimePos !== null && (
            <Schedule.CurrentTimeBadge
              position={currentTimePos}
              orientation='vertical'
              currentTime={currentTime}
              className='right-0'
              zIndex={5}
            />
          )}
        </div>
      </div>

      {/* --- Resource Grid --- */}
      <div
        className={cn('flex relative', classNames.gridContainer)}
        style={{
          minWidth: resources.length * resourceColumnWidth,
          height: gridHeight + resourceHeaderHeight,
        }}
      >
        {resources.map((resource) => {
          const sortedEvents = (eventsByResource[resource.id] || []).sort(
            (a, b) => new Date(a.start) - new Date(b.start),
          );

          return (
            <div
              key={resource.id}
              className={cn('shrink-0', classNames.resourceColumn)}
              style={{ width: resourceColumnWidth, minHeight: gridHeight + resourceHeaderHeight }}
            >
              {/* Sticky Header */}
              <div
                className='border-b border-stroke-soft-200 bg-gray-50 sticky top-0 z-20 p-1'
                style={{ height: resourceHeaderHeight }}
              >
                <Schedule.ResourceHeader
                  renderContent={renderResourceHeader}
                  resource={resource}
                  variant='vertical'
                  sticky
                />
              </div>

              {/* Lane */}
              <div
                className='relative bg-white border-r border-stroke-soft-200'
                style={{ height: gridHeight }}
              >
                {/* Top Gutter Slot */}
                <Schedule.Slot
                  state='disabled'
                  past
                  style={{ top: 0, height: gutterTimeSlotHeight, width: '100%' }}
                  orientation='vertical'
                  className='border-t-0'
                />

                {/* Interactive Slots */}
                {timeSlots.map((slot, i) => {
                  const slotTop = i * slotHeight + gutterTimeSlotHeight;
                  const isPast = isSlotInPast(slot.hour);
                  const isCreating = dragState.isCreating && dragState.resourceId === resource.id;

                  return (
                    <Schedule.Slot
                      key={`${resource.id}-${slot.hour}`}
                      state={isCreating ? 'creating' : isPast ? 'disabled' : 'default'}
                      past={isPast}
                      style={{
                        top: slotTop,
                        height: slotHeight,
                        width: '100%',
                        position: 'absolute',
                      }}
                      onClick={() => onSlotClickWrapper(resource.id, slot.hour)}
                      onMouseDown={(e) => handleDragStart(e, resource.id, slot.hour, slotTop)}
                      onMouseMove={(e) => handleDragMove(e, resource.id, slot.hour, slotTop)}
                      orientation='vertical'
                    >
                      {renderEmptySlot?.(resource.id, slot.hour)}
                    </Schedule.Slot>
                  );
                })}

                {/* Bottom Gutter Slot */}
                <Schedule.Slot
                  state='disabled'
                  past
                  style={{ bottom: 0, height: gutterTimeSlotHeight, width: '100%' }}
                  orientation='vertical'
                />

                {/* Drag Preview */}
                {dragState.isCreating && dragState.resourceId === resource.id && preview && (
                  <Schedule.DragPreview
                    position={{ top: preview.offset, height: preview.size, left: 8, right: 8 }}
                    state='creating'
                  />
                )}

                {/* Events */}
                {sortedEvents.map((event, i) => {
                  const prev = sortedEvents[i - 1];
                  const next = sortedEvents[i + 1];
                  const padding = SCHEDULE_DIMENSIONS.EVENT_PADDING || 8;
                  const touchingPrev =
                    areTimesAdjacent(prev?.end, event.start) && !isGridLine(event.start);
                  const touchingNext =
                    areTimesAdjacent(event.end, next?.start) && !isGridLine(event.end);
                  const marginTop = touchingPrev ? padding / 2 : padding;
                  const marginBottom = touchingNext ? padding / 2 : padding;

                  const { top, height } = calculateEventPosition(
                    event.start,
                    event.end,
                    startHour,
                    slotHeight,
                    'vertical',
                    gutterTimeSlotHeight,
                  );

                  return (
                    <Schedule.Event
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      renderContent={renderEvent}
                      isPast={new Date(event.end) < currentTime}
                      style={{
                        top: top + marginTop,
                        height: Math.max(height - marginTop - marginBottom, 0),
                        left: padding,
                        right: padding,
                        zIndex: 3,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {currentTimePos !== null && (
          <Schedule.CurrentTimeLine
            position={currentTimePos + resourceHeaderHeight}
            orientation='vertical'
            zIndex={4}
          />
        )}
      </div>
    </div>
  );
};
