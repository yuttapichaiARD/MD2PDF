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
  latexInlineFont: "16",
  latexBlockFont: "20",
  lineHeight: "1.72",
};

const pdfMetadataSource = "yuttapichaiARD-MD2PDF";
const docxFontFamily = "Noto Sans Thai";
const docxPreviewFontFamily = "Noto Sans Thai Local";
const docxEmbeddedFonts = [
  { style: "regular", fileName: "NotoSansThai-Regular.ttf", embedTag: "embedRegular" },
  { style: "bold", fileName: "NotoSansThai-Bold.ttf", embedTag: "embedBold" },
  { style: "italic", fileName: "NotoSansThai-Regular.ttf", embedTag: "embedItalic" },
  { style: "boldItalic", fileName: "NotoSansThai-Bold.ttf", embedTag: "embedBoldItalic" },
];
const pdfEmbeddedFonts = [
  { family: "NotoSans", style: "normal", fileName: "NotoSans-Regular.ttf" },
  { family: "NotoSans", style: "bold", fileName: "NotoSans-Bold.ttf" },
  { family: "NotoSans", style: "italic", fileName: "NotoSans-Italic.ttf" },
  { family: "NotoSans", style: "bolditalic", fileName: "NotoSans-BoldItalic.ttf" },
  { family: "NotoSansThai", style: "normal", fileName: "NotoSansThai-Regular.ttf" },
  { family: "NotoSansThai", style: "bold", fileName: "NotoSansThai-Bold.ttf" },
  { family: "NotoSansThai", style: "italic", fileName: "NotoSansThai-Regular.ttf" },
  { family: "NotoSansThai", style: "bolditalic", fileName: "NotoSansThai-Bold.ttf" },
  { family: "NotoSansMono", style: "normal", fileName: "NotoSansMono-Regular.ttf" },
  { family: "NotoSansMono", style: "bold", fileName: "NotoSansMono-Bold.ttf" },
];
const pdfFontFamily = "NotoSansThai";
const pdfFallbackFontFamily = "NotoSans";
const pdfMonoFontFamily = "NotoSansMono";

// jsPDF ไม่ทำ OpenType shaping (GPOS/GSUB) จึงต้องจัดตำแหน่งสระ/วรรณยุกต์ไทยเอง
const thaiPattern = /[฀-๿]/;
const thaiCombiningPattern = /[ัิ-ฺ็-๎]/;
const thaiLowerMarkPattern = /[ุ-ฺ]/;
const thaiToneMarkPattern = /[่-์]/;
const thaiAscenderBasePattern = /[ปฝฟฬ]/; // ป ฝ ฟ ฬ
const thaiDescenderBasePattern = /[ฎฏญฐ]/; // ฎ ฏ ญ ฐ
const thaiMarkTuning = {
  stackedToneRaise: 0.32, // ยกวรรณยุกต์/การันต์ขึ้นเมื่อซ้อนบนสระบน (สัดส่วน em)
  ascenderMarkShift: 0.1, // เลื่อนเครื่องหมายบนไปทางซ้ายเมื่อพยัญชนะหางสูง
  descenderLowerDrop: 0.14, // กดสระล่างลงเมื่อพยัญชนะมีหางล่าง
};
const thaiWordSegmenter = (() => {
  try {
    return new Intl.Segmenter("th", { granularity: "word" });
  } catch {
    return null;
  }
})();

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
  pdfMode: document.getElementById("pdfMode"),
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

  const html = window.marked.parse(injectLatexPlaceholders(markdown));
  const cleanHtml = window.DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "data-tex", "data-display"],
  });

  elements.preview.innerHTML = cleanHtml;
  ensurePreviewHeadingIds();
  elements.preview.querySelectorAll("a[href]").forEach((anchor) => {
    if (!isInternalHashLink(anchor.getAttribute("href") || "")) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noreferrer");
    }
  });
  applyCodeHighlighting();
  renderLatexBlocks();
}

function injectLatexPlaceholders(markdown) {
  const protectedSegments = [];
  const protect = (match) => {
    const token = `@@MD2PDF_PROTECTED_${protectedSegments.length}@@`;
    protectedSegments.push(match);
    return token;
  };

  const protectedMarkdown = markdown
    .replace(/(^|\n)(```[\s\S]*?\n```|~~~[\s\S]*?\n~~~)/g, (match) => protect(match))
    .replace(/`[^`\n]+`/g, (match) => protect(match));

  const withDisplayMath = protectedMarkdown
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => createLatexHtml(tex, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => createLatexHtml(tex, true));

  const withInlineMath = withDisplayMath
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => createLatexHtml(tex, false))
    .replace(/(^|[^\\$])\$(?!\s|\$)([^\n$]+?)(?<!\s)\$(?!\$)/g, (_, prefix, tex) => `${prefix}${createLatexHtml(tex, false)}`);

  return withInlineMath.replace(/@@MD2PDF_PROTECTED_(\d+)@@/g, (_, index) => protectedSegments[Number(index)] || "");
}

function createLatexHtml(tex, displayMode) {
  const source = String(tex || "").trim();
  const tagName = displayMode ? "div" : "span";
  const className = displayMode ? "math-block" : "math-inline";
  return `<${tagName} class="${className}" data-tex="${escapeHtmlAttribute(source)}" data-display="${displayMode ? "true" : "false"}">${escapeHtml(source)}</${tagName}>`;
}

function renderLatexBlocks() {
  elements.preview.querySelectorAll("[data-tex]").forEach((element) => {
    const tex = element.getAttribute("data-tex") || "";
    const displayMode = element.getAttribute("data-display") === "true";
    if (!window.katex) {
      element.textContent = displayMode ? `$$${tex}$$` : `$${tex}$`;
      return;
    }

    try {
      window.katex.render(tex, element, {
        displayMode,
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      element.textContent = displayMode ? `$$${tex}$$` : `$${tex}$`;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function ensurePreviewHeadingIds() {
  const usedIds = new Map();
  elements.preview.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const baseId = slugifyHeading(heading.textContent || "") || "section";
    const count = usedIds.get(baseId) || 0;
    usedIds.set(baseId, count + 1);
    heading.id = count ? `${baseId}-${count + 1}` : baseId;
  });
}

function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{M}\p{N}_-]/gu, "")
    .replace(/^-|-$/g, "");
}

function isInternalHashLink(href) {
  return href.trim().startsWith("#");
}

function normalizeHashTarget(href) {
  const hash = String(href || "").trim().replace(/^#/, "");
  try {
    return decodeURIComponent(hash).toLowerCase();
  } catch {
    return hash.toLowerCase();
  }
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
  if (!JsPdf) {
    printPdf();
    return;
  }

  setBusy(true, "กำลังสร้าง PDF");

  try {
    await waitForFonts();
    const page = getPageSettings();
    const orientation = page.width >= page.height ? "landscape" : "portrait";
    const pdf = new JsPdf({
      unit: "mm",
      format: [page.width, page.height],
      orientation,
    });

    pdf.setProperties(getPdfMetadata());

    let useVectorText = !elements.pdfMode || elements.pdfMode.value !== "image";
    if (useVectorText) {
      try {
        await registerPdfFonts(pdf);
      } catch (error) {
        console.error("โหลดฟอนต์สำหรับ PDF ไม่สำเร็จ ใช้โหมดภาพแทน", error);
        useVectorText = false;
      }
    }

    if (useVectorText) {
      await renderTextPdf(pdf, page);
    } else {
      await renderPreviewPdf(pdf, page, orientation);
    }
    pdf.save(getPdfName());
    setStatus("ดาวน์โหลดแล้ว");
  } catch (error) {
    console.error(error);
    setStatus("สร้าง PDF ไม่สำเร็จ");
  } finally {
    setBusy(false);
  }
}

async function registerPdfFonts(pdf) {
  await Promise.all(
    pdfEmbeddedFonts.map(async (font) => {
      const bytes = await fetchFontBytes(`resource/font/${encodeURIComponent(font.fileName)}`);
      const base64 = bytesToBase64(bytes);
      pdf.addFileToVFS(font.fileName, base64);
      pdf.addFont(font.fileName, font.family, font.style);
    }),
  );

  pdf.setFont(pdfFontFamily, "normal");
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function renderPreviewPdf(pdf, page, orientation) {
  if (!window.html2canvas) {
    renderTextPdf(pdf, page);
    return;
  }

  const clone = elements.previewPage.cloneNode(true);
  clone.removeAttribute("id");
  elements.exportHost.replaceChildren(clone);

  try {
    await waitForFonts();
    const scale = readNumber(elements.renderScale, 2, 1, 3);
    const canvas = await window.html2canvas(clone, {
      allowTaint: true,
      backgroundColor: "#ffffff",
      scale,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      windowHeight: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
    });

    const slices = addCanvasPagesToPdf(pdf, canvas, page, orientation);
    addPreviewPdfLinks(pdf, clone, canvas, page, slices);
    addPreviewPdfBookmarks(pdf, clone, canvas, page, slices);
  } finally {
    elements.exportHost.replaceChildren();
  }
}

async function renderTextPdf(pdf, page) {
  const context = createPdfRenderContext(pdf, page);
  for (const node of [...elements.preview.childNodes]) {
    await renderPdfNode(node, context);
  }
  resolvePdfInternalLinks(context);
  addPdfBookmarks(context);
}

function createPdfRenderContext(pdf, page) {
  return {
    pdf,
    page,
    cursorY: page.marginTop,
    left: page.marginLeft,
    right: page.width - page.marginRight,
    bottom: page.height - page.marginBottom,
    usableWidth: page.width - page.marginLeft - page.marginRight,
    anchors: new Map(),
    anchorAliases: new Map(),
    pendingInternalLinks: [],
    bookmarks: [],
    tableCount: 0,
    codeCount: 0,
  };
}

async function renderPdfNode(node, context) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    if (text) {
      drawPdfParagraph(context, [{ text }], getPdfTextStyle("body"));
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const tagName = node.tagName.toLowerCase();
  if (node.hasAttribute("data-tex")) {
    await drawPdfMathBlock(context, node);
    return;
  }

  if (/^h[1-6]$/.test(tagName)) {
    const level = Number(tagName.slice(1));
    drawPdfParagraph(context, inlineNodesToPdfRuns(node.childNodes, { bold: true }), getPdfTextStyle(`h${Math.min(level, 5)}`), {
      anchorId: node.id,
      bookmarkTitle: level <= 2 ? node.textContent.trim() : "",
      bookmarkLevel: level,
      keepWithNextMm: 16,
    });
    drawPdfRule(context);
    return;
  }

  if (tagName === "p") {
    if (node.querySelector("img")) {
      await drawPdfParagraphWithImages(context, node);
    } else {
      drawPdfParagraph(context, inlineNodesToPdfRuns(node.childNodes, {}), getPdfTextStyle("body"));
    }
    return;
  }

  if (tagName === "ul" || tagName === "ol") {
    drawPdfList(context, node, tagName === "ol");
    return;
  }

  if (tagName === "blockquote") {
    drawPdfQuote(context, node);
    return;
  }

  if (tagName === "pre") {
    drawPdfCodeBlock(context, node);
    return;
  }

  if (tagName === "table") {
    drawPdfTable(context, node);
    return;
  }

  if (tagName === "hr") {
    drawPdfRule(context);
    return;
  }

  if (tagName === "img") {
    await drawPdfImage(context, node);
    return;
  }

  drawPdfParagraph(context, inlineNodesToPdfRuns(node.childNodes, {}), getPdfTextStyle("body"));
}

async function drawPdfParagraphWithImages(context, paragraphElement) {
  const style = getPdfTextStyle("body");
  let inlineNodes = [];

  const flushInline = () => {
    const runs = inlineNodesToPdfRuns(inlineNodes, {});
    if (runs.some((run) => String(run.text || "").trim())) {
      drawPdfParagraph(context, runs, style);
    }
    inlineNodes = [];
  };

  for (const child of [...paragraphElement.childNodes]) {
    const isImage = child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "img";
    if (isImage) {
      flushInline();
      await drawPdfImage(context, child);
    } else {
      inlineNodes.push(child);
    }
  }
  flushInline();
}

async function drawPdfImage(context, imgElement) {
  const fallbackText = imgElement.getAttribute("alt") || imgElement.getAttribute("src") || "";
  try {
    const image = await loadImageData(imgElement);
    const pxToMm = 25.4 / 96;
    const capacity = context.bottom - context.page.marginTop;
    let widthMm = Math.min(image.width * pxToMm, context.usableWidth);
    let heightMm = image.height * pxToMm * (widthMm / (image.width * pxToMm));
    if (heightMm > capacity) {
      widthMm *= capacity / heightMm;
      heightMm = capacity;
    }

    ensurePdfSpace(context, heightMm);
    context.pdf.addImage(image.dataUrl, "PNG", context.left, context.cursorY, widthMm, heightMm);
    context.cursorY += heightMm + 3;
  } catch {
    drawPdfParagraph(context, [{ text: fallbackText, italic: true }], getPdfTextStyle("body"));
  }
}

function loadImageData(imgElement) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const canvasContext = canvas.getContext("2d");
        canvasContext.fillStyle = "#ffffff";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(image, 0, 0);
        resolve({ dataUrl: canvas.toDataURL("image/png"), width: image.naturalWidth, height: image.naturalHeight });
      } catch (error) {
        reject(error);
      }
    });
    image.addEventListener("error", reject);
    image.src = imgElement.currentSrc || imgElement.src;
  });
}

function getPdfTextStyle(kind) {
  const styleMap = {
    body: ["bodyFont", 16],
    h1: ["h1Font", 30],
    h2: ["h2Font", 24],
    h3: ["h3Font", 19],
    h4: ["h4Font", 17],
    h5: ["h5Font", 15],
    list: ["listFont", 16],
    quote: ["quoteFont", 16],
    table: ["tableFont", 14],
    inlineCode: ["inlineCodeFont", 15],
    codeBlock: ["codeBlockFont", 14],
    latexInline: ["latexInlineFont", 16],
    latexBlock: ["latexBlockFont", 20],
  };
  const [inputId, fallback] = styleMap[kind] || styleMap.body;
  const input = document.getElementById(inputId);
  const px = readNumber(input, fallback, Number(input.min || 8), Number(input.max || 72));
  return {
    fontSize: pxToPoint(px),
    lineHeight: readNumber(document.getElementById("lineHeight"), 1.72, 1, 2.5),
  };
}

function drawPdfParagraph(context, runs, style, options = {}) {
  const { pdf } = context;
  const fontSize = style.fontSize;
  const lineHeightMm = pointToMm(fontSize) * style.lineHeight;
  const left = options.left ?? context.left;
  const width = options.width ?? context.usableWidth;
  const normalizedRuns = normalizePdfRuns(runs, style);
  const lines = wrapPdfRuns(pdf, normalizedRuns, width, fontSize);
  const segments = [];

  if (!lines.length) {
    context.cursorY += lineHeightMm;
    return segments;
  }

  const pageCapacity = context.bottom - context.page.marginTop;
  const totalHeight = lines.length * lineHeightMm;
  const keepWithNextMm = options.keepWithNextMm || 0;
  const remaining = context.bottom - context.cursorY;
  let forcedBreakAfterLine = -1;

  if (totalHeight + keepWithNextMm > remaining) {
    const linesThatFit = Math.floor(remaining / lineHeightMm);
    const keepTogether =
      totalHeight + keepWithNextMm <= pageCapacity &&
      (linesThatFit < 2 || lines.length - linesThatFit < 2 || lines.length <= 4);

    if (keepTogether || linesThatFit < 1) {
      startNewPdfPage(context);
    } else if (lines.length - linesThatFit === 1 && linesThatFit >= 3) {
      forcedBreakAfterLine = linesThatFit - 2;
    }
  }

  if (options.anchorId) {
    recordPdfAnchor(context, options.anchorId);
  }
  if (options.bookmarkTitle) {
    recordPdfBookmark(context, options.bookmarkTitle, options.bookmarkLevel || 1);
  }

  let segment = null;
  const openSegment = () => {
    segment = {
      pageNumber: pdf.internal.getCurrentPageInfo().pageNumber,
      startY: context.cursorY,
      endY: context.cursorY,
    };
    segments.push(segment);
  };
  openSegment();

  lines.forEach((line, lineIndex) => {
    if (
      context.cursorY + lineHeightMm > context.bottom + 0.1 ||
      (forcedBreakAfterLine >= 0 && lineIndex === forcedBreakAfterLine + 1)
    ) {
      forcedBreakAfterLine = -1;
      startNewPdfPage(context);
      openSegment();
    }

    let cursorX = left;
    line.forEach((run) => {
      setPdfRunFont(pdf, run, fontSize);
      const baselineY = context.cursorY + lineHeightMm * 0.72;
      const runWidth = pdf.getTextWidth(run.text);
      if (run.href) {
        pdf.setTextColor("#145c4d");
        drawPdfRunText(pdf, run, cursorX, baselineY, fontSize);
        pdf.link(cursorX, context.cursorY, runWidth, lineHeightMm, { url: run.href });
      } else if (run.internalHref) {
        pdf.setTextColor("#145c4d");
        drawPdfRunText(pdf, run, cursorX, baselineY, fontSize);
        queuePdfInternalLink(context, run.internalHref, cursorX, context.cursorY, runWidth, lineHeightMm);
      } else {
        pdf.setTextColor(run.color || "#191817");
        drawPdfRunText(pdf, run, cursorX, baselineY, fontSize);
      }
      cursorX += runWidth;
    });
    context.cursorY += lineHeightMm;
    segment.endY = context.cursorY;
  });

  pdf.setTextColor("#191817");
  context.cursorY += options.after ?? lineHeightMm * 0.35;
  return segments;
}

function recordPdfAnchor(context, anchorId) {
  if (!anchorId || context.anchors.has(anchorId)) {
    return;
  }
  context.anchors.set(anchorId, {
    pageNumber: context.pdf.internal.getCurrentPageInfo().pageNumber,
    top: context.cursorY,
  });
  context.anchorAliases.set(canonicalizeAnchorId(anchorId), anchorId);
}

function recordPdfBookmark(context, title, level = 1) {
  const cleanTitle = String(title || "").replace(/\s+/g, " ").trim();
  if (!cleanTitle) {
    return;
  }
  context.bookmarks.push({
    title: cleanTitle,
    level,
    pageNumber: context.pdf.internal.getCurrentPageInfo().pageNumber,
    top: context.cursorY,
  });
}

function queuePdfInternalLink(context, targetId, x, y, width, height) {
  if (!targetId || width <= 0 || height <= 0) {
    return;
  }
  context.pendingInternalLinks.push({
    targetId,
    pageNumber: context.pdf.internal.getCurrentPageInfo().pageNumber,
    x,
    y,
    width,
    height,
  });
}

function resolvePdfInternalLinks(context) {
  const { pdf } = context;
  const lastPage = pdf.internal.getCurrentPageInfo().pageNumber;
  context.pendingInternalLinks.forEach((link) => {
    const target = context.anchors.get(link.targetId) || context.anchors.get(context.anchorAliases.get(canonicalizeAnchorId(link.targetId)));
    if (!target) {
      return;
    }
    pdf.setPage(link.pageNumber);
    pdf.link(link.x, link.y, link.width, link.height, {
      pageNumber: target.pageNumber,
      top: target.top,
    });
  });
  pdf.setPage(lastPage);
}

function canonicalizeAnchorId(anchorId) {
  return String(anchorId || "")
    .trim()
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function addPdfBookmarks(context) {
  const { pdf } = context;
  if (!pdf.outline || typeof pdf.outline.add !== "function") {
    return;
  }

  const parentsByLevel = new Map();
  context.bookmarks.forEach((bookmark) => {
    const level = Math.max(1, Math.min(Number(bookmark.level) || 1, 3));
    const parent = level > 1 ? parentsByLevel.get(level - 1) || null : null;
    const outlineItem = pdf.outline.add(parent, bookmark.title, {
      pageNumber: bookmark.pageNumber,
      top: bookmark.top,
    });
    parentsByLevel.set(level, outlineItem);
    [...parentsByLevel.keys()].forEach((storedLevel) => {
      if (storedLevel > level) {
        parentsByLevel.delete(storedLevel);
      }
    });
  });
}

function normalizePdfRuns(runs, style) {
  return runs
    .flatMap((run) => splitPdfTextRun(run))
    .map((run) => ({
      ...run,
      fontSize: run.fontSize || style.fontSize,
    }))
    .filter((run) => run.text);
}

function splitPdfTextRun(run) {
  const text = decomposeThaiSaraAm(String(run.text || ""));
  const parts = splitTextForWrapping(text);
  return parts.flatMap((part) => splitPdfRunByFont({ ...run, text: part }));
}

// แยกสระอำเป็นนิคหิต + สระอา และย้ายนิคหิตมาก่อนวรรณยุกต์
// เพื่อให้วางตำแหน่งได้ถูก (วรรณยุกต์ต้องลอยเหนือนิคหิต)
function decomposeThaiSaraAm(text) {
  if (!text.includes("ำ")) {
    return text;
  }
  return text.replace(/([่-์]?)ำ/g, (_, tone) => `ํ${tone}า`);
}

// ตัดข้อความเป็นชิ้นสำหรับ wrap บรรทัด — ภาษาไทยตัดตามขอบคำด้วย Intl.Segmenter
function splitTextForWrapping(text) {
  if (!thaiWordSegmenter || !thaiPattern.test(text)) {
    return text.match(/(\s+|[^\s]+)/g) || [];
  }

  const parts = [];
  for (const { segment } of thaiWordSegmenter.segment(text)) {
    const isSpace = /^\s+$/.test(segment);
    const isThai = thaiPattern.test(segment);
    const previous = parts[parts.length - 1];
    if (!isSpace && previous && !previous.isSpace && !(isThai && previous.isThai)) {
      previous.text += segment;
      previous.isThai = previous.isThai || isThai;
    } else {
      parts.push({ text: segment, isSpace, isThai });
    }
  }
  return parts.map((part) => part.text);
}

function splitPdfRunByFont(run) {
  if (run.fontFamily && run.fontFamily !== pdfMonoFontFamily) {
    return [run];
  }

  const chunks = [];
  let current = "";
  let currentFamily = "";
  [...String(run.text || "")].forEach((char) => {
    const nextFamily =
      run.fontFamily === pdfMonoFontFamily ? getPdfMonoFallbackFontForChar(char) : getPdfFallbackFontForChar(char);
    if (current && nextFamily !== currentFamily) {
      chunks.push({ ...run, text: current, fontFamily: currentFamily });
      current = "";
    }
    current += char;
    currentFamily = nextFamily;
  });

  if (current) {
    chunks.push({ ...run, text: current, fontFamily: currentFamily });
  }
  return chunks;
}

function getPdfFallbackFontForChar(char) {
  if (/[\u0E00-\u0E7F]/u.test(char)) {
    return pdfFontFamily;
  }
  return pdfFallbackFontFamily;
}

function getPdfMonoFallbackFontForChar(char) {
  if (/[\u0E00-\u0E7F]/u.test(char)) {
    return pdfFontFamily;
  }
  return pdfMonoFontFamily;
}

function wrapPdfRuns(pdf, runs, maxWidth, fontSize) {
  const lines = [];
  let line = [];
  let lineWidth = 0;

  runs.forEach((run) => {
    const pieces = breakLongPdfRun(pdf, run, maxWidth, fontSize);
    pieces.forEach((piece) => {
      setPdfRunFont(pdf, piece, fontSize);
      const width = pdf.getTextWidth(piece.text);
      const isWhitespace = /^\s+$/.test(piece.text);

      if (!isWhitespace && line.length && lineWidth + width > maxWidth) {
        lines.push(trimPdfLine(line));
        line = [];
        lineWidth = 0;
      }

      if (!(isWhitespace && !line.length)) {
        line.push(piece);
        lineWidth += width;
      }
    });
  });

  if (line.length) {
    lines.push(trimPdfLine(line));
  }

  return lines;
}

function breakLongPdfRun(pdf, run, maxWidth, fontSize) {
  setPdfRunFont(pdf, run, fontSize);
  if (/^\s+$/.test(run.text) || pdf.getTextWidth(run.text) <= maxWidth) {
    return [run];
  }

  const pieces = [];
  let current = "";
  [...run.text].forEach((char) => {
    const next = current + char;
    if (current && !thaiCombiningPattern.test(char) && pdf.getTextWidth(next) > maxWidth) {
      pieces.push({ ...run, text: current });
      current = char;
    } else {
      current = next;
    }
  });
  if (current) {
    pieces.push({ ...run, text: current });
  }
  return pieces;
}

function trimPdfLine(line) {
  while (line.length && /^\s+$/.test(line[line.length - 1].text)) {
    line.pop();
  }
  return line;
}

function setPdfRunFont(pdf, run, fallbackFontSize) {
  const family = run.fontFamily || pdfFontFamily;
  const style =
    family === pdfMonoFontFamily
      ? run.bold
        ? "bold"
        : "normal"
      : run.bold && run.italic
        ? "bolditalic"
        : run.bold
          ? "bold"
          : run.italic
            ? "italic"
            : "normal";
  pdf.setFont(family, style);
  pdf.setFontSize(run.fontSize || fallbackFontSize);
}

function drawPdfRunText(pdf, run, x, baselineY, fallbackFontSize) {
  setPdfRunFont(pdf, run, fallbackFontSize);
  const text = String(run.text || "");
  if (!thaiCombiningPattern.test(text)) {
    pdf.text(text, x, baselineY);
    return;
  }
  drawThaiShapedText(pdf, text, x, baselineY, run.fontSize || fallbackFontSize);
}

// วาดข้อความไทยโดยวางเครื่องหมาย combining ทีละตัวพร้อมชดเชยตำแหน่งตามบริบท
// แทน GPOS ที่ jsPDF ไม่รองรับ: ยกวรรณยุกต์เมื่อซ้อนสระบน, เลื่อนซ้ายบนพยัญชนะ
// หางสูง (ป ฝ ฟ ฬ), กดสระล่างใต้พยัญชนะหางล่าง (ฎ ฏ ญ ฐ)
function drawThaiShapedText(pdf, text, x, baselineY, fontSize) {
  const emMm = pointToMm(fontSize);
  let penX = x;
  let buffer = "";
  let baseChar = "";
  let upperMarkCount = 0;

  const flushBuffer = () => {
    if (!buffer) {
      return;
    }
    pdf.text(buffer, penX, baselineY);
    penX += pdf.getTextWidth(buffer);
    buffer = "";
  };

  for (const char of text) {
    if (thaiCombiningPattern.test(char)) {
      flushBuffer();
      let dx = 0;
      let dy = 0;
      if (thaiLowerMarkPattern.test(char)) {
        if (thaiDescenderBasePattern.test(baseChar)) {
          dy += thaiMarkTuning.descenderLowerDrop * emMm;
        }
      } else {
        if (thaiAscenderBasePattern.test(baseChar)) {
          dx -= thaiMarkTuning.ascenderMarkShift * emMm;
        }
        if (upperMarkCount > 0 && thaiToneMarkPattern.test(char)) {
          dy -= thaiMarkTuning.stackedToneRaise * emMm;
        }
        upperMarkCount += 1;
      }
      pdf.text(char, penX + dx, baselineY + dy);
    } else {
      buffer += char;
      baseChar = char;
      upperMarkCount = 0;
    }
  }
  flushBuffer();
}

function drawPdfList(context, listElement, isOrdered, level = 0) {
  [...listElement.children].forEach((item, index) => {
    if (item.tagName.toLowerCase() !== "li") return;
    const marker = isOrdered ? `${index + 1}. ` : "• ";
    const childNodes = [...item.childNodes].filter(
      (child) => child.nodeType !== Node.ELEMENT_NODE || !["ul", "ol"].includes(child.tagName.toLowerCase()),
    );
    drawPdfParagraph(
      context,
      [{ text: marker, bold: true }, ...inlineNodesToPdfRuns(childNodes, {})],
      getPdfTextStyle("list"),
      {
        left: context.left + level * 6,
        width: context.usableWidth - level * 6,
        after: 0.8,
      },
    );
    [...item.children]
      .filter((child) => ["ul", "ol"].includes(child.tagName.toLowerCase()))
      .forEach((child) => drawPdfList(context, child, child.tagName.toLowerCase() === "ol", level + 1));
  });
  context.cursorY += 1.5;
}

function drawPdfQuote(context, blockquote) {
  const segments = drawPdfParagraph(context, inlineNodesToPdfRuns(blockquote.childNodes, { italic: true }), getPdfTextStyle("quote"), {
    left: context.left + 5,
    width: context.usableWidth - 5,
  });
  const { pdf } = context;
  const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
  pdf.setDrawColor("#217a68");
  pdf.setLineWidth(0.8);
  segments.forEach((segment) => {
    if (segment.endY <= segment.startY) {
      return;
    }
    pdf.setPage(segment.pageNumber);
    pdf.line(context.left, segment.startY, context.left, Math.max(segment.startY, segment.endY - 1));
  });
  pdf.setPage(currentPage);
}

async function drawPdfMathBlock(context, element) {
  const tex = element.getAttribute("data-tex") || element.textContent.trim();
  const displayMode = element.getAttribute("data-display") === "true";

  if (displayMode && window.html2canvas && element.isConnected) {
    try {
      const scale = Math.max(2, readNumber(elements.renderScale, 2, 1, 3));
      const canvas = await window.html2canvas(element, {
        backgroundColor: "#ffffff",
        scale,
      });
      const rect = element.getBoundingClientRect();
      const pxToMm = 25.4 / 96;
      let widthMm = Math.min(rect.width * pxToMm, context.usableWidth);
      const heightMm = rect.height * pxToMm * (widthMm / (rect.width * pxToMm));

      ensurePdfSpace(context, heightMm + 2);
      const offsetX = context.left + Math.max(0, (context.usableWidth - widthMm) / 2);
      context.pdf.addImage(canvas.toDataURL("image/png"), "PNG", offsetX, context.cursorY, widthMm, heightMm);
      context.cursorY += heightMm + 4;
      return;
    } catch (error) {
      console.error("แปลงสูตรเป็นภาพไม่สำเร็จ ใช้ข้อความแทน", error);
    }
  }

  const text = displayMode ? `$$${tex}$$` : `$${tex}$`;
  const style = getPdfTextStyle(displayMode ? "latexBlock" : "latexInline");
  drawPdfParagraph(context, [{ text, fontFamily: pdfMonoFontFamily }], style, {
    left: displayMode ? context.left + 6 : context.left,
    width: displayMode ? context.usableWidth - 12 : context.usableWidth,
    after: displayMode ? 4 : undefined,
  });
}

function drawPdfCodeBlock(context, preElement) {
  const style = getPdfTextStyle("codeBlock");
  const text = preElement.textContent.replace(/\n$/, "");
  const allLines = text.split("\n");
  const lineHeightMm = pointToMm(style.fontSize) * 1.45;
  const paddingMm = 3;
  const { pdf } = context;

  const linesThatFit = () => Math.floor((context.bottom - context.cursorY - paddingMm * 2) / lineHeightMm);
  if (linesThatFit() < Math.min(allLines.length, 3)) {
    startNewPdfPage(context);
  }

  context.codeCount += 1;
  const language = getCodeLanguage(preElement);
  recordPdfBookmark(context, `Code ${context.codeCount}${language ? ` (${language})` : ""}`, 3);

  let index = 0;
  while (index < allLines.length) {
    const remainingLines = allLines.length - index;
    let count = Math.min(linesThatFit(), remainingLines);
    if (count < 1) {
      startNewPdfPage(context);
      continue;
    }
    if (remainingLines - count === 1 && count > 2) {
      count -= 1;
    }

    const chunk = allLines.slice(index, index + count);
    const blockHeight = chunk.length * lineHeightMm + paddingMm * 2;
    pdf.setFillColor("#202321");
    pdf.roundedRect(context.left, context.cursorY, context.usableWidth, blockHeight, 1.8, 1.8, "F");
    pdf.setTextColor("#f7f7f2");
    chunk.forEach((line, lineIndex) => {
      let cursorX = context.left + 3;
      const baselineY = context.cursorY + paddingMm + lineHeightMm * (lineIndex + 0.72);
      const runs = normalizePdfRuns([{ text: line || " ", fontFamily: pdfMonoFontFamily }], style);
      runs.forEach((run) => {
        setPdfRunFont(pdf, run, style.fontSize);
        drawPdfRunText(pdf, run, cursorX, baselineY, style.fontSize);
        cursorX += pdf.getTextWidth(run.text);
      });
    });
    pdf.setTextColor("#191817");
    context.cursorY += blockHeight;
    index += count;
    if (index < allLines.length) {
      startNewPdfPage(context);
    }
  }
  context.cursorY += 4;
}

function getCodeLanguage(preElement) {
  const code = preElement.querySelector("code");
  const className = code ? code.className : "";
  const match = String(className).match(/language-([a-z0-9_+-]+)/i);
  return match ? match[1] : "";
}

function drawPdfTable(context, tableElement) {
  const style = getPdfTextStyle("table");
  const rows = [...tableElement.querySelectorAll("tr")].map((row) =>
    [...row.children].map((cell) => ({
      text: cell.textContent.trim(),
      header: cell.tagName.toLowerCase() === "th",
    })),
  );
  if (!rows.length) return;

  const { pdf } = context;
  context.tableCount += 1;
  const columnCount = Math.max(...rows.map((row) => row.length));
  const cellPadding = 2.5;
  const columnWidth = context.usableWidth / columnCount;
  const lineHeightMm = pointToMm(style.fontSize) * 1.45;

  const preparedRows = rows.map((row) => {
    const wrappedCells = Array.from({ length: columnCount }, (_, columnIndex) => {
      const cell = row[columnIndex] || { text: "", header: false };
      const runs = normalizePdfRuns([{ text: cell.text || " ", bold: cell.header }], style);
      return {
        ...cell,
        lines: wrapPdfRuns(pdf, runs, columnWidth - cellPadding * 2, style.fontSize),
      };
    });
    return {
      cells: wrappedCells,
      height: Math.max(...wrappedCells.map((cell) => cell.lines.length)) * lineHeightMm + cellPadding * 2,
    };
  });

  const headerRow = rows[0].length && rows[0].every((cell) => cell.header) ? preparedRows[0] : null;

  const drawRow = (preparedRow) => {
    preparedRow.cells.forEach((cell, columnIndex) => {
      const x = context.left + columnIndex * columnWidth;
      if (cell.header) {
        pdf.setFillColor("#eef2f1");
        pdf.rect(x, context.cursorY, columnWidth, preparedRow.height, "F");
      }
      pdf.setDrawColor("#d8dedb");
      pdf.rect(x, context.cursorY, columnWidth, preparedRow.height);
      pdf.setTextColor("#191817");
      cell.lines.forEach((line, lineIndex) => {
        let cursorX = x + cellPadding;
        const baselineY = context.cursorY + cellPadding + lineHeightMm * (lineIndex + 0.72);
        line.forEach((run) => {
          setPdfRunFont(pdf, run, style.fontSize);
          drawPdfRunText(pdf, run, cursorX, baselineY, style.fontSize);
          cursorX += pdf.getTextWidth(run.text);
        });
      });
    });
    context.cursorY += preparedRow.height;
  };

  // ถ้าเนื้อที่เหลือไม่พอสำหรับหัวตาราง + แถวแรก ให้ขึ้นหน้าใหม่ก่อน
  const firstBodyRow = preparedRows[headerRow ? 1 : 0];
  const initialNeed = (headerRow ? headerRow.height : 0) + (firstBodyRow ? firstBodyRow.height : 0);
  if (context.cursorY + initialNeed > context.bottom + 0.1 && initialNeed <= context.bottom - context.page.marginTop) {
    startNewPdfPage(context);
  }
  recordPdfBookmark(context, `Table ${context.tableCount}`, 3);

  preparedRows.forEach((preparedRow, rowIndex) => {
    if (context.cursorY + preparedRow.height > context.bottom + 0.1) {
      startNewPdfPage(context);
      if (headerRow && rowIndex > 0) {
        drawRow(headerRow);
      }
    }
    drawRow(preparedRow);
  });
  context.cursorY += 4;
}

function drawPdfRule(context) {
  ensurePdfSpace(context, 8);
  context.pdf.setDrawColor("#d8dedb");
  context.pdf.setLineWidth(0.25);
  context.pdf.line(context.left, context.cursorY + 2, context.right, context.cursorY + 2);
  context.cursorY += 7;
}

function startNewPdfPage(context) {
  context.pdf.addPage([context.page.width, context.page.height], context.page.width >= context.page.height ? "landscape" : "portrait");
  context.cursorY = context.page.marginTop;
}

function ensurePdfSpace(context, neededHeight) {
  if (context.cursorY + neededHeight <= context.bottom) {
    return;
  }
  startNewPdfPage(context);
}

function inlineNodesToPdfRuns(nodes, inherited = {}) {
  const runs = [];
  nodes.forEach((node) => {
    runs.push(...inlineNodeToPdfRuns(node, inherited));
  });
  return runs;
}

function inlineNodeToPdfRuns(node, inherited) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ? [{ ...inherited, text: node.textContent }] : [];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const tagName = node.tagName.toLowerCase();
  if (node.hasAttribute("data-tex")) {
    const tex = node.getAttribute("data-tex") || node.textContent.trim();
    return [
      {
        ...inherited,
        text: `$${tex}$`,
        fontFamily: pdfMonoFontFamily,
        fontSize: getPdfTextStyle("latexInline").fontSize,
      },
    ];
  }

  if (tagName === "br") {
    return [{ ...inherited, text: "\n" }];
  }
  const next = {
    ...inherited,
    bold: inherited.bold || ["strong", "b", "th"].includes(tagName),
    italic: inherited.italic || ["em", "i"].includes(tagName),
  };
  if (tagName === "a") {
    const rawHref = node.getAttribute("href") || "";
    if (isInternalHashLink(rawHref)) {
      next.internalHref = normalizeHashTarget(rawHref);
    } else if (node.href) {
      next.href = node.href;
    }
    next.color = "#145c4d";
  }
  if (tagName === "code") {
    next.fontSize = getPdfTextStyle("inlineCode").fontSize;
    next.fontFamily = pdfMonoFontFamily;
  }
  return inlineNodesToPdfRuns(node.childNodes, next);
}

function pxToPoint(px) {
  return px * 0.75;
}

function pointToMm(point) {
  return point * 0.3527777778;
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
  const pageHeightPx = Math.floor(page.height * pxPerMm);
  const sourceContext = canvas.getContext("2d", { willReadFrequently: true });
  let renderedHeightPx = 0;
  let pageIndex = 0;
  const slices = [];

  while (renderedHeightPx < canvas.height) {
    let sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
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
      0,
      page.width,
      imageHeightMm,
    );

    slices.push({
      pageNumber: pageIndex + 1,
      topPx: renderedHeightPx,
      heightPx: sliceHeightPx,
    });
    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  return slices;
}

function addPreviewPdfLinks(pdf, root, canvas, page, slices) {
  const rootRect = root.getBoundingClientRect();
  const scale = canvas.width / rootRect.width;
  const pxPerMm = canvas.width / page.width;
  const anchors = collectPreviewAnchors(root, rootRect, scale, pxPerMm, page, slices);

  root.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const rects = [...link.getClientRects()];
    rects.forEach((rect) => {
      const box = mapPreviewRectToPdf(rect, rootRect, scale, pxPerMm, page, slices);
      if (!box || box.width <= 0 || box.height <= 0) {
        return;
      }

      pdf.setPage(box.pageNumber);
      if (isInternalHashLink(href)) {
        const target = anchors.get(canonicalizeAnchorId(normalizeHashTarget(href)));
        if (target) {
          pdf.link(box.x, box.y, box.width, box.height, {
            pageNumber: target.pageNumber,
            top: target.y,
          });
        }
        return;
      }

      const url = link.href;
      if (url) {
        pdf.link(box.x, box.y, box.width, box.height, { url });
      }
    });
  });

  pdf.setPage(pdf.internal.getNumberOfPages());
}

function addPreviewPdfBookmarks(pdf, root, canvas, page, slices) {
  if (!pdf.outline || typeof pdf.outline.add !== "function") {
    return;
  }

  const rootRect = root.getBoundingClientRect();
  const scale = canvas.width / rootRect.width;
  const pxPerMm = canvas.width / page.width;
  const parentsByLevel = new Map();
  let tableCount = 0;
  let codeCount = 0;

  root.querySelectorAll("h1, h2, table, pre").forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    let title = "";
    let level = 1;

    if (tagName === "h1" || tagName === "h2") {
      title = element.textContent.trim();
      level = tagName === "h1" ? 1 : 2;
    } else if (tagName === "table") {
      tableCount += 1;
      title = `Table ${tableCount}`;
      level = 3;
    } else if (tagName === "pre") {
      codeCount += 1;
      title = `Code ${codeCount}`;
      level = 3;
    }

    const target = mapPreviewRectToPdf(element.getBoundingClientRect(), rootRect, scale, pxPerMm, page, slices);
    if (!title || !target) {
      return;
    }

    const parent = level > 1 ? parentsByLevel.get(level - 1) || null : null;
    const outlineItem = pdf.outline.add(parent, title, {
      pageNumber: target.pageNumber,
      top: target.y,
    });
    parentsByLevel.set(level, outlineItem);
    [...parentsByLevel.keys()].forEach((storedLevel) => {
      if (storedLevel > level) {
        parentsByLevel.delete(storedLevel);
      }
    });
  });
}

function collectPreviewAnchors(root, rootRect, scale, pxPerMm, page, slices) {
  const anchors = new Map();
  root.querySelectorAll("[id]").forEach((element) => {
    const id = canonicalizeAnchorId(element.id);
    const target = mapPreviewRectToPdf(element.getBoundingClientRect(), rootRect, scale, pxPerMm, page, slices);
    if (id && target) {
      anchors.set(id, target);
    }
  });
  return anchors;
}

function mapPreviewRectToPdf(rect, rootRect, scale, pxPerMm, page, slices) {
  const xPx = (rect.left - rootRect.left) * scale;
  const yPx = (rect.top - rootRect.top) * scale;
  const widthPx = rect.width * scale;
  const heightPx = rect.height * scale;
  const slice = slices.find((candidate) => yPx >= candidate.topPx && yPx < candidate.topPx + candidate.heightPx);
  if (!slice) {
    return null;
  }

  return {
    pageNumber: slice.pageNumber,
    x: xPx / pxPerMm,
    y: (yPx - slice.topPx) / pxPerMm,
    width: widthPx / pxPerMm,
    height: Math.min(heightPx / pxPerMm, page.height - (yPx - slice.topPx) / pxPerMm),
  };
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
  if (!window.docx || !window.JSZip) {
    setStatus("โหลดตัวแปลง DOCX ไม่สำเร็จ");
    return;
  }

  setBusy(true, "กำลังสร้าง DOCX");

  try {
    const doc = createDocxDocument();
    const packedBlob = await window.docx.Packer.toBlob(doc);
    const blob = await embedFontsInDocx(packedBlob);
    downloadBlob(blob, getDocxName());
    setStatus("ดาวน์โหลดแล้ว");
  } catch (error) {
    console.error(error);
    setStatus("สร้าง DOCX ไม่สำเร็จ");
  } finally {
    setBusy(false);
  }
}

async function embedFontsInDocx(docxBlob) {
  const zip = await window.JSZip.loadAsync(docxBlob);
  const fontEntries = await Promise.all(
    docxEmbeddedFonts.map(async (font, index) => {
      const fontBytes = await fetchFontBytes(`resource/font/${encodeURIComponent(font.fileName)}`);
      const fontKey = createFontKey(index);
      const targetName = `${font.style}.odttf`;
      zip.file(`word/fonts/${targetName}`, obfuscateFont(fontBytes, fontKey));
      return {
        ...font,
        fontKey,
        relId: `rIdEmbedFont${index + 1}`,
        targetName,
      };
    }),
  );

  zip.file("word/fontTable.xml", createFontTableXml(fontEntries));
  zip.file("word/_rels/fontTable.xml.rels", createFontTableRelationshipsXml(fontEntries));
  await ensureFontTableDocumentRelationship(zip);
  await ensureFontContentType(zip);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

const fontBytesCache = new Map();

async function fetchFontBytes(url) {
  if (fontBytesCache.has(url)) {
    return fontBytesCache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cannot load font: ${url}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  fontBytesCache.set(url, bytes);
  return bytes;
}

function createFontKey(index) {
  const base = [0x59, 0x75, 0x74, 0x74, 0x61, 0x70, 0x69, 0x63, 0x68, 0x61, 0x69, 0x41, 0x52, 0x44, 0x00, index + 1];
  const hex = base.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `{${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}}`;
}

function obfuscateFont(fontBytes, fontKey) {
  const result = new Uint8Array(fontBytes);
  const keyBytes = fontKey
    .replace(/[{}-]/g, "")
    .match(/../g)
    .map((part) => Number.parseInt(part, 16))
    .reverse();

  for (let index = 0; index < Math.min(32, result.length); index += 1) {
    result[index] ^= keyBytes[index % keyBytes.length];
  }

  return result;
}

function createFontTableXml(fontEntries) {
  const embedTags = fontEntries
    .map(
      (font) =>
        `<w:${font.embedTag} r:id="${font.relId}" w:fontKey="${font.fontKey}" w:subsetted="0"/>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:font w:name="${escapeXml(docxFontFamily)}">
    <w:charset w:val="00"/>
    <w:family w:val="roman"/>
    <w:pitch w:val="variable"/>
    ${embedTags}
  </w:font>
</w:fonts>`;
}

function createFontTableRelationshipsXml(fontEntries) {
  const relationships = fontEntries
    .map(
      (font) =>
        `<Relationship Id="${font.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/${font.targetName}"/>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`;
}

async function ensureFontTableDocumentRelationship(zip) {
  const path = "word/_rels/document.xml.rels";
  const xml = await zip.file(path).async("string");
  if (xml.includes("fontTable.xml")) {
    return;
  }

  const relId = createUniqueRelationshipId(xml, "rIdFontTable");
  const relationship = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>`;
  zip.file(path, xml.replace("</Relationships>", `${relationship}</Relationships>`));
}

async function ensureFontContentType(zip) {
  const path = "[Content_Types].xml";
  let xml = await zip.file(path).async("string");

  if (!xml.includes('PartName="/word/fontTable.xml"')) {
    xml = xml.replace(
      "</Types>",
      '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/></Types>',
    );
  }

  if (!xml.includes('Extension="odttf"')) {
    xml = xml.replace(
      "</Types>",
      '<Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/></Types>',
    );
  }

  zip.file(path, xml);
}

function createUniqueRelationshipId(xml, baseId) {
  let index = 1;
  let relId = baseId;
  while (xml.includes(`Id="${relId}"`)) {
    index += 1;
    relId = `${baseId}${index}`;
  }
  return relId;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  if (node.hasAttribute("data-tex")) {
    const tex = node.getAttribute("data-tex") || "";
    const displayMode = node.getAttribute("data-display") === "true";
    return [createDocxParagraph(displayMode ? `$$${tex}$$` : `$${tex}$`)];
  }

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
  if (node.hasAttribute("data-tex")) {
    const tex = node.getAttribute("data-tex") || "";
    return [createTextRun(`$${tex}$`, inherited)];
  }

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
