import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { EditorContent, ReactRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import * as Avatar from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import * as CompactButton from '@/components/ui/compact-button';

const MentionList = React.forwardRef(({ items = [], command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((previous) => (previous - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((previous) => (previous + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className='min-w-[320px] max-w-[360px] max-h-[250px] overflow-y-auto rounded-2xl bg-bg-white-0 shadow-regular-md ring-1 ring-stroke-soft-200 p-1.5'>
        <div className='px-3 py-2 text-sm text-text-soft-400 text-center'>No users found</div>
      </div>
    );
  }

  return (
    <div className='min-w-[320px] max-w-[360px] max-h-[250px] overflow-y-auto rounded-2xl bg-bg-white-0 shadow-regular-md ring-1 ring-stroke-soft-200 p-1.5'>
      <div className='space-y-1'>
        {items.map((item, index) => {
          const name = item.label || item.name || item.email || item.id || 'User';
          const role =
            item.user_role || (item.roles && item.roles.length > 0 ? item.roles[0] : item.role);
          return (
            <button
              key={item.id || `${name}-${index}`}
              type='button'
              onMouseDown={(event) => {
                // Prevent editor blur so the command still works
                event.preventDefault();
              }}
              onClick={() => selectItem(index)}
              className={cn(
                'group/item relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg p-2',
                'text-paragraph-sm text-text-strong-950 outline-none',
                'transition duration-200 ease-out',
                'bg-bg-white-0 hover:bg-bg-weak-50',
                index === selectedIndex && 'bg-bg-weak-50',
              )}
            >
              <Avatar.Root size={32} color='gray'>
                {item.image ? (
                  <Avatar.Image src={item.image} alt={name} />
                ) : (
                  <span className='text-label-xs'>
                    {(name && name.charAt(0).toUpperCase()) || 'U'}
                  </span>
                )}
              </Avatar.Root>
              <div className='flex flex-1 flex-col'>
                <span className='text-paragraph-sm text-text-main-900 text-start'>{name}</span>
                {role && (
                  <span className='text-label-xs text-text-soft-400 text-start'>{role}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

MentionList.displayName = 'MentionList';

const normalizeMentionItem = (item) => {
  if (!item) return null;
  const id = item.id || item.value || item.name || item.email || item.label;
  const label = item.label || item.full_name || item.name || item.email || item.value || 'User';
  return {
    id,
    label,
    name: item.name || item.full_name || label,
    email: item.email,
    image: item.image || item.avatar || item.user_image || null,
    user_role: item.user_role || (item.roles && item.roles[0]) || null,
  };
};

const createMentionSuggestion = (onSearchMentions) => ({
  char: '@',
  items: async ({ query }) => {
    if (!onSearchMentions) return [];
    const results = await onSearchMentions(query || '');
    return (results || []).map(normalizeMentionItem).filter(Boolean);
  },
  render: () => {
    let reactRenderer;
    let popup;

    return {
      onStart: (props) => {
        reactRenderer = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: reactRenderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          maxWidth: 'none',
          theme: 'mention',
          offset: [0, 8],
        });
      },
      onUpdate: (props) => {
        reactRenderer.updateProps(props);

        if (!props.clientRect) return;

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }
        return reactRenderer?.ref?.onKeyDown(props);
      },
      onExit: () => {
        popup?.[0]?.destroy();
        reactRenderer?.destroy();
      },
    };
  },
});

const TextEditor = ({
  value = '',
  onChange,
  placeholder = 'Write a comment...',
  className,
  editorClassName,
  toolbarClassName,
  onFocus,
  onBlur,
  onKeyDown,
  enableMentions = false,
  onSearchMentions,
  inboxToolbar = false,
  showFormattingToolbar = true,
  showMentionInToolbar = true,
  /** When provided, set to the TipTap editor instance when ready (e.g. for parent to call insertContent) */
  editorInstanceRef,
}) => {
  const editorRef = useRef(null);
  const isInboxMode = inboxToolbar === true;
  const showFormatting = isInboxMode ? false : showFormattingToolbar;
  const showMentionButton = isInboxMode ? false : showMentionInToolbar;

  const suggestionConfig = useMemo(
    () => (enableMentions ? createMentionSuggestion(onSearchMentions) : null),
    [enableMentions, onSearchMentions],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'paragraph-small',
          },
        },
        ...(showFormatting ? {} : { bold: false, italic: false }),
      }),
      ...(enableMentions
        ? [
          Mention.configure({
            HTMLAttributes: {
              class: 'mention',
              'data-mention': 'true',
            },
            renderText({ options, node }) {
              return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
            },
            suggestion: suggestionConfig,
          }),
        ]
        : []),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: cn(
          'min-h-16 max-h-40 w-full overflow-y-auto rounded-none bg-transparent outline-none',
          'text-sm text-text-main-900',
          editorClassName,
        ),
      },
      handleKeyDown: (_, event) => {
        onKeyDown?.(event);
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editorInstanceRef && typeof editorInstanceRef === 'object') {
      editorInstanceRef.current = editor;
    }
  }, [editor, editorInstanceRef]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  const isEmpty = editor?.isEmpty ?? true;

  const showToolbar = showFormatting || (enableMentions && showMentionButton);

  // return (
  //   <div className={cn('space-y-2', className)}>
  //     <div className={cn('flex items-center gap-2', toolbarClassName)}>
  //       <CompactButton.Root
  //         variant={editor?.isActive('bold') ? 'primary' : 'white'}
  //         onClick={() => editor?.chain().focus().toggleBold().run()}
  //         type='button'
  //       >
  //         B
  //       </CompactButton.Root>
  //       <CompactButton.Root
  //         variant={editor?.isActive('italic') ? 'primary' : 'white'}
  //         onClick={() => editor?.chain().focus().toggleItalic().run()}
  //         type='button'
  //       >
  //         I
  //       </CompactButton.Root>
  //       <CompactButton.Root
  //         variant={editor?.isActive('underline') ? 'primary' : 'white'}
  //         onClick={() => editor?.chain().focus().toggleUnderline().run()}
  //         type='button'
  //       >
  //         U
  //       </CompactButton.Root>
  //       {enableMentions && (
  //         <CompactButton.Root
  //           variant='white'
  //           onClick={() => editor?.chain().focus().insertContent('@').run()}
  //           type='button'
  //         >
  //           @
  //         </CompactButton.Root>
  //       )}
  //     </div>
  //     <div className='relative'>
  //       {isEmpty && (
  //         <div className='pointer-events-none absolute left-0 top-0 px-px pt-0.5 text-sm text-text-soft-400'>
  //           {placeholder}
  //         </div>
  //       )}
  //       <EditorContent
  //         editor={editor}
  //         onFocus={onFocus}
  //         onBlur={onBlur}
  //         className={cn(
  //           'min-h-16 max-h-40 w-full overflow-y-auto',
  //           '[&>div]:outline-none',
  //           '[&_.paragraph-small]:m-0',
  //         )}
  //       />
  //     </div>
  //   </div>
  // );
  return (
    <div className={cn('space-y-2', className)}>
      {showToolbar && (
        <div className={cn('flex items-center gap-2', toolbarClassName)}>
          {showFormatting && (
            <>
              <CompactButton.Root
                variant={editor?.isActive('bold') ? 'primary' : 'white'}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                type='button'
              >
                B
              </CompactButton.Root>
              <CompactButton.Root
                variant={editor?.isActive('italic') ? 'primary' : 'white'}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                type='button'
              >
                I
              </CompactButton.Root>
              <CompactButton.Root
                variant={editor?.isActive('underline') ? 'primary' : 'white'}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                type='button'
              >
                U
              </CompactButton.Root>
            </>
          )}
          {enableMentions && showMentionButton && (
            <CompactButton.Root
              variant='white'
              onClick={() => editor?.chain().focus().insertContent('@').run()}
              type='button'
            >
              @
            </CompactButton.Root>
          )}
        </div>
      )}
      <div className='relative'>
        {isEmpty && (
          <div className='pointer-events-none absolute left-0 top-0 px-px pt-0.5 text-sm text-text-soft-400'>
            {placeholder}
          </div>
        )}
        <EditorContent
          editor={editor}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            'min-h-16 max-h-40 w-full overflow-y-auto',
            '[&>div]:outline-none',
            '[&_.paragraph-small]:m-0',
          )}
        />
      </div>
    </div>
  );
};

export default TextEditor;
