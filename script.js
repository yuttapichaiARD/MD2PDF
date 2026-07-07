const sampleMarkdown = `# ตัวอย่างเอกสาร

ไฟล์ Markdown จะแสดงตัวอย่างด้วยฟอนต์ **Noto Sans Thai** ก่อนดาวน์โหลดเป็น PDF

## รายการ

- รองรับหัวข้อ ตาราง รูปภาพ ลิงก์ และโค้ด
- แก้ไขข้อความในกล่อง Markdown แล้วดูตัวอย่างทันที
- ใช้ปุ่มดาวน์โหลดเพื่อสร้างไฟล์ PDF ในเบราว์เซอร์

| รายการ | สถานะ |
| --- | --- |
| Markdown preview | พร้อม |
| PDF export | พร้อม |

\`\`\`js
console.log("Markdown to PDF");
\`\`\`
`;

const paperSizes = {
  a4: { label: "A4", portrait: [210, 297], landscape: [297, 210] },
  letter: { label: "Letter", portrait: [216, 279], landscape: [279, 216] },
};

const state = {
  sourceName: "document.md",
};

const elements = {
  dropZone: document.getElementById("dropZone"),
  fileInput: document.getElementById("fileInput"),
  fileMeta: document.getElementById("fileMeta"),
  fileName: document.getElementById("fileName"),
  paperSize: document.getElementById("paperSize"),
  orientation: document.getElementById("orientation"),
  marginSize: document.getElementById("marginSize"),
  markdownInput: document.getElementById("markdownInput"),
  preview: document.getElementById("preview"),
  previewPage: document.getElementById("previewPage"),
  downloadPdf: document.getElementById("downloadPdf"),
  printPdf: document.getElementById("printPdf"),
  statusText: document.getElementById("statusText"),
  pageLabel: document.getElementById("pageLabel"),
  exportHost: document.getElementById("exportHost"),
  printStyle: document.getElementById("printStyle"),
};

function init() {
  elements.markdownInput.value = sampleMarkdown;
  renderMarkdown();
  applyPageSettings();
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
  elements.paperSize.addEventListener("change", applyPageSettings);
  elements.orientation.addEventListener("change", applyPageSettings);
  elements.marginSize.addEventListener("change", applyPageSettings);
  elements.downloadPdf.addEventListener("click", downloadPdf);
  elements.printPdf.addEventListener("click", printPdf);
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
  const markdown = elements.markdownInput.value.trim()
    ? elements.markdownInput.value
    : " ";

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
}

function applyPageSettings() {
  const paper = paperSizes[elements.paperSize.value];
  const orientation = elements.orientation.value;
  const [width, height] = paper[orientation];
  const margin = Number(elements.marginSize.value);

  document.documentElement.style.setProperty("--page-width", `${width}mm`);
  document.documentElement.style.setProperty("--page-height", `${height}mm`);
  document.documentElement.style.setProperty("--page-padding", `${margin}mm`);

  const orientationLabel = orientation === "portrait" ? "ตั้ง" : "นอน";
  elements.pageLabel.textContent = `${paper.label} ${orientationLabel}`;
  elements.printStyle.textContent = `@page { size: ${paper.label} ${orientation}; margin: 0; }`;
}

function normalizePdfName() {
  if (!elements.fileName.value.trim()) {
    return;
  }

  elements.fileName.value = ensurePdfExtension(elements.fileName.value);
}

async function downloadPdf() {
  if (!window.html2pdf) {
    printPdf();
    return;
  }

  setBusy(true, "กำลังสร้าง PDF");

  try {
    await waitForFonts();
    const clone = elements.previewPage.cloneNode(true);
    clone.removeAttribute("id");
    elements.exportHost.replaceChildren(clone);

    const options = {
      filename: getPdfName(),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: clone.scrollWidth,
      },
      jsPDF: {
        unit: "mm",
        format: elements.paperSize.value,
        orientation: elements.orientation.value,
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ["blockquote", "img", "pre", "table"],
      },
    };

    await window.html2pdf().set(options).from(clone).save();
    setStatus("ดาวน์โหลดแล้ว");
  } catch (error) {
    console.error(error);
    setStatus("สร้าง PDF ไม่สำเร็จ");
  } finally {
    elements.exportHost.replaceChildren();
    setBusy(false);
  }
}

async function printPdf() {
  setStatus("เปิดหน้าพิมพ์");
  await waitForFonts();
  window.print();
}

function getPdfName() {
  return ensurePdfExtension(elements.fileName.value.trim() || buildPdfName(state.sourceName));
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
  elements.printPdf.disabled = isBusy;
  setStatus(message);
}

function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    return document.fonts.ready;
  }

  return Promise.resolve();
}

window.addEventListener("DOMContentLoaded", init);
