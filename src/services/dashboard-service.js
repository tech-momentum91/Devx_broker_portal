/**
 * Dashboard service – filter options and lead submissions.
 * Uses mock data when USE_MOCK is true. When API is ready:
 * 1. Set USE_MOCK to false (or remove and call API functions directly).
 * 2. Implement the fetch*FromApi functions with real endpoints.
 * 3. Ensure API response shapes match the types below; normalizeLeadSubmission maps API → UI.
 */

// ---------------------------------------------------------------------------
// Config – switch to API by setting USE_MOCK = false and implementing fetch*FromApi
// ---------------------------------------------------------------------------

import apiClient from '@/api/axios';
import { City } from 'country-state-city';

const USE_MOCK = false;
const MOCK_DELAY_MS = 300;

// ---------------------------------------------------------------------------
// Constants (shared by mock and API response handling)
// ---------------------------------------------------------------------------

/** Static dashboard status filter options (no API call). */
const DASHBOARD_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Static dashboard city filter options (no API call). */
const DASHBOARD_CITY_OPTIONS = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'hyderabad', label: 'Hyderabad' },
];

export const LEAD_STATUS = {
  IN_DISCUSSION: 'in_discussion',
  LEAD_SUBMITTED: 'lead_submitted',
  DROPPED: 'dropped',
  WON: 'won',
};

export const SUBMISSION_SERVICE_TYPE = {
  MANAGED_OFFICE: 'Managed Office',
  COWORKING_SPACE: 'Coworking Space',
  DESIGN_BUILD: 'Design & Build',
};

/** CRM stages API – optional `pipeline` = CRM Stages Pipeline document name */
const CRM_STAGES_API =
  '/method/devx.devx_crm.doctype.crm_status_master.crm_status_master.get_crm_stages';

const CRM_STAGES_ALL_PIPELINES_API =
  '/method/devx.devx_crm.doctype.crm_status_master.crm_status_master.get_crm_stages_all_pipelines';

// ---------------------------------------------------------------------------
// Error handling – consistent shape for Redux rejectWithValue
// ---------------------------------------------------------------------------

/**
 * Serializes an error so the UI can show a string message.
 * When API is ready: error.response?.data may contain { message, code }.
 * @param {unknown} error
 * @returns {string}
 */
function serializeError(error) {
  if (error == null) return 'An error occurred';
  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string') return error.message;
  if (error?.response?.data != null) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (typeof data?.message === 'string') return data.message;
  }
  return 'An error occurred';
}

// ---------------------------------------------------------------------------
// Normalizer – single place to map API response → UI shape (used by mock and API)
// ---------------------------------------------------------------------------

/** Format API creation datetime for display (e.g. "2026-03-10 10:40:57" -> "Mar 10, 2026"). */
function formatCreationDate(value) {
  if (value == null || value === '') return '-';
  const s = String(value).trim();
  if (!s) return '-';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return s;
  }
}

/**
 * Normalizes a lead submission from API shape to UI shape.
 * When API is ready, ensure your API returns (or we map) fields that match the keys below.
 * @param {object} item - Raw submission (API or mock)
 * @returns {object|null} Normalized submission for LeadSubmissionCard / lead detail page
 */
/** Format budget/deal value for display (number -> "₹X Cr" or "₹X L"). */
function formatBudgetDisplay(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(1)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(1)} L`;
  return `₹${num.toLocaleString()}`;
}

export function normalizeLeadSubmission(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.name ?? '';
  const companyName = String(item.company_name ?? item.company ?? '').trim() || '-';
  const initial = companyName !== '-' ? companyName.charAt(0).toUpperCase() : '?';
  const rawDate = item.date ?? item.submission_date ?? item.creation;
  const areaSqFt = item.area_sqft ?? item.area ?? item.carpet_area ?? item.estimated_carpet_area_sft ?? 0;
  const budgetRaw = item.total_dnb_budget_lead ?? item.total_dnb_budget ?? item.estimated_budget;
  const dealValueRaw = item.deal_value;
  return {
    id: String(id),
    companyName,
    initial,
    serviceType: item.service_type ?? item.office_type ?? item.type ?? '-',
    city: item.city ?? item.location ?? '-',
    date: rawDate ? formatCreationDate(rawDate) : '-',
    seats: item.seats ?? item.no_of_seats ?? 0,
    areaSqFt: Number(areaSqFt) || 0,
    status: item.status ?? item.lead_status ?? 'lead_submitted',
    life_cycle_stage_status: item.life_cycle_stage_status ?? item.lifecycle_stage_status ?? null,
    stage_color:
      item.stage_color ??
      item.stage_color_hex ??
      item.life_cycle_stage_status_color ??
      item.lifecycle_stage_status_color ??
      item.lifecycle_stage_color ??
      null,
    budget: formatBudgetDisplay(budgetRaw) ?? null,
    dealValue: formatBudgetDisplay(dealValueRaw) ?? null,
    workspace_requirement_type: item.workspace_requirement_type ?? item.product ?? '-',
    /** CRM Stages Pipeline doc name for get_crm_stages */
    pipelineId: item.pipeline_id ?? item.pipeline?.pipeline_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_LEAD_SUBMISSIONS = [
  {
    id: '1',
    company_name: 'Tata Elxsi',
    service_type: 'Managed Office',
    city: 'Bangalore',
    date: 'Feb 21, 2026',
    seats: 120,
    area_sqft: 8400,
    status: 'dropped',
    dropReason: 'Lost to Competitor',
  },
  {
    id: '2',
    company_name: 'Swiggy Instamart',
    service_type: 'Managed Office',
    city: 'Hyderabad',
    date: 'Feb 17, 2026',
    seats: 80,
    area_sqft: 5600,
    status: 'lead_submitted',
  },
  {
    id: '3',
    company_name: 'Zomato',
    service_type: 'Managed Office',
    city: 'Mumbai',
    date: 'Feb 15, 2026',
    seats: 150,
    area_sqft: 10500,
    status: 'dropped',
  },
  {
    id: '4',
    company_name: 'Myntra',
    service_type: 'Coworking Space',
    city: 'Bangalore',
    date: 'Feb 10, 2026',
    seats: 60,
    area_sqft: 4200,
    status: 'won',
  },
  {
    id: '5',
    company_name: 'TechCorp Solutions',
    service_type: 'Design & Build',
    city: 'Chennai',
    date: 'Feb 28, 2026',
    seats: 200,
    area_sqft: 12000,
    status: 'lead_submitted',
  },
  {
    id: '6',
    company_name: 'Global Innovations',
    service_type: 'Managed Office',
    city: 'Delhi',
    date: 'Mar 01, 2026',
    seats: 95,
    area_sqft: 6650,
    status: 'in_discussion',
  },
];

/** Mock lead details for LeadDetailPage (normalized UI shape). Keyed by id for lookup. */
const MOCK_LEAD_DETAILS_BY_ID = {
  '1': {
    id: '1',
    companyName: 'Tata Elxsi',
    serviceType: 'Managed Office',
    city: 'Bangalore',
    contactPerson: 'Priya Sharma',
    email: 'priya@tataelxsi.com',
    phone: '+91 98200 11234',
    status: 'In Discussion',
    source: 'Direct Referral',
    submittedDate: 'Feb 21, 2026',
    lastUpdated: 'Feb 23, 2026',
    requirementType: 'Managed Office',
    seats: 120,
    areaSqFt: 8400,
    timeline: 'Q2 2026',
    requirementSummary:
      'Tata Elxsi requires a fully managed office for 120 seats in Bangalore. Preference for a premium location near Whitefield or Electronic City.',
    estimatedBudget: '₹1.2 Cr / year',
    totalDnbBudget: null,
  },
  '2': {
    id: '2',
    companyName: 'Swiggy Instamart',
    serviceType: 'Managed Office',
    city: 'Hyderabad',
    contactPerson: 'Kiran Rao',
    email: 'kiran@swiggy.in',
    phone: '+91 93400 88765',
    status: 'Lead',
    source: 'Partner Network',
    submittedDate: 'Feb 17, 2026',
    lastUpdated: 'Feb 17, 2026',
    requirementType: 'Managed Office',
    seats: 80,
    areaSqFt: 5600,
    timeline: 'Q3 2026',
    requirementSummary:
      'Swiggy Instamart is looking for a managed office in Hyderabad for their operations team. Close to Hitech City preferred.',
    estimatedBudget: '₹72L / year',
    totalDnbBudget: null,
  },
  '3': {
    id: '3',
    companyName: 'Zepto HQ',
    serviceType: 'Coworking Space',
    city: 'Mumbai',
    contactPerson: 'Amara Nair',
    email: 'amara@zepto.com',
    phone: '+91 91234 56700',
    status: 'Dropped',
    source: 'Direct Referral',
    submittedDate: 'Feb 14, 2026',
    lastUpdated: 'Feb 19, 2026',
    requirementType: 'Coworking Space',
    seats: 150,
    areaSqFt: 10500,
    timeline: 'Q1 2026',
    requirementSummary:
      'Zepto was evaluating coworking options in BKC, Mumbai. Client deprioritised the project due to internal budget freeze.',
    estimatedBudget: '₹1.5 Cr / year',
    totalDnbBudget: null,
    dropReason:
      'Client put expansion on hold due to an internal budget freeze for Q1 2026. May revisit in Q3.',
    lossReason:
      'Client put expansion on hold due to an internal budget freeze for Q1 2026. May revisit in Q3.',
  },
  '4': {
    id: '4',
    companyName: 'Myntra Logistics',
    serviceType: 'Managed Office',
    city: 'Bangalore',
    contactPerson: 'Sanjay Verma',
    email: 'sanjay@myntra.com',
    phone: '+91 88001 23456',
    status: 'Won',
    source: 'Partner Network',
    submittedDate: 'Feb 10, 2026',
    lastUpdated: 'Feb 20, 2026',
    requirementType: 'Managed Office',
    seats: 60,
    areaSqFt: 4200,
    timeline: 'Q1 2026',
    requirementSummary:
      'Myntra Logistics secured a managed office in Bangalore for their supply chain team. Deal closed successfully.',
    estimatedBudget: '₹54L / year',
    totalDnbBudget: null,
  },
  '5': {
    id: '5',
    companyName: 'Peenya Manufacturing Hub',
    serviceType: 'Design & Build',
    city: 'Bangalore',
    contactPerson: 'Arvind Shetty',
    email: 'arvind@peenya.com',
    phone: '+91 98100 00042',
    status: 'Engagement',
    source: 'Direct Referral',
    submittedDate: 'Feb 19, 2026',
    lastUpdated: 'Feb 23, 2026',
    requirementType: 'Design & Build',
    seats: 0,
    areaSqFt: 26000,
    timeline: 'Q2 2026',
    requirementSummary:
      'Client requires a premium D&B office space for a new manufacturing HQ in Peenya. High-priority project with exec sponsorship and board-level visibility.',
    estimatedBudget: '₹8.8 Cr',
    totalDnbBudget: 88000000,
    brand: 'DevX',
    dealValue: '₹8.8 Cr',
    commissionRange: '₹17.5L – ₹43.8L',
    milestoneMeetingDone: true,
    milestoneRequirementsReceived: true,
    milestoneLOISigned: true,
  },
  '6': {
    id: '6',
    companyName: 'Razorpay',
    serviceType: 'Design & Build',
    city: 'Bangalore',
    contactPerson: 'Deepa Iyer',
    email: 'deepa@razorpay.com',
    phone: '+91 87654 32109',
    status: 'Design Won',
    source: 'Direct Referral',
    submittedDate: 'Feb 15, 2026',
    lastUpdated: 'Feb 22, 2026',
    requirementType: 'Design & Build',
    seats: 0,
    areaSqFt: 12000,
    timeline: 'Q1 2026',
    requirementSummary:
      'Full office fit-out for Razorpay\'s new Bangalore HQ. Modern open-plan with breakout zones, cafeteria, and 3 boardrooms.',
    estimatedBudget: '₹4.2 Cr',
    totalDnbBudget: 42000000,
    brand: 'DevX',
    dealValue: '₹4.2 Cr',
    commissionRange: '₹8.4L – ₹21L',
    milestoneMeetingDone: true,
    milestoneRequirementsReceived: true,
    milestoneLOISigned: true,
  },
};

const STATUS_FILTER_MAP = {
  active: ['in_discussion', 'lead_submitted'],
  pending: ['lead_submitted'],
  completed: ['won'],
  cancelled: ['dropped'],
  in_discussion: ['in_discussion'],
  lead_submitted: ['lead_submitted'],
  dropped: ['dropped'],
  won: ['won'],
};

function applyTabFilter(data, tab) {
  if (tab === 'managed') {
    return data.filter(
      (s) =>
        s.serviceType === SUBMISSION_SERVICE_TYPE.MANAGED_OFFICE ||
        s.serviceType === SUBMISSION_SERVICE_TYPE.COWORKING_SPACE,
    );
  }
  if (tab === 'design') {
    return data.filter((s) => s.serviceType === SUBMISSION_SERVICE_TYPE.DESIGN_BUILD);
  }
  return data;
}

function applyStatusFilter(data, statusList) {
  if (!Array.isArray(statusList) || statusList.length === 0) return data;
  const allowed = new Set(statusList.flatMap((s) => STATUS_FILTER_MAP[s] ?? [s]));
  return data.filter((item) => allowed.has(item.status));
}

function applyCityFilter(data, cityList) {
  if (!Array.isArray(cityList) || cityList.length === 0) return data;
  const allowed = new Set(cityList.map((c) => String(c).toLowerCase()));
  return data.filter((item) => allowed.has(String(item.city).toLowerCase()));
}

// ---------------------------------------------------------------------------
// API layer (stubs – implement with real fetch when backend is ready)
// ---------------------------------------------------------------------------

/**
 * Fetch status filter options from CRM stages API (apply_to_external = true).
 * Maps each stage to { value, label } for the dashboard filter.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function fetchStatusOptionsFromApi() {
  try {
    const stages = await getCrmStagesForExternal();
    if (!Array.isArray(stages) || stages.length === 0) return DASHBOARD_STATUS_OPTIONS;
    return stages.map((s) => {
    const label = (s.stage ?? s.name ?? '').trim() || '—';
    const value =
      (s.stage ?? s.name ?? '').trim() ||
      (Array.isArray(s.crm_stage_status)?.[0]?.status ?? '').trim() ||
      label;
    return { value, label };
  });
  } catch {
    return DASHBOARD_STATUS_OPTIONS;
  }
}

/**
 * City options – same source as devx_frontend create-new-cp-contact-modal (dynamic from API).
 * Uses get_cp_contact_filter_options only; backend has no get_city_options.
 */
const CP_CONTACT_FILTER_OPTIONS_API = '/method/devx.channel_partner.api.channel_partner.get_cp_contact_filter_options';

function normalizeCityOption(item) {
  if (typeof item === 'string')
    return { value: item.toLowerCase().replace(/\s+/g, '_'), label: item };
  const label = item.label ?? item.name ?? item.value ?? item.city ?? '';
  const value = (item.value ?? item.name ?? label ?? '').toString().trim();
  return { value: value || label, label: String(label).trim() || value };
}

function getAllIndiaCityOptions() {
  const cities = City.getCitiesOfCountry('IN');
  if (!Array.isArray(cities) || cities.length === 0) return [];

  const seen = new Set();
  const options = [];
  cities.forEach((city) => {
    const label = String(city?.name ?? '').trim();
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ value: label, label });
  });

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Fetch city filter options from API (same as devx_frontend CP contact modal).
 * Uses get_cp_contact_filter_options; falls back to static list if API fails or returns no cities.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function fetchCityOptionsFromApi() {
  const allIndiaCities = getAllIndiaCityOptions();
  try {
    const res = await apiClient.post(CP_CONTACT_FILTER_OPTIONS_API, { centers: [] });
    const data = res?.data?.message ?? res?.data;
    const list = Array.isArray(data?.city) ? data.city : [];
    if (list.length > 0) {
      const apiCities = list.map(normalizeCityOption).filter((o) => o.value && o.label);
      const merged = [...apiCities, ...allIndiaCities];
      const seen = new Set();
      return merged.filter((opt) => {
        const key = String(opt?.label ?? '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  } catch {
    // fallback to full dynamic India city list
  }
  return allIndiaCities.length > 0 ? allIndiaCities : DASHBOARD_CITY_OPTIONS;
}

/**
 * Map API summary shape (snake_case) to UI shape (camelCase) for dashboard cards.
 * @param {object} summary - API summary from get_leads_for_cp_contact
 * @returns {object|null}
 */
function mapApiSummaryToCounts(summary) {
  if (!summary || typeof summary !== 'object') return null;
  const m = summary.managed ?? summary.Managed;
  const d = summary.design_build ?? summary.designBuild;
  return {
    managed: m
      ? {
          totalSubmissions: Number(m.total_submissions ?? m.totalSubmissions) ?? 0,
          active: Number(m.active) ?? 0,
          won: Number(m.won) ?? 0,
          droppedRejected: Number(m.dropped_rejected ?? m.droppedRejected) ?? 0,
        }
      : null,
    designBuild: d
      ? {
          phiTotal: Number(d.phi_total ?? d.phiTotal) ?? 0,
          active: Number(d.active) ?? 0,
          designWon: Number(d.design_won ?? d.designWon) ?? 0,
          executionWon: Number(d.execution_won ?? d.executionWon) ?? 0,
          milestoneBonusEarned:
            d.milestone_bonus_earned ?? d.milestoneBonusEarned ?? '—',
          commissionEligibleDeals:
            Number(d.commission_eligible_deals ?? d.commissionEligibleDeals) ?? 0,
        }
      : null,
  };
}

/**
 * Fetch lead submissions from API: devx.channel_partner.api.lead.get_leads_for_cp_contact
 * Returns leads where custom_cp_contact_user = logged-in user, filtered by tab (custom_service_type) and optional status/city.
 * Also returns summary counts for Managed Office and Design & Build dashboard cards when API includes summary.
 * @param {{ tab: string, filters: { status?: string[], city?: string[] } }} params
 * @returns {Promise<{ data: object[], managedCount: number, designCount: number, summary?: object }>}
 */
async function fetchLeadSubmissionsFromApi({ tab = 'managed', filters = {} } = {}) {
  const params = {};
  if (tab) params.tab = tab;
  if (Array.isArray(filters.status) && filters.status.length)
    params.status = filters.status.join(',');
  if (Array.isArray(filters.city) && filters.city.length)
    params.city = filters.city.join(',');

  const res = await apiClient.get('/method/devx.channel_partner.api.lead.get_leads_for_cp_contact', {
    params,
  });
  let body = res?.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (body?.exc) throw new Error(body.message || body.exc);

  // Frappe wraps whitelist return value in .message; support both shapes
  const json = body && (body.message !== undefined ? body.message : body);

  const raw = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : [];
  const data = raw.map(normalizeLeadSubmission).filter(Boolean);
  const summary = mapApiSummaryToCounts(json?.summary);
  return {
    data,
    managedCount: Number(json?.managed_count ?? json?.managedCount) ?? 0,
    designCount: Number(json?.design_count ?? json?.designCount) ?? 0,
    ...(summary ? { summary: { counts: summary } } : {}),
  };
}

function isCrmStageApplyToExternal(item) {
  const v = item?.apply_to_external;
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

/** Stages with apply_to_external, ordered by stage_index. */
function filterStagesForBrokerExternal(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .filter(isCrmStageApplyToExternal)
    .sort((a, b) => (a?.stage_index ?? 0) - (b?.stage_index ?? 0));
}

/**
 * Fetches CRM stages and returns only those with apply_to_external = true.
 * @param {string|null|undefined} pipeline - CRM Stages Pipeline document name (same as CRM Lead.pipeline)
 * @returns {Promise<Array<{ name, stage, stage_index, color, apply_to_external, crm_stage_status }>>}
 */
export async function getCrmStagesForExternal(pipeline) {
  const pid = pipeline != null && String(pipeline).trim() !== '' ? String(pipeline).trim() : undefined;
  const res = await apiClient.post(CRM_STAGES_API, pid ? { pipeline: pid } : {});
  const raw = res?.data?.message ?? res?.data;
  return filterStagesForBrokerExternal(raw);
}

/**
 * One request: all pipelines with full stage docs; returns map pipeline doc name → external stages.
 * @returns {Promise<Record<string, Array>>}
 */
export async function getCrmStagesAllPipelinesForExternal() {
  const res = await apiClient.post(CRM_STAGES_ALL_PIPELINES_API, {});
  const raw = res?.data?.message ?? res?.data;
  const pipelines = Array.isArray(raw) ? raw : [];
  /** @type {Record<string, unknown[]>} */
  const byPipeline = {};
  for (const pl of pipelines) {
    const id = pl?.name;
    if (!id) continue;
    byPipeline[id] = filterStagesForBrokerExternal(pl.stages);
  }
  return byPipeline;
}

// ---------------------------------------------------------------------------
// Mock implementations
// ---------------------------------------------------------------------------

async function getStatusOptionsMock() {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return DASHBOARD_STATUS_OPTIONS;
}

async function getCityOptionsMock() {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return DASHBOARD_CITY_OPTIONS;
}

/**
 * @param {{ tab: string, filters: { status?: string[], city?: string[] } }} params
 * @returns {Promise<{ data: object[], managedCount: number, designCount: number }>}
 */
async function getLeadSubmissionsMock({ tab = 'managed', filters = {} } = {}) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const statusList = Array.isArray(filters.status) ? filters.status : [];
  const cityList = Array.isArray(filters.city) ? filters.city : [];

  let data = MOCK_LEAD_SUBMISSIONS.map(normalizeLeadSubmission).filter(Boolean);
  data = applyTabFilter(data, tab);
  data = applyStatusFilter(data, statusList);
  data = applyCityFilter(data, cityList);

  const managedCount = MOCK_LEAD_SUBMISSIONS.filter(
    (s) =>
      s.service_type === SUBMISSION_SERVICE_TYPE.MANAGED_OFFICE ||
      s.service_type === SUBMISSION_SERVICE_TYPE.COWORKING_SPACE,
  ).length;
  const designCount = MOCK_LEAD_SUBMISSIONS.filter(
    (s) => s.service_type === SUBMISSION_SERVICE_TYPE.DESIGN_BUILD,
  ).length;

  return { data, managedCount, designCount };
}

// ---------------------------------------------------------------------------
// Public API – use try/catch and single place to switch mock vs API
// ---------------------------------------------------------------------------

/**
 * Returns dashboard status filter options.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function getDashboardStatusOptions() {
  try {
    if (USE_MOCK) return await getStatusOptionsMock();
    return await fetchStatusOptionsFromApi();
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

/**
 * Returns dashboard city filter options.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function getDashboardCityOptions() {
  try {
    //if (USE_MOCK) return await getCityOptionsMock();
    return await fetchCityOptionsFromApi();
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

/**
 * Returns city options for lead forms (Managed Office & Design & Build).
 * Uses the same API as dashboard filter; use this in submit-lead forms for dynamic city dropdown.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function getCityOptionsForLeadForm() {
  return getDashboardCityOptions();
}

/**
 * Returns client company suggestions for lead forms.
 * User can still type a new company name not in this list.
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function getClientCompanyOptionsForLeadForm() {
  try {
    const { data } = await apiClient.get(
      '/method/devx.devx_crm.api.crm_account.get_crm_account_options',
    );
    const rows = Array.isArray(data?.message) ? data.message : Array.isArray(data) ? data : [];
    const seen = new Set();
    const options = [];
    rows.forEach((row) => {
      const label = String(row?.label ?? row?.customer_name ?? row?.value ?? '').trim();
      if (!label || label === '-') return;
      const key = label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ value: label, label });
    });
    return options.sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

/**
 * Fetches lead submissions for the dashboard (API: get_leads_for_cp_contact by logged-in user).
 * @param {object} [params]
 * @param {string} [params.tab] - 'managed' | 'design' (maps to Lead custom_service_type)
 * @param {object} [params.filters] - { status?: string[], city?: string[] }
 * @returns {Promise<{ data: object[], managedCount: number, designCount: number }>}
 */
export async function getLeadSubmissions({ tab = 'managed', filters = {} } = {}) {
  try {
    if (USE_MOCK) return await getLeadSubmissionsMock({ tab, filters });
    return await fetchLeadSubmissionsFromApi({ tab, filters });
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

// ---------------------------------------------------------------------------
// Lead by ID (detail page) – API: get_lead_by_id
// ---------------------------------------------------------------------------

/**
 * Normalizes API lead detail response to UI shape for LeadDetailPage.
 * @param {object} raw - Response from get_lead_by_id
 * @returns {object|null}
 */
export function normalizeLeadDetail(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const creation = raw.creation ?? raw.submitted_date;
  const modified = raw.modified ?? raw.last_updated ?? creation;
  return {
    id: raw.name ?? '',
    companyName: (raw.company_name ?? '').trim() || '-',
    contactPerson: (raw.contact_person ?? raw.first_name ?? '').trim() || '—',
    email: (raw.email ?? raw.email_id ?? '').trim() || '—',
    phone: (raw.phone ?? raw.mobile_no ?? '').trim() || '—',
    city: (raw.city ?? '').trim() || '—',
    status: (raw.status ?? 'Lead').trim(),
    life_cycle_stage_status: (raw.life_cycle_stage_status ?? raw.status ?? '').trim() || null,
    lifecycle_stage: (raw.lifecycle_stage ?? '').trim() || null,
    stage_color: (raw.stage_color ?? '').trim() || null,
    source: (raw.source ?? '').trim() || '—',
    submittedDate: creation ? formatCreationDate(creation) : '—',
    lastUpdated: modified ? formatCreationDate(modified) : '—',
    serviceType: (raw.service_type ?? '').trim() || '—',
    requirementType: (raw.workspace_requirement_type ?? raw.service_type ?? '').trim() || '—',
    seats: raw.no_of_seats ?? 0,
    areaSqFt: raw.area_sqft != null ? Number(raw.area_sqft) : 0,
    timeline: (raw.expected_decision_timeline ?? '').trim() || '—',
    requirementSummary: (raw.requirement_summary ?? raw.notes_mo ?? '').trim() || '—',
    estimatedBudget: raw.estimated_budget ?? null,
    totalDnbBudget: raw.total_dnb_budget,
    perSftRate: raw.per_sft_rate,
    buildingName: (raw.building_name ?? '').trim() || '—',
    floor: (raw.floor ?? '').trim() || '—',
    unitNumber: (raw.unit_number ?? '').trim() || '—',
    microMarketMo: (raw.micro_market_mo ?? '').trim() || '—',
    microMarketDb: (raw.micro_market_db ?? '').trim() || '—',
    estimatedCarpetArea: String(raw.estimated_carpet_area ?? '').trim() || '—',
    dealSituation: (raw.deal_situation ?? '').trim() || '—',
    // Lead detail page: drop/loss reason, brand, Design & Build fields
    dropReason: raw.drop_reason ?? null,
    lossReason: raw.loss_reason ?? raw.drop_reason ?? null,
    brand: (raw.brand ?? '').trim() || null,
    dealValue: raw.deal_value ?? null,
    commissionRange: raw.commission_range ?? null,
    milestoneMeetingDone: raw.milestone_meeting_done ?? false,
    milestoneRequirementsReceived: raw.milestone_requirements_received ?? false,
    milestoneLOISigned: raw.milestone_loi_signed ?? false,
    /** From get_lead_by_id: pipeline progress + pipeline_id for stage API */
    pipeline:
      raw.pipeline && typeof raw.pipeline === 'object' ? raw.pipeline : null,
  };
}

/**
 * Fetches full lead details by id (Lead name). API: devx.channel_partner.api.lead.get_lead_by_id
 * @param {string} leadName - Lead doc name (e.g. CRM-LEAD-2026-00002)
 * @returns {Promise<object>} Normalized lead detail for UI
 */
export async function getLeadById(leadName) {
  const id = leadName && String(leadName).trim();
  if (!id) {
    throw new Error('Lead ID is required');
  }

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    const mock = MOCK_LEAD_DETAILS_BY_ID[id] ?? Object.values(MOCK_LEAD_DETAILS_BY_ID)[0];
    if (!mock) throw new Error('Lead not found');
    return { ...mock };
  }

  try {
    const res = await apiClient.get('/method/devx.channel_partner.api.lead.get_lead_by_id', {
      params: { lead_name: id },
    });
    let body = res?.data;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }
    if (body?.exc) throw new Error(body.message || body.exc);
    const json = body && (body.message !== undefined ? body.message : body);
    return normalizeLeadDetail(json);
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

// ---------------------------------------------------------------------------
// Lead activities (comments / conversation) – API: get_lead_activities, add_lead_comment
// ---------------------------------------------------------------------------

/**
 * Fetches comments and activity history for a lead. API: devx.channel_partner.api.lead.get_lead_activities
 * @param {string} leadName - Lead doc name
 * @returns {Promise<{ comments: Array<{ name, content, owner, creation, from: 'Partner'|'Team' }>, history: Array }>}
 */
export async function getLeadActivities(leadName) {
  const id = leadName && String(leadName).trim();
  if (!id) throw new Error('Lead ID is required');

  try {
    const res = await apiClient.get('/method/devx.channel_partner.api.lead.get_lead_activities', {
      params: { lead_name: id },
    });
    let body = res?.data;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }
    if (body?.exc) throw new Error(body.message || body.exc);
    const json = body && (body.message !== undefined ? body.message : body);
    return {
      comments: Array.isArray(json?.comments) ? json.comments : [],
      history: Array.isArray(json?.history) ? json.history : [],
    };
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

/**
 * Adds a comment to a lead (broker message). API: devx.channel_partner.api.lead.add_lead_comment
 * @param {string} leadName - Lead doc name
 * @param {string} content - Comment text
 * @returns {Promise<{ name: string, message: string }>}
 */
export async function addLeadComment(leadName, content, attachments = []) {
  const id = leadName && String(leadName).trim();
  const text = content != null ? String(content).trim() : '';
  if (!id) throw new Error('Lead ID is required');
  if (!text) throw new Error('Comment cannot be empty');

  try {
    const hasFiles = Array.isArray(attachments) && attachments.length > 0;
    const payload = hasFiles ? new FormData() : { lead_name: id, content: text };
    if (hasFiles) {
      payload.append('lead_name', id);
      payload.append('content', text);
      attachments.forEach((att) => {
        if (att?.file instanceof File) {
          payload.append('attachments', att.file, att.name || att.file.name);
        }
      });
    }

    const res = await apiClient.post('/method/devx.channel_partner.api.lead.add_lead_comment', payload);
    let data = res?.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        data = null;
      }
    }
    if (data?.exc) throw new Error(data.message || data.exc);
    const out = data?.message ?? data;
    return { name: out?.name, message: out?.message ?? 'Comment added' };
  } catch (error) {
    throw new Error(serializeError(error));
  }
}
