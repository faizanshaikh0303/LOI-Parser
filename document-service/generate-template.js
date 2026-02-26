/**
 * Generates template.docx for use with docxtemplater.
 * Run during build: node generate-template.js
 *
 * Uses paragraphLoop: true syntax — {#condition} and {/condition} tags
 * must be alone in their own paragraphs.
 */

const { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } = require('docx');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'template.docx');

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 120 },
  });
}

function heading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, underline: { type: UnderlineType.SINGLE } })],
    spacing: { before: 240, after: 120 },
  });
}

function blank() {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } });
}

// paragraphLoop conditional opener/closer — must be sole content of paragraph
function open(tag) {
  return new Paragraph({ children: [new TextRun(`{#${tag}}`)] });
}

function close(tag) {
  return new Paragraph({ children: [new TextRun(`{/${tag}}`)] });
}

const doc = new Document({
  sections: [{
    children: [

      // ── Title ──────────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: 'LETTER OF INTENT', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Commercial Real Estate Transaction', size: 22 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '{current_date}' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      }),

      // ── Introduction ───────────────────────────────────────────────────────
      p('This Letter of Intent ("LOI") outlines the proposed terms under which the parties below intend to proceed. This LOI is non-binding except where expressly stated.'),
      blank(),

      // ── 1. Property ────────────────────────────────────────────────────────
      heading('1. PROPERTY'),
      p('Address:          {property_address}'),
      p('Property Type:    {property_type}'),
      p('Size:             {square_footage} square feet'),
      p('Description:      {property_description}'),
      blank(),

      // ── 2. Parties ─────────────────────────────────────────────────────────
      heading('2. PARTIES'),

      open('is_lease'),
      p('Tenant:    {buyer_tenant_name} ({buyer_tenant_entity})'),
      p('Landlord:  {seller_landlord_name} ({seller_landlord_entity})'),
      close('is_lease'),

      open('is_purchase'),
      p('Buyer:   {buyer_tenant_name} ({buyer_tenant_entity})'),
      p('Seller:  {seller_landlord_name} ({seller_landlord_entity})'),
      close('is_purchase'),

      blank(),

      // ── 3. Financial Terms ─────────────────────────────────────────────────
      heading('3. FINANCIAL TERMS'),
      p('Transaction Type: {transaction_type}'),
      blank(),

      // Lease financial terms
      open('is_lease'),
      p('Base Rent:                    {base_rent} / month'),
      p('Rent per Square Foot:         {rent_per_sqft} / sq ft / year'),
      p('Annual Escalation:            {escalation_rate}'),
      p('Security Deposit:             {security_deposit}'),
      p('Operating Expenses:           {operating_expenses}'),
      p('Free Rent Period:             {free_rent_period}'),
      p('Tenant Improvement Allowance: {tenant_improvement_allowance} / sq ft'),
      close('is_lease'),

      // Purchase financial terms
      open('is_purchase'),
      p('Purchase Price: {purchase_price}'),
      close('is_purchase'),

      blank(),

      // ── 4. Timeline ────────────────────────────────────────────────────────
      heading('4. TIMELINE'),
      p('LOI Expiration Date:     {loi_expiration_date}'),
      p('Due Diligence Period:    {due_diligence_period}'),

      open('is_lease'),
      p('Lease Commencement Date: {lease_commencement_date}'),
      p('Lease Term:              {lease_term}'),
      close('is_lease'),

      open('is_purchase'),
      p('Closing Date: {closing_date}'),
      close('is_purchase'),

      blank(),

      // ── 5. Contingencies ───────────────────────────────────────────────────
      heading('5. CONTINGENCIES'),
      p('Financing Contingency:     {financing_contingency}'),
      p('Inspection Contingency:    {inspection_contingency}'),
      p('Environmental Contingency: {environmental_contingency}'),
      p('Zoning Approval Required:  {zoning_approval}'),
      p('Additional Contingencies:'),
      p('{custom_contingencies}'),
      blank(),

      // ── 6. Transaction Costs ───────────────────────────────────────────────
      heading('6. TRANSACTION COSTS'),
      p('Broker Commission:   {broker_commission_rate} — paid by {broker_paid_by}'),
      p('Legal Fees:          {legal_fees_allocation}'),

      open('is_purchase'),
      p('Title Insurance:     {title_insurance_paid_by}'),
      close('is_purchase'),

      open('is_lease'),
      p('TI Allowance:        {tenant_improvement_allowance} / sq ft'),
      close('is_lease'),

      blank(),

      // ── 7. Additional Terms ────────────────────────────────────────────────
      heading('7. ADDITIONAL TERMS'),
      p('{additional_terms}'),
      blank(),

      // ── 8. Broker ──────────────────────────────────────────────────────────
      heading('8. BROKER INFORMATION'),
      p('{broker_information}'),
      blank(),

      // ── Non-binding notice ─────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({
          text: 'NON-BINDING: This Letter of Intent is not intended to be and shall not constitute a legally binding agreement. Either party may withdraw without liability prior to execution of a definitive agreement.',
          italics: true,
          size: 18,
        })],
        spacing: { before: 240, after: 320 },
      }),

      // ── Signatures ─────────────────────────────────────────────────────────
      heading('SIGNATURES'),

      open('is_lease'),
      p('TENANT: {buyer_tenant_name}'),
      close('is_lease'),

      open('is_purchase'),
      p('BUYER: {buyer_tenant_name}'),
      close('is_purchase'),

      p('Signature: _________________________________    Date: _______________'),
      p('Name:      _________________________________'),
      p('Title:     _________________________________'),
      blank(),

      open('is_lease'),
      p('LANDLORD: {seller_landlord_name}'),
      close('is_lease'),

      open('is_purchase'),
      p('SELLER: {seller_landlord_name}'),
      close('is_purchase'),

      p('Signature: _________________________________    Date: _______________'),
      p('Name:      _________________________________'),
      p('Title:     _________________________________'),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(TEMPLATE_PATH, buffer);
  console.log('✓ template.docx generated successfully');
}).catch((err) => {
  console.error('✗ Failed to generate template.docx:', err);
  process.exit(1);
});
