import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Label from '@/components/ui/label';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import * as Textarea from '@/components/ui/textarea';
import * as Button from '@/components/ui/button';
import { RiArrowRightSLine } from 'react-icons/ri';
import { submitLead, resetSubmitState } from '@/redux/leadSubmitSlice';
import {
  selectLeadSubmitStatus,
  selectLeadSubmitError,
} from '@/redux/leadSubmitSlice';
import { getCityOptionsForLeadForm } from '@/services/dashboard-service';

const WORKSPACE_TYPES = [
  { value: 'managed_office', label: 'Managed Office' },
  { value: 'coworking', label: 'Coworking Space' },
  { value: 'hot_desk', label: 'Hot Desk' },
  { value: 'private_office', label: 'Private Office' },
];

const COWORKING_PRODUCTS = [
  { value: 'hot_desk', label: 'Hot Desk' },
  { value: 'private_office', label: 'Private Office' },
  { value: 'dedicated_desk', label: 'Dedicated Desk' },
  { value: 'team_space', label: 'Team Space' },
];

const DECISION_TIMELINES = [
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: '6_months', label: 'Within 6 months' },
  { value: 'flexible', label: 'Flexible' },
];

function SectionHeader({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-lighter text-label-sm font-semibold text-success-darker"
        aria-hidden
      >
        {number}
      </span>
      <div>
        <h2 className="text-label-lg font-semibold text-text-main-900">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-paragraph-sm text-text-sub-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
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

const ManagedOfficeLeadForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submitStatus = useSelector(selectLeadSubmitStatus);
  const submitError = useSelector(selectLeadSubmitError);

  const [workspaceType, setWorkspaceType] = useState('');
  const [productType, setProductType] = useState('');
  const [seats, setSeats] = useState('');
  const [microMarket, setMicroMarket] = useState('');
  const [area, setArea] = useState('');
  const [timeline, setTimeline] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [requirementSummary, setRequirementSummary] = useState('');
  const [cityOptions, setCityOptions] = useState([]);

  useEffect(() => {
    dispatch(resetSubmitState());
  }, [dispatch]);

  useEffect(() => {
    if (workspaceType !== 'coworking') setProductType('');
  }, [workspaceType]);

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
    if (submitStatus === 'succeeded') {
      navigate('/submissions', { replace: true });
    }
  }, [submitStatus, navigate]);

  const handleSeatsChange = useCallback((e) => {
    const v = e.target.value;
    if (v === '' || /^\d+$/.test(v)) setSeats(v);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!workspaceType?.trim() || !seats?.trim()) {
      return;
    }
    dispatch(
      submitLead({
        workspaceType: workspaceType.trim(),
        productType: showProductType ? productType.trim() : '',
        seats: seats.trim(),
        microMarket: microMarket.trim(),
        area: area.trim(),
        timeline: timeline.trim(),
        clientCompany: clientCompany.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        requirementSummary: requirementSummary.trim(),
      }),
    );
  }, [
    dispatch,
    workspaceType,
    productType,
    seats,
    microMarket,
    area,
    timeline,
    clientCompany,
    contactPerson,
    phone,
    email,
    city,
    requirementSummary,
  ]);

  const isSubmitting = submitStatus === 'loading';
  const showProductType = workspaceType === 'coworking';

  const inputTriggerClass = 'w-full bg-bg-white-0 rounded-lg ring-1 ring-stroke-soft-200';
  const inputRootClass = 'rounded-lg bg-bg-white-0 before:ring-stroke-soft-200';

  return (
    <div className="rounded-xl border border-stroke-soft-200 bg-[#F6F8FB] p-6">
      <div className="space-y-10">
        {/* Section 1: Requirement Details */}
        <div className="space-y-6">
          <SectionHeader
            number="1"
            title="Requirement Details"
            subtitle="Tell us about the workspace need"
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FieldGroup label="Workspace Requirement Type" required>
              <Select.Root value={workspaceType} onValueChange={setWorkspaceType}>
                <Select.Trigger className={inputTriggerClass}>
                  <Select.Value placeholder="Select type…" />
                </Select.Trigger>
                <Select.Content>
                  {WORKSPACE_TYPES.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </FieldGroup>

            {showProductType && (
              <FieldGroup label="Product Type" required>
                <Select.Root value={productType} onValueChange={setProductType}>
                  <Select.Trigger className={inputTriggerClass}>
                    <Select.Value placeholder="Select product…" />
                  </Select.Trigger>
                  <Select.Content>
                    {COWORKING_PRODUCTS.map((opt) => (
                      <Select.Item key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </FieldGroup>
            )}

            <FieldGroup label="Number of Seats" required>
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 80"
                    value={seats}
                    onChange={handleSeatsChange}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <FieldGroup label="Micro Market" optional>
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    placeholder="e.g. Whitefield, Bandra Kurla"
                    value={microMarket}
                    onChange={(e) => setMicroMarket(e.target.value)}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <FieldGroup label="Area" optional>
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    placeholder="e.g. 5600 sq ft"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <FieldGroup label="Expected Decision Timeline">
              <Select.Root value={timeline} onValueChange={setTimeline}>
                <Select.Trigger className={inputTriggerClass}>
                  <Select.Value placeholder="Select timeline…" />
                </Select.Trigger>
                <Select.Content>
                  {DECISION_TIMELINES.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </FieldGroup>
          </div>
        </div>

        {/* Section 2: Client Information */}
        <div className="space-y-6">
          <SectionHeader
            number="2"
            title="Client Information"
            subtitle="Optional – fill what you know"
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FieldGroup label="Client Company">
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    placeholder="e.g. Tata Elxsi"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <FieldGroup label="Contact Person">
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="text"
                    placeholder="e.g. Anita Sharma"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <FieldGroup label="Phone">
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <FieldGroup label="Email">
              <Input.Root className={inputRootClass}>
                <Input.Wrapper>
                  <Input.Input
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Input.Wrapper>
              </Input.Root>
            </FieldGroup>

            <div className="md:col-span-2">
              <FieldGroup label="City">
                <Select.Root value={city} onValueChange={setCity}>
                  <Select.Trigger className={inputTriggerClass}>
                    <Select.Value placeholder="Select city…" />
                  </Select.Trigger>
                  <Select.Content>
                    {cityOptions.map((opt) => (
                      <Select.Item key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </FieldGroup>
            </div>
          </div>
        </div>

        {/* Section 3: Notes */}
        <div className="space-y-6">
          <SectionHeader number="3" title="Notes" />
          <FieldGroup label="Requirement Summary" optional>
            <Textarea.Root
              simple
              placeholder="Briefly describe the client's key requirements, urgency, or any important context…"
              value={requirementSummary}
              onChange={(e) => setRequirementSummary(e.target.value)}
              rows={4}
              className="min-h-[110px] w-full resize-none rounded-lg bg-bg-white-0 text-paragraph-sm"
            />
          </FieldGroup>
        </div>

        {/* Submit error */}
        {submitError && (
          <p className="text-paragraph-sm text-error-500" role="alert">
            {submitError}
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
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

export default ManagedOfficeLeadForm;
