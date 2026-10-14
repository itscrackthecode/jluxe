import { withTransaction } from '../pool';

export type NewBuyerPropertyEnquiry = {
  propertyType: string;
  propertySubtype: string;
  preferredCity: string;
  preferredLocality: string | null;
  budgetMin: string;
  budgetMax: string;
  purchasePurpose: string | null;
  propertyRequirements: Record<string, string>;
  purchaseTimeline: string | null;
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  additionalRequirements: string | null;
};

export async function createBuyerPropertyEnquiry(input: NewBuyerPropertyEnquiry) {
  return withTransaction(async (client) => {
    const result = await client.query<{ id: string; createdAt: Date }>(
      `INSERT INTO public."BuyerPropertyEnquiry" (
         "propertyId", "propertyTitle", "propertySlug", "propertyLocation",
         "propertyType", "propertySubtype", "preferredCity", "preferredLocality",
         "budgetMin", "budgetMax", "purchasePurpose", "propertyRequirements",
         "purchaseTimeline", "name", "email", "phone", "preferredContactMethod",
         "additionalRequirements"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15, $16, $17, $18)
       RETURNING "id", "createdAt"`,
      [
        null,
        '',
        '',
        null,
        input.propertyType,
        input.propertySubtype,
        input.preferredCity,
        input.preferredLocality,
        input.budgetMin,
        input.budgetMax,
        input.purchasePurpose,
        JSON.stringify(input.propertyRequirements),
        input.purchaseTimeline,
        input.name,
        input.email,
        input.phone,
        input.preferredContactMethod,
        input.additionalRequirements,
      ],
    );
    return { kind: 'created' as const, enquiry: result.rows[0] };
  });
}
