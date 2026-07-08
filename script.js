const sampleMarkdown = `# ตัวอย่างเอกสาร

ไฟล์ Markdown จะแสดงตัวอย่างด้วยฟอนต์ **Noto Sans Thai** ก่อนดาวน์โหลดเป็น PDF

## รายการ

- รองรับหัวข้อ ตาราง รูปภาพ ลิงก์ และโค้ด
- แก้ไขข้อความในกล่อง Markdown แล้วดูตัวอย่างทันที
- ปรับขนาดฟอนต์ของ \`inline code\`, code block และ table ได้

### ตารางตัวอย่าง

| รายการ | สถานะ |
| --- | --- |
| Markdown preview | พร้อม |
| PDF export | พร้อม |

> ข้อความ quote จะใช้ขนาดฟอนต์ของตัวเอง

\`\`\`js
const message = "Markdown to PDF";
console.log(message);
\`\`\`

\`\`\`python
def make_pdf(title):
    return f"{title}.pdf"
\`\`\`
`;

const paperSizes = {
  a4: { label: "A4", width: 210, height: 297 },
  a5: { label: "A5", width: 148, height: 210 },
  letter: { label: "Letter", width: 216, height: 279 },
  legal: { label: "Legal", width: 216, height: 356 },
};

const marginPresets = {
  narrow: { top: 10, right: 10, bottom: 10, left: 10 },
  normal: { top: 14, right: 14, bottom: 14, left: 14 },
  wide: { top: 20, right: 20, bottom: 20, left: 20 },
};

const typographyDefaults = {
  bodyFont: "16",
  h1Font: "30",
  h2Font: "24",
  h3Font: "19",
  h4Font: "17",
  h5Font: "15",
  listFont: "16",
  quoteFont: "16",
  tableFont: "14",
  inlineCodeFont: "15",
  codeBlockFont: "14",
  lineHeight: "1.72",
};

const pdfMetadataSource = "yuttapichaiARD-MD2PDF";
const docxFontFamily = "THSarabun";

const state = {
  sourceName: "document.md",
  outputMode: "pdf",
};

const elements = {
  pdfTab: document.getElementById("pdfTab"),
  docxTab: document.getElementById("docxTab"),
  dropZone: document.getElementById("dropZone"),
  fileInput: document.getElementById("fileInput"),
  fileMeta: document.getElementById("fileMeta"),
  fileName: document.getElementById("fileName"),
  paperSize: document.getElementById("paperSize"),
  orientation: document.getElementById("orientation"),
  pageWidth: document.getElementById("pageWidth"),
  pageHeight: document.getElementById("pageHeight"),
  renderScale: document.getElementById("renderScale"),
  marginPreset: document.getElementById("marginPreset"),
  marginTop: document.getElementById("marginTop"),
  marginRight: document.getElementById("marginRight"),
  marginBottom: document.getElementById("marginBottom"),
  marginLeft: document.getElementById("marginLeft"),
  markdownInput: document.getElementById("markdownInput"),
  preview: document.getElementById("preview"),
  previewPage: document.getElementById("previewPage"),
  downloadPdf: document.getElementById("downloadPdf"),
  printPdf: document.getElementById("printPdf"),
  resetTypography: document.getElementById("resetTypography"),
  statusText: document.getElementById("statusText"),
  pageLabel: document.getElementById("pageLabel"),
  exportHost: document.getElementById("exportHost"),
  printStyle: document.getElementById("printStyle"),
  typographyInputs: [...document.querySelectorAll("[data-style-var]")],
};

function init() {
  elements.markdownInput.value = sampleMarkdown;
  syncPaperInputsFromPreset();
  applyMarginPreset();
  applyTypographySettings();
  applyPageSettings();
  renderMarkdown();
  applyOutputMode();
  wireEvents();
}

function wireEvents() {
  elements.fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) {
      readMarkdownFile(file);
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove("is-dragging");
    });
  });

  elements.dropZone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    if (file) {
      readMarkdownFile(file);
    }
  });

  elements.markdownInput.addEventListener("input", renderMarkdown);
  elements.fileName.addEventListener("blur", normalizePdfName);

  elements.paperSize.addEventListener("change", () => {
    syncPaperInputsFromPreset();
    applyPageSettings();
  });

  elements.orientation.addEventListener("change", () => {
    if (elements.paperSize.value === "custom") {
      swapPageDimensions();
    } else {
      syncPaperInputsFromPreset();
    }
    applyPageSettings();
  });

  [elements.pageWidth, elements.pageHeight].forEach((input) => {
    input.addEventListener("input", () => {
      elements.paperSize.value = "custom";
      setCustomPageInputsEnabled(true);
      applyPageSettings();
    });
  });

  elements.marginPreset.addEventListener("change", () => {
    applyMarginPreset();
    applyPageSettings();
  });

  [elements.marginTop, elements.marginRight, elements.marginBottom, elements.marginLeft].forEach(
    (input) => {
      input.addEventListener("input", () => {
        elements.marginPreset.value = "custom";
        applyPageSettings();
      });
    },
  );

  elements.typographyInputs.forEach((input) => {
    input.addEventListener("input", applyTypographySettings);
  });

  elements.resetTypography.addEventListener("click", resetTypographySettings);
  elements.pdfTab.addEventListener("click", () => setOutputMode("pdf"));
  elements.docxTab.addEventListener("click", () => setOutputMode("docx"));
  elements.downloadPdf.addEventListener("click", downloadCurrentOutput);
  elements.printPdf.addEventListener("click", printPdf);
}

function setOutputMode(mode) {
  state.outputMode = mode;
  applyOutputMode();
}

function applyOutputMode() {
  const isDocx = state.outputMode === "docx";
  document.body.classList.toggle("docx-mode", isDocx);
  elements.pdfTab.classList.toggle("is-active", !isDocx);
  elements.docxTab.classList.toggle("is-active", isDocx);
  elements.pdfTab.setAttribute("aria-selected", String(!isDocx));
  elements.docxTab.setAttribute("aria-selected", String(isDocx));
  elements.downloadPdf.textContent = isDocx ? "ดาวน์โหลด DOCX" : "ดาวน์โหลด PDF";
  elements.printPdf.disabled = isDocx;
  elements.pageLabel.textContent = isDocx
    ? `DOCX ${docxFontFamily}`
    : elements.pageLabel.textContent;

  if (!isDocx) {
    applyPageSettings();
  }
}

function downloadCurrentOutput() {
  if (state.outputMode === "docx") {
    downloadDocx();
    return;
  }

  downloadPdf();
}

function readMarkdownFile(file) {
  const isMarkdown = /\.(md|markdown|txt)$/i.test(file.name);
  if (!isMarkdown) {
    setStatus("เลือกไฟล์ .md หรือ .markdown");
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    state.sourceName = file.name;
    elements.markdownInput.value = String(reader.result || "");
    elements.fileMeta.textContent = `${file.name} (${formatBytes(file.size)})`;
    elements.fileName.value = buildPdfName(file.name);
    renderMarkdown();
    setStatus("โหลดไฟล์แล้ว");
  });

  reader.addEventListener("error", () => {
    setStatus("อ่านไฟล์ไม่สำเร็จ");
  });

  reader.readAsText(file, "utf-8");
}

function renderMarkdown() {
  const markdown = elements.markdownInput.value.trim() ? elements.markdownInput.value : " ";

  if (!window.marked || !window.DOMPurify) {
    elements.preview.textContent = markdown;
    setStatus("กำลังโหลดตัวแปลง Markdown");
    return;
  }

  window.marked.setOptions({
    breaks: false,
    gfm: true,
  });

  const html = window.marked.parse(markdown);
  const cleanHtml = window.DOMPurify.sanitize(html, {
    ADD_ATTR: ["target"],
  });

  elements.preview.innerHTML = cleanHtml;
  elements.preview.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer");
  });
  applyCodeHighlighting();
}

function applyCodeHighlighting() {
  elements.preview.querySelectorAll("pre code").forEach((block) => {
    if (!window.hljs) {
      block.classList.add("hljs");
      return;
    }

    block.removeAttribute("data-highlighted");
    window.hljs.highlightElement(block);
  });
}

function syncPaperInputsFromPreset() {
  const preset = paperSizes[elements.paperSize.value];
  const isCustom = !preset;
  setCustomPageInputsEnabled(isCustom);

  if (isCustom) {
    return;
  }

  const dimensions = getPresetDimensions(preset, elements.orientation.value);
  elements.pageWidth.value = dimensions.width;
  elements.pageHeight.value = dimensions.height;
}

function setCustomPageInputsEnabled(isEnabled) {
  elements.pageWidth.disabled = !isEnabled;
  elements.pageHeight.disabled = !isEnabled;
}

function getPresetDimensions(preset, orientation) {
  if (orientation === "landscape") {
    return { width: preset.height, height: preset.width };
  }

  return { width: preset.width, height: preset.height };
}

function swapPageDimensions() {
  const currentWidth = elements.pageWidth.value;
  elements.pageWidth.value = elements.pageHeight.value;
  elements.pageHeight.value = currentWidth;
}

function applyMarginPreset() {
  const preset = marginPresets[elements.marginPreset.value];
  if (!preset) {
    return;
  }

  elements.marginTop.value = preset.top;
  elements.marginRight.value = preset.right;
  elements.marginBottom.value = preset.bottom;
  elements.marginLeft.value = preset.left;
}

function applyTypographySettings() {
  elements.typographyInputs.forEach((input) => {
    const cssVariable = input.dataset.styleVar;
    const unit = input.dataset.unit ?? "px";
    const fallback = typographyDefaults[input.id] || input.value;
    const value = readNumber(input, Number(fallback), Number(input.min), Number(input.max));
    document.documentElement.style.setProperty(cssVariable, `${value}${unit}`);
  });
}

function resetTypographySettings() {
  Object.entries(typographyDefaults).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = value;
    }
  });
  applyTypographySettings();
  setStatus("รีเซ็ตตัวอักษรแล้ว");
}

function applyPageSettings() {
  const page = getPageSettings();
  const paperLabel =
    elements.paperSize.value === "custom"
      ? "Custom"
      : paperSizes[elements.paperSize.value].label;
  const orientationLabel = page.width >= page.height ? "นอน" : "ตั้ง";

  document.documentElement.style.setProperty("--page-width", `${page.width}mm`);
  document.documentElement.style.setProperty("--page-height", `${page.height}mm`);
  document.documentElement.style.setProperty("--page-margin-top", `${page.marginTop}mm`);
  document.documentElement.style.setProperty("--page-margin-right", `${page.marginRight}mm`);
  document.documentElement.style.setProperty("--page-margin-bottom", `${page.marginBottom}mm`);
  document.documentElement.style.setProperty("--page-margin-left", `${page.marginLeft}mm`);

  if (state.outputMode === "docx") {
    elements.pageLabel.textContent = `DOCX ${docxFontFamily}`;
    return;
  }

  elements.pageLabel.textContent = `${paperLabel} ${orientationLabel} ${page.width} x ${page.height} mm`;
  elements.printStyle.textContent = `@page { size: ${page.width}mm ${page.height}mm; margin: 0; }`;
}

function getPageSettings() {
  return {
    width: readNumber(elements.pageWidth, 210, 50, 1000),
    height: readNumber(elements.pageHeight, 297, 50, 1000),
    marginTop: readNumber(elements.marginTop, 14, 0, 80),
    marginRight: readNumber(elements.marginRight, 14, 0, 80),
    marginBottom: readNumber(elements.marginBottom, 14, 0, 80),
    marginLeft: readNumber(elements.marginLeft, 14, 0, 80),
  };
}

function readNumber(input, fallback, min, max) {
  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function normalizePdfName() {
  if (!elements.fileName.value.trim()) {
    return;
  }

  elements.fileName.value = ensurePdfExtension(elements.fileName.value);
}

async function downloadPdf() {
  const JsPdf = getJsPdfConstructor();
  if (!window.html2canvas || !JsPdf) {
    printPdf();
    return;
  }

  setBusy(true, "กำลังสร้าง PDF");

  try {
    await waitForFonts();
    const page = getPageSettings();
    const clone = elements.previewPage.cloneNode(true);
    clone.removeAttribute("id");
    clone.style.maxWidth = "none";
    clone.style.minHeight = `${Math.max(page.height - page.marginTop - page.marginBottom, 10)}mm`;
    clone.style.width = `${page.width}mm`;
    clone.style.paddingTop = "0";
    clone.style.paddingBottom = "0";
    elements.exportHost.replaceChildren(clone);

    const canvas = await window.html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: readNumber(elements.renderScale, 2, 1, 3),
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      windowHeight: Math.ceil(clone.scrollHeight),
      windowWidth: Math.ceil(clone.scrollWidth),
    });

    const orientation = page.width >= page.height ? "landscape" : "portrait";
    const pdf = new JsPdf({
      unit: "mm",
      format: [page.width, page.height],
      orientation,
    });

    pdf.setProperties(getPdfMetadata());
    addCanvasPagesToPdf(pdf, canvas, page, orientation);
    pdf.save(getPdfName());
    setStatus("ดาวน์โหลดแล้ว");
  } catch (error) {
    console.error(error);
    setStatus("สร้าง PDF ไม่สำเร็จ");
  } finally {
    elements.exportHost.replaceChildren();
    setBusy(false);
  }
}

function getJsPdfConstructor() {
  if (window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }

  return window.jsPDF;
}

function addCanvasPagesToPdf(pdf, canvas, page, orientation) {
  const pageWidthPx = canvas.width;
  const pxPerMm = pageWidthPx / page.width;
  const usableHeightMm = Math.max(page.height - page.marginTop - page.marginBottom, 10);
  const usableHeightPx = Math.floor(usableHeightMm * pxPerMm);
  const sourceContext = canvas.getContext("2d", { willReadFrequently: true });
  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    let sliceHeightPx = Math.min(usableHeightPx, canvas.height - renderedHeightPx);
    if (renderedHeightPx + sliceHeightPx < canvas.height) {
      sliceHeightPx = findSafeSliceHeight(sourceContext, pageWidthPx, renderedHeightPx, sliceHeightPx);
    }

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = pageWidthPx;
    pageCanvas.height = sliceHeightPx;

    const context = pageCanvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      renderedHeightPx,
      pageWidthPx,
      sliceHeightPx,
      0,
      0,
      pageWidthPx,
      sliceHeightPx,
    );

    if (pageIndex > 0) {
      pdf.addPage([page.width, page.height], orientation);
    }

    const imageHeightMm = sliceHeightPx / pxPerMm;
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      0,
      page.marginTop,
      page.width,
      imageHeightMm,
    );

    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }
}

function findSafeSliceHeight(context, widthPx, topPx, sliceHeightPx) {
  const lookbackPx = Math.min(Math.floor(sliceHeightPx * 0.35), sliceHeightPx - 1);
  if (lookbackPx < 1) {
    return sliceHeightPx;
  }

  const scanTopPx = topPx + sliceHeightPx - lookbackPx;
  const pixels = context.getImageData(0, scanTopPx, widthPx, lookbackPx).data;
  const maxInkPixels = Math.max(4, Math.floor(widthPx * 0.005));

  for (let row = lookbackPx - 1; row >= 0; row -= 1) {
    if (isRowSafeToCut(pixels, row, widthPx, maxInkPixels)) {
      return sliceHeightPx - lookbackPx + row + 1;
    }
  }

  return sliceHeightPx;
}

function isRowSafeToCut(pixels, row, widthPx, maxInkPixels) {
  const rowOffset = row * widthPx * 4;
  let inkPixels = 0;
  let minChannel = 255;
  let maxChannel = 0;

  for (let x = 0; x < widthPx; x += 1) {
    const offset = rowOffset + x * 4;
    for (let channel = 0; channel < 3; channel += 1) {
      const value = pixels[offset + channel];
      if (value < minChannel) minChannel = value;
      if (value > maxChannel) maxChannel = value;
    }

    if (pixels[offset] < 246 || pixels[offset + 1] < 246 || pixels[offset + 2] < 246) {
      inkPixels += 1;
      if (inkPixels > maxInkPixels && maxChannel - minChannel > 20) {
        return false;
      }
    }
  }

  // Nearly-blank rows (gaps between lines) or flat-colored rows
  // (gaps inside dark code blocks) are safe places to break a page.
  return inkPixels <= maxInkPixels || maxChannel - minChannel <= 20;
}

async function downloadDocx() {
  if (!window.docx) {
    setStatus("โหลดตัวแปลง DOCX ไม่สำเร็จ");
    return;
  }

  setBusy(true, "กำลังสร้าง DOCX");

  try {
    const doc = createDocxDocument();
    const blob = await window.docx.Packer.toBlob(doc);
    downloadBlob(blob, getDocxName());
    setStatus("ดาวน์โหลดแล้ว");
  } catch (error) {
    console.error(error);
    setStatus("สร้าง DOCX ไม่สำเร็จ");
  } finally {
    setBusy(false);
  }
}

function createDocxDocument() {
  const { Document } = window.docx;
  const page = getPageSettings();

  return new Document({
    creator: pdfMetadataSource,
    description: `Generated by ${pdfMetadataSource}`,
    keywords: `${pdfMetadataSource}, markdown, docx`,
    title: getDocxName(),
    styles: createDocxStyles(),
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: page.width >= page.height ? "landscape" : "portrait",
              width: mmToTwip(page.width),
              height: mmToTwip(page.height),
            },
            margin: {
              top: mmToTwip(page.marginTop),
              right: mmToTwip(page.marginRight),
              bottom: mmToTwip(page.marginBottom),
              left: mmToTwip(page.marginLeft),
            },
          },
        },
        children: createDocxChildren(),
      },
    ],
  });
}

function createDocxStyles() {
  return {
    default: {
      document: {
        run: {
          font: docxFontFamily,
          size: pxToHalfPoint(readNumber(elements.typographyInputs[0], 16, 8, 48)),
        },
        paragraph: {
          spacing: { after: 120 },
        },
      },
    },
    paragraphStyles: [
      createParagraphStyle("Heading1", "Heading 1", "h1Font", 30, true),
      createParagraphStyle("Heading2", "Heading 2", "h2Font", 24, true),
      createParagraphStyle("Heading3", "Heading 3", "h3Font", 19, true),
      createParagraphStyle("Heading4", "Heading 4", "h4Font", 17, true),
      createParagraphStyle("Heading5", "Heading 5", "h5Font", 15, true),
    ],
  };
}

function createParagraphStyle(id, name, inputId, fallbackPx, bold) {
  const input = document.getElementById(inputId);
  return {
    id,
    name,
    basedOn: "Normal",
    next: "Normal",
    quickFormat: true,
    run: {
      bold,
      font: docxFontFamily,
      size: pxToHalfPoint(readNumber(input, fallbackPx, Number(input.min), Number(input.max))),
    },
    paragraph: {
      spacing: { before: 180, after: 120 },
    },
  };
}

function createDocxChildren() {
  const children = [];
  elements.preview.childNodes.forEach((node) => {
    children.push(...nodeToDocxBlocks(node));
  });

  return children.length ? children : [createDocxParagraph("")];
}

function nodeToDocxBlocks(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? [createDocxParagraph(text)] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const tagName = node.tagName.toLowerCase();

  if (/^h[1-6]$/.test(tagName)) {
    return [createHeadingParagraph(node, Number(tagName.slice(1)))];
  }

  if (tagName === "p") {
    return [createDocxParagraphFromElement(node)];
  }

  if (tagName === "ul" || tagName === "ol") {
    return createListParagraphs(node, tagName === "ol");
  }

  if (tagName === "blockquote") {
    return createBlockquoteParagraphs(node);
  }

  if (tagName === "pre") {
    return [createCodeBlockParagraph(node)];
  }

  if (tagName === "table") {
    return [createDocxTable(node)];
  }

  if (tagName === "hr") {
    return [createDocxParagraph("")];
  }

  return [createDocxParagraphFromElement(node)];
}

function createHeadingParagraph(element, level) {
  const { HeadingLevel, Paragraph } = window.docx;
  const headingMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  return new Paragraph({
    heading: headingMap[level],
    children: inlineNodesToRuns(element.childNodes, { bold: true }),
  });
}

function createDocxParagraphFromElement(element, options = {}) {
  return createDocxParagraph("", {
    ...options,
    children: inlineNodesToRuns(element.childNodes, options),
  });
}

function createDocxParagraph(text, options = {}) {
  const { Paragraph, TextRun } = window.docx;
  return new Paragraph({
    bullet: options.bullet,
    numbering: options.numbering,
    spacing: options.spacing || { after: 120 },
    indent: options.indent,
    children: options.children || [
      new TextRun({
        text,
        font: docxFontFamily,
        size: pxToHalfPoint(readNumber(document.getElementById("bodyFont"), 16, 8, 48)),
      }),
    ],
  });
}

function createListParagraphs(listElement, isOrdered, level = 0) {
  const blocks = [];
  [...listElement.children].forEach((item, index) => {
    if (item.tagName.toLowerCase() !== "li") {
      return;
    }

    const inlineNodes = [...item.childNodes].filter(
      (child) => child.nodeType !== Node.ELEMENT_NODE || !["ul", "ol"].includes(child.tagName.toLowerCase()),
    );
    blocks.push(
      createDocxParagraph("", {
        bullet: isOrdered ? undefined : { level },
        children: isOrdered
          ? [createTextRun(`${index + 1}. `), ...inlineNodesToRuns(inlineNodes, {})]
          : inlineNodesToRuns(inlineNodes, {}),
      }),
    );

    [...item.children]
      .filter((child) => ["ul", "ol"].includes(child.tagName.toLowerCase()))
      .forEach((child) => {
        blocks.push(...createListParagraphs(child, child.tagName.toLowerCase() === "ol", level + 1));
      });
  });

  return blocks;
}

function createBlockquoteParagraphs(blockquote) {
  return [
    createDocxParagraph("", {
      children: inlineNodesToRuns(blockquote.childNodes, {
        italics: true,
      }),
      indent: { left: 360 },
    }),
  ];
}

function createCodeBlockParagraph(preElement) {
  const { Paragraph, TextRun } = window.docx;
  return new Paragraph({
    spacing: { before: 120, after: 160 },
    children: [
      new TextRun({
        text: preElement.textContent.replace(/\n$/, ""),
        font: docxFontFamily,
        size: pxToHalfPoint(readNumber(document.getElementById("codeBlockFont"), 14, 8, 42)),
      }),
    ],
  });
}

function createDocxTable(tableElement) {
  const { Table, TableCell, TableRow, WidthType } = window.docx;
  const rows = [...tableElement.querySelectorAll("tr")].map((row) => {
    const cells = [...row.children].map(
      (cell) =>
        new TableCell({
          children: [
            createDocxParagraph("", {
              children: inlineNodesToRuns(cell.childNodes, {
                bold: cell.tagName.toLowerCase() === "th",
              }),
            }),
          ],
        }),
    );
    return new TableRow({ children: cells });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function inlineNodesToRuns(nodes, inherited = {}) {
  const runs = [];
  nodes.forEach((node) => {
    runs.push(...inlineNodeToRuns(node, inherited));
  });

  return runs.length ? runs : [createTextRun("", inherited)];
}

function inlineNodeToRuns(node, inherited) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ? [createTextRun(node.textContent, inherited)] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const tagName = node.tagName.toLowerCase();
  const next = {
    ...inherited,
    bold: inherited.bold || ["strong", "b", "th"].includes(tagName),
    italics: inherited.italics || ["em", "i"].includes(tagName),
  };

  if (tagName === "br") {
    return [createTextRun("", { ...next, break: 1 })];
  }

  if (tagName === "code") {
    next.font = docxFontFamily;
    next.size = pxToHalfPoint(readNumber(document.getElementById("inlineCodeFont"), 15, 8, 42));
  }

  return inlineNodesToRuns(node.childNodes, next);
}

function createTextRun(text, options = {}) {
  const { TextRun } = window.docx;
  return new TextRun({
    text,
    bold: options.bold,
    italics: options.italics,
    break: options.break,
    font: options.font || docxFontFamily,
    size: options.size || pxToHalfPoint(readNumber(document.getElementById("bodyFont"), 16, 8, 48)),
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getDocxName() {
  const baseName = elements.fileName.value.trim() || buildPdfName(state.sourceName);
  return baseName.replace(/\.(pdf|docx)$/i, "") + ".docx";
}

function mmToTwip(mm) {
  return Math.round(mm * 56.6929133858);
}

function pxToHalfPoint(px) {
  return Math.max(2, Math.round(px * 1.5));
}

async function printPdf() {
  setStatus("เปิดหน้าพิมพ์");
  await waitForFonts();
  window.print();
}

function getPdfName() {
  return ensurePdfExtension(elements.fileName.value.trim() || buildPdfName(state.sourceName));
}

function getPdfMetadata() {
  return {
    title: getPdfName(),
    subject: `Generated by ${pdfMetadataSource}`,
    author: pdfMetadataSource,
    keywords: `${pdfMetadataSource}, markdown, pdf`,
    creator: pdfMetadataSource,
  };
}

function buildPdfName(fileName) {
  return ensurePdfExtension(fileName.replace(/\.(md|markdown|txt)$/i, ""));
}

function ensurePdfExtension(fileName) {
  const trimmedName = fileName.trim();
  if (!trimmedName) {
    return "document.pdf";
  }

  return /\.pdf$/i.test(trimmedName) ? trimmedName : `${trimmedName}.pdf`;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

function setBusy(isBusy, message = "พร้อมแปลง") {
  elements.downloadPdf.disabled = isBusy;
  elements.printPdf.disabled = isBusy || state.outputMode === "docx";
  setStatus(message);
}

function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    return document.fonts.ready;
  }

  return Promise.resolve();
}

window.addEventListener("DOMContentLoaded", init);
