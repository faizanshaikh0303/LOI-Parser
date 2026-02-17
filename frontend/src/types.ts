// TypeScript types matching the Pydantic models

export interface PropertyDetails {
  address: string;
  property_type: string;
  square_footage: number | null;
  description: string | null;
}

export interface PartyInformation {
  buyer_tenant_name: string;
  buyer_tenant_entity: string | null;
  seller_landlord_name: string;
  seller_landlord_entity: string | null;
}

export interface FinancialTerms {
  transaction_type: string;
  purchase_price: number | null;
  base_rent: number | null;
  rent_per_sqft: number | null;
  escalation_rate: number;
  security_deposit: number | null;
  operating_expenses: string;
}

export interface Timeline {
  loi_expiration_date: string | null;
  due_diligence_period: number;
  lease_commencement_date: string | null;
  lease_term_months: number | null;
  closing_date: string | null;
  free_rent_period: number | null;
}

export interface Contingencies {
  financing_contingency: boolean;
  inspection_contingency: boolean;
  environmental_contingency: boolean;
  zoning_approval: boolean;
  custom_contingencies: string[];
}

export interface TransactionCosts {
  broker_commission_rate: number;
  broker_paid_by: string;
  legal_fees_allocation: string;
  title_insurance_paid_by: string | null;
  tenant_improvement_allowance: number | null;
}

export interface LOIFields {
  property_details: PropertyDetails;
  party_information: PartyInformation;
  financial_terms: FinancialTerms;
  timeline: Timeline;
  contingencies: Contingencies;
  transaction_costs: TransactionCosts;
  additional_terms: string | null;
  broker_information: string | null;
}

export interface ParseResponse {
  success: boolean;
  data: LOIFields;
  message: string;
  field_confidences?: Record<string, number>;
  low_confidence_fields?: string[];
}
