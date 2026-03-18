import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  RiUser3Line,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiBuilding2Line,
  RiBriefcase4Line,
  RiLinksLine,
  RiEditLine,
  RiCheckLine,
  RiNotificationLine,
  RiShieldLine,
  RiBankCardLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import * as Avatar from '@/components/ui/avatar';
import PageLayout from '@/components/page-layout';
import { getCpContactProfile } from '@/redux/profileSlice';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/utils/cn';

function getInitials(firstName, lastName, email) {
  const first = (firstName ?? '').trim();
  const last = (lastName ?? '').trim();
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  const e = (email ?? '').trim();
  if (e) return e[0].toUpperCase();
  return '?';
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className='flex items-center gap-4 border-b border-stroke-soft-100 py-3.5 last:border-0'>
      <div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-soft-200 text-text-soft-400'>
        <Icon className='size-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-label-xs font-medium text-text-sub-500'>{label}</p>
        <p className='mt-0.5 truncate text-paragraph-sm font-semibold text-text-main-900'>
          {value || <span className='font-normal text-text-soft-400'>Not set</span>}
        </p>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-stroke-soft-200 bg-bg-soft-100 px-4 py-3 text-paragraph-sm text-text-main-900 outline-none transition-colors placeholder:text-text-soft-400 focus:border-success-soft-400 focus:ring-1 focus:ring-success-soft-300';

function Field({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='flex items-center gap-1.5 text-label-xs font-semibold text-text-sub-500'>
        <Icon className='size-4 text-text-soft-400' /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className={inputClass}
      />
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useAuth();
  const { data: cpContact, isLoading, error } = useSelector((state) => state.profile.cpContactProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    primaryContact: '',
    alternativeNumber: '',
    email: '',
    city: '',
    company: '',
    designation: '',
    department: '',
    linkedIn: '',
  });

  useEffect(() => {
    dispatch(getCpContactProfile());
  }, [dispatch]);

  useEffect(() => {
    if (cpContact) {
      setForm({
        firstName: cpContact.first_name ?? '',
        lastName: cpContact.last_name ?? '',
        primaryContact: cpContact.mobile_no ?? '',
        alternativeNumber: cpContact.alt_mobile_no ?? '',
        email: cpContact.email_id ?? authUser?.email ?? '',
        city: cpContact.city ?? '',
        company: cpContact.company_name ?? '',
        designation: cpContact.designation ?? '',
        department: cpContact.department ?? '',
        linkedIn: cpContact.linkedin_link ?? '',
      });
    }
  }, [cpContact, authUser?.email]);

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const displayName =
    cpContact && (cpContact.first_name || cpContact.last_name)
      ? [cpContact.first_name, cpContact.last_name].filter(Boolean).join(' ')
      : authUser?.full_name ?? authUser?.email ?? '—';
  const initials = getInitials(
    form.firstName || cpContact?.first_name,
    form.lastName || cpContact?.last_name,
    form.email || authUser?.email,
  );
  const profileImage = authUser?.user_image || null;

  return (
    <PageLayout>
      <div className='max-w-[900px] mx-auto py-8 md:py-10 space-y-6'>
        <div>
          <h1 className='text-title-h4 font-semibold tracking-tight text-text-main-900'>
            My Account
          </h1>
          <p className='mt-1 text-paragraph-sm text-text-sub-500'>
            Manage your partner profile and preferences.
          </p>
        </div>

        {isLoading && (
          <div className='rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-8 text-center text-text-sub-500'>
            Loading profile…
          </div>
        )}

        {error && !cpContact && (
          <div className='rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-6 text-center'>
            <p className='text-error-base'>{error}</p>
            <p className='mt-2 text-paragraph-sm text-text-sub-500'>
              You may not have a CP Contact linked to your account yet.
            </p>
          </div>
        )}

        {(cpContact || authUser) && !isLoading && (
          <>
            {/* Profile Card */}
            <div className='overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 shadow-[var(--shadow-custom-xs)]'>
              <div className='relative h-24 bg-gradient-to-r from-success-base to-success-dark'>
                <div className='absolute right-0 top-0 size-48 translate-x-1/4 -translate-y-1/2 rounded-full bg-static-white/10' />
              </div>
              <div className='relative px-6 pb-6 -mt-10'>
                <div className='flex flex-wrap items-end justify-between gap-4'>
                  <div className='flex items-end gap-4'>
                    <div className='flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-bg-white-0 bg-gradient-to-br from-success-base to-success-dark shadow-md'>
                      {profileImage ? (
                        <Avatar.Root size='80' color='gray'>
                          <Avatar.Image src={profileImage} alt={displayName} />
                        </Avatar.Root>
                      ) : (
                        <span className='text-title-h4 font-semibold text-static-white'>
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className='pb-1'>
                      <h2 className='text-title-h5 font-semibold text-text-main-900'>{displayName}</h2>
                      <div className='mt-0.5 flex flex-wrap items-center gap-2'>
                        <span className='rounded-full bg-success-lighter px-2.5 py-0.5 text-label-xs font-semibold text-success-darker'>
                          Channel Partner
                        </span>
                        {(cpContact?.designation || cpContact?.company_name) && (
                          <span className='text-label-xs text-text-sub-500'>
                            {[cpContact.designation, cpContact.company_name].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setEditing((e) => !e)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2.5 text-label-sm font-semibold transition-colors',
                      editing
                        ? 'bg-bg-soft-200 text-text-sub-500 hover:bg-bg-soft-200'
                        : 'bg-success-lighter text-success-darker hover:bg-success-light',
                    )}
                  >
                    <RiEditLine className='size-4' />
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {saved && (
                  <div className='mt-5 flex items-center gap-2 rounded-xl bg-success-lighter px-4 py-3 text-paragraph-sm font-semibold text-success-darker'>
                    <RiCheckLine className='size-4' />
                    Profile saved successfully
                  </div>
                )}

                {editing ? (
                  <div className='mt-6 space-y-5'>
                    <div>
                      <p className='mb-3 text-label-xs font-semibold uppercase tracking-wider text-text-sub-500'>
                        Personal Info
                      </p>
                      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field
                          label='First Name'
                          icon={RiUser3Line}
                          value={form.firstName}
                          onChange={set('firstName')}
                        />
                        <Field
                          label='Last Name'
                          icon={RiUser3Line}
                          value={form.lastName}
                          onChange={set('lastName')}
                        />
                        <Field
                          label='Primary Contact'
                          icon={RiPhoneLine}
                          value={form.primaryContact}
                          onChange={set('primaryContact')}
                          placeholder='+91 XXXXX XXXXX'
                        />
                        <Field
                          label='Alternative Number'
                          icon={RiPhoneLine}
                          value={form.alternativeNumber}
                          onChange={set('alternativeNumber')}
                          placeholder='+91 XXXXX XXXXX'
                        />
                        <Field
                          label='Email ID'
                          icon={RiMailLine}
                          value={form.email}
                          onChange={set('email')}
                          type='email'
                        />
                        <Field
                          label='City'
                          icon={RiMapPinLine}
                          value={form.city}
                          onChange={set('city')}
                        />
                      </div>
                    </div>
                    <div>
                      <p className='mb-3 text-label-xs font-semibold uppercase tracking-wider text-text-sub-500'>
                        Company Info
                      </p>
                      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field
                          label='Company'
                          icon={RiBuilding2Line}
                          value={form.company}
                          onChange={set('company')}
                        />
                        <Field
                          label='Designation'
                          icon={RiBriefcase4Line}
                          value={form.designation}
                          onChange={set('designation')}
                        />
                        <Field
                          label='Department'
                          icon={RiBriefcase4Line}
                          value={form.department}
                          onChange={set('department')}
                        />
                        <Field
                          label='LinkedIn URL'
                          icon={RiLinksLine}
                          value={form.linkedIn}
                          onChange={set('linkedIn')}
                          placeholder='linkedin.com/in/yourname'
                        />
                      </div>
                    </div>
                    <div className='flex justify-end'>
                      <button
                        type='button'
                        onClick={handleSave}
                        className='flex items-center gap-2 rounded-xl bg-success-base px-6 py-3 text-label-sm font-semibold text-static-white shadow-md transition-opacity hover:opacity-90'
                      >
                        <RiCheckLine className='size-4' />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='mt-6 space-y-1'>
                    <p className='mb-2 mt-1 text-label-xs font-semibold uppercase tracking-wider text-text-sub-500'>
                      Personal Info
                    </p>
                    <div className='mb-4 divide-y divide-stroke-soft-100'>
                      <InfoRow label='First Name' icon={RiUser3Line} value={cpContact?.first_name} />
                      <InfoRow label='Last Name' icon={RiUser3Line} value={cpContact?.last_name} />
                      <InfoRow label='Primary Contact' icon={RiPhoneLine} value={cpContact?.mobile_no} />
                      <InfoRow label='Alternative Number' icon={RiPhoneLine} value={cpContact?.alt_mobile_no} />
                      <InfoRow label='Email ID' icon={RiMailLine} value={cpContact?.email_id || authUser?.email} />
                      <InfoRow label='City' icon={RiMapPinLine} value={cpContact?.city} />
                    </div>
                    <p className='mb-2 mt-4 text-label-xs font-semibold uppercase tracking-wider text-text-sub-500'>
                      Company Info
                    </p>
                    <div className='divide-y divide-stroke-soft-100'>
                      <InfoRow label='Company' icon={RiBuilding2Line} value={cpContact?.company_name} />
                      <InfoRow label='Designation' icon={RiBriefcase4Line} value={cpContact?.designation} />
                      <InfoRow label='Department' icon={RiBriefcase4Line} value={cpContact?.department} />
                      <InfoRow label='LinkedIn URL' icon={RiLinksLine} value={cpContact?.linkedin_link} />
                    </div>
                  </div>
                )}
              </div>
            </div>

          
          </>
        )}
      </div>
    </PageLayout>
  );
}
