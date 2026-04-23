/**
 * Lead submission service – submit lead from broker portal (Manage Office or Design and Build).
 * All data is saved in the CRM Lead doctype only (devx_crm/doctype/crm_lead).
 */

import apiClient from '@/api/axios';
import { extractErrorMessage } from '@/utils/error-utils';

/** User-facing copy when Frappe returns tracebacks or unreadable payloads (matches main app tone). */
export const BROKER_SUBMIT_LEAD_ERROR_FALLBACK = 'Unable to create lead. Please try again.';

/** Remove `frappe.exceptions.ValidationError:` / `ValidationError:` style prefixes (not for brokers). */
function stripPythonExceptionPrefix(msg) {
  if (!msg || typeof msg !== 'string') return msg;
  let s = msg.trim();
  s = s.replace(/^frappe\.exceptions\.\w+\s*:\s*/i, '').trim();
  s = s.replace(/^builtins\.\w+\s*:\s*/i, '').trim();
  s = s.replace(/^[A-Z][a-zA-Z0-9_]*Error\s*:\s*/, '').trim();
  return s;
}

/**
 * Short, single-line message for submit-lead failures (toast + inline alert).
 * @param {unknown} data - Frappe `response.data`, a thrown message string, or an axios-like `{ response }`
 */
export function getShortSubmitLeadErrorMessage(input) {
  if (input == null || input === '') {
    return BROKER_SUBMIT_LEAD_ERROR_FALLBACK;
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return BROKER_SUBMIT_LEAD_ERROR_FALLBACK;
  }

  const shaped =
    typeof input === 'string'
      ? input
      : typeof input === 'object' && input !== null
        ? input
        : BROKER_SUBMIT_LEAD_ERROR_FALLBACK;

  const raw = extractErrorMessage(shaped, BROKER_SUBMIT_LEAD_ERROR_FALLBACK);
  let s = String(raw || BROKER_SUBMIT_LEAD_ERROR_FALLBACK)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  s = stripPythonExceptionPrefix(s);

  // Internal CRM validation — do not show on broker submit UI (address in CRM / broker API).
  if (/pipeline\s+is\s+required/i.test(s) && s.length <= 80) {
    return BROKER_SUBMIT_LEAD_ERROR_FALLBACK;
  }

  if (
    s.includes('Traceback (most recent call last)') ||
    s.includes('Traceback (most recent call)') ||
    (s.length > 400 && s.includes('File "'))
  ) {
    return BROKER_SUBMIT_LEAD_ERROR_FALLBACK;
  }
  if (s.length > 180) {
    return `${s.slice(0, 177)}…`;
  }
  return s || BROKER_SUBMIT_LEAD_ERROR_FALLBACK;
}

/**
 * CRM Lead Product options for Manage Office workspace dropdown (CRM Lead.product Link).
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function getCrmLeadProductsForBrokerPortal() {
  const response = await apiClient.post(
    '/method/devx.channel_partner.api.lead.get_crm_lead_products_for_broker_portal',
    {},
  );
  const msg = response?.data?.message;
  return Array.isArray(msg) ? msg : [];
}

/**
 * Submit a lead from the broker portal. Creates a CRM Lead document with all form data.
 * Payload shape:
 * - Manage Office: workspaceType, seats, microMarket, area, timeline, clientCompany,
 *   contactPerson, phone, email, city, requirementSummary
 * - Design and Build: serviceType "Design and Build", buildingName, floor, unitNumber,
 *   microMarket, carpetArea, perSftRate, totalBudget, dealSituation, clientCompany,
 *   contactPerson, phone, email, clientCity, requirementSummary
 *
 * @param {object} payload - Form values (camelCase)
 * @returns {Promise<{ name: string, message: string }>}
 */
export async function submitLeadFromBrokerPortal(payload) {
  const response = await apiClient.post(
    '/method/devx.channel_partner.api.lead.create_lead_from_broker_portal',
    payload,
  );
  const data = response?.data;
  const messagePayload = data?.message;
  const leadName =
    data?.name ??
    messagePayload?.name ??
    messagePayload?.lead_name ??
    messagePayload?.data?.name ??
    null;

  const hasExplicitFailure =
    Boolean(data?.exc) ||
    messagePayload?.success === false ||
    messagePayload?.status === 'error' ||
    data?.status === 'error';

  if (hasExplicitFailure) {
    throw new Error(getShortSubmitLeadErrorMessage(data ?? messagePayload));
  }

  // Some Frappe responses return 200 even when operation fails.
  // If we do not get a lead name, treat it as failure so UI can show error.
  if (!leadName) {
    throw new Error(getShortSubmitLeadErrorMessage(data ?? messagePayload));
  }
  return {
    name: leadName,
    message:
      (typeof messagePayload === 'string' ? messagePayload : messagePayload?.message) ||
      'Lead created successfully',
  };
}

/** @deprecated Use submitLeadFromBrokerPortal */
export async function submitManagedOfficeLead(payload) {
  return submitLeadFromBrokerPortal(payload);
}
