/* ============================================================
   AGENTS MAÎTRES — Document Extraction Module (v3.0)
   Handles PDF and DOCX text extraction
   ============================================================ */

/**
 * Extract text from a File object
 * @param {File} file 
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'docx':
      return await extractTextFromDOCX(file);
    default:
      throw new Error('Format de fichier non supporté. Utilisez PDF ou DOCX.');
  }
}

/**
 * PDF extraction using PDF.js
 */
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use the global pdfjsLib from CDN
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(' ') + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    throw new Error('Erreur lors de l’analyse du PDF.');
  }
}

/**
 * DOCX extraction using Mammoth.js
 */
async function extractTextFromDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use the global mammoth from CDN
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('DOCX Extraction Error:', error);
    throw new Error('Erreur lors de l’analyse du document Word.');
  }
}
