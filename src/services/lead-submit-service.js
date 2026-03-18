/**
 * Lead submission service – submit lead from broker portal (Manage Office or Design and Build).
 * All data is saved in the CRM Lead doctype only (devx_crm/doctype/crm_lead).
 */

import apiClient from '@/api/axios';

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
    '/method/devx.api.lead.create_lead_from_broker_portal',
    payload,
  );
  const data = response?.data;
  if (data?.exc) {
    throw new Error(data.message || data.exc);
  }
  return {
    name: data?.name ?? data?.message?.name,
    message: data?.message ?? 'Lead created successfully',
  };
}

/** @deprecated Use submitLeadFromBrokerPortal */
export async function submitManagedOfficeLead(payload) {
  return submitLeadFromBrokerPortal(payload);
}
