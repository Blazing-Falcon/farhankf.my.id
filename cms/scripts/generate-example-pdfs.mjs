import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const cmsOutput = resolve(scriptDirectory, '../seed-assets/documents');
const siteOutput = resolve(scriptDirectory, '../../site/public/documents');

const documents = [
  ['example-research-paper.pdf', 'Example Research Paper', 'Sample attachment to verify PDF embedding in blog posts and projects.'],
  ['architecture-overview.pdf', 'Architecture Overview Document', 'Sample technical documentation PDF.'],
];

const lorem = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
];

const escapePdfText = (value) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function pageStream(title, subtitle, pageNumber) {
  const commands = [
    'BT',
    '/F1 20 Tf',
    `72 770 Td (${escapePdfText(title)}) Tj`,
    '/F1 11 Tf',
    `0 -28 Td (${escapePdfText(subtitle)}) Tj`,
    `0 -24 Td (Page ${pageNumber} of 2 - sample document for preview.) Tj`,
  ];

  for (const paragraph of lorem) {
    commands.push(`0 -30 Td (${escapePdfText(paragraph.slice(0, 82))}) Tj`);
    commands.push(`0 -16 Td (${escapePdfText(paragraph.slice(82))}) Tj`);
  }

  commands.push('0 -34 Td (Replace this file through the PDF Document component in Strapi.) Tj', 'ET');
  return commands.join('\n');
}

function createPdf(title, subtitle) {
  const firstPage = pageStream(title, subtitle, 1);
  const secondPage = pageStream('Sample Continuation Page', 'Second page ensures multi-page navigation works properly.', 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
    `<< /Length ${Buffer.byteLength(firstPage)} >>\nstream\n${firstPage}\nendstream`,
    `<< /Length ${Buffer.byteLength(secondPage)} >>\nstream\n${secondPage}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

mkdirSync(cmsOutput, { recursive: true });
mkdirSync(siteOutput, { recursive: true });

for (const [fileName, title, subtitle] of documents) {
  const pdf = createPdf(title, subtitle);
  writeFileSync(resolve(cmsOutput, fileName), pdf);
  writeFileSync(resolve(siteOutput, fileName), pdf);
}
