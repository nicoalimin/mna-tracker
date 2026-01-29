import JSZip from 'jszip';

/**
 * Extracts raw text from a PPTX file buffer manually using JSZip.
 * It opens the PPTX (which is a ZIP) and iterates through slide XMLs.
 * @param buffer - The file buffer
 * @returns Concatenated raw text from the document
 */
export async function extractPptxText(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let extractedText = "";

    // Helper to extract text from XML content
    const getTextFromXml = (xml: string) => {
      // Remove all tags, leaving only content
      // This is a naive regex strip but effective for getting raw tokens for LLM
      return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    };

    // 1. Process Slides (ppt/slides/slide*.xml)
    // We sort them to try and keep order, though file names aren't always 1,2,3 perfectly ordered in numerical sense (slide1, slide10, etc)
    const slideFiles = Object.keys(zip.files).filter(path =>
      path.startsWith("ppt/slides/slide") && path.endsWith(".xml")
    );

    // Sort naively or by extracting number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0");
      return numA - numB;
    });

    for (const fileName of slideFiles) {
      const xmlContent = await zip.file(fileName)?.async("text");
      if (xmlContent) {
        extractedText += `\n--- Slide ${fileName} ---\n`;
        extractedText += getTextFromXml(xmlContent) + "\n";
      }
    }

    // 2. Process Notes (ppt/notesSlides/notesSlide*.xml)
    const noteFiles = Object.keys(zip.files).filter(path =>
      path.startsWith("ppt/notesSlides/notesSlide") && path.endsWith(".xml")
    );

    // Attempt to map notes to slides if needed, but for raw context dumping all notes is fine
    for (const fileName of noteFiles) {
      const xmlContent = await zip.file(fileName)?.async("text");
      if (xmlContent) {
        extractedText += `\n--- Note ${fileName} ---\n`;
        extractedText += getTextFromXml(xmlContent) + "\n";
      }
    }

    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PPTX manually:', error);
    throw new Error('Failed to extract text from PPTX file');
  }
}
