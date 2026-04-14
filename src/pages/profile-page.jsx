import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import * as Select from '@/components/ui/select';
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
} from 'react-icons/ri';
import * as Avatar from '@/components/ui/avatar';
import PageLayout from '@/components/page-layout';
import {
  getCpContactProfile,
  updateCpContactProfile,
  clearCpContactSaveError,
} from '@/redux/profileSlice';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/utils/cn';
import { CityCombobox } from '@/components/city-combobox/city-combobox';
import { getCrmContactOptions } from '@/api/crmContacts';
import { DESIGNATION_OPTIONS, DEPARTMENT_OPTIONS } from '@/constants/cp-contact-form-options';

function normalizeCrmSelectOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (item == null) return null;
      if (typeof item === 'string') {
        const s = item.trim();
        return s ? { value: s, label: s } : null;
      }
      const value = String(item.value ?? item.name ?? '').trim();
      const label = String(item.label ?? item.designation ?? item.department ?? value).trim();
      if (!value && !label) return null;
      const v = value || label;
      return { value: v, label: label || v };
    })
    .filter(Boolean);
}

function withCurrentOptionIfMissing(baseOptions, currentValue) {
  const v = String(currentValue ?? '').trim();
  if (!v) return baseOptions;
  const has = baseOptions.some((o) => String(o?.value ?? '') === v);
  if (has) return baseOptions;
  return [...baseOptions, { value: v, label: v }];
}

function mergeStaticWithCrmOptions(staticList, crmList) {
  const map = new Map();
  for (const o of crmList || []) {
    const v = String(o?.value ?? '').trim();
    if (!v) continue;
    map.set(v, { value: v, label: String(o.label ?? v).trim() || v });
  }
  for (const o of staticList || []) {
    const v = String(o?.value ?? '').trim();
    if (!v) continue;
    map.set(v, { value: v, label: String(o.label ?? v).trim() || v });
  }
  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
  );
}

const SELECT_CONTENT_Z = 'z-[120]';

const selectTriggerClass =
  'w-full rounded-xl border border-stroke-soft-200 bg-bg-soft-100 px-4 py-3 text-left text-paragraph-sm text-text-main-900 min-h-[48px]';

const cpProfileEditSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  primaryContact: z.string().optional(),
  alternativeNumber: z.string().optional(),
  email: z.string(),
  city: z.string().trim().min(1, 'Please search and select a city'),
  company: z.string(),
  designation: z.string().optional(),
  department: z.string().optional(),
  linkedIn: z.string().optional(),
});

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

function Field({ label, icon: Icon, error, disabled = false, ...inputProps }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='flex items-center gap-1.5 text-label-xs font-semibold text-text-sub-500'>
        <Icon className='size-4 text-text-soft-400' /> {label}
      </label>
      <input
        {...inputProps}
        disabled={disabled}
        className={cn(
          inputClass,
          disabled && 'cursor-not-allowed opacity-70',
          error && 'border-error-base ring-1 ring-error-base/25',
        )}
      />
      {error ? <p className='text-paragraph-xs font-medium text-error-base'>{error}</p> : null}
    </div>
  );
}

function mapCpContactToFormValues(cpContact, authEmail) {
  if (!cpContact) {
    return {
      firstName: '',
      lastName: '',
      primaryContact: '',
      alternativeNumber: '',
      email: authEmail ?? '',
      city: '',
      company: '',
      designation: '',
      department: '',
      linkedIn: '',
    };
  }
  return {
    firstName: cpContact.first_name ?? '',
    lastName: cpContact.last_name ?? '',
    primaryContact: cpContact.mobile_no ?? '',
    alternativeNumber: cpContact.alt_mobile_no ?? '',
    email: cpContact.email_id ?? authEmail ?? '',
    city: cpContact.city ?? '',
    company: cpContact.company_name ?? '',
    designation: cpContact.designation ?? '',
    department: cpContact.department ?? '',
    linkedIn: cpContact.linkedin_link ?? '',
  };
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useAuth();
  const { data: cpContact, isLoading, error, saving, saveError } = useSelector(
    (state) => state.profile.cpContactProfile,
  );
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [crmDesignationOptions, setCrmDesignationOptions] = useState([]);
  const [crmDepartmentOptions, setCrmDepartmentOptions] = useState([]);
  const [crmFieldOptionsLoading, setCrmFieldOptionsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cpProfileEditSchema),
    defaultValues: mapCpContactToFormValues(null, authUser?.email),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    dispatch(getCpContactProfile());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;
    setCrmFieldOptionsLoading(true);
    getCrmContactOptions()
      .then((contactOptions) => {
        if (!isMounted) return;
        setCrmDesignationOptions(normalizeCrmSelectOptions(contactOptions?.designation));
        setCrmDepartmentOptions(normalizeCrmSelectOptions(contactOptions?.department));
      })
      .catch(() => {
        if (isMounted) {
          setCrmDesignationOptions([]);
          setCrmDepartmentOptions([]);
        }
      })
      .finally(() => {
        if (isMounted) setCrmFieldOptionsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    reset(mapCpContactToFormValues(cpContact, authUser?.email));
  }, [cpContact, authUser?.email, reset]);

  const [wFirst, wLast, wEmail] = watch(['firstName', 'lastName', 'email']);

  const onSave = handleSubmit(async (values) => {
    if (!cpContact?.name) return;
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      mobileNumber: (values.primaryContact ?? '').trim(),
      altMobileNumber: (values.alternativeNumber ?? '').trim(),
      city: values.city.trim(),
      designation: (values.designation ?? '').trim(),
      department: (values.department ?? '').trim(),
      linkedin: (values.linkedIn ?? '').trim(),
    };
    try {
      await dispatch(updateCpContactProfile({ name: cpContact.name, payload })).unwrap();
      await dispatch(getCpContactProfile()).unwrap();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* saveError from Redux */
    }
  });

  const displayName =
    cpContact && (cpContact.first_name || cpContact.last_name)
      ? [cpContact.first_name, cpContact.last_name].filter(Boolean).join(' ')
      : authUser?.full_name ?? authUser?.email ?? '—';
  const initials = getInitials(
    wFirst || cpContact?.first_name,
    wLast || cpContact?.last_name,
    wEmail || authUser?.email,
  );
  const profileImage = authUser?.user_image || null;

  const resetFormFromServer = () => {
    reset(mapCpContactToFormValues(cpContact, authUser?.email));
  };

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
                    disabled={saving}
                    onClick={() => {
                      if (editing) {
                        resetFormFromServer();
                        dispatch(clearCpContactSaveError());
                        setEditing(false);
                      } else {
                        resetFormFromServer();
                        dispatch(clearCpContactSaveError());
                        setEditing(true);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-4 py-2.5 text-label-sm font-semibold transition-colors',
                      editing
                        ? 'bg-bg-soft-200 text-text-sub-500 hover:bg-bg-soft-200'
                        : 'bg-success-lighter text-success-darker hover:bg-success-light',
                      saving && 'pointer-events-none opacity-60',
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

                {saveError && (
                  <div className='mt-5 rounded-xl border border-error-base/30 bg-error-lighter/30 px-4 py-3 text-paragraph-sm text-error-base'>
                    {saveError}
                  </div>
                )}

                {editing ? (
                  <form className='mt-6 space-y-5' onSubmit={onSave} noValidate>
                    <div>
                      <p className='mb-3 text-label-xs font-semibold uppercase tracking-wider text-text-sub-500'>
                        Personal Info
                      </p>
                      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field
                          label='First Name'
                          icon={RiUser3Line}
                          error={errors.firstName?.message}
                          {...register('firstName')}
                        />
                        <Field
                          label='Last Name'
                          icon={RiUser3Line}
                          error={errors.lastName?.message}
                          {...register('lastName')}
                        />
                        <Field
                          label='Primary Contact'
                          icon={RiPhoneLine}
                          error={errors.primaryContact?.message}
                          {...register('primaryContact')}
                          placeholder='+91 XXXXX XXXXX'
                        />
                        <Field
                          label='Alternative Number'
                          icon={RiPhoneLine}
                          error={errors.alternativeNumber?.message}
                          {...register('alternativeNumber')}
                          placeholder='+91 XXXXX XXXXX'
                        />
                        <Field
                          label='Email ID'
                          icon={RiMailLine}
                          error={errors.email?.message}
                          {...register('email')}
                          type='email'
                          disabled
                        />
                        <p className='md:col-span-2 -mt-2 text-paragraph-xs text-text-sub-500'>
                          Email cannot be changed here. Contact your administrator if it is wrong.
                        </p>
                        <div className='flex flex-col gap-1.5 md:col-span-2'>
                          <label className='flex items-center gap-1.5 text-label-xs font-semibold text-text-sub-500'>
                            <RiMapPinLine className='size-4 text-text-soft-400' /> City
                          </label>
                          <Controller
                            name='city'
                            control={control}
                            render={({ field, fieldState }) => (
                              <>
                                <CityCombobox
                                  className='w-full'
                                  value={field.value || ''}
                                  onChange={(v) => field.onChange(v ?? '')}
                                  placeholder='Search city...'
                                  disabled={saving}
                                />
                                {fieldState.error?.message ? (
                                  <p className='text-paragraph-xs font-medium text-error-base'>
                                    {fieldState.error.message}
                                  </p>
                                ) : null}
                              </>
                            )}
                          />
                        </div>
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
                          error={errors.company?.message}
                          {...register('company')}
                          disabled
                        />
                        <p className='md:col-span-2 -mt-2 text-paragraph-xs text-text-sub-500'>
                          Company comes from your linked CP account and is not editable on this form.
                        </p>
                        <div className='flex flex-col gap-1.5'>
                          <label className='flex items-center gap-1.5 text-label-xs font-semibold text-text-sub-500'>
                            <RiBriefcase4Line className='size-4 text-text-soft-400' /> Designation
                          </label>
                          <Controller
                            name='designation'
                            control={control}
                            render={({ field, fieldState }) => {
                              const base = mergeStaticWithCrmOptions(
                                DESIGNATION_OPTIONS,
                                crmDesignationOptions,
                              );
                              const options = withCurrentOptionIfMissing(
                                base,
                                String(field.value ?? '').trim(),
                              );
                              return (
                                <>
                                  <Select.Root
                                    value={field.value || ''}
                                    onValueChange={field.onChange}
                                    hasError={Boolean(fieldState.error)}
                                  >
                                    <Select.Trigger
                                      className={cn(
                                        selectTriggerClass,
                                        fieldState.error && 'border-error-base ring-1 ring-error-base/25',
                                      )}
                                      disabled={saving}
                                    >
                                      <Select.Value
                                        placeholder={
                                          crmFieldOptionsLoading && crmDesignationOptions.length === 0
                                            ? 'Loading options…'
                                            : 'Select designation'
                                        }
                                      />
                                    </Select.Trigger>
                                    <Select.Content className={SELECT_CONTENT_Z}>
                                      {options.map((opt) => (
                                        <Select.Item key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </Select.Item>
                                      ))}
                                    </Select.Content>
                                  </Select.Root>
                                  {fieldState.error?.message ? (
                                    <p className='text-paragraph-xs font-medium text-error-base'>
                                      {fieldState.error.message}
                                    </p>
                                  ) : null}
                                </>
                              );
                            }}
                          />
                        </div>
                        <div className='flex flex-col gap-1.5'>
                          <label className='flex items-center gap-1.5 text-label-xs font-semibold text-text-sub-500'>
                            <RiBriefcase4Line className='size-4 text-text-soft-400' /> Department
                          </label>
                          <Controller
                            name='department'
                            control={control}
                            render={({ field, fieldState }) => {
                              const base = mergeStaticWithCrmOptions(
                                DEPARTMENT_OPTIONS,
                                crmDepartmentOptions,
                              );
                              const options = withCurrentOptionIfMissing(
                                base,
                                String(field.value ?? '').trim(),
                              );
                              return (
                                <>
                                  <Select.Root
                                    value={field.value || ''}
                                    onValueChange={field.onChange}
                                    hasError={Boolean(fieldState.error)}
                                  >
                                    <Select.Trigger
                                      className={cn(
                                        selectTriggerClass,
                                        fieldState.error && 'border-error-base ring-1 ring-error-base/25',
                                      )}
                                      disabled={saving}
                                    >
                                      <Select.Value
                                        placeholder={
                                          crmFieldOptionsLoading && crmDepartmentOptions.length === 0
                                            ? 'Loading options…'
                                            : 'Select department'
                                        }
                                      />
                                    </Select.Trigger>
                                    <Select.Content className={SELECT_CONTENT_Z}>
                                      {options.map((opt) => (
                                        <Select.Item key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </Select.Item>
                                      ))}
                                    </Select.Content>
                                  </Select.Root>
                                  {fieldState.error?.message ? (
                                    <p className='text-paragraph-xs font-medium text-error-base'>
                                      {fieldState.error.message}
                                    </p>
                                  ) : null}
                                </>
                              );
                            }}
                          />
                        </div>
                        <Field
                          label='LinkedIn URL'
                          icon={RiLinksLine}
                          error={errors.linkedIn?.message}
                          {...register('linkedIn')}
                          placeholder='linkedin.com/in/yourname'
                        />
                      </div>
                    </div>
                    <div className='flex justify-end'>
                      <button
                        type='submit'
                        disabled={saving || !cpContact?.name}
                        className={cn(
                          'flex items-center gap-2 rounded-xl bg-success-base px-6 py-3 text-label-sm font-semibold text-static-white shadow-md transition-opacity hover:opacity-90',
                          (saving || !cpContact?.name) && 'pointer-events-none opacity-60',
                        )}
                      >
                        <RiCheckLine className='size-4' />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
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
