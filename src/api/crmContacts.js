import apiClient from '@/api/axios';

/**
 * CRM Contact dropdown options (designation, department, etc.) — same endpoint as main ERP app.
 */
export async function getCrmContactOptions() {
  const { data } = await apiClient.get(
    '/method/devx.devx_crm.api.crm_options.get_crm_contact_options',
    { withCredentials: true },
  );
  const result = data?.message ?? data ?? {};
  return {
    subscription_type: Array.isArray(result.subscription_type) ? result.subscription_type : [],
    subscription_status: Array.isArray(result.subscription_status)
      ? result.subscription_status
      : [],
    designation: Array.isArray(result.designation) ? result.designation : [],
    department: Array.isArray(result.department) ? result.department : [],
    unsubscribed_reason: Array.isArray(result.unsubscribed_reason)
      ? result.unsubscribed_reason
      : [],
  };
}
