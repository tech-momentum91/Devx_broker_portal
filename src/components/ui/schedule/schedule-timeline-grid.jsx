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

export const ScheduleTimelineGrid = ({
  resources = [],
  events = [],
  renderResourceHeader,
  renderEvent,
  renderTimeLabel,
  renderEmptySlot,
  timeSlotWidth = SCHEDULE_DIMENSIONS.TIME_SLOT_WIDTH || 120,
  resourceColumnWidth = SCHEDULE_DIMENSIONS.RESOURCE_SIDEBAR_WIDTH || 200,
  resourceRowHeight = 96,
  headerHeight = SCHEDULE_DIMENSIONS.RESOURCE_HEADER_HEIGHT_HORIZONTAL || 48,
  gutterTimeSlotWidth = SCHEDULE_DIMENSIONS.GUTTER_TIME_SLOT_WIDTH ?? 40,
  className,
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
  const orientation = 'horizontal';
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
    slotSize: timeSlotWidth,
    gutterSize: gutterTimeSlotWidth,
    orientation,
    enableDragToCreate,
    allowPastEventCreation,
    onSlotMouseUp,
    showCurrentTime,
  });

  const totalContainerWidth =
    resourceColumnWidth + gutterTimeSlotWidth + (endHour - startHour + 1) * timeSlotWidth;
  const preview = getCreationPreview();

  return (
    <div
      ref={scrollRef}
      className={cn('h-full overflow-auto bg-white relative booking-calendar-scroll', className)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      {...rest}
    >
      <div
        className='flex flex-col relative min-w-max bg-white'
        style={{ width: totalContainerWidth }}
      >
        {/* --- Header --- */}
        <div
          className='sticky top-0 z-40 flex bg-white border-b border-stroke-soft-200'
          style={{ height: headerHeight }}
        >
          <div
            className='sticky left-0 z-50 bg-white border-r border-stroke-soft-200 shrink-0'
            style={{ width: resourceColumnWidth }}
          />
          <div className='relative flex h-full grow'>
            {/* Left gutter so first slot's time label has space */}
            <div
              className='absolute top-0 bottom-0 left-0'
              style={{ width: gutterTimeSlotWidth }}
              aria-hidden
            />
            {timeSlots.map((slot, i) => (
              <div
                key={slot.hour}
                className='absolute top-0 bottom-0'
                style={{
                  left: gutterTimeSlotWidth + i * timeSlotWidth,
                  width: timeSlotWidth,
                }}
              >
                <div className='absolute inset-0 flex items-end justify-center py-3 pointer-events-none pl-8'>
                  {renderTimeLabel ? (
                    renderTimeLabel(slot.hour)
                  ) : (
                    <Schedule.TimeLabel hour={slot.hour} orientation={orientation} />
                  )}
                </div>
              </div>
            ))}
            {currentTimePos !== null && (
              <Schedule.CurrentTimeBadge
                position={currentTimePos}
                orientation='horizontal'
                currentTime={currentTime}
                className='bottom-0'
                zIndex={5}
              />
            )}
          </div>
        </div>

        {/* --- Body --- */}
        <div className='relative flex-1'>
          {resources.map((resource) => {
            const id = resource.id;
            // Already sorted by start time
            const sortedEvents = eventsByResource[id] || [];
            return (
              <div key={id} className='flex relative' style={{ height: resourceRowHeight }}>
                {/* Sticky Resource Header */}
                <div
                  className='sticky left-0 z-20 flex shrink-0 flex-col justify-center border-r border-stroke-soft-200 bg-gray-50 px-2'
                  style={{ width: resourceColumnWidth }}
                >
                  <Schedule.ResourceHeader
                    resource={resource}
                    variant='horizontal'
                    renderContent={renderResourceHeader}
                  />
                </div>

                {/* Slots & Events Track */}
                <div className='relative border-b border-stroke-soft-200 grow'>
                  {/* Gutter slot */}
                  <Schedule.Slot
                    state='disabled'
                    past
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: gutterTimeSlotWidth,
                      height: '100%',
                    }}
                    orientation='horizontal'
                    className='border-r border-stroke-soft-200'
                  />
                  {timeSlots.map((slot, i) => {
                    const slotLeft = gutterTimeSlotWidth + i * timeSlotWidth;
                    const isPast = isSlotInPast(slot.hour);
                    const isCreating = dragState.isCreating && dragState.resourceId === id;

                    return (
                      <Schedule.Slot
                        key={`${id}-${slot.hour}`}
                        state={isCreating ? 'creating' : isPast ? 'disabled' : 'default'}
                        past={isPast}
                        style={{
                          position: 'absolute',
                          left: slotLeft,
                          width: timeSlotWidth,
                          height: '100%',
                          borderRight: '1px solid rgba(226,228,233,0.8)',
                        }}
                        onClick={() => onSlotClickWrapper(id, slot.hour)}
                        onMouseDown={(e) => handleDragStart(e, id, slot.hour, slotLeft)}
                        onMouseMove={(e) => handleDragMove(e, id, slot.hour, slotLeft)}
                        orientation='horizontal'
                      >
                        {renderEmptySlot?.(id, slot.hour)}
                      </Schedule.Slot>
                    );
                  })}

                  {/* Drag Preview */}
                  {dragState.isCreating && dragState.resourceId === id && preview && (
                    <Schedule.DragPreview
                      position={{ left: preview.offset, width: preview.size, top: 8, bottom: 8 }}
                      state='creating'
                    />
                  )}

                  {/* Events */}
                  {sortedEvents.map((event, i) => {
                    // Padding Logic
                    const prev = sortedEvents[i - 1];
                    const next = sortedEvents[i + 1];
                    const padding = SCHEDULE_DIMENSIONS.EVENT_PADDING || 8;
                    const touchingPrev =
                      areTimesAdjacent(prev?.end, event.start) && !isGridLine(event.start);
                    const touchingNext =
                      areTimesAdjacent(event.end, next?.start) && !isGridLine(event.end);
                    const marginLeft = touchingPrev ? padding / 2 : padding;
                    const marginRight = touchingNext ? padding / 2 : padding;

                    const { left, width } = calculateEventPosition(
                      event.start,
                      event.end,
                      startHour,
                      timeSlotWidth,
                      'horizontal',
                      gutterTimeSlotWidth,
                    );

                    return (
                      <Schedule.Event
                        key={event.name}
                        event={event}
                        onClick={onEventClick}
                        renderContent={renderEvent}
                        isPast={new Date(event.end) < currentTime}
                        style={{
                          left: left + marginLeft,
                          width: Math.max(width - marginLeft - marginRight, 0),
                          top: padding,
                          bottom: padding,
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
              position={currentTimePos + resourceColumnWidth}
              orientation='horizontal'
              zIndex={4}
            />
          )}
        </div>
      </div>
    </div>
  );
};
