# MD to PDF - Noto

เว็บ static สำหรับอัปโหลดไฟล์ Markdown (`.md`) แล้วแปลงเป็น PDF ในเบราว์เซอร์ โดยใช้และฝังฟอนต์ Noto Sans Thai จากไฟล์ในโปรเจกต์

## ความสามารถ

- อัปโหลดหรือลากไฟล์ `.md` / `.markdown`
- เลือกแท็บ `MD to PDF` หรือ `MD to DOCX`
- ตั้งค่าหน้ากระดาษ A4, A5, Letter, Legal หรือกำหนดขนาดเองเป็นมิลลิเมตร
- ตั้งค่าขอบกระดาษแยก บน / ขวา / ล่าง / ซ้าย
- ปรับขนาดฟอนต์ของเนื้อหา, `#`, `##`, `###`, `####`, H5/H6, list, quote, table, inline code และ code block
- ลงสี syntax highlighting ให้ code block ตามภาษาที่ระบุ เช่น ` ```js `, ` ```python `, ` ```html `
- PDF มี 2 โหมด: ข้อความ (ค่าเริ่มต้น — ฟอนต์คมชัด คัดลอก/ค้นหาได้) และภาพ (ตรงตามตัวอย่างเป๊ะ)
- โหมดข้อความจัดตำแหน่งสระ/วรรณยุกต์ไทยเอง (ยกวรรณยุกต์เหนือสระบน, เลื่อนซ้ายบน ป ฝ ฟ ฬ, กดสระล่างใต้ ฎ ฏ ญ ฐ, แยกสระอำ) เพราะ jsPDF ไม่รองรับ OpenType shaping
- ตัดบรรทัดภาษาไทยตามขอบคำด้วย `Intl.Segmenter`
- แบ่งหน้าอัตโนมัติ: ตารางทวนหัวตารางเมื่อขึ้นหน้าใหม่, code block ยาวแบ่งข้ามหน้า, หัวข้อไม่ตกท้ายหน้า, กันบรรทัดกำพร้า (widow/orphan)
- รูปภาพและสมการ LaTeX แบบ `$$...$$` ฝังเป็นภาพความละเอียดสูงในโหมดข้อความ
- PDF export เป็น text layer คัดลอกข้อความได้ และเก็บ hyperlink จาก Markdown
- รองรับสมการ LaTeX ด้วย KaTeX สมการ `$$...$$` ถูกฝังลง PDF เป็นภาพความละเอียดสูงที่หน้าตาตรงกับ preview ส่วน `$...$` ในบรรทัดยังเก็บเป็น source formula
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

## ตรวจว่าเว็บเป็นเวอร์ชันล่าสุด

มุมบนขวาของหน้าเว็บมีป้าย `build xxxxxxx` แสดงเลข commit ที่ deploy อยู่จริง เทียบกับ commit ล่าสุดบน `main` ได้เลย คลิกที่ป้ายเพื่อดูว่า commit นั้นแก้อะไรบ้าง และชี้ค้างไว้จะเห็นวันเวลาที่ deploy

ถ้าเปิดไฟล์จากเครื่องตัวเองป้ายจะขึ้นว่า `build local` เป็นสีส้ม แปลว่ายังไม่ใช่เวอร์ชันที่ deploy

## โฮสต์บน GitHub Pages

repo นี้ตั้ง `Settings > Pages` ให้เสิร์ฟจาก branch `gh-pages` ไม่ใช่จาก Actions artifact ดังนั้นการ push `main` เฉยๆ จะไม่อัปเดตเว็บ

`.github/workflows/sync-gh-pages.yml` จัดการให้อัตโนมัติ: ทุกครั้งที่ push `main` มันจะประทับเลข commit ลง `index.html` แล้ว push ไป `gh-pages` ต่อ จากนั้นตัว build ในตัวของ Pages จะ deploy เอง รวมแล้วราว 1 นาที **จึง push `main` อย่างเดียวพอ**

ถ้าอยากสั่ง deploy โดยไม่แก้โค้ด กด `Run workflow` ที่ workflow นี้ในหน้า Actions ได้

ถ้าสร้าง repo ใหม่:

```powershell
git init
git add .
git commit -m "Add markdown to PDF site"
gh repo create MD2PDF --public --source=. --push
```

จากนั้นเปิด `Settings > Pages` แล้วเลือก branch `gh-pages` เป็นแหล่ง deploy

## หมายเหตุ

- PDF ใช้ text renderer และฝังฟอนต์ Noto local จึงคัดลอกข้อความ/เปิดลิงก์/ใช้ bookmarks ได้
- รูปภาพจาก URL ภายนอกต้องอนุญาต CORS จึงจะติดไปกับ PDF ได้ครบ
- LaTeX font size controls are available separately for `$...$` and `$$...$$`.
