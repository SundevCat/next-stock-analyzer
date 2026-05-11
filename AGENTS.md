# AGENTS.md — stock-analyzer

คู่มือสั้นๆ สำหรับ AI / นักพัฒนาเมื่อแก้โปรเจกต์นี้ (ภาษาเทคนิคเป็นหลักเป็นภาษาอังกฤษ)

## สรุปโปรเจกต์

แอปวิเคราะห์หุ้น (Next.js): รายชื่อหุ้น (SEC + Yahoo search), กราฟจาก Yahoo Finance, สัญญาณจากอินดิเคเตอร์ (EMA/RSI/regression) ผ่าน `predictFromCandles`, รายการโปรดที่ผูกกับ session

## Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, `lightweight-charts` สำหรับกราฟ
- **Data**: Yahoo Finance chart/search (HTTP), SEC `company_tickers.json` (ลิสต์หลัก)
- **Optional DB**: MongoDB สำหรับ favourites (`MONGODB_URI` ใน `.env`) — ไม่มี URI จะ fallback แบบ in-memory ต่อ instance
- **Validation**: Zod (ถ้ามีใน route)

## โครงสร้างโค้ดที่สำคัญ

| พื้นที่ | เส้นทาง |
|--------|---------|
| หน้า | `src/app/(pages)/` — `stocks`, `stocks/[symbol]`, `dashboard`, `page.tsx` |
| API | `src/app/api/stocks/route.ts`, `.../stocks/[symbol]/candles`, `.../predict`, `.../favorites` |
| บริการ | `src/services/yahooFinanceService.ts`, `secSymbolsService.ts`, `predictionService.ts` |
| Components | `src/components/` — `StockMarketBrowser`, `StockChart`, `StockDetailClient`, `FavoriteButton`, `AppShell` |
| Session | `src/middleware.ts` (ตั้ง cookie session), `src/lib/session.ts`, `sessionConstants.ts` |
| Favourites | `src/repositories/favoritesRepository.ts` |
| Types | `src/types/stock.ts` |

## กฎการทำงาน (สำหรับ agent)

1. **อย่าทำลายพฤติกรรมเดิม**: กราฟ, การคำนวณ prediction, favourites, เลย์เอาต์ dashboard — ถ้าต้องเปลี่ยน API shape ให้ backward-compatible หรืออัปเดตผู้เรียกทุกจุด
2. **แหล่งความจริงของ prediction**: ใช้ `predictFromCandles` จาก `predictionService.ts` เท่านั้นเมื่อต้องการ logic เดียวกับหน้า detail — ห้ามคัดลอกสูตรไปผูก UI โดยแยก logic
3. **สัญลักษณ์หุ้น**: Route param และ Yahoo อาจมี `^` หรือรูปแบบ URL-encoded; การแสดงผล/API ควรผ่านฟังก์ชัน sanitize/decode กลาง (ถ้ามีใน `src/lib/`) ก่อน render และก่อนส่ง JSON
4. **Caching**: `getAllSecSymbols` ใช้ `unstable_cache`; Yahoo fetch ใช้ `next: { revalidate: ... }` — พิจารณา TTL เมื่อเพิ่ม endpoint ใหม่
5. **Imports**: ใช้ alias `@/` ตาม `tsconfig`
6. **ขอบเขต diff**: แก้เฉพาะไฟล์ที่จำเป็นต่องาน ไม่ refactor ยกก้อนโดยไม่ขอ

## คำสั่งที่ใช้บ่อย

```bash
npm run dev    # Turbopack
npm run lint
npm run build
```

## Environment

คัดลอกจาก `.env.example`: `MONGODB_URI` เป็นทางเลือก

## เมื่อเพิ่มฟีเจอร์ใหม่

- รายการหุ้น: ดู `StockMarketBrowser` + `GET /api/stocks`
- รายละเอียด/กราฟ: `StockDetailClient`, `StockChart`, `GET .../candles`, `GET .../predict`
- Favourites: `GET/POST/PATCH /api/favorites` + repository

หากมี skill โปรเจกต์ ให้อ่าน `.cursor/skills/stock-analyzer/SKILL.md` ก่อนลงมือแก้ฟีเจอร์ที่ซับซ้อน
