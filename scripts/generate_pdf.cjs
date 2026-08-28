const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.resolve('/Users/mac/Desktop/TP-_Stripe_repo/The_Pot_Strategic_Improvement_Report.pdf');
const artifactDir = path.resolve('/Users/mac/.gemini/antigravity-ide/brain/baff4091-7fb8-4d88-8aa2-6ce165aae7b5');
const artifactPdfPath = path.join(artifactDir, 'The_Pot_Strategic_Improvement_Report.pdf');

// Create document
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 45, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Colors
const primaryColor = '#4F46E5'; // Indigo
const secondaryColor = '#7C3AED'; // Purple
const accentColor = '#059669'; // Emerald
const darkColor = '#0F172A'; // Slate 900
const grayColor = '#475569'; // Slate 600
const lightBg = '#F8FAFC'; // Slate 50
const borderCard = '#E2E8F0'; // Slate 200

// Helper: Header Banner
function drawHeader(title, subtitle) {
  doc.rect(0, 0, 595.28, 80).fill('#312E81'); // Deep Indigo

  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
     .text(title, 45, 20);

  doc.fillColor('#A5B4FC').fontSize(11).font('Helvetica')
     .text(subtitle, 45, 48);

  doc.moveDown(2);
}

// -------------------------------------------------------------
// PAGE 1: Executive Summary & Rotational Savings (ROSCAs / Susu)
// -------------------------------------------------------------
drawHeader('THE POT — Strategic Roadmap & Proposal', 'Comprehensive Architectural & Product Modernization Plan');

doc.y = 95;

// Meta card
doc.roundedRect(45, doc.y, 505.28, 48, 6).fillAndStroke(lightBg, borderCard);
doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold')
   .text('DOCUMENT VERSION:', 55, 102)
   .font('Helvetica').text('2.0 (Production Blueprint)', 165, 102)
   .font('Helvetica-Bold').text('TARGET PLATFORM:', 310, 102)
   .font('Helvetica').text('The Pot Group Banking', 415, 102);

doc.font('Helvetica-Bold').text('AUTHORS:', 55, 120)
   .font('Helvetica').text('Product & Fintech Architecture Team', 165, 120)
   .font('Helvetica-Bold').text('DATE:', 310, 120)
   .font('Helvetica').text('February 2026', 415, 120);

doc.y = 155;

// Section 1: Executive Summary
doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('1. Executive Summary', 45, doc.y);
doc.moveDown(0.4);

doc.fillColor(darkColor).fontSize(9.5).font('Helvetica').lineGap(3)
   .text('The Pot is a modern collaborative savings and group liquidity web application. While the current MVP successfully validates simulated sandbox deposits, natural language AI pot generation, and basic voting governance, scaling the product into a category-defining fintech platform requires architectural modernization across five strategic pillars: Rotational Savings (ROSCAs/Susu), Multi-User Authentication & Viral Invites, In-Pot Social/Expense Management, Multi-Sig Governance, and AI-Driven Financial Intelligence.');

doc.moveDown(0.8);

// Section 2: Rotational Savings Architecture
doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('2. Pillar I: Rotational Savings Architecture (ROSCAs / Susu / Chit Funds)', 45, doc.y);
doc.moveDown(0.4);

doc.fillColor(darkColor).fontSize(9.5).font('Helvetica').lineGap(2.5)
   .text('Over 1 billion people globally utilize informal peer-to-peer rotational savings systems (known as Esusu/Ajo in West Africa, Tandas in Latin America, Chit Funds in India, and Hui in East Asia). Adding structured rotational cycles elevates The Pot from a simple static pool into an active peer-to-peer credit and savings engine.');

doc.moveDown(0.6);

// Diagram Box
const diagramY = doc.y;
doc.roundedRect(45, diagramY, 505.28, 70, 6).fillAndStroke('#EEF2FF', '#C7D2FE');
doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text('HOW ROTATIONAL SAVINGS WORKS IN THE POT', 55, diagramY + 8);

const colW = 150;
const startX = 55;
const rowY = diagramY + 24;

doc.roundedRect(startX, rowY, colW, 36, 4).fillAndStroke('#FFFFFF', '#CBD5E1');
doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text('Cycle 1 ($300 Pot)', startX + 6, rowY + 5);
doc.font('Helvetica').fontSize(7.5).fillColor(grayColor).text('3 members deposit $100\nRecipient: Member A', startX + 6, rowY + 16);

doc.roundedRect(startX + colW + 20, rowY, colW, 36, 4).fillAndStroke('#FFFFFF', '#CBD5E1');
doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text('Cycle 2 ($300 Pot)', startX + colW + 26, rowY + 5);
doc.font('Helvetica').fontSize(7.5).fillColor(grayColor).text('3 members deposit $100\nRecipient: Member B', startX + colW + 26, rowY + 16);

doc.roundedRect(startX + (colW + 20) * 2, rowY, colW, 36, 4).fillAndStroke('#FFFFFF', '#CBD5E1');
doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text('Cycle 3 ($300 Pot)', startX + (colW + 20) * 2 + 6, rowY + 5);
doc.font('Helvetica').fontSize(7.5).fillColor(grayColor).text('3 members deposit $100\nRecipient: Member C', startX + (colW + 20) * 2 + 6, rowY + 16);

doc.y = diagramY + 82;

doc.fillColor(darkColor).fontSize(9.5).font('Helvetica-Bold').text('Rotation Models Supported:');
doc.font('Helvetica').fontSize(9).lineGap(2)
   .text('• Fixed Sequence: Pre-agreed turn order designated at Pot initialization.')
   .text('• Lottery / Random Draw: Cryptographically verifiable fair draw each cycle with celebratory animations.')
   .text('• Chit Fund / Auction Bidding: Members in urgent need bid for early payouts at a discount distributed to peers.');

doc.moveDown(0.8);

// Section 3: Multi-User Collaboration & Viral Invites
doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('3. Pillar II: Multi-User Auth & Viral Invite Engine', 45, doc.y);
doc.moveDown(0.4);

doc.fillColor(darkColor).fontSize(9).font('Helvetica').lineGap(2.5)
   .text('• Hybrid Authentication: Production-grade Auth (Google OAuth, Magic Links, Passkeys) with one-click sandbox demo switcher.')
   .text('• Instant Deep-Link Invites: Shareable links (/join/:potId?token=...) with rich OpenGraph metadata previewing Pot targets.')
   .text('• WhatsApp, Telegram & QR Code Engine: Generates scannable QR codes for seamless in-person community onboarding.');

// -------------------------------------------------------------
// PAGE 2: Social Layer, Governance, AI, PWA & Implementation Roadmap
// -------------------------------------------------------------
doc.addPage();
drawHeader('THE POT — Strategic Roadmap & Proposal', 'Core Architecture, Governance & Execution Roadmap');

doc.y = 95;

// Section 4: In-Pot Social Layer & Expense Splitting
doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('4. Pillar III: In-Pot Social Feed & Expense Management', 45, doc.y);
doc.moveDown(0.3);

doc.fillColor(darkColor).fontSize(9).font('Helvetica').lineGap(2.5)
   .text('• Social Activity Stream: In-pot messaging feed where members post receipts, trip photos, and milestone celebrations.')
   .text('• Out-of-Pocket Expense Logging: Members log shared receipts (e.g. Airbnb bookings); the Pot reimburses them automatically.')
   .text('• Automated Social Nudges: Automated multi-channel SMS/WhatsApp reminders 48h and 12h prior to contribution deadlines.');

doc.moveDown(0.6);

// Section 5: Smart Governance & Multi-Sig Approvals
doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('5. Pillar IV: Smart Governance & Multi-Signature Approvals', 45, doc.y);
doc.moveDown(0.3);

doc.fillColor(darkColor).fontSize(9).font('Helvetica').lineGap(2.5)
   .text('• M-of-N Multi-Sig Authorization: Requires majority sign-off (e.g. 3 of 5 members) before high-value withdrawals disburse.')
   .text('• Milestone Escrow Releases: Staged unlocks (e.g. 30% reservation, 40% mid-point proof, 30% final settlement).')
   .text('• Emergency Freeze Voting: Immediate security freeze triggered if suspicious activity is reported by any participant.');

doc.moveDown(0.6);

// Section 6: AI Intelligence & Mobile PWA
doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('6. Pillar V: AI Financial Intelligence & Mobile PWA', 45, doc.y);
doc.moveDown(0.3);

doc.fillColor(darkColor).fontSize(9).font('Helvetica').lineGap(2.5)
   .text('• AI Pot Financial Advisor: Embedded Gemini/N8N agent predicting goal completion velocity and flagging member defaults.')
   .text('• Mobile PWA (Progressive Web App): Service worker & manifest for native iOS/Android installation with offline caching.');

doc.moveDown(0.8);

// Section 7: Phased Implementation Roadmap Table
doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('7. Strategic Implementation Roadmap', 45, doc.y);
doc.moveDown(0.4);

// Table Header
const tableY = doc.y;
const tWidth = 505.28;
doc.rect(45, tableY, tWidth, 22).fill('#4338CA');
doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
   .text('PHASE', 55, tableY + 6)
   .text('FOCUS MILESTONE', 115, tableY + 6)
   .text('KEY DELIVERABLES', 240, tableY + 6)
   .text('TIMELINE', 475, tableY + 6);

const rows = [
  { phase: 'Phase 1', milestone: 'Multi-User & Invites', desc: 'Real-time PostgreSQL sync, Deep-link invites, QR code share, Google OAuth', time: '2 Weeks' },
  { phase: 'Phase 2', milestone: 'Rotational Payouts', desc: 'Cycle schedule engine, Turn lottery/auction, Recurring auto-deposits', time: '3 Weeks' },
  { phase: 'Phase 3', milestone: 'Social & Expenses', desc: 'In-pot activity stream, Receipt attachments, Expense reimbursements, Nudges', time: '2 Weeks' },
  { phase: 'Phase 4', milestone: 'Multi-Sig Governance', desc: 'M-of-N signature approvals, Milestone escrow releases, Emergency freeze', time: '2 Weeks' },
  { phase: 'Phase 5', milestone: 'PWA Mobile & AI', desc: 'Mobile PWA offline app, Push notifications, AI savings velocity advisor', time: '2 Weeks' },
];

let currentY = tableY + 22;
rows.forEach((r, idx) => {
  const rowBg = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
  doc.rect(45, currentY, tWidth, 26).fillAndStroke(rowBg, borderCard);

  doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text(r.phase, 55, currentY + 8);
  doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text(r.milestone, 115, currentY + 8);
  doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text(r.desc, 240, currentY + 4, { width: 225, lineGap: 1.5 });
  doc.fillColor(accentColor).fontSize(8).font('Helvetica-Bold').text(r.time, 475, currentY + 8);

  currentY += 26;
});

doc.y = currentY + 15;

// Summary Box
doc.roundedRect(45, doc.y, tWidth, 48, 6).fillAndStroke('#ECFDF5', '#A7F3D0');
doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('RECOMMENDED IMMEDIATE NEXT STEPS:', 55, doc.y + 8);
doc.fillColor(darkColor).fontSize(8).font('Helvetica').lineGap(2)
   .text('1. Deploy Deep-Link Invite & QR Code Generator to enable multi-user viral sharing.', 55, doc.y + 22)
   .text('2. Build the Rotational Payout Schedule component to unlock ROSCA/Susu community savings pooling.', 55, doc.y + 34);

// Footer on all pages
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.rect(45, 800, 505.28, 1).fill('#E2E8F0');
  doc.fillColor(grayColor).fontSize(7.5).font('Helvetica')
     .text('The Pot Unlimited © 2026 — Strategic Roadmap & Engineering Specification', 45, 808)
     .text(`Page ${i + 1} of ${pages.count}`, 500, 808, { align: 'right' });
}

doc.end();

writeStream.on('finish', () => {
  // Also copy to artifact dir
  fs.copyFileSync(outputPath, artifactPdfPath);
  console.log('PDF successfully created at:', outputPath);
  console.log('PDF copied to artifact dir at:', artifactPdfPath);
});
