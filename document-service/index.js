const express = require('express');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from output directory
app.use('/downloads', express.static(path.join(__dirname, 'output')));

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Format currency values
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return 'N/A';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date values
 */
function formatDate(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Prepare data for template injection
 */
function prepareTemplateData(loiData) {
  const pd = loiData.property_details;
  const pi = loiData.party_information;
  const ft = loiData.financial_terms;
  const tl = loiData.timeline;
  const co = loiData.contingencies;
  const tc = loiData.transaction_costs;

  return {
    // Current date
    current_date: formatDate(new Date().toISOString()),

    // Property Details
    property_address: pd.address,
    property_type: pd.property_type,
    square_footage: pd.square_footage ? pd.square_footage.toLocaleString() : 'TBD',
    property_description: pd.description || 'N/A',

    // Parties
    buyer_tenant_name: pi.buyer_tenant_name,
    buyer_tenant_entity: pi.buyer_tenant_entity || '',
    seller_landlord_name: pi.seller_landlord_name,
    seller_landlord_entity: pi.seller_landlord_entity || '',

    // Financial Terms
    transaction_type: ft.transaction_type,
    is_lease: ft.transaction_type.toLowerCase().includes('lease'),
    is_purchase: ft.transaction_type.toLowerCase().includes('purchase'),
    purchase_price: formatCurrency(ft.purchase_price),
    base_rent: formatCurrency(ft.base_rent),
    rent_per_sqft: ft.rent_per_sqft ? `$${ft.rent_per_sqft.toFixed(2)}` : 'N/A',
    escalation_rate: `${ft.escalation_rate}%`,
    security_deposit: formatCurrency(ft.security_deposit),
    operating_expenses: ft.operating_expenses,

    // Timeline
    loi_expiration_date: formatDate(tl.loi_expiration_date),
    due_diligence_period: `${tl.due_diligence_period} days`,
    lease_commencement_date: formatDate(tl.lease_commencement_date),
    lease_term: tl.lease_term_months ? `${tl.lease_term_months} months (${Math.floor(tl.lease_term_months / 12)} years)` : 'TBD',
    closing_date: formatDate(tl.closing_date),
    free_rent_period: tl.free_rent_period ? `${tl.free_rent_period} months` : 'None',

    // Contingencies
    financing_contingency: co.financing_contingency ? 'Yes' : 'No',
    inspection_contingency: co.inspection_contingency ? 'Yes' : 'No',
    environmental_contingency: co.environmental_contingency ? 'Yes' : 'No',
    zoning_approval: co.zoning_approval ? 'Yes' : 'No',
    custom_contingencies: co.custom_contingencies && co.custom_contingencies.length > 0
      ? co.custom_contingencies.map(c => `• ${c}`).join('\n')
      : 'None',

    // Transaction Costs
    broker_commission_rate: `${tc.broker_commission_rate}%`,
    broker_paid_by: tc.broker_paid_by,
    legal_fees_allocation: tc.legal_fees_allocation,
    title_insurance_paid_by: tc.title_insurance_paid_by || 'N/A',
    tenant_improvement_allowance: tc.tenant_improvement_allowance
      ? `$${tc.tenant_improvement_allowance} per square foot`
      : 'None',

    // Additional
    additional_terms: loiData.additional_terms || 'None',
    broker_information: loiData.broker_information || '[Broker Name and Contact]',
  };
}

/**
 * POST /generate - Generate LOI document
 */
app.post('/generate', async (req, res) => {
  try {
    const loiData = req.body;

    // Read template
    const templatePath = path.join(__dirname, 'template.docx');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        success: false,
        error: 'Template file not found. Please ensure template.docx exists in document-service folder.'
      });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Create document
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare and inject data
    const templateData = prepareTemplateData(loiData);

    // Render document with data (new API)
    doc.render(templateData);

    // Generate buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Save file
    const filename = `LOI_${Date.now()}.docx`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, buffer);

    // Return download URL
    const downloadUrl = `http://localhost:${PORT}/downloads/${filename}`;

    res.json({
      success: true,
      filename,
      download_url: downloadUrl,
      message: 'Document generated successfully'
    });

  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate document'
    });
  }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  const templateExists = fs.existsSync(path.join(__dirname, 'template.docx'));
  res.json({
    status: 'healthy',
    template_exists: templateExists,
    output_dir: outputDir
  });
});

/**
 * GET / - Service info
 */
app.get('/', (req, res) => {
  res.json({
    service: 'LOI Document Generation Service',
    version: '1.0.0',
    endpoints: {
      generate: 'POST /generate',
      health: 'GET /health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Document service running on http://localhost:${PORT}`);
  console.log(`Output directory: ${outputDir}`);
});
