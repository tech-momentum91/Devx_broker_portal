// AlignUI Select v0.0.0 — JSX Version

'use client';

import * as React from 'react';
import * as ScrollAreaPrimitives from '@radix-ui/react-scroll-area';
import * as SelectPrimitives from '@radix-ui/react-select';
import { Slottable } from '@radix-ui/react-slot';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

import { cn } from '@/utils/cn';
import { tv } from '@/utils/tv';

export const selectVariants = tv({
  slots: {
    triggerRoot: [
      'group/trigger min-w-0 cursor-pointer shrink-0 bg-bg-white-0 shadow-regular-xs outline-none ring-1 ring-inset ring-stroke-soft-200',
      'text-paragraph-sm text-text-strong-950',
      'flex items-center text-left',
      'transition duration-200 ease-out',
      'hover:bg-bg-weak-50 hover:ring-transparent',
      'focus:shadow-button-important-focus focus:outline-none focus:ring-primary-base',
      'focus:text-text-strong-950 data-[placeholder]:focus:text-text-strong-950',
      'disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:shadow-none disabled:ring-transparent data-[placeholder]:disabled:text-text-disabled-300',
      'data-[placeholder]:text-text-soft-400',
    ],
    triggerArrow: [
      'ml-auto size-5 shrink-0',
      'transition duration-200 ease-out',
      'group-data-[placeholder]/trigger:text-text-soft-400',
      'text-text-soft-400',
      'group-hover/trigger:text-text-soft-400 group-data-[placeholder]/trigger:group-hover:text-text-soft-400',
      'group-focus/trigger:text-text-strong-950 group-data-[placeholder]/trigger:group-focus/trigger:text-text-strong-950',
      'group-disabled/trigger:text-text-disabled-300 group-data-[placeholder]/trigger:group-disabled/trigger:text-text-disabled-300',
      'group-data-[state=open]/trigger:rotate-180',
    ],
    triggerIcon: [
      'h-5 w-auto min-w-0 shrink-0 object-contain text-text-soft-400',
      'transition duration-200 ease-out',
      'group-data-[placeholder]/trigger:text-text-soft-400',
      'group-hover/trigger:text-text-soft-400 group-data-[placeholder]/trigger:group-hover:text-text-soft-400',
      'group-disabled/trigger:text-text-disabled-300 group-data-[placeholder]/trigger:group-disabled/trigger:text-text-disabled-300',
      'group-disabled/trigger:[&:not(.remixicon)]:opacity-[.48]',
    ],
    selectItemIcon: [
      'size-5 shrink-0 bg-[length:1.25rem] text-text-soft-400',
      '[[data-disabled]_&:not(.remixicon)]:opacity-[.48] [[data-disabled]_&]:text-text-disabled-300',
    ],
  },

  variants: {
    size: {
      medium: {},
      small: {},
      xsmall: {},
    },
    variant: {
      default: { triggerRoot: 'w-full' },
      compact: { triggerRoot: 'w-auto' },
      compactForInput: {
        triggerRoot: [
          'w-auto rounded-none shadow-none ring-0',
          'focus:bg-bg-weak-50 focus:shadow-none focus:ring-0 focus:ring-transparent',
        ],
      },
      inline: {
        triggerRoot: [
          'h-5 min-h-5 w-auto gap-0 rounded-none bg-transparent p-0 text-text-soft-400 shadow-none ring-0',
          'hover:bg-transparent hover:text-text-strong-950',
          'focus:shadow-none',
          'data-[state=open]:text-text-strong-950',
        ],
        triggerIcon: [
          'mr-1.5 text-text-soft-400',
          'group-hover/trigger:text-text-soft-400',
          'group-data-[state=open]/trigger:text-text-soft-400',
        ],
        triggerArrow: [
          'ml-0.5',
          'group-hover/trigger:text-text-strong-950',
          'group-data-[state=open]/trigger:text-text-strong-950',
        ],
        selectItemIcon: 'text-text-soft-400 group-hover/trigger:text-text-soft-400',
      },
      borderless: {
        triggerRoot: ['w-full ring-transparent shadow-none!'],
      },
    },

    hasError: {
      true: {
        triggerRoot: ['ring-error-base', 'focus:shadow-button-error-focus focus:ring-error-base'],
      },
    },
  },

  compoundVariants: [
    {
      size: 'medium',
      variant: 'default',
      class: { triggerRoot: 'h-10 min-h-10 gap-2 rounded-10 pl-3 pr-2.5' },
    },
    {
      size: 'small',
      variant: 'default',
      class: { triggerRoot: 'h-9 min-h-9 gap-2 rounded-lg pl-2.5 pr-2' },
    },
    {
      size: 'xsmall',
      variant: 'default',
      class: { triggerRoot: 'h-8 min-h-8 gap-1.5 rounded-lg pl-2 pr-1.5' },
    },

    {
      size: 'medium',
      variant: 'compact',
      class: {
        triggerRoot: 'h-10 gap-1 rounded-10 pl-3 pr-2.5',
        triggerIcon: '-ml-0.5',
        selectItemIcon: 'group-has-[&]/trigger:-ml-0.5',
      },
    },
    {
      size: 'small',
      variant: 'compact',
      class: {
        triggerRoot: 'h-9 gap-1 rounded-lg pl-3 pr-2',
        triggerIcon: '-ml-0.5',
        selectItemIcon: 'group-has-[&]/trigger:-ml-0.5',
      },
    },
    {
      size: 'xsmall',
      variant: 'compact',
      class: {
        triggerRoot: 'h-8 gap-0.5 rounded-lg pl-2.5 pr-1.5',
        triggerIcon: '-ml-0.5 size-4',
        selectItemIcon: 'size-4 bg-[length:1rem] group-has-[&]/trigger:-ml-0.5',
      },
    },

    {
      size: 'medium',
      variant: 'compactForInput',
      class: { triggerRoot: 'pl-2.5 pr-2', triggerIcon: 'mr-2', triggerArrow: 'ml-0.5' },
    },
    {
      size: 'small',
      variant: 'compactForInput',
      class: { triggerRoot: 'px-2', triggerIcon: 'mr-2', triggerArrow: 'ml-0.5' },
    },
    {
      size: 'xsmall',
      variant: 'compactForInput',
      class: {
        triggerRoot: 'pl-2 pr-1.5',
        triggerIcon: 'mr-1.5 size-4',
        triggerArrow: 'ml-0.5',
        selectItemIcon: 'size-4 bg-[length:1rem]',
      },
    },

    // Borderless variant with size-specific styles
    {
      size: 'medium',
      variant: 'borderless',
      class: { triggerRoot: 'h-10 min-h-10 gap-2 rounded-10 pl-3 pr-2.5' },
    },
    {
      size: 'small',
      variant: 'borderless',
      class: { triggerRoot: 'h-9 min-h-9 gap-2 rounded-lg pl-2.5 pr-2' },
    },
    {
      size: 'xsmall',
      variant: 'borderless',
      class: { triggerRoot: 'h-8 min-h-8 gap-1.5 rounded-lg pl-2 pr-1.5' },
    },
  ],

  defaultVariants: {
    variant: 'default',
    size: 'medium',
  },
});

const SelectContext = React.createContext({
  size: 'medium',
  variant: 'default',
  hasError: false,
  matchTriggerWidth: true,
});

const useSelectContext = () => React.useContext(SelectContext);

const SelectRoot = ({
  size = 'medium',
  variant = 'default',
  hasError,
  matchTriggerWidth = true,
  ...rest
}) => {
  return (
    <SelectContext.Provider value={{ size, variant, hasError, matchTriggerWidth }}>
      <SelectPrimitives.Root {...rest} />
    </SelectContext.Provider>
  );
};

SelectRoot.displayName = 'SelectRoot';

const SelectGroup = SelectPrimitives.Group;
const SelectValue = SelectPrimitives.Value;
const SelectSeparator = SelectPrimitives.Separator;
const SelectGroupLabel = SelectPrimitives.Label;

const SelectTrigger = React.forwardRef(
  (
    { className, children, showArrow = true, arrowColor = '', ringLess = false, ...rest },
    forwardedRef,
  ) => {
    const { size, variant, hasError } = useSelectContext();
    const { triggerRoot, triggerArrow } = selectVariants({ size, variant, hasError });

    return (
      <SelectPrimitives.Trigger
        ref={forwardedRef}
        className={cn(triggerRoot({ class: className }), ringLess && 'ring-0!')}
        {...rest}
      >
        <Slottable>{children}</Slottable>

        {showArrow && (
          <SelectPrimitives.Icon asChild>
            <RiArrowDownSLine className={triggerArrow()} style={{ color: arrowColor }} />
          </SelectPrimitives.Icon>
        )}
      </SelectPrimitives.Trigger>
    );
  },
);

SelectTrigger.displayName = 'SelectTrigger';

function TriggerIcon({ as: As = 'div', className, ...rest }) {
  const { size, variant, hasError } = useSelectContext();
  const { triggerIcon } = selectVariants({ size, variant, hasError });

  return <As className={triggerIcon({ class: className })} {...rest} />;
}

const SelectContent = React.forwardRef(
  (
    {
      className,
      position = 'popper',
      children,
      sideOffset = 8,
      collisionPadding = 8,
      style,
      ...rest
    },
    forwardedRef,
  ) => {
    const { matchTriggerWidth } = useSelectContext();

    const contentStyle = matchTriggerWidth
      ? {
        width: 'var(--radix-select-trigger-width)',
        ...style,
      }
      : style;

    return (
      <SelectPrimitives.Portal>
        <SelectPrimitives.Content
          ref={forwardedRef}
          className={cn(
            'relative z-50 cursor-pointer overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200',
            'min-w-[--radix-select-trigger-width] max-w-[max(var(--radix-select-trigger-width),320px)]',
            'max-h-[--radix-select-content-available-height]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            className,
          )}
          sideOffset={sideOffset}
          position={position}
          collisionPadding={collisionPadding}
          style={contentStyle}
          {...rest}
        >
          <ScrollAreaPrimitives.Root type='auto'>
            <SelectPrimitives.Viewport asChild>
              <ScrollAreaPrimitives.Viewport
                style={{ overflowY: undefined }}
                className='max-h-[196px] w-full scroll-py-2 overflow-auto p-2'
              >
                {children}
              </ScrollAreaPrimitives.Viewport>
            </SelectPrimitives.Viewport>

            <ScrollAreaPrimitives.Scrollbar orientation='vertical'>
              <ScrollAreaPrimitives.Thumb className='!w-1 rounded bg-bg-soft-200' />
            </ScrollAreaPrimitives.Scrollbar>
          </ScrollAreaPrimitives.Root>
        </SelectPrimitives.Content>
      </SelectPrimitives.Portal>
    );
  },
);

SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef(({ className, children, ...rest }, forwardedRef) => {
  const { size } = useSelectContext();

  return (
    <SelectPrimitives.Item
      ref={forwardedRef}
      className={cn(
        'group relative cursor-pointer select-none rounded-lg p-2 pr-9 text-paragraph-sm text-text-strong-950',
        'flex items-center gap-2 transition duration-200 ease-out',
        'data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled-300',
        'data-[highlighted]:bg-bg-weak-50 data-[highlighted]:outline-0',
        size === 'xsmall' && 'gap-1.5 pr-[34px]',
        className,
      )}
      {...rest}
    >
      <SelectPrimitives.ItemText asChild>
        <span
          className={cn(
            'flex flex-1 items-center gap-2',
            'group-disabled:text-text-disabled-300',
            size === 'xsmall' && 'gap-1.5',
          )}
        >
          {typeof children === 'string' ? (
            <span className='line-clamp-1'>{children}</span>
          ) : (
            children
          )}
        </span>
      </SelectPrimitives.ItemText>

      <SelectPrimitives.ItemIndicator asChild>
        <RiCheckLine className='absolute right-2 top-1/2 size-5 shrink-0 -translate-y-1/2 text-text-soft-400' />
      </SelectPrimitives.ItemIndicator>
    </SelectPrimitives.Item>
  );
});

SelectItem.displayName = 'SelectItem';

function SelectItemIcon({ as: As = 'div', className, ...rest }) {
  const { size, variant } = useSelectContext();
  const { selectItemIcon } = selectVariants({ size, variant });

  return <As className={selectItemIcon({ class: className })} {...rest} />;
}

export {
  SelectRoot as Root,
  SelectContent as Content,
  SelectGroup as Group,
  SelectGroupLabel as GroupLabel,
  SelectItem as Item,
  SelectItemIcon as ItemIcon,
  SelectSeparator as Separator,
  SelectTrigger as Trigger,
  TriggerIcon,
  SelectValue as Value,
};
