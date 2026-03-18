import apiClient from '@/api/axios';

const USE_MOCK = false;
const MOCK_DELAY_MS = 200;

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

/** Map API summary (get_leads_for_cp_contact) to shape expected by DashboardSummaryCards. */
function mapSummaryToCounts(summary) {
  if (!summary || typeof summary !== 'object') return null;
  const m = summary.managed;
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
          milestoneBonusEarned: d.milestone_bonus_earned ?? d.milestoneBonusEarned ?? '—',
          commissionEligibleDeals:
            Number(d.commission_eligible_deals ?? d.commissionEligibleDeals) ?? 0,
        }
      : null,
  };
}

/**
 * Fetch dashboard summary from get_leads_for_cp_contact (same API as My Submissions).
 * Returns summary counts for Managed Office and Design & Build for the logged-in CP contact.
 */
async function fetchBrokerDashboardSummaryFromApi() {
  const res = await apiClient.get('/method/devx.api.lead.get_leads_for_cp_contact');
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
  const counts = mapSummaryToCounts(json?.summary);
  return counts ? { counts } : { counts: null };
}

const MOCK_COUNTS = {
  managed: {
    totalSubmissions: 28,
    active: 9,
    won: 7,
    droppedRejected: 12,
  },
  designBuild: {
    phiTotal: 20,
    active: 5,
    designWon: 6,
    executionWon: 7,
    milestoneBonusEarned: '₹30,000',
    commissionEligibleDeals: 4,
  },
};

async function getBrokerDashboardSummaryMock() {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  return {
    counts: MOCK_COUNTS,
  };
}

export async function getBrokerDashboardSummary() {
  try {
    if (USE_MOCK) return await getBrokerDashboardSummaryMock();
    return await fetchBrokerDashboardSummaryFromApi();
  } catch (error) {
    throw new Error(serializeError(error));
  }
}

