import { z } from 'zod';

/**
 * Base address schema that can be reused for primary, billing, and shipping addresses
 * All fields are required by default
 */
export const baseAddressSchema = z.object({
  address_line1: z.string().min(1, 'Address Line 1 is required'),
  address_line2: z.string().min(1, 'Address Line 2 is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z
    .string()
    .min(1, 'Pin Code is required')
    .regex(/^\d{6}$/, 'Pin Code must be 6 digits'),
});

/**
 * Optional address schema for cases where address fields are optional (e.g., shipping address)
 */
export const optionalAddressSchema = z.object({
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
});

/**
 * Schema for editing primary and billing addresses
 * Uses baseAddressSchema for primary address and conditionally validates billing address
 */
export const addressEditSchema = z
  .object({
    // Primary address (required)
    ...baseAddressSchema.shape,
    billing_same_as_primary: z.boolean().default(false),
    // Billing address fields (required when billing_same_as_primary is false)
    billing_address_line1: z.string().optional(),
    billing_address_line2: z.string().optional(),
    billing_state: z.string().optional(),
    billing_city: z.string().optional(),
    billing_pincode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If billing is not same as primary, validate billing address fields using baseAddressSchema
    // Only validate if billing fields have values (not empty strings)
    // This allows editing primary address without validating billing fields when they're not shown
    if (!data.billing_same_as_primary) {
      const billingAddress = {
        address_line1: data.billing_address_line1,
        address_line2: data.billing_address_line2,
        state: data.billing_state,
        city: data.billing_city,
        pincode: data.billing_pincode,
      };

      // Only validate if at least one billing field has a value
      // This means user is actually editing billing address
      const hasBillingValues = Object.values(billingAddress).some(
        (value) => value && value.trim() !== '',
      );

      if (hasBillingValues) {
        const result = baseAddressSchema.safeParse(billingAddress);
        if (!result.success) {
          result.error.errors.forEach((error) => {
            ctx.addIssue({
              code: error.code,
              message: error.message.replace('Address', 'Billing Address'),
              path: [`billing_${error.path[0]}`],
            });
          });
        }
      }
    }
  });

export const defaultAddressValues = {
  address_line1: '',
  address_line2: '',
  state: '',
  city: '',
  pincode: '',
  billing_same_as_primary: false,
  billing_address_line1: '',
  billing_address_line2: '',
  billing_state: '',
  billing_city: '',
  billing_pincode: '',
};
