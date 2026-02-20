import json
from groq import Groq
from .models import LOIFields, LOIFieldsWithConfidence
from .config import get_settings
from typing import Dict, List, Any


class LOIExtractionService:
    """Service for extracting LOI fields from call transcripts using Groq"""

    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model

    def extract_loi_fields(self, transcript: str) -> LOIFields:
        """
        Extract structured LOI fields from a call transcript using Groq LLM

        Args:
            transcript: Raw text transcript of broker-owner call

        Returns:
            LOIFields: Validated Pydantic model with extracted data
        """
        system_prompt = """You are an expert commercial real estate analyst. Extract LOI (Letter of Intent) terms from call transcripts.

CRITICAL INSTRUCTIONS:
1. Extract ONLY information explicitly mentioned in the transcript
2. Use default/mock values for fields not discussed (as provided in schema)
3. Return valid JSON matching the LOIFields schema exactly
4. For dates, use ISO format (YYYY-MM-DD)
5. For financial terms, extract numbers without currency symbols
6. Infer reasonable defaults for standard CRE terms if not mentioned

SCHEMA STRUCTURE:
{
  "property_details": {
    "address": "string (REQUIRED - extract from transcript)",
    "property_type": "string (default: Office Space)",
    "square_footage": "integer or null",
    "description": "string or null"
  },
  "party_information": {
    "buyer_tenant_name": "string (REQUIRED)",
    "buyer_tenant_entity": "string or null",
    "seller_landlord_name": "string (REQUIRED)",
    "seller_landlord_entity": "string or null"
  },
  "financial_terms": {
    "transaction_type": "Lease or Purchase",
    "purchase_price": "float or null",
    "base_rent": "float (monthly) or null",
    "rent_per_sqft": "float (annual) or null",
    "escalation_rate": "float (default: 3.0)",
    "security_deposit": "float or null",
    "operating_expenses": "string (default: NNN)"
  },
  "timeline": {
    "loi_expiration_date": "date or null",
    "due_diligence_period": "integer (default: 30)",
    "lease_commencement_date": "date or null",
    "lease_term_months": "integer or null",
    "closing_date": "date or null",
    "free_rent_period": "integer or null"
  },
  "contingencies": {
    "financing_contingency": "boolean (default: true)",
    "inspection_contingency": "boolean (default: true)",
    "environmental_contingency": "boolean (default: true)",
    "zoning_approval": "boolean (default: false)",
    "custom_contingencies": "array of strings"
  },
  "transaction_costs": {
    "broker_commission_rate": "float (default: 5.0)",
    "broker_paid_by": "string (default: Seller/Landlord)",
    "legal_fees_allocation": "string (default: Each party pays own)",
    "title_insurance_paid_by": "string (default: Buyer)",
    "tenant_improvement_allowance": "float or null"
  },
  "additional_terms": "string or null - Format as text with bullets like: '• Exclusive signage rights\\n• ROFR on adjacent space\\n• 25 parking spaces'. NEVER use dictionary/object.",
  "broker_information": "string (default: [Broker Name and Contact])"
}

Return ONLY the JSON object, no markdown or explanation."""

        try:
            # Call Groq API with structured output
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract LOI terms from this transcript:\n\n{transcript}"}
                ],
                temperature=0.1,
                max_tokens=4096,
                response_format={"type": "json_object"}
            )

            # Parse response
            response_text = completion.choices[0].message.content
            loi_data = json.loads(response_text)

            # Validate with Pydantic
            loi_fields = LOIFields(**loi_data)
            return loi_fields

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"Error extracting LOI fields: {e}")

    def extract_loi_fields_with_confidence(self, transcript: str) -> LOIFieldsWithConfidence:
        """
        Extract LOI fields with confidence scores for each field

        Args:
            transcript: Raw text transcript of broker-owner call

        Returns:
            LOIFieldsWithConfidence: LOI data with confidence metadata
        """
        system_prompt = """You are an expert commercial real estate analyst. Extract LOI (Letter of Intent) terms from call transcripts.

CRITICAL INSTRUCTIONS:
1. Extract ONLY information explicitly mentioned in the transcript
2. For fields not mentioned, use reasonable defaults and mark with low confidence (10-20)
3. ALWAYS include ALL required fields in the response - never omit any section
4. Return valid JSON with TWO keys: "loi_data" and "field_confidences"
5. For dates, use ISO format (YYYY-MM-DD)
6. For financial terms, extract numbers without currency symbols

DATA TYPE REQUIREMENTS (CRITICAL):
- Integer fields (square_footage, lease_term_months, etc.): Use actual number or null. NEVER use strings like "a few thousand"
- Float fields (base_rent, rent_per_sqft, etc.): Use actual number or null
- String fields (names, addresses, etc.): ALWAYS use a string, NEVER null. Use "[Not Specified]" if unknown
- Boolean fields: Use true or false, never null
- If you can't determine a number, use null - DO NOT use text descriptions

REQUIRED JSON STRUCTURE (YOU MUST INCLUDE ALL SECTIONS):
{
  "loi_data": {
    "property_details": {
      "address": "string (use '[Address Not Specified]' if unknown)",
      "property_type": "Office Space",
      "square_footage": null,
      "description": null
    },
    "party_information": {
      "buyer_tenant_name": "string (use '[Tenant Name Not Specified]' if unknown)",
      "buyer_tenant_entity": null,
      "seller_landlord_name": "string (use '[Landlord Name Not Specified]' if unknown)",
      "seller_landlord_entity": null
    },
    "financial_terms": {
      "transaction_type": "Lease",
      "purchase_price": null,
      "base_rent": null,
      "rent_per_sqft": null,
      "escalation_rate": 3.0,
      "security_deposit": null,
      "operating_expenses": "NNN"
    },
    "timeline": {
      "loi_expiration_date": null,
      "due_diligence_period": 30,
      "lease_commencement_date": null,
      "lease_term_months": null,
      "closing_date": null,
      "free_rent_period": null
    },
    "contingencies": {
      "financing_contingency": true,
      "inspection_contingency": true,
      "environmental_contingency": true,
      "zoning_approval": false,
      "custom_contingencies": []
    },
    "transaction_costs": {
      "broker_commission_rate": 5.0,
      "broker_paid_by": "Seller/Landlord",
      "legal_fees_allocation": "Each party pays own",
      "title_insurance_paid_by": "Buyer",
      "tenant_improvement_allowance": null
    },
    "additional_terms": null,
    "broker_information": "[Broker Name and Contact]"
  },
  "field_confidences": {
    "property_details.address": 10,
    "property_details.square_footage": 10,
    "party_information.buyer_tenant_name": 10,
    ... (confidence score 0-100 for each field you extract)
  }
}

CRITICAL VALIDATION RULES:
1. "square_footage" MUST be an integer or null - NEVER a string like "a few thousand"
2. "broker_paid_by" MUST be a string - use "Seller/Landlord" if unknown, NEVER null
3. "legal_fees_allocation" MUST be a string - use "Each party pays own" if unknown, NEVER null
4. "broker_information" MUST be a string - use "[Broker Name and Contact]" if unknown, NEVER null
5. "additional_terms" MUST be a string or null - NEVER a dictionary/object. Format as text with bullet points like: "• Exclusive signage rights\n• ROFR on Suite 2200\n• 25 parking spaces included"
6. ALL string fields marked as REQUIRED must have a string value, not null
7. Integer/float fields can be null if value is unknown - do not guess or use text

CONFIDENCE SCORING (BE VERY STRICT):
- 90-100: ONLY if explicitly stated with exact numbers/dates in transcript
- 70-89: Clearly discussed but not exact numbers
- 50-69: Mentioned but vague
- 30-49: Barely mentioned or heavily inferred
- 10-29: NOT mentioned at all, using default value
- 0-9: Complete guess with no basis

CRITICAL CONFIDENCE RULES:
1. If a field was NOT explicitly mentioned → confidence MUST be ≤30
2. If using a default value → confidence MUST be 10-20
3. If using placeholder like "[Not Specified]" → confidence MUST be 10
4. If inferred from context but not stated → confidence MUST be 30-40
5. ONLY give high confidence (70+) if the transcript explicitly mentions it

IMPORTANT: Even if the transcript is very short or vague, you MUST return the complete structure with all sections. Be CONSERVATIVE with confidence scores - when in doubt, score it LOW (10-30).

Return ONLY the JSON object, no markdown or explanation."""

        try:
            # Call Groq API
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract LOI terms WITH CONFIDENCE SCORES from this transcript:\n\n{transcript}"}
                ],
                temperature=0.1,
                max_tokens=4096,
                response_format={"type": "json_object"}
            )

            # Parse response
            response_text = completion.choices[0].message.content
            response_data = json.loads(response_text)

            # Extract LOI data and confidence scores
            loi_data = response_data.get("loi_data", response_data)
            field_confidences = response_data.get("field_confidences", {})

            # Validate LOI data with Pydantic
            try:
                loi_fields = LOIFields(**loi_data)
            except Exception as validation_error:
                # Log the actual response for debugging
                print(f"LLM Response that failed validation: {json.dumps(loi_data, indent=2)}")
                raise ValueError(f"LLM returned incomplete data. Missing required fields. Please provide a more detailed transcript with party names and property address. Error: {validation_error}")

            # Find low confidence fields (< 70%)
            low_confidence_fields = [
                field_path for field_path, confidence in field_confidences.items()
                if confidence < 70
            ]

            # Return with confidence metadata
            return LOIFieldsWithConfidence(
                data=loi_fields,
                field_confidences=field_confidences,
                low_confidence_fields=low_confidence_fields
            )

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")
        except ValueError as e:
            # Re-raise ValueError with original message
            raise e
        except Exception as e:
            raise RuntimeError(f"Error extracting LOI fields with confidence: {e}")

    @staticmethod
    def create_mock_loi() -> LOIFields:
        """Create a mock LOI for testing"""
        from datetime import date, timedelta

        mock_data = {
            "property_details": {
                "address": "500 Park Avenue, 10th Floor, New York, NY 10022",
                "property_type": "Class A Office Space",
                "square_footage": 8500,
                "description": "Premium office space with Hudson River views, modern finishes, and 24/7 access"
            },
            "party_information": {
                "buyer_tenant_name": "TechStart Innovations LLC",
                "buyer_tenant_entity": "Delaware Limited Liability Company",
                "seller_landlord_name": "Park Avenue Properties Group",
                "seller_landlord_entity": "New York REIT"
            },
            "financial_terms": {
                "transaction_type": "Lease",
                "base_rent": 28000.0,
                "rent_per_sqft": 45.0,
                "escalation_rate": 3.5,
                "security_deposit": 56000.0,
                "operating_expenses": "Modified Gross"
            },
            "timeline": {
                "loi_expiration_date": (date.today() + timedelta(days=14)).isoformat(),
                "due_diligence_period": 45,
                "lease_commencement_date": (date.today() + timedelta(days=90)).isoformat(),
                "lease_term_months": 84,
                "free_rent_period": 3
            },
            "contingencies": {
                "financing_contingency": False,
                "inspection_contingency": True,
                "environmental_contingency": True,
                "zoning_approval": False,
                "custom_contingencies": [
                    "Subject to landlord completing buildout of common areas",
                    "Tenant approval of final space plan"
                ]
            },
            "transaction_costs": {
                "broker_commission_rate": 4.5,
                "broker_paid_by": "Landlord",
                "legal_fees_allocation": "Each party responsible for own legal fees",
                "tenant_improvement_allowance": 35.0
            },
            "additional_terms": "Tenant shall have right of first refusal on adjacent 11th floor space. Signage rights on building directory.",
            "broker_information": "Sarah Chen, Manhattan Commercial Realty | sarah.chen@mcr.com | (212) 555-0123"
        }

        return LOIFields(**mock_data)
