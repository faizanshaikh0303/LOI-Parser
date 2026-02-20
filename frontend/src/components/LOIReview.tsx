import { useState } from 'react';
import { LOIFields } from '../types';
import { LEASE_TRANSCRIPT } from '../data/mockTranscript';

interface LOIReviewProps {
  initialTranscript?: string;
}

export default function LOIReview({ initialTranscript = '' }: LOIReviewProps) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [loiData, setLoiData] = useState<LOIFields | null>(null);
  const [fieldConfidences, setFieldConfidences] = useState<Record<string, number>>({});
  const [lowConfidenceFields, setLowConfidenceFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleParse = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse transcript');
      }

      const data = await response.json();
      console.log('🔍 Parse Response:', data);
      console.log('📊 Field Confidences:', data.field_confidences);
      console.log('⚠️ Low Confidence Fields:', data.low_confidence_fields);
      setLoiData(data.data);
      setFieldConfidences(data.field_confidences || {});
      setLowConfidenceFields(data.low_confidence_fields || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/parse/mock`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to load mock data');

      const data = await response.json();
      setLoiData(data.data);
      setFieldConfidences(data.field_confidences || {});
      setLowConfidenceFields(data.low_confidence_fields || []);
      setTranscript(LEASE_TRANSCRIPT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!loiData) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/generate-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loi_data: loiData }),
      });

      if (!response.ok) throw new Error('Failed to generate document');

      const result = await response.json();

      if (result.download_url) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = result.filename || 'LOI.docx';
        link.click();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateLoiField = (path: string, value: any) => {
    if (!loiData) return;

    const pathParts = path.split('.');
    const newData = JSON.parse(JSON.stringify(loiData));

    let current: any = newData;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    setLoiData(newData);
  };

  // Helper to add confidence props to any Input
  const confidenceProps = { fieldConfidences, lowConfidenceFields };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CRE LOI Parser
          </h1>
          <p className="text-gray-600">
            Extract deal terms from call transcripts and generate professional Letters of Intent
          </p>
        </header>

        {lowConfidenceFields.length > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {lowConfidenceFields.length} field{lowConfidenceFields.length > 1 ? 's' : ''} with low confidence
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Some fields were extracted with less than 70% confidence. These fields are highlighted in yellow and should be reviewed carefully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Transcript Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Call Transcript
              </h2>
              <button
                onClick={handleLoadMock}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                disabled={isLoading}
              >
                Load Mock
              </button>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the call transcript here...&#10;&#10;Example:&#10;Broker: Hi, I'm calling about the office space at 123 Main Street.&#10;Owner: Yes, we have 5,000 square feet available.&#10;Broker: My client is interested in a 5-year lease..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />

            <button
              onClick={handleParse}
              disabled={isLoading || !transcript.trim()}
              className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
            >
              {isLoading ? 'Parsing...' : 'Parse Transcript'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right Panel - Extracted Fields */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                LOI Fields
              </h2>
              {loiData && (
                <button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
                >
                  {isGenerating ? 'Generating...' : 'Generate LOI'}
                </button>
              )}
            </div>

            {!loiData ? (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Parse a transcript to see extracted fields</p>
                </div>
              </div>
            ) : (
              <div className="h-96 overflow-y-auto space-y-6">
                {/* Property Details */}
                <Section title="Property Details">
                  <Input
                    label="Address"
                    value={loiData.property_details.address}
                    onChange={(v) => updateLoiField('property_details.address', v)}
                    fieldPath="property_details.address"
                    {...confidenceProps}
                  />
                  <Input
                    label="Property Type"
                    value={loiData.property_details.property_type}
                    onChange={(v) => updateLoiField('property_details.property_type', v)}
                    fieldPath="property_details.property_type"
                    {...confidenceProps}
                  />
                  <Input
                    label="Square Footage"
                    type="number"
                    value={loiData.property_details.square_footage ?? ''}
                    onChange={(v) => updateLoiField('property_details.square_footage', v ? Number(v) : null)}
                    fieldPath="property_details.square_footage"
                    {...confidenceProps}
                  />
                  <TextArea
                    label="Description"
                    value={loiData.property_details.description ?? ''}
                    onChange={(v) => updateLoiField('property_details.description', v)}
                  />
                </Section>

                {/* Party Information */}
                <Section title="Party Information">
                  <Input
                    label="Buyer/Tenant Name"
                    value={loiData.party_information.buyer_tenant_name}
                    onChange={(v) => updateLoiField('party_information.buyer_tenant_name', v)}
                    fieldPath="party_information.buyer_tenant_name"
                    {...confidenceProps}
                  />
                  <Input
                    label="Buyer/Tenant Entity"
                    value={loiData.party_information.buyer_tenant_entity ?? ''}
                    onChange={(v) => updateLoiField('party_information.buyer_tenant_entity', v)}
                    fieldPath="party_information.buyer_tenant_entity"
                    {...confidenceProps}
                  />
                  <Input
                    label="Seller/Landlord Name"
                    value={loiData.party_information.seller_landlord_name}
                    onChange={(v) => updateLoiField('party_information.seller_landlord_name', v)}
                    fieldPath="party_information.seller_landlord_name"
                    {...confidenceProps}
                  />
                  <Input
                    label="Seller/Landlord Entity"
                    value={loiData.party_information.seller_landlord_entity ?? ''}
                    onChange={(v) => updateLoiField('party_information.seller_landlord_entity', v)}
                    fieldPath="party_information.seller_landlord_entity"
                    {...confidenceProps}
                  />
                </Section>

                {/* Financial Terms */}
                <Section title="Financial Terms">
                  <Input
                    label="Transaction Type"
                    value={loiData.financial_terms.transaction_type}
                    onChange={(v) => updateLoiField('financial_terms.transaction_type', v)}
                    fieldPath="financial_terms.transaction_type"
                    {...confidenceProps}
                  />
                  <Input
                    label="Purchase Price"
                    type="number"
                    value={loiData.financial_terms.purchase_price ?? ''}
                    onChange={(v) => updateLoiField('financial_terms.purchase_price', v ? Number(v) : null)}
                    fieldPath="financial_terms.purchase_price"
                    {...confidenceProps}
                    prefix="$"
                  />
                  <Input
                    label="Base Rent (Monthly)"
                    type="number"
                    value={loiData.financial_terms.base_rent ?? ''}
                    onChange={(v) => updateLoiField('financial_terms.base_rent', v ? Number(v) : null)}
                    fieldPath="financial_terms.base_rent"
                    {...confidenceProps}
                    prefix="$"
                  />
                  <Input
                    label="Rent per SqFt (Annual)"
                    type="number"
                    value={loiData.financial_terms.rent_per_sqft ?? ''}
                    onChange={(v) => updateLoiField('financial_terms.rent_per_sqft', v ? Number(v) : null)}
                    fieldPath="financial_terms.rent_per_sqft"
                    {...confidenceProps}
                    prefix="$"
                  />
                  <Input
                    label="Escalation Rate (%)"
                    type="number"
                    value={loiData.financial_terms.escalation_rate}
                    onChange={(v) => updateLoiField('financial_terms.escalation_rate', Number(v))}
                    fieldPath="financial_terms.escalation_rate"
                    {...confidenceProps}
                    suffix="%"
                  />
                  <Input
                    label="Security Deposit"
                    type="number"
                    value={loiData.financial_terms.security_deposit ?? ''}
                    onChange={(v) => updateLoiField('financial_terms.security_deposit', v ? Number(v) : null)}
                    fieldPath="financial_terms.security_deposit"
                    {...confidenceProps}
                    prefix="$"
                  />
                  <Input
                    label="Operating Expenses"
                    value={loiData.financial_terms.operating_expenses}
                    onChange={(v) => updateLoiField('financial_terms.operating_expenses', v)}
                    fieldPath="financial_terms.operating_expenses"
                    {...confidenceProps}
                  />
                </Section>

                {/* Timeline */}
                <Section title="Timeline">
                  <Input
                    label="LOI Expiration Date"
                    type="date"
                    value={loiData.timeline.loi_expiration_date ?? ''}
                    onChange={(v) => updateLoiField('timeline.loi_expiration_date', v)}
                    fieldPath="timeline.loi_expiration_date"
                    {...confidenceProps}
                  />
                  <Input
                    label="Due Diligence Period (Days)"
                    type="number"
                    value={loiData.timeline.due_diligence_period}
                    onChange={(v) => updateLoiField('timeline.due_diligence_period', Number(v))}
                    fieldPath="timeline.due_diligence_period"
                    {...confidenceProps}
                  />
                  <Input
                    label="Closing Date"
                    type="date"
                    value={loiData.timeline.closing_date ?? ''}
                    onChange={(v) => updateLoiField('timeline.closing_date', v)}
                    fieldPath="timeline.closing_date"
                    {...confidenceProps}
                  />
                  <Input
                    label="Lease Commencement Date"
                    type="date"
                    value={loiData.timeline.lease_commencement_date ?? ''}
                    onChange={(v) => updateLoiField('timeline.lease_commencement_date', v)}
                    fieldPath="timeline.lease_commencement_date"
                    {...confidenceProps}
                  />
                  <Input
                    label="Lease Term (Months)"
                    type="number"
                    value={loiData.timeline.lease_term_months ?? ''}
                    onChange={(v) => updateLoiField('timeline.lease_term_months', v ? Number(v) : null)}
                    fieldPath="timeline.lease_term_months"
                    {...confidenceProps}
                  />
                  <Input
                    label="Free Rent Period (Months)"
                    type="number"
                    value={loiData.timeline.free_rent_period ?? ''}
                    onChange={(v) => updateLoiField('timeline.free_rent_period', v ? Number(v) : null)}
                    fieldPath="timeline.free_rent_period"
                    {...confidenceProps}
                  />
                </Section>

                {/* Transaction Costs */}
                <Section title="Transaction Costs">
                  <Input
                    label="Broker Commission Rate (%)"
                    type="number"
                    value={loiData.transaction_costs.broker_commission_rate ?? ''}
                    onChange={(v) => updateLoiField('transaction_costs.broker_commission_rate', v ? Number(v) : null)}
                    fieldPath="transaction_costs.broker_commission_rate"
                    {...confidenceProps}
                    suffix="%"
                  />
                  <Input
                    label="Broker Paid By"
                    value={loiData.transaction_costs.broker_paid_by}
                    onChange={(v) => updateLoiField('transaction_costs.broker_paid_by', v)}
                    fieldPath="transaction_costs.broker_paid_by"
                    {...confidenceProps}
                  />
                  <Input
                    label="Legal Fees Allocation"
                    value={loiData.transaction_costs.legal_fees_allocation}
                    onChange={(v) => updateLoiField('transaction_costs.legal_fees_allocation', v)}
                    fieldPath="transaction_costs.legal_fees_allocation"
                    {...confidenceProps}
                  />
                  <Input
                    label="Title Insurance Paid By"
                    value={loiData.transaction_costs.title_insurance_paid_by ?? ''}
                    onChange={(v) => updateLoiField('transaction_costs.title_insurance_paid_by', v)}
                    fieldPath="transaction_costs.title_insurance_paid_by"
                    {...confidenceProps}
                  />
                  <Input
                    label="Tenant Improvement Allowance ($/sqft)"
                    type="number"
                    value={loiData.transaction_costs.tenant_improvement_allowance ?? ''}
                    onChange={(v) => updateLoiField('transaction_costs.tenant_improvement_allowance', v ? Number(v) : null)}
                    fieldPath="transaction_costs.tenant_improvement_allowance"
                    {...confidenceProps}
                    prefix="$"
                  />
                </Section>

                {/* Additional Terms */}
                <Section title="Additional Information">
                  <TextArea
                    label="Additional Terms"
                    value={loiData.additional_terms ?? ''}
                    onChange={(v) => updateLoiField('additional_terms', v)}
                  />
                  <Input
                    label="Broker Information"
                    value={loiData.broker_information ?? ''}
                    onChange={(v) => updateLoiField('broker_information', v)}
                    fieldPath="broker_information"
                    {...confidenceProps}
                  />
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 pb-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}


interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  fieldPath?: string;
  fieldConfidences?: Record<string, number>;
  lowConfidenceFields?: string[];
  type?: string;
  prefix?: string;
  suffix?: string;
  confidence?: number;
  isLowConfidence?: boolean;
}

function Input({
  label,
  value,
  onChange,
  fieldPath,
  fieldConfidences,
  lowConfidenceFields,
  type = 'text',
  prefix,
  suffix,
  confidence: providedConfidence,
  isLowConfidence: providedIsLowConfidence
}: InputProps) {
  // Auto-lookup confidence if fieldPath is provided
  const confidence = providedConfidence ?? (fieldPath && fieldConfidences ? fieldConfidences[fieldPath] : undefined);
  const isLowConfidence = providedIsLowConfidence ?? (fieldPath && lowConfidenceFields ? lowConfidenceFields.includes(fieldPath) : false);
  const inputClasses = isLowConfidence
    ? "flex-1 px-3 py-2 border-2 border-yellow-400 bg-yellow-50 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
    : "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  // Ensure value is always a string to avoid React warnings
  const safeValue = value === null || value === undefined ? '' : String(value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
        {label}
        {isLowConfidence && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            ⚠️ Low Confidence {confidence ? `(${Math.round(confidence)}%)` : ''}
          </span>
        )}
      </label>
      <div className="flex items-center">
        {prefix && <span className="text-gray-500 mr-2">{prefix}</span>}
        <input
          type={type}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
          placeholder={isLowConfidence ? "⚠️ Please verify and update this field" : undefined}
        />
        {suffix && <span className="text-gray-500 ml-2">{suffix}</span>}
      </div>
      {isLowConfidence && (
        <p className="text-xs text-yellow-700 mt-1">
          This field was extracted with low confidence. Please review and update if needed.
        </p>
      )}
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    </div>
  );
}
