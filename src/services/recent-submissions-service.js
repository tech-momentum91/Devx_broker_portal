import apiClient from '@/api/axios';
import { normalizeLeadSubmission } from '@/services/dashboard-service';

const USE_MOCK = false;
const MOCK_DELAY_MS = 250;

function serializeError(error) {
  if (error == null) return 'An error occurred';
  if (typeof error === 'string') return error;
  if (typeof error?.serialized === 'string') return error.serialized;
  if (typeof error?.message === 'string') return error.message;
  if (error?.response?.data != null) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (typeof data?.message === 'string') return data.message;
  }
  return 'An error occurred';
}

function formatShortDate(value) {
  if (!value) return '—';
  const s = String(value).trim();
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return s;
  }
}

function normalizeRecentSubmission(raw) {
  const base = normalizeLeadSubmission(raw);
  if (!base) return null;
  const modified = raw?.modified ?? raw?.last_updated ?? raw?.updated_on ?? raw?.creation ?? raw?.date;
  return {
    ...base,
    lastUpdated: formatShortDate(modified),
  };
}

async function fetchRecentSubmissionsFromApi({ limit = 7 } = {}) {
  // CP contact leads API (backend filters by logged-in CP contact user).
  const res = await apiClient.get('/method/devx.api.lead.get_leads_for_cp_contact', {
    params: { limit },
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
  const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  return list.map(normalizeRecentSubmission).filter(Boolean);
}

const MOCK = [
  {
    id: '1',
    company_name: 'Tata Elxsi',
    service_type: 'Managed Office',
    city: 'Bangalore',
    status: 'in_discussion',
    modified: '2026-02-21',
  },
  {
    id: '2',
    company_name: 'Razorpay',
    service_type: 'Design & Build',
    city: 'Bangalore',
    status: 'design_won',
    modified: '2026-02-19',
  },
  {
    id: '3',
    company_name: 'Swiggy Instamart',
    service_type: 'Managed Office',
    city: 'Hyderabad',
    status: 'lead_submitted',
    modified: '2026-02-17',
  },
  {
    id: '4',
    company_name: 'ICICI Prudential',
    service_type: 'Design & Build',
    city: 'Pune',
    status: 'in_qualification',
    modified: '2026-02-15',
  },
  {
    id: '5',
    company_name: 'Myntra Logistics',
    service_type: 'Managed Office',
    city: 'Bangalore',
    status: 'won',
    modified: '2026-02-10',
  },
  {
    id: '6',
    company_name: 'Groww Technologies',
    service_type: 'Design & Build',
    city: 'Bangalore',
    status: 'execution_won',
    modified: '2026-02-10',
  },
];

async function getRecentSubmissionsMock({ limit = 7 } = {}) {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return MOCK.slice(0, Math.max(0, Number(limit) || 6))
    .map(normalizeRecentSubmission)
    .filter(Boolean);
}

export async function getRecentSubmissions({ limit = 7 } = {}) {
  try {
    if (USE_MOCK) return await getRecentSubmissionsMock({ limit });
    return await fetchRecentSubmissionsFromApi({ limit });
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

