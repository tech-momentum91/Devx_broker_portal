import React, { useEffect, useMemo, useState, useRef } from 'react';
import { RiSendPlaneLine, RiCloseLine, RiAttachment2 } from 'react-icons/ri';
import * as CompactButton from '@/components/ui/compact-button';
import TextEditor from '@/components/ui/text-editor';
import * as Switch from '@/components/ui/switch';
import * as Label from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/utils/file-utils';
import { showErrorToast } from '@/utils/error-utils';
import { useSelector } from 'react-redux';
import { isClient } from '@/constants/users-constants';
import * as Tooltip from '@/components/ui/tooltip';
import CommentItem from '@/components/ui/comment-item';

const CommentInput = ({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Add a comment...',
  className,
  replyTo = null,
  onCancelReply = () => {},
  showVisibleToClient = true, // Allow disabling visibility toggle for non-ticket contexts
  enableMentions = false,
  onSearchMentions,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isVisibleToClient, setIsVisibleToClient] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);
  const { userSideBarPerm } = useSelector((state) => state.auth);
  const roleMap = userSideBarPerm?.data?.message?.role;
  const isClientUser = isClient(roleMap);

  // When replying, lock visibility to parent's value to avoid leaking hidden comments
  useEffect(() => {
    if (replyTo && replyTo.custom_visible_to_client !== undefined) {
      setIsVisibleToClient(Boolean(replyTo.custom_visible_to_client));
    }
  }, [replyTo]);

  const replyPreview = useMemo(() => {
    if (!replyTo) return '';
    const source =
      replyTo.content ||
      replyTo.parent_comment_details?.content_preview ||
      replyTo.content_preview ||
      '';
    return source.replaceAll(/<[^>]+>/g, '').trim();
  }, [replyTo]);

  // Strip HTML/entities to get meaningful text (avoid posting empty rich-text like <p></p>)
  const contentText = content
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(/&\w+;|&#\d+;/g, ' ')
    .trim();
  const hasText = contentText.length > 0;
  const hasContent = hasText || attachments.length > 0;

  const handleSubmit = async () => {
    if (!hasContent) return;

    try {
      await onSubmit(
        content,
        attachments,
        isClientUser ? true : isVisibleToClient,
        replyTo?.name || replyTo?.id || null,
      );
      // Reset form after successful submission
      setContent('');
      setAttachments([]);
      setIsVisibleToClient(false);
      setIsFocused(false);
      onCancelReply?.();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      showErrorToast(error, {
        defaultMessage: 'Failed to submit comment. Please try again.',
        position: 'bottom-right',
      });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (event) => {
    const files = [...event.target.files];
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).slice(2, 11),
    }));

    setAttachments((previous) => [...previous, ...newAttachments]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((previous) => previous.filter((att) => att.id !== attachmentId));
  };

  return (
    <div className={cn('', className)}>
      <div
        className={cn(
          'bg-white rounded-lg shadow-regular-xs outline-none ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out',
          isFocused && 'shadow-button-important-focus ring-primary-base',
        )}
      >
        {replyTo && (
          <div className='group relative flex items-start justify-between gap-2 px-3 pt-3 pb-0'>
            <div className='flex-1 space-y-2'>
              <CommentItem
                comment={{
                  ...replyTo,
                  content: replyPreview || replyTo?.content || 'Original comment',
                  custom_parent_comment: null,
                }}
                isPreview
              />
            </div>
            <CompactButton.Root
              variant='ghost'
              size='small'
              onClick={onCancelReply}
              className='absolute right-2 top-2 text-text-soft-400 hover:text-text-strong-950 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out'
              aria-label='Cancel reply'
            >
              <CompactButton.Icon as={RiCloseLine} />
            </CompactButton.Root>
          </div>
        )}
        {/* Main Input Area */}
        <div className='p-3 pb-1'>
          <TextEditor
            value={content}
            onChange={setContent}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            enableMentions={enableMentions}
            onSearchMentions={onSearchMentions}
          />

          {/* Attachments Preview - Figma chip style */}
          {attachments.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2 py-1'
                >
                  <RiAttachment2
                    size={16}
                    className='text-text-soft-400 shrink-0'
                    aria-hidden='true'
                  />
                  <div className='flex justify-center items-center gap-1 min-w-0'>
                    <span className='text-sm font-medium text-text-main-900 truncate max-w-[150px]'>
                      {attachment.name}
                    </span>
                    <span className='text-xs text-text-sub-500'>
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                  <CompactButton.Root
                    variant='ghost'
                    size='small'
                    onClick={() => removeAttachment(attachment.id)}
                    className='text-text-soft-400 hover:text-text-strong-950 cursor-pointer'
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <CompactButton.Icon as={RiCloseLine} />
                  </CompactButton.Root>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Controls */}
        <div className='p-3 pt-0 flex items-center justify-between'>
          {/* Visibility Toggle */}
          {showVisibleToClient && !isClientUser ? (
            <Tooltip.Provider>
              <Tooltip.Root delayDuration={200}>
                <Tooltip.Trigger asChild>
                  <div className='flex items-center gap-2 self-end'>
                    <Switch.Root
                      checked={isVisibleToClient}
                      onCheckedChange={setIsVisibleToClient}
                      id='visible_to_client'
                      size='small'
                      disabled={Boolean(replyTo)}
                    />
                    <Label.Root className='text-text-soft-400 text-sm' htmlFor='visible_to_client'>
                      Visible to Client
                    </Label.Root>
                  </div>
                </Tooltip.Trigger>
                {replyTo && (
                  <Tooltip.Content side='top' size='small' variant='dark'>
                    Replies keep the same visibility as the comment you are replying to.
                  </Tooltip.Content>
                )}
              </Tooltip.Root>
            </Tooltip.Provider>
          ) : (
            <div />
          )}
          <div className='flex items-center justify-end'>
            {/* Right Controls */}
            <div className='flex items-center gap-1'>
              {/* File Attachment */}
              <input
                ref={fileInputRef}
                type='file'
                multiple
                onChange={handleFileSelect}
                className='hidden'
                accept='*/*'
              />
              <CompactButton.Root
                variant='ghost'
                size='large'
                onClick={() => fileInputRef.current?.click()}
                className='text-text-soft-400 hover:text-text-strong-950 p-1 cursor-pointer'
              >
                <CompactButton.Icon as={RiAttachment2} />
              </CompactButton.Root>
              {/* Submit Button */}
              <CompactButton.Root
                size='large'
                onClick={handleSubmit}
                disabled={!hasContent || isSubmitting}
                className='bg-primary-base text-white p-1 cursor-pointer'
              >
                <CompactButton.Icon as={RiSendPlaneLine} />
              </CompactButton.Root>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
