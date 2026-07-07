# MD to PDF - Noto

เว็บ static สำหรับอัปโหลดไฟล์ Markdown (`.md`) แล้วแปลงเป็น PDF ในเบราว์เซอร์ โดยใช้ฟอนต์ Noto Sans Thai ผ่าน Google Fonts

## ความสามารถ

- อัปโหลดหรือลากไฟล์ `.md` / `.markdown`
- ตั้งค่าหน้ากระดาษ A4, A5, Letter, Legal หรือกำหนดขนาดเองเป็นมิลลิเมตร
- ตั้งค่าขอบกระดาษแยก บน / ขวา / ล่าง / ซ้าย
- ปรับขนาดฟอนต์ของเนื้อหา, `#`, `##`, `###`, `####`, H5/H6, list, quote, table, inline code และ code block
- ลงสี syntax highlighting ให้ code block ตามภาษาที่ระบุ เช่น ` ```js `, ` ```python `, ` ```html `
- เลือกความละเอียดตอน export PDF
- แปลงทั้งหมดในเบราว์เซอร์ ไฟล์ Markdown ไม่ถูกอัปโหลดไปเซิร์ฟเวอร์

## ใช้งาน

1. เปิด `index.html`
2. อัปโหลดไฟล์ `.md` หรือวางไฟล์ลงในพื้นที่อัปโหลด
3. ปรับหน้ากระดาษ ขอบกระดาษ และขนาดตัวอักษร
4. ตรวจตัวอย่างเอกสาร
5. กด `ดาวน์โหลด PDF`

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

- PDF ใช้การ render จากหน้าเว็บ จึงรองรับภาษาไทยด้วยฟอนต์ Noto
- รูปภาพจาก URL ภายนอกต้องอนุญาต CORS จึงจะติดไปกับ PDF ได้ครบ
