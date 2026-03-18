import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  RiDownloadLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiImage2Line,
  RiDeleteBinLine,
  RiUploadCloud2Line,
} from 'react-icons/ri';
import * as CompactButton from '@/components/ui/compact-button';
import * as FileFormatIcon from '@/components/ui/file-format-icon';
import * as Button from '@/components/ui/button';
import * as Tooltip from '@/components/ui/tooltip';
import { formatFileSize } from '@/utils/file-utils';
import { safeDisplayDateTime } from '@/utils/date-utils';
import { getFileExtension, isImageFile, getPreviewUrl } from '@/utils/task-utils';

const IMAGE_EXTENSIONS = new Set(['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'BMP']);

const AttachmentList = ({
  attachments = [],
  onDownload,
  onRemove,
  emptyStateMessage = 'Choose a file or drag & drop.',
  emptyStateDescription = 'All file types, up to 10 MB per file.',
  disabled = false,
  emptyStateAction,
}) => {
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [imagePreviewErrors, setImagePreviewErrors] = useState({});
  const attachmentsListRef = useRef(null);
  const scrollSyncTimeoutRef = useRef(null);

  useEffect(() => {
    if (attachments.length === 0) {
      setCurrentAttachmentIndex(0);
      return;
    }

    setCurrentAttachmentIndex((previous) => {
      if (previous >= attachments.length) return attachments.length - 1;
      return previous;
    });
  }, [attachments.length]);

  const scrollToAttachment = useCallback((index) => {
    if (!attachmentsListRef.current) return;
    const target = attachmentsListRef.current.children?.[index];
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, []);

  const handleScrollSyncCurrentIndex = useCallback(() => {
    if (!attachmentsListRef.current) return;

    const container = attachmentsListRef.current;
    const containerRect = container.getBoundingClientRect();
    const children = [...container.children];

    let bestIndex = 0;
    let bestVisibleWidth = 0;

    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect();

      const visibleLeft = Math.max(rect.left, containerRect.left);
      const visibleRight = Math.min(rect.right, containerRect.right);
      const visibleWidth = visibleRight - visibleLeft;

      if (
        visibleWidth > 0 &&
        (visibleWidth > bestVisibleWidth ||
          (visibleWidth === bestVisibleWidth && index > bestIndex))
      ) {
        bestVisibleWidth = visibleWidth;
        bestIndex = index;
      }
    });

    setCurrentAttachmentIndex((previous) => (previous !== bestIndex ? bestIndex : previous));
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollSyncTimeoutRef.current) {
      clearTimeout(scrollSyncTimeoutRef.current);
    }

    scrollSyncTimeoutRef.current = setTimeout(() => {
      handleScrollSyncCurrentIndex();
    }, 100);
  }, [handleScrollSyncCurrentIndex]);

  useEffect(() => {
    return () => {
      if (scrollSyncTimeoutRef.current) {
        clearTimeout(scrollSyncTimeoutRef.current);
      }
    };
  }, []);

  const handleAttachmentNav = useCallback(
    (direction) => {
      if (attachments.length === 0) return;

      setCurrentAttachmentIndex((previous) => {
        const nextIndex = Math.min(Math.max(previous + direction, 0), attachments.length - 1);
        requestAnimationFrame(() => scrollToAttachment(nextIndex));
        return nextIndex;
      });
    },
    [attachments.length, scrollToAttachment],
  );

  const handleAttachmentDownload = useCallback(
    (attachment) => {
      if (onDownload) {
        onDownload(attachment);
        return;
      }

      // Default download behavior
      if (attachment.fileUrl) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        link.download = attachment.fileName || attachment.name || 'attachment';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (attachment.file && attachment.file instanceof File) {
        // For local files, create a blob URL
        const url = URL.createObjectURL(attachment.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name || attachment.fileName || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    },
    [onDownload],
  );

  const handleImageError = useCallback((attachmentId) => {
    setImagePreviewErrors((prev) => ({ ...prev, [attachmentId]: true }));
  }, []);

  const normalizeAttachment = useCallback((attachment, index) => {
    // Handle local File objects (from file input)
    if (attachment.file && attachment.file instanceof File) {
      const fileName = attachment.name || attachment.fileName || attachment.file.name || 'Untitled';
      const extension = getFileExtension(fileName);
      const previewUrl = getPreviewUrl(attachment);
      return {
        id: attachment.id || `${fileName}-${index}`,
        fileName,
        fileUrl: previewUrl,
        size: attachment.size ?? attachment.file.size ?? 0,
        createdAt: attachment.uploadedAt || attachment.createdAt,
        extension: extension ? extension.toUpperCase() : 'FILE',
        isImage: isImageFile(attachment),
        file: attachment.file, // Keep reference for download
        childRowId: attachment.childRowId, // Preserve childRowId for delete functionality
      };
    }

    // Handle server attachments (with URLs)
    const fileName =
      attachment.fileName ||
      attachment.file_name ||
      attachment.filename ||
      attachment.name ||
      attachment.file ||
      'Untitled';

    const extension = getFileExtension(fileName).toUpperCase();
    const fileUrl = attachment.fileUrl || attachment.file_url || attachment.url || attachment.file;

    return {
      id: attachment.id || attachment.name || `${fileName}-${index}`,
      fileName,
      fileUrl,
      size: attachment.size ?? attachment.file_size ?? attachment.file_size_bytes ?? 0,
      createdAt: attachment.createdAt || attachment.created_at || attachment.creation,
      extension,
      isImage: IMAGE_EXTENSIONS.has(extension) || attachment.isImage === true,
      childRowId: attachment.childRowId, // Preserve childRowId for delete functionality
    };
  }, []);

  const normalizedAttachments = attachments.map(normalizeAttachment);

  return (
    <div className='flex flex-col gap-2 pb-6'>
      {normalizedAttachments.length > 0 && (
        <div className='flex flex-col gap-3'>
          <div
            ref={attachmentsListRef}
            className='flex gap-4 overflow-x-auto pb-1 pr-2 snap-x snap-mandatory'
            onScroll={handleScroll}
          >
            {normalizedAttachments.map((attachment, index) => {
              const hasSize =
                attachment.size !== null &&
                attachment.size !== undefined &&
                attachment.size !== '' &&
                attachment.size > 0;
              const hasDate = Boolean(attachment.createdAt);
              const showPreview =
                attachment.isImage && attachment.fileUrl && !imagePreviewErrors[attachment.id];

              return (
                <div
                  key={attachment.id || `${attachment.fileName}-${index}`}
                  className='w-[220px] shrink-0 snap-start'
                >
                  <div className='group relative flex h-full flex-col overflow-hidden rounded-[10px] border border-stroke-soft-200 bg-bg-weak-100'>
                    <div className='relative flex size-[176px] w-full items-center justify-center bg-bg-weak-100'>
                      {(attachment.fileUrl || onRemove) && (
                        <div className='absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10'>
                          {attachment.fileUrl && (
                            <CompactButton.Root
                              size='large'
                              variant='ghost'
                              onClick={() => handleAttachmentDownload(attachment)}
                              disabled={disabled}
                              aria-label={`Download ${attachment.fileName || 'attachment'}`}
                              type='button'
                            >
                              <CompactButton.Icon as={RiDownloadLine} />
                            </CompactButton.Root>
                          )}
                          {onRemove && (
                            <CompactButton.Root
                              size='large'
                              variant='ghost'
                              onClick={() =>
                                onRemove(attachment.id || index, attachment.childRowId)
                              }
                              disabled={disabled}
                              aria-label={`Remove ${attachment.fileName || 'attachment'}`}
                              type='button'
                            >
                              <CompactButton.Icon as={RiDeleteBinLine} />
                            </CompactButton.Root>
                          )}
                        </div>
                      )}
                      {showPreview ? (
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className='h-full w-full object-cover'
                          loading='lazy'
                          onError={() => handleImageError(attachment.id)}
                        />
                      ) : (
                        <div className='flex flex-col items-center justify-center gap-2 px-3 text-center text-text-sub-500'>
                          <div className='flex size-10 items-center justify-center rounded-lg border border-stroke-soft-200 bg-white shadow-sm'>
                            <RiImage2Line className='size-5 text-text-sub-500' />
                          </div>
                          <span className='text-paragraph-xs text-text-sub-500'>
                            Preview unavailable
                          </span>
                        </div>
                      )}
                    </div>
                    <div className='border-t border-stroke-soft-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)]'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <FileFormatIcon.Root
                          format={attachment.extension || 'FILE'}
                          size='small'
                          color='purple'
                        />
                        <div className='flex flex-col min-w-0'>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <span className='label-small text-text-main-900 truncate max-w-full cursor-default'>
                                {attachment.fileName}
                              </span>
                            </Tooltip.Trigger>
                            <Tooltip.Content size='xsmall' side='top'>
                              {attachment.fileName}
                            </Tooltip.Content>
                          </Tooltip.Root>
                          {(hasSize || (!hasSize && !hasDate)) && (
                            <div className='flex items-center gap-2 text-paragraph-xs text-text-sub-500'>
                              {hasSize && <span>{formatFileSize(attachment.size)}</span>}
                              {!hasSize && !hasDate && <span>--</span>}
                            </div>
                          )}
                          {hasDate && (
                            <div className='flex items-center gap-2 text-paragraph-xs text-text-sub-500'>
                              <span>{safeDisplayDateTime(attachment.createdAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {normalizedAttachments.length > 1 && (
            <div className='flex items-center justify-center gap-2 text-paragraph-xs text-text-sub-500'>
              <CompactButton.Root
                size='large'
                variant='ghost'
                onClick={() => handleAttachmentNav(-1)}
                disabled={currentAttachmentIndex === 0 || disabled}
                className='shrink-0'
                type='button'
              >
                <CompactButton.Icon as={RiArrowLeftSLine} />
              </CompactButton.Root>
              <span className='min-w-[52px] text-center'>
                {currentAttachmentIndex + 1}/{normalizedAttachments.length}
              </span>
              <CompactButton.Root
                size='large'
                variant='ghost'
                onClick={() => handleAttachmentNav(1)}
                disabled={currentAttachmentIndex === normalizedAttachments.length - 1 || disabled}
                className='shrink-0'
                type='button'
              >
                <CompactButton.Icon as={RiArrowRightSLine} />
              </CompactButton.Root>
            </div>
          )}
        </div>
      )}

      {normalizedAttachments.length === 0 && (
        <div className='flex items-start gap-3 rounded-xl border border-dashed border-stroke-sub-300 px-4 py-3'>
          <RiUploadCloud2Line className='size-6 text-text-sub-500' />
          <div className='flex flex-1 flex-col gap-1'>
            <p className='label-small text-text-main-900'>{emptyStateMessage}</p>
            <p className='text-paragraph-xs text-text-soft-400'>{emptyStateDescription}</p>
          </div>
          {emptyStateAction && (
            <Button.Root
              type='button'
              onClick={emptyStateAction.onClick}
              disabled={disabled || emptyStateAction.disabled}
              variant='neutral'
              mode='stroke'
              size='xsmall'
            >
              {emptyStateAction.label || 'Browse File'}
            </Button.Root>
          )}
        </div>
      )}
    </div>
  );
};

export default AttachmentList;
