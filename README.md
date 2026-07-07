# MD to PDF - Noto

เว็บ static สำหรับอัปโหลดไฟล์ Markdown (`.md`) แล้วแปลงเป็น PDF ในเบราว์เซอร์ โดยใช้ฟอนต์ Noto Sans Thai ผ่าน Google Fonts

## ใช้งาน

1. เปิด `index.html`
2. อัปโหลดไฟล์ `.md` หรือวางไฟล์ลงในพื้นที่อัปโหลด
3. ตรวจตัวอย่างเอกสาร
4. กด `ดาวน์โหลด PDF`

## โฮสต์บน GitHub Pages

วิธีเร็วด้วย GitHub CLI:

```powershell
git init
git add .
git commit -m "Add markdown to PDF site"
gh repo create MD2PDF --public --source=. --push
```

จากนั้นไปที่ repository บน GitHub แล้วเปิด `Settings > Pages` เลือก `GitHub Actions` เป็นแหล่ง deploy

ถ้าไม่ใช้ GitHub CLI ให้สร้าง repository ใหม่บน GitHub, อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ แล้วเปิด Pages ด้วย GitHub Actions เช่นเดียวกัน

## หมายเหตุ

- การแปลงทั้งหมดเกิดบนเครื่องผู้ใช้ ไฟล์ Markdown ไม่ถูกอัปโหลดไปเซิร์ฟเวอร์
- PDF ใช้การ render จากหน้าเว็บ จึงรองรับภาษาไทยด้วยฟอนต์ Noto
- รูปภาพจาก URL ภายนอกต้องอนุญาต CORS จึงจะติดไปกับ PDF ได้ครบ
