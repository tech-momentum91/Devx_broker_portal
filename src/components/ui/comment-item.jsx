import React from 'react';
import * as Avatar from '@/components/ui/avatar';
import AttachmentList from '@/components/ui/attachment-list';
import { cn, getInitials } from '@/lib/utils';
import { safeDisplayDateTime } from '@/utils/date-utils';
import { RiCircleFill, RiInformationFill, RiReplyLine } from 'react-icons/ri';
import { useSelector } from 'react-redux';
import { isClient } from '@/constants/users-constants';
import * as Button from '@/components/ui/button';

const CommentItem = ({ comment, onPin, onReply, onEdit, onDelete, isPreview = false }) => {
  const { userSideBarPerm } = useSelector((state) => state.auth);
  const { profileData } = useSelector((state) => state.profile);
  const roleMap = userSideBarPerm?.data?.message?.role;
  const isClientUser = isClient(roleMap);

  const {
    name,
    content,
    creation,
    is_pinned,
    user,
    attachments = [],
    commented_by,
    custom_visible_to_client,
    custom_parent_comment,
    parent_comment,
    parent_comment_missing,
    reply_count = 2,
  } = comment;

  const displayName = (user?.name || commented_by || '').trim() || 'Comment';

  // Sanitize and render HTML content with @mention styling
  const renderContent = (htmlContent) => {
    const safeHtml = htmlContent != null ? String(htmlContent) : '';
    let sanitizedContent = safeHtml
      .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replaceAll(/javascript:/gi, '');

    // Style @mentions with exact green color from Figma (#079455)

    // Rich mention markup from TipTap: wrap inner text without changing saved HTML
    const mentionSpanRegex = /(<span[^>]*data-mention=["']true["'][^>]*>)([^<]*)(<\/span>)/gi;

    sanitizedContent = sanitizedContent.replaceAll(
      mentionSpanRegex,
      (fullMatch, openTag, innerText, closeTag) => {
        const idMatch = openTag.match(/data-id=["']([^"']+)["']/i);
        const mentionEmail = (idMatch?.[1] || '').toLowerCase();
        const currentEmail = (profileData?.email || '').toLowerCase();
        const isCurrentUserMention = mentionEmail && mentionEmail === currentEmail;
        const fontWeightStyle = isCurrentUserMention
          ? 'font-weight: 600;  background-color: var(--color-primary-lighter); padding-bottom: 2px;'
          : '';

        const styledInner = `<span style="color: var(--color-primary-base); ${fontWeightStyle}">${innerText}</span>`;
        return `${openTag}${styledInner}${closeTag}`;
      },
    );

    return (
      <div
        className='paragraph-small text-text-main-900 [&>p]:mb-0 [&>p:last-child]:mb-0'
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  };

  // Compact preview card variant (used for parent comment preview)
  if (isPreview) {
    return (
      <div className='rounded-2xl bg-neutral-100 p-1.5 opacity-70 group relative'>
        <div
          className={cn(
            'bg-bg-weak-100 rounded-[10px] border border-stroke-soft-200 overflow-hidden shadow-regular-xs',
          )}
        >
          <div className='bg-bg-weak-100 px-4 py-2.5 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Avatar.Root size='20' color='gray' className='shrink-0'>
                {user?.image ? (
                  <Avatar.Image
                    src={user.image}
                    alt={displayName}
                    onError={(event) => {
                      if (event?.target) {
                        event.target.style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  getInitials(displayName) || 'U'
                )}
              </Avatar.Root>
              <span className='text-sm font-normal text-text-sub-500 leading-[20px] tracking-[-0.084px]'>
                {displayName}
              </span>
            </div>
            <span className='text-xs font-normal text-text-sub-500 leading-[16px] whitespace-nowrap'>
              {creation ? safeDisplayDateTime(creation) : ''}
            </span>
          </div>
          <div className='bg-white border-t border-l border-r -mx-px border-stroke-soft-200 rounded-[10px] p-4'>
            <div className='mb-0'>{renderContent(content || 'Original comment')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative bg-bg-weak-100 rounded-[10px] border border-stroke-soft-200 overflow-hidden',
      )}
    >
      {/* Pinned indicator */}
      {/* {is_pinned === 1 && (
        <div className='absolute -top-2 -right-2 z-20'>
          <div className='bg-primary-500 text-white rounded-full p-1'>
            <RiPushpinFill size={12} />
          </div>
        </div>
      )} */}

      {/* Header: Avatar, Name, Timestamp */}
      <div className='bg-bg-weak-100 px-4 py-2.5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {/* Avatar - 20px as per Figma, now using shared Avatar component */}
          <Avatar.Root size='20' color='gray' className='shrink-0'>
            {user?.image ? (
              <Avatar.Image
                src={user.image}
                alt={user.name || commented_by}
                onError={(event) => {
                  if (event?.target) {
                    event.target.style.display = 'none';
                  }
                }}
              />
            ) : (
              getInitials(user?.name || commented_by) || 'U'
            )}
          </Avatar.Root>
          {/* Name - 14px regular, text-sub-500 */}
          <span className='text-sm font-normal text-text-sub-500 leading-[20px] tracking-[-0.084px]'>
            {user?.name || commented_by}
          </span>
        </div>
        {/* Timestamp / Reply Button - Show timestamp by default, reply button on hover */}
        <div className='flex items-center gap-2 relative'>
          {/* Timestamp - visible by default, hidden on hover */}
          <span className='text-xs font-normal text-text-sub-500 leading-[16px] whitespace-nowrap group-hover:opacity-0 group-hover:invisible transition-opacity duration-200'>
            {safeDisplayDateTime(creation)}
          </span>
          {/* Reply Button - hidden by default, visible on hover */}
          {onReply && (
            <Button.Root
              variant='neutral'
              mode='ghost'
              size='xsmall'
              onClick={() => onReply?.(comment)}
              className='gap-1 text-xs font-medium text-text-sub-500 hover:text-text-strong-950 absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200'
            >
              <Button.Icon as={RiReplyLine} className='w-4 h-4' />
              Reply
            </Button.Root>
          )}
        </div>
      </div>

      {/* Content Area - White background with border */}

      <div
        className={`bg-white border-t border-l border-r -mx-px border-stroke-soft-200 rounded-[10px] ${parent_comment ? 'p-[10px]' : 'p-4'} space-y-3`}
      >
        {custom_parent_comment && parent_comment && (
          <CommentItem
            comment={{
              ...parent_comment,
              custom_parent_comment: null,
            }}
            isPreview
          />
        )}
        {/* Comment Content - 14px regular, text-main-900, line-height 20px */}
        <div className={`mb-0 ${parent_comment ? 'mx-2' : ''}`}>{renderContent(content)}</div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className={`mt-3 ${parent_comment ? 'mx-2' : ''}`}>
            <AttachmentList attachments={attachments} />
          </div>
        )}

        {/* Visible to client indicator */}
        {Boolean(custom_visible_to_client && !isClientUser) && (
          <div
            className={`mt-2 flex items-center gap-1.5 pl-px pt-1 pr-2 pb-0.5 ${parent_comment ? 'mx-2' : ''}`}
          >
            <RiCircleFill className='size-1.5 text-neutral-300' />
            <span className='text-xs font-medium text-text-sub-500 leading-[16px]'>
              Visible to Client
            </span>
            <RiInformationFill className='text-neutral-400' />
          </div>
        )}
      </div>

      {/* "2 Replies" Badge - Absolutely positioned at bottom right */}
      {/* {reply_count > 0 && (
        <div className='absolute right-9 bottom-3 z-10'>
          <button
            onClick={() => onReply?.(comment)}
            className='inline-flex items-center gap-0.5 bg-white border border-stroke-soft-200 rounded-full pl-0.5 pr-2 py-0.5 hover:bg-bg-weak-50 transition-colors'
          >
            <RiReplyFill className='w-4 h-4 text-text-soft-400' />
            <span className='text-xs font-medium text-text-sub-500 leading-[16px]'>
              {reply_count} {reply_count === 1 ? 'Reply' : 'Replies'}
            </span>
          </button>
        </div>
      )} */}
    </div>
  );
};

export default CommentItem;
