from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date


class PropertyDetails(BaseModel):
    """Property and space information"""
    address: str = Field(..., description="Full property address")
    property_type: str = Field(default="Office Space", description="Type of property (Office, Retail, Industrial, etc.)")
    square_footage: Optional[int] = Field(None, description="Total square footage")
    description: Optional[str] = Field(None, description="Additional property description")


class PartyInformation(BaseModel):
    """Buyer/Seller or Landlord/Tenant information"""
    buyer_tenant_name: str = Field(..., description="Legal name of buyer or tenant")
    buyer_tenant_entity: Optional[str] = Field(None, description="Entity type (LLC, Corp, etc.)")
    seller_landlord_name: str = Field(..., description="Legal name of seller or landlord")
    seller_landlord_entity: Optional[str] = Field(None, description="Entity type")


class FinancialTerms(BaseModel):
    """Financial terms of the deal"""
    transaction_type: str = Field(default="Lease", description="'Purchase' or 'Lease'")
    purchase_price: Optional[float] = Field(None, description="Purchase price if sale")
    base_rent: Optional[float] = Field(None, description="Monthly base rent if lease")
    rent_per_sqft: Optional[float] = Field(None, description="Rent per square foot per year")
    escalation_rate: Optional[float] = Field(default=3.0, description="Annual rent escalation percentage")
    security_deposit: Optional[float] = Field(None, description="Security deposit amount")
    operating_expenses: Optional[str] = Field(default="NNN", description="Expense structure (NNN, Modified Gross, Full Service)")


class Timeline(BaseModel):
    """Important dates and deadlines"""
    loi_expiration_date: Optional[date] = Field(None, description="When this LOI expires")
    due_diligence_period: Optional[int] = Field(default=30, description="Due diligence period in days")
    lease_commencement_date: Optional[date] = Field(None, description="When lease starts")
    lease_term_months: Optional[int] = Field(None, description="Lease term in months")
    closing_date: Optional[date] = Field(None, description="Proposed closing date for purchase")
    free_rent_period: Optional[int] = Field(None, description="Free rent period in months")


class Contingencies(BaseModel):
    """Conditions that must be met"""
    financing_contingency: bool = Field(default=True, description="Subject to financing approval")
    inspection_contingency: bool = Field(default=True, description="Subject to property inspection")
    environmental_contingency: bool = Field(default=True, description="Subject to environmental review")
    zoning_approval: bool = Field(default=False, description="Subject to zoning approval")
    custom_contingencies: Optional[List[str]] = Field(default=[], description="Additional contingencies")


class TransactionCosts(BaseModel):
    """Allocation of transaction expenses"""
    broker_commission_rate: Optional[float] = Field(default=5.0, description="Broker commission percentage")
    broker_paid_by: str = Field(default="Seller/Landlord", description="Who pays broker commission")
    legal_fees_allocation: str = Field(default="Each party pays own", description="Legal fees allocation")
    title_insurance_paid_by: Optional[str] = Field(default="Buyer", description="Who pays title insurance")
    tenant_improvement_allowance: Optional[float] = Field(None, description="TI allowance per sqft or total")


class LOIFields(BaseModel):
    """Complete LOI data structure"""
    # Core sections
    property_details: PropertyDetails
    party_information: PartyInformation
    financial_terms: FinancialTerms
    timeline: Timeline
    contingencies: Contingencies = Field(default_factory=Contingencies)
    transaction_costs: TransactionCosts = Field(default_factory=TransactionCosts)

    # Additional fields
    additional_terms: Optional[str] = Field(None, description="Any additional terms or notes")
    broker_information: Optional[str] = Field(default="[Broker Name and Contact]", description="Broker details")

    class Config:
        json_schema_extra = {
            "example": {
                "property_details": {
                    "address": "123 Main Street, Suite 500, New York, NY 10001",
                    "property_type": "Office Space",
                    "square_footage": 5000,
                    "description": "Class A office space with city views"
                },
                "party_information": {
                    "buyer_tenant_name": "Acme Corporation",
                    "buyer_tenant_entity": "Delaware LLC",
                    "seller_landlord_name": "Main Street Properties LLC",
                    "seller_landlord_entity": "New York LLC"
                },
                "financial_terms": {
                    "transaction_type": "Lease",
                    "base_rent": 15000.0,
                    "rent_per_sqft": 36.0,
                    "escalation_rate": 3.0,
                    "security_deposit": 30000.0,
                    "operating_expenses": "NNN"
                },
                "timeline": {
                    "loi_expiration_date": "2026-03-01",
                    "due_diligence_period": 30,
                    "lease_commencement_date": "2026-06-01",
                    "lease_term_months": 60,
                    "free_rent_period": 2
                },
                "contingencies": {
                    "financing_contingency": True,
                    "inspection_contingency": True,
                    "environmental_contingency": True,
                    "zoning_approval": False,
                    "custom_contingencies": ["Subject to board approval"]
                },
                "transaction_costs": {
                    "broker_commission_rate": 5.0,
                    "broker_paid_by": "Landlord",
                    "legal_fees_allocation": "Each party pays own",
                    "tenant_improvement_allowance": 25.0
                }
            }
        }


class FieldConfidence(BaseModel):
    """Confidence score for extracted fields"""
    field_path: str = Field(..., description="Dot-notation path to field (e.g., 'property_details.address')")
    confidence: float = Field(..., ge=0, le=100, description="Confidence percentage (0-100)")
    extracted_value: Optional[str] = Field(None, description="The value that was extracted")


class LOIFieldsWithConfidence(BaseModel):
    """LOI Fields with confidence metadata"""
    data: LOIFields
    field_confidences: Dict[str, float] = Field(
        default_factory=dict,
        description="Map of field paths to confidence scores (0-100)"
    )
    low_confidence_fields: List[str] = Field(
        default_factory=list,
        description="List of field paths with confidence < 50%"
    )
