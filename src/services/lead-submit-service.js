/**
 * Lead submission service – submit lead from broker portal (Manage Office or Design and Build).
 * All data is saved in the CRM Lead doctype only (devx_crm/doctype/crm_lead).
 */

import apiClient from '@/api/axios';

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

function extractErrorMessage(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.exc === 'string') return body.exc;
  if (typeof body?._server_messages === 'string') return body._server_messages;
  return '';
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
    throw new Error(
      extractErrorMessage(data) ||
      extractErrorMessage(messagePayload) ||
      'Failed to submit lead',
    );
  }

  // Some Frappe responses return 200 even when operation fails.
  // If we do not get a lead name, treat it as failure so UI can show error.
  if (!leadName) {
    throw new Error(
      extractErrorMessage(data) ||
      extractErrorMessage(messagePayload) ||
      'Lead was not created. Please try again.',
    );
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
