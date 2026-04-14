import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Label from '@/components/ui/label';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import * as Textarea from '@/components/ui/textarea';
import * as Button from '@/components/ui/button';
import * as Radio from '@/components/ui/radio';
import ErrorText from '@/components/ui/error-text';
import { RiArrowRightSLine } from 'react-icons/ri';
import { z } from 'zod';
import { submitLead, resetSubmitState } from '@/redux/leadSubmitSlice';
import {
  selectLeadSubmitStatus,
  selectLeadSubmitError,
} from '@/redux/leadSubmitSlice';
import {
  getCityOptionsForLeadForm,
  getClientCompanyOptionsForLeadForm,
} from '@/services/dashboard-service';
import { showErrorToast } from '@/utils/error-utils';

const DEAL_SITUATION_OPTIONS = [
  {
    value: 'I am working on this deal – office not finalized yet',
    label: 'I am working on this deal – office not finalized yet',
  },
  {
    value: 'Office finalized – need Design & Build partner',
    label: 'Office finalized – need Design & Build partner',
  },
  {
    value: "Market intelligence lead – I don't know client yet",
    label: "Market intelligence lead – I don't know client yet",
  },
  {
    value: 'Client onboarded designer – need execution partner',
    label: 'Client onboarded designer – need execution partner',
  },
];

const designBuildSchema = z.object({
  buildingName: z.string().trim().min(1, 'Building Name is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  microMarket: z.string().trim().min(1, 'Micro Market is required.'),
  carpetArea: z.string().trim().min(1, 'Estimated Carpet Area (SFT) is required.'),
  perSftRate: z.string().trim().min(1, 'Per SFT Rate (₹) is required.'),
  totalBudget: z.string().trim().min(1, 'Total D&B Budget (₹) is required.'),
  clientCompany: z.string().trim().min(1, 'Client Company is required.'),
  contactPerson: z.string().trim().min(1, 'Contact Person is required.'),
  phone: z.string().trim().min(1, 'Phone is required.'),
  email: z.string().trim().min(1, 'Email is required.'),
  clientCity: z.string().trim().min(1, 'Client City is required.'),
});

const getFieldErrorsFromIssues = (issues = []) => {
  const errors = {};
  issues.forEach((issue) => {
    const key = issue?.path?.[0];
    if (!key || errors[key]) return;
    errors[key] = issue.message;
  });
  return errors;
};

function FormSection({ step, title, subtitle, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-lighter text-label-sm font-semibold text-success-darker"
          aria-hidden
        >
          {step}
        </span>
        <div>
          <h2 className="text-label-lg font-semibold text-text-main-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-paragraph-sm text-text-sub-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SubsectionTitle({ children }) {
  return (
    <h3 className="subheading-small text-text-main-900 uppercase tracking-wide">
      {children}
    </h3>
  );
}

function FieldGroup({ label, required, optional, children, className = '' }) {
  return (
    <div className={className}>
      <Label.Root className="mb-1.5 block text-label-sm font-medium text-text-main-900">
        {label}
        {required && <Label.Asterisk />}
        {optional && (
          <span className="ml-1 font-normal text-text-sub-500">(optional)</span>
        )}
      </Label.Root>
      {children}
    </div>
  );
}

function pickInitialString(src, ...keys) {
  if (!src || typeof src !== 'object') return '';
  for (const k of keys) {
    const v = src[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

const DesignBuildLeadForm = ({ initialData = null }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submitStatus = useSelector(selectLeadSubmitStatus);
  const submitError = useSelector(selectLeadSubmitError);

  const [buildingName, setBuildingName] = useState('');
  const [city, setCity] = useState('');
  const [floor, setFloor] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [microMarket, setMicroMarket] = useState('');
  const [carpetArea, setCarpetArea] = useState('');
  const [perSftRate, setPerSftRate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [dealSituation, setDealSituation] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [isCustomClientCompany, setIsCustomClientCompany] = useState(false);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [requirementSummary, setRequirementSummary] = useState('');
  const [cityOptions, setCityOptions] = useState([]);
  const [clientCompanyOptions, setClientCompanyOptions] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(resetSubmitState());
  }, [dispatch]);

  useEffect(() => {
    if (!initialData || typeof initialData !== 'object') return;
    const d = initialData;
    setBuildingName(pickInitialString(d, 'buildingName', 'building_name'));
    setCity(pickInitialString(d, 'city', 'site_city', 'project_city'));
    setFloor(pickInitialString(d, 'floor', 'floor_level'));
    setUnitNumber(pickInitialString(d, 'unitNumber', 'unit_number'));
    setMicroMarket(pickInitialString(d, 'microMarket', 'micro_market'));
    setCarpetArea(pickInitialString(d, 'carpetArea', 'carpet_area', 'estimated_carpet_area'));
    setPerSftRate(pickInitialString(d, 'perSftRate', 'per_sft_rate'));
    setTotalBudget(
      pickInitialString(d, 'totalBudget', 'total_budget', 'total_d_and_b_budget'),
    );
    const deal = pickInitialString(d, 'dealSituation', 'deal_situation');
    if (deal) {
      const match = DEAL_SITUATION_OPTIONS.find(
        (o) =>
          o.value === deal ||
          o.label === deal ||
          o.value.toLowerCase() === deal.toLowerCase(),
      );
      if (match) setDealSituation(match.value);
    }
    setClientCompany(pickInitialString(d, 'clientCompany', 'client_company'));
    setContactPerson(pickInitialString(d, 'contactPerson', 'contact_person'));
    setPhone(pickInitialString(d, 'phone', 'mobile_no', 'mobileNo', 'mobile_number'));
    setEmail(pickInitialString(d, 'email', 'email_id'));
    setClientCity(pickInitialString(d, 'clientCity', 'client_city'));
    setRequirementSummary(
      pickInitialString(d, 'requirementSummary', 'requirement_summary'),
    );
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;
    getCityOptionsForLeadForm()
      .then((opts) => {
        if (!cancelled && Array.isArray(opts)) setCityOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setCityOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!initialData || typeof initialData !== 'object') return;

    setBuildingName(initialData.buildingName ?? initialData.building_name ?? '');
    setCity(initialData.city ?? '');
    setFloor(initialData.floor ?? '');
    setUnitNumber(initialData.unitNumber ?? initialData.unit_number ?? '');
    setMicroMarket(initialData.microMarket ?? initialData.micro_market ?? '');
    setCarpetArea(
      String(
        initialData.carpetArea ??
          initialData.carpet_area ??
          initialData.estimated_carpet_area ??
          '',
      ),
    );
    setPerSftRate(String(initialData.perSftRate ?? initialData.per_sft_rate ?? ''));
    setTotalBudget(
      String(
        initialData.totalBudget ??
          initialData.total_budget ??
          initialData.total_d_and_b_budget ??
          '',
      ),
    );
    setDealSituation(initialData.dealSituation ?? initialData.deal_situation ?? '');
    setClientCompany(initialData.clientCompany ?? initialData.client_company ?? '');
    setContactPerson(initialData.contactPerson ?? initialData.contact_person ?? '');
    setPhone(initialData.phone ?? initialData.mobile_number ?? '');
    setEmail(initialData.email ?? initialData.email_id ?? '');
    setClientCity(initialData.clientCity ?? initialData.client_city ?? initialData.city ?? '');
    setRequirementSummary(initialData.requirementSummary ?? initialData.requirement_summary ?? '');
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;
    getClientCompanyOptionsForLeadForm()
      .then((opts) => {
        if (!cancelled && Array.isArray(opts)) setClientCompanyOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setClientCompanyOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialData || typeof initialData !== 'object') return;

    setBuildingName(initialData.buildingName ?? initialData.building_name ?? '');
    setCity(initialData.city ?? '');
    setFloor(initialData.floor ?? '');
    setUnitNumber(initialData.unitNumber ?? initialData.unit_number ?? '');
    setMicroMarket(initialData.microMarket ?? initialData.micro_market ?? '');
    setCarpetArea(String(initialData.carpetArea ?? initialData.estimated_carpet_area ?? ''));
    setPerSftRate(String(initialData.perSftRate ?? initialData.per_sft_rate ?? ''));
    setTotalBudget(String(initialData.totalBudget ?? initialData.total_d_and_b_budget ?? ''));
    setDealSituation(initialData.dealSituation ?? initialData.deal_situation ?? '');
    setClientCompany(initialData.clientCompany ?? initialData.client_company ?? '');
    setContactPerson(initialData.contactPerson ?? initialData.contact_person ?? '');
    setPhone(initialData.phone ?? initialData.mobile_number ?? '');
    setEmail(initialData.email ?? initialData.email_id ?? '');
    setClientCity(initialData.clientCity ?? initialData.client_city ?? initialData.city ?? '');
    setRequirementSummary(initialData.requirementSummary ?? initialData.requirement_summary ?? '');
  }, [initialData]);

  useEffect(() => {
    if (!clientCompany) {
      setIsCustomClientCompany(false);
      return;
    }
    const existsInOptions = clientCompanyOptions.some((opt) => opt.value === clientCompany);
    setIsCustomClientCompany(!existsInOptions);
  }, [clientCompany, clientCompanyOptions]);

  useEffect(() => {
    if (submitStatus === 'succeeded') {
      navigate('/submissions', { replace: true });
    }
  }, [submitStatus, navigate]);

  useEffect(() => {
    if (submitStatus === 'failed' && submitError) {
      showErrorToast(submitError, { defaultMessage: 'Failed to submit lead.' });
    }
  }, [submitStatus, submitError]);

  const handleNumericChange = useCallback((setter, e) => {
    const v = e.target.value;
    if (v === '' || /^[\d.,\s₹Cr]*$/.test(v)) setter(v);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedBuildingName = buildingName.trim();
    const trimmedCity = city.trim();
    const trimmedMicroMarket = microMarket.trim();
    const trimmedCarpetArea = carpetArea.trim();
    const trimmedPerSftRate = perSftRate.trim();
    const trimmedTotalBudget = totalBudget.trim();
    const trimmedClientCompany = clientCompany.trim();
    const trimmedContactPerson = contactPerson.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedClientCity = clientCity.trim();

    const validation = designBuildSchema.safeParse({
      buildingName: trimmedBuildingName,
      city: trimmedCity,
      microMarket: trimmedMicroMarket,
      carpetArea: trimmedCarpetArea,
      perSftRate: trimmedPerSftRate,
      totalBudget: trimmedTotalBudget,
      clientCompany: trimmedClientCompany,
      contactPerson: trimmedContactPerson,
      phone: trimmedPhone,
      email: trimmedEmail,
      clientCity: trimmedClientCity,
    });
    if (!validation.success) {
      setValidationErrors(getFieldErrorsFromIssues(validation.error.issues));
      return;
    }

    setValidationErrors({});
    const dealSituationLabel =
      DEAL_SITUATION_OPTIONS.find((o) => o.value === dealSituation)?.label ?? dealSituation;
    dispatch(
      submitLead({
        serviceType: 'Design and Build',
        buildingName: trimmedBuildingName,
        city: trimmedCity,
        floor: floor.trim(),
        unitNumber: unitNumber.trim(),
        microMarket: trimmedMicroMarket,
        carpetArea: trimmedCarpetArea,
        perSftRate: trimmedPerSftRate,
        totalBudget: trimmedTotalBudget,
        dealSituation: dealSituationLabel,
        clientCompany: trimmedClientCompany,
        contactPerson: trimmedContactPerson,
        phone: trimmedPhone,
        email: trimmedEmail,
        clientCity: trimmedClientCity,
        requirementSummary: requirementSummary.trim(),
      }),
    );
  }, [
    dispatch,
    buildingName,
    city,
    floor,
    unitNumber,
    microMarket,
    carpetArea,
    perSftRate,
    totalBudget,
    dealSituation,
    clientCompany,
    contactPerson,
    phone,
    email,
    clientCity,
    requirementSummary,
  ]);

  const isSubmitting = submitStatus === 'loading';

  return (
    <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-100 p-6">
      <div className="flex flex-col gap-8">
        {/* Section 1: Project Details */}
        <FormSection
          step={1}
          title="Project Details"
          subtitle="Site and budget details"
        >
          <div className="flex flex-col gap-5">
            <SubsectionTitle>SITE INFORMATION</SubsectionTitle>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FieldGroup label="Building Name" required>
                <Input.Root
                  className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                  hasError={Boolean(validationErrors.buildingName)}
                >
                  <Input.Wrapper>
                    <Input.Input
                      type="text"
                      placeholder="e.g. Prestige Tech Park"
                      value={buildingName}
                      onChange={(e) => {
                        setBuildingName(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, buildingName: undefined }));
                      }}
                    />
                  </Input.Wrapper>
                </Input.Root>
                <ErrorText>{validationErrors.buildingName}</ErrorText>
              </FieldGroup>

              <FieldGroup label="City" required>
                <Select.Root
                  value={city}
                  onValueChange={(value) => {
                    setCity(value);
                    setValidationErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                >
                  <Select.Trigger
                    className="w-full bg-bg-white-0 rounded-lg ring-1 ring-stroke-soft-200"
                    hasError={Boolean(validationErrors.city)}
                  >
                    <Select.Value placeholder="Select city..." />
                  </Select.Trigger>
                  <Select.Content>
                    {cityOptions.map((opt) => (
                      <Select.Item key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <ErrorText>{validationErrors.city}</ErrorText>
              </FieldGroup>

              <FieldGroup label="Floor" optional>
                <Input.Root className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200">
                  <Input.Wrapper>
                    <Input.Input
                      type="text"
                      placeholder="e.g. 4th Floor"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                    />
                  </Input.Wrapper>
                </Input.Root>
              </FieldGroup>

              <FieldGroup label="Unit Number" optional>
                <Input.Root className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200">
                  <Input.Wrapper>
                    <Input.Input
                      type="text"
                      placeholder="e.g. Unit 402"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                    />
                  </Input.Wrapper>
                </Input.Root>
              </FieldGroup>
            </div>

            <FieldGroup label="Micro Market" required>
              <Input.Root
                className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                hasError={Boolean(validationErrors.microMarket)}
              >
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    placeholder="e.g. Outer Ring Road, Whitefield"
                    value={microMarket}
                    onChange={(e) => {
                      setMicroMarket(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, microMarket: undefined }));
                    }}
                  />
                </Input.Wrapper>
              </Input.Root>
              <ErrorText>{validationErrors.microMarket}</ErrorText>
            </FieldGroup>

            <SubsectionTitle>BUDGET BREAKDOWN</SubsectionTitle>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <FieldGroup label="Estimated Carpet Area (SFT)" required>
                <Input.Root
                  className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                  hasError={Boolean(validationErrors.carpetArea)}
                >
                  <Input.Wrapper>
                    <Input.Input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 12000"
                      value={carpetArea}
                      onChange={(e) => {
                        handleNumericChange(setCarpetArea, e);
                        setValidationErrors((prev) => ({ ...prev, carpetArea: undefined }));
                      }}
                    />
                  </Input.Wrapper>
                </Input.Root>
                <ErrorText>{validationErrors.carpetArea}</ErrorText>
              </FieldGroup>

              <FieldGroup label="Per SFT Rate (₹)" required>
                <Input.Root
                  className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                  hasError={Boolean(validationErrors.perSftRate)}
                >
                  <Input.Wrapper>
                    <Input.Input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 2500"
                      value={perSftRate}
                      onChange={(e) => {
                        handleNumericChange(setPerSftRate, e);
                        setValidationErrors((prev) => ({ ...prev, perSftRate: undefined }));
                      }}
                    />
                  </Input.Wrapper>
                </Input.Root>
                <ErrorText>{validationErrors.perSftRate}</ErrorText>
              </FieldGroup>

              <FieldGroup label="Total D&B Budget (₹)" required>
                <Input.Root
                  className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                  hasError={Boolean(validationErrors.totalBudget)}
                >
                  <Input.Wrapper>
                    <Input.Input
                      type="text"
                      placeholder="e.g. ₹4.2 Cr"
                      value={totalBudget}
                      onChange={(e) => {
                        handleNumericChange(setTotalBudget, e);
                        setValidationErrors((prev) => ({ ...prev, totalBudget: undefined }));
                      }}
                    />
                  </Input.Wrapper>
                </Input.Root>
                <ErrorText>{validationErrors.totalBudget}</ErrorText>
              </FieldGroup>
            </div>
          </div>
        </FormSection>

        {/* Divider */}
        <hr className="border-0 border-t border-stroke-soft-200" />

        {/* Section 2: Deal Situation */}
        <FormSection
          step={2}
          title="Deal Situation"
          subtitle="Help us understand where you are in this deal"
        >
          <Radio.Group
            value={dealSituation}
            onValueChange={setDealSituation}
            className="flex flex-col gap-3"
          >
            {DEAL_SITUATION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-4 py-3 cursor-pointer hover:bg-bg-weak-50"
              >
                <Radio.Item value={opt.value} />
                <span className="text-paragraph-sm text-text-main-900">{opt.label}</span>
              </label>
            ))}
          </Radio.Group>
        </FormSection>

        {/* Divider */}
        <hr className="border-0 border-t border-stroke-soft-200" />

        {/* Section 3: Client Details */}
        <FormSection
          step={3}
          title="Client Details"
          subtitle="Required for D&B leads"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Client Company" required>
              {isCustomClientCompany ? (
                <Input.Root
                  className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                  hasError={Boolean(validationErrors.clientCompany)}
                >
                  <Input.Wrapper>
                    <Input.Input
                      autoFocus
                      type="text"
                      placeholder="Enter company name"
                      value={clientCompany}
                      onChange={(e) => {
                        setClientCompany(e.target.value);
                        setValidationErrors((prev) => ({ ...prev, clientCompany: undefined }));
                      }}
                      onBlur={() => {
                        const trimmed = clientCompany.trim();
                        if (!trimmed) {
                          setIsCustomClientCompany(false);
                        }
                      }}
                    />
                  </Input.Wrapper>
                </Input.Root>
              ) : (
                <Select.Root
                  value={clientCompany}
                  onValueChange={(value) => {
                    if (value === '__add_new__') {
                      setIsCustomClientCompany(true);
                      setClientCompany('');
                      return;
                    }
                    setClientCompany(value);
                    setValidationErrors((prev) => ({ ...prev, clientCompany: undefined }));
                  }}
                >
                  <Select.Trigger
                    className="w-full bg-bg-white-0 rounded-lg ring-1 ring-stroke-soft-200"
                    hasError={Boolean(validationErrors.clientCompany)}
                  >
                    <Select.Value placeholder="Select company..." />
                  </Select.Trigger>
                  <Select.Content>
                    {clientCompanyOptions.map((opt) => (
                      <Select.Item key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Item>
                    ))}
                    <Select.Item value="__add_new__">+ Add New Company</Select.Item>
                  </Select.Content>
                </Select.Root>
              )}
              <ErrorText>{validationErrors.clientCompany}</ErrorText>
            </FieldGroup>

            <FieldGroup label="Contact Person" required>
              <Input.Root
                className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                hasError={Boolean(validationErrors.contactPerson)}
              >
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    placeholder="e.g. Arvind Shetty"
                    value={contactPerson}
                    onChange={(e) => {
                      setContactPerson(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, contactPerson: undefined }));
                    }}
                  />
                </Input.Wrapper>
              </Input.Root>
              <ErrorText>{validationErrors.contactPerson}</ErrorText>
            </FieldGroup>

            <FieldGroup label="Phone" required>
              <Input.Root
                className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                hasError={Boolean(validationErrors.phone)}
              >
                <Input.Wrapper>
                  <Input.Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                  />
                </Input.Wrapper>
              </Input.Root>
              <ErrorText>{validationErrors.phone}</ErrorText>
            </FieldGroup>

            <FieldGroup label="Email" required>
              <Input.Root
                className="rounded-lg bg-bg-white-0 before:ring-stroke-soft-200"
                hasError={Boolean(validationErrors.email)}
              >
                <Input.Wrapper>
                  <Input.Input
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                  />
                </Input.Wrapper>
              </Input.Root>
              <ErrorText>{validationErrors.email}</ErrorText>
            </FieldGroup>
          </div>

          <div className="mt-1">
            <FieldGroup label="City" required>
              <Select.Root
                value={clientCity}
                onValueChange={(value) => {
                  setClientCity(value);
                  setValidationErrors((prev) => ({ ...prev, clientCity: undefined }));
                }}
              >
                <Select.Trigger
                  className="w-full bg-bg-white-0 rounded-lg ring-1 ring-stroke-soft-200"
                  hasError={Boolean(validationErrors.clientCity)}
                >
                  <Select.Value placeholder="Select city..." />
                </Select.Trigger>
                <Select.Content>
                  {cityOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <ErrorText>{validationErrors.clientCity}</ErrorText>
            </FieldGroup>
          </div>
        </FormSection>

        {/* Divider */}
        <hr className="border-0 border-t border-stroke-soft-200" />

        {/* Section 4: Notes */}
        <FormSection
          step={4}
          title="Notes"
          subtitle=""
        >
          <FieldGroup label="Requirement Summary" required>
            <Textarea.Root
              simple
              placeholder="Describe the client's key requirements, site details, urgency, or any important context..."
              value={requirementSummary}
              onChange={(e) => setRequirementSummary(e.target.value)}
              rows={4}
              className="min-h-28 w-full resize-y rounded-lg bg-bg-white-0 text-paragraph-sm"
            />
          </FieldGroup>
        </FormSection>

        {/* Submit */}
        <div className="flex flex-col items-end gap-2 pt-2">
          {submitError && (
            <p className="text-paragraph-sm text-error-500" role="alert">
              {submitError}
            </p>
          )}
          <Button.Root
            variant="primary"
            mode="filled"
            size="medium"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full px-5 flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit Lead'}</span>
            {!isSubmitting && <Button.Icon as={RiArrowRightSLine} />}
          </Button.Root>
        </div>
      </div>
    </div>
  );
};

export default DesignBuildLeadForm;
