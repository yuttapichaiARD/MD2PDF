# MD to PDF - Noto

เว็บ static สำหรับอัปโหลดไฟล์ Markdown (`.md`) แล้วแปลงเป็น PDF ในเบราว์เซอร์ โดยใช้และฝังฟอนต์ Noto Sans Thai จากไฟล์ในโปรเจกต์

## ความสามารถ

- อัปโหลดหรือลากไฟล์ `.md` / `.markdown`
- เลือกแท็บ `MD to PDF` หรือ `MD to DOCX`
- ตั้งค่าหน้ากระดาษ A4, A5, Letter, Legal หรือกำหนดขนาดเองเป็นมิลลิเมตร
- ตั้งค่าขอบกระดาษแยก บน / ขวา / ล่าง / ซ้าย
- ปรับขนาดฟอนต์ของเนื้อหา, `#`, `##`, `###`, `####`, H5/H6, list, quote, table, inline code และ code block
- ลงสี syntax highlighting ให้ code block ตามภาษาที่ระบุ เช่น ` ```js `, ` ```python `, ` ```html `
- เลือกความละเอียดตอน export PDF
- PDF export เป็น text layer คัดลอกข้อความได้ และเก็บ hyperlink จาก Markdown
- รองรับสมการ LaTeX ด้วย KaTeX ใน preview และเก็บ source formula ใน export
- เพิ่ม PDF bookmark/outlines สำหรับ H1, H2, table และ code block
- ฝังฟอนต์ `NotoSansThai`, `NotoSans`, และ `NotoSansMono` ใน PDF จาก `resource/font/`
- DOCX ใช้และฝังฟอนต์ `Noto Sans Thai` จาก `resource/font/`
- แปลงทั้งหมดในเบราว์เซอร์ ไฟล์ Markdown ไม่ถูกอัปโหลดไปเซิร์ฟเวอร์

## ใช้งาน

1. เปิด `index.html`
2. อัปโหลดไฟล์ `.md` หรือวางไฟล์ลงในพื้นที่อัปโหลด
3. เลือกแท็บ `MD to PDF` หรือ `MD to DOCX`
4. ปรับหน้ากระดาษ ขอบกระดาษ และขนาดตัวอักษร
5. ตรวจตัวอย่างเอกสาร
6. กด `ดาวน์โหลด PDF` หรือ `ดาวน์โหลด DOCX`

## โฮสต์บน GitHub Pages

โปรเจกต์นี้มี GitHub Actions workflow สำหรับ Pages อยู่แล้วที่ `.github/workflows/pages.yml`

ถ้าสร้าง repo ใหม่:

```powershell
git init
git add .
git commit -m "Add markdown to PDF site"
gh repo create MD2PDF --public --source=. --push
```

จากนั้นไปที่ repository บน GitHub แล้วเปิด `Settings > Pages` เลือก `GitHub Actions` เป็นแหล่ง deploy

## หมายเหตุ

- PDF ใช้ text renderer และฝังฟอนต์ Noto local จึงคัดลอกข้อความ/เปิดลิงก์/ใช้ bookmarks ได้
- รูปภาพจาก URL ภายนอกต้องอนุญาต CORS จึงจะติดไปกับ PDF ได้ครบ
- LaTeX font size controls are available separately for `$...$` and `$$...$$`.
