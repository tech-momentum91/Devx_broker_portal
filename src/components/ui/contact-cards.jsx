import React, { useState } from 'react';
import {
  RiContactsBook2Line,
  RiAddLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiAlertFill,
} from 'react-icons/ri';
import * as Button from '@/components/ui/button';
import * as Badge from '@/components/ui/badge';
import * as Avatar from '@/components/ui/avatar';
import * as CompactButton from '@/components/ui/compact-button';
import * as Modal from '@/components/ui/modal';
import { cn, getInitials } from '@/lib/utils';

/**
 * Normalizes contact objects from different sources (client vs landlord API shapes)
 */
const normalizeContact = (c) => ({
  name: c?.name ?? c?.contact_name ?? '--',
  email: c?.email ?? '',
  phone: c?.phone ?? c?.mobile_no ?? '',
  phone_country: c?.phone_country ?? '+91',
  is_spoc: c?.is_spoc === true || c?.is_primary_contact === 1,
  department: c?.department ?? '',
  originalContact: c?.originalContact ?? c,
});

const getAvatarColor = (initials) => {
  const colors = ['blue', 'yellow', 'purple', 'sky', 'red', 'gray'];
  const index = initials.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Shared contact cards component for Client and Landlord detail views.
 * Supports both client (contact_name, mobile_no, is_primary_contact) and landlord API shapes.
 *
 * @param {Object} props
 * @param {Array} props.contacts - Array of contact objects
 * @param {Function} [props.onAddContact] - Callback when Add Contact is clicked
 * @param {Function} [props.onEditContact] - Callback(originalContact) when Edit is clicked
 * @param {Function} [props.onDeleteContact] - Callback(contactForDelete) when delete is confirmed
 * @param {Object} [props.emptyState] - { title, description } for empty state
 * @param {boolean} [props.showActions=true] - Whether to show edit/delete buttons on each card
 */
const ContactCards = ({
  contacts = [],
  onAddContact,
  onEditContact,
  onDeleteContact,
  emptyState = { title: 'No contacts added yet.', description: 'Add a contact to get started.' },
  showActions = true,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  const normalizedContacts = contacts.map(normalizeContact);
  const canEdit = typeof onEditContact === 'function';
  const canDelete = typeof onDeleteContact === 'function';
  const showCardActions = showActions && (canEdit || canDelete);

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete || !canDelete) return;
    try {
      await Promise.resolve(onDeleteContact(contactToDelete));
      setDeleteModalOpen(false);
      setContactToDelete(null);
    } catch {
      // Parent shows error toast; keep modal open on failure
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  return (
    <div className='flex flex-col gap-3 border-t border-stroke-soft-200 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <RiContactsBook2Line size={20} className='text-text-soft-400' />
          <span className='text-label-md text-text-sub-500'>Contacts</span>
        </div>
        {onAddContact && (
          <Button.Root variant='neutral' mode='stroke' size='xsmall' onClick={onAddContact}>
            <Button.Icon as={RiAddLine} className='mr-0.5' />
            Add Contact
          </Button.Root>
        )}
      </div>

      {normalizedContacts.length > 0 ? (
        <div className='grid grid-cols-2 gap-3'>
          {normalizedContacts.map((contact, index) => (
            <div
              key={index}
              className={cn('border rounded-xl p-3 bg-white group relative border-stroke-soft-200')}
            >
              <div className='flex gap-3 items-center'>
                <Avatar.Root size='32' color={getAvatarColor(getInitials(contact.name))}>
                  <span className='text-label-sm font-medium'>{getInitials(contact.name)}</span>
                </Avatar.Root>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='label-small text-text-main-900'>{contact.name}</span>
                    {contact.department && (
                      <Badge.Root size='small' variant='stroke'>
                        {contact.department}
                      </Badge.Root>
                    )}
                    {contact.is_spoc && (
                      <Badge.Root variant='stroke' color='green'>
                        SPOC
                      </Badge.Root>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5 text-paragraph-xs text-text-soft-400'>
                    {contact.phone && (
                      <>
                        <span>
                          {contact.phone_country} {String(contact.phone).replaceAll('-', ' ')}
                        </span>
                        {contact.email && <span className='size-1 rounded-full bg-text-sub-500' />}
                      </>
                    )}
                    {contact.email && <span className='truncate'>{contact.email}</span>}
                  </div>
                </div>
                {showCardActions && (
                  <div className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                    {canEdit && (
                      <CompactButton.Root
                        size='large'
                        variant='stroke'
                        className='hover:text-[var(--color-text-sub-500)]'
                        onClick={() => onEditContact(contact.originalContact)}
                      >
                        <CompactButton.Icon as={RiPencilLine} />
                      </CompactButton.Root>
                    )}
                    {canDelete && (
                      <CompactButton.Root
                        size='large'
                        variant='stroke'
                        onClick={() => handleDeleteClick(contact)}
                      >
                        <CompactButton.Icon as={RiDeleteBinLine} />
                      </CompactButton.Root>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-stroke-soft-200 bg-bg-white-0 p-16 text-center'>
          <h3 className='mb-2 text-lg font-semibold text-text-strong-950'>{emptyState.title}</h3>
          <p className='max-w-md text-sm text-text-sub-600'>{emptyState.description}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {canDelete && (
        <Modal.Root open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <Modal.Content className='max-w-[450px]' showClose={false}>
            <Modal.Body className='px-5 py-8'>
              <div className='flex flex-col items-center gap-4'>
                <div className='flex items-center justify-center p-2 bg-warning-base/10 rounded-lg'>
                  <RiAlertFill size={24} className='text-warning-base' />
                </div>
                <div className='flex flex-col gap-1 items-center text-center'>
                  <h3 className='text-label-md text-text-sub-500'>Remove Contact?</h3>
                  <p className='text-paragraph-sm text-text-sub-500'>
                    Are you sure you want to remove this contact?
                  </p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className='flex items-center justify-end gap-3 w-full'>
                <Button.Root
                  type='button'
                  variant='neutral'
                  mode='stroke'
                  size='small'
                  onClick={handleCancelDelete}
                >
                  Cancel
                </Button.Root>
                <Button.Root
                  type='button'
                  variant='primary'
                  size='small'
                  onClick={handleConfirmDelete}
                >
                  Confirm
                </Button.Root>
              </div>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}
    </div>
  );
};

export default ContactCards;
