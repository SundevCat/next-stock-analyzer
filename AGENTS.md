# AGENTS.md — stock-analyzer

คู่มือสั้นๆ สำหรับ AI / นักพัฒนาเมื่อแก้โปรเจกต์นี้ (ภาษาเทคนิคเป็นหลักเป็นภาษาอังกฤษ)

## สรุปโปรเจกต์

แอปวิเคราะห์หุ้น (Next.js): รายชื่อหุ้น (SEC + Yahoo search), กราฟจาก Yahoo Finance, สัญญาณจากอินดิเคเตอร์ (EMA/RSI/regression) ผ่าน `predictFromCandles`, รายการโปรดที่ผูกกับ session

## Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, `lightweight-charts` สำหรับกราฟ
- **Data**: Yahoo Finance chart/search (HTTP), SEC `company_tickers.json`; Thailand **SET+mai** symbols loaded from SET’s published `listedCompanies_en_US.xls` (see `thSetSymbolsService.ts`), mapped to `*.BK` for Yahoo; static `thSecurities.ts` is fallback if the file can’t be fetched.
- **Optional DB**: MongoDB สำหรับ favourites (`MONGODB_URI` ใน `.env`) — ไม่มี URI จะ fallback แบบ in-memory ต่อ instance
- **Validation**: Zod (ถ้ามีใน route)

## โครงสร้างโค้ดที่สำคัญ

| พื้นที่ | เส้นทาง |
|--------|---------|
| หน้า | `src/app/(pages)/` — `stocks`, `stocks/[symbol]`, `dashboard`, `page.tsx` |
| API | `src/app/api/stocks/route.ts`, `.../stocks/[symbol]/candles`, `.../predict`, `.../favorites` |
| บริการ | `yahooFinanceService.ts`, `secSymbolsService.ts`, `marketUniverseService.ts`, `predictionService.ts` |
| Components | `src/components/` — `StockMarketBrowser`, `StockChart`, `StockDetailClient`, `FavoriteButton`, `AppShell` |
| Session | `src/middleware.ts` (ตั้ง cookie session), `src/lib/session.ts`, `sessionConstants.ts` |
| Favourites | `src/repositories/favoritesRepository.ts` |
| Types | `src/types/stock.ts` |

## กฎการทำงาน (สำหรับ agent)

1. **อย่าทำลายพฤติกรรมเดิม**: กราฟ, การคำนวณ prediction, favourites, เลย์เอาต์ dashboard — ถ้าต้องเปลี่ยน API shape ให้ backward-compatible หรืออัปเดตผู้เรียกทุกจุด
2. **แหล่งความจริงของ prediction**: ใช้ `predictFromCandles` จาก `predictionService.ts` เท่านั้นเมื่อต้องการ logic เดียวกับหน้า detail — ห้ามคัดลอกสูตรไปผูก UI โดยแยก logic
3. **สัญลักษณ์หุ้น**: Route param และ Yahoo อาจมี `^` หรือรูปแบบ URL-encoded; การแสดงผล/API ควรผ่านฟังก์ชัน sanitize/decode กลาง (ถ้ามีใน `src/lib/`) ก่อน render และก่อนส่ง JSON
4. **Caching**: `getAllSecSymbols` ใช้ `unstable_cache`; Yahoo fetch ใช้ `next: { revalidate: ... }` — พิจารณา TTL เมื่อเพิ่ม endpoint ใหม่
5. **Universe รายการหุ้น**: ลิสต์หลักรวม US (SEC) + ไทย (`getAllMarketSymbols`); การค้นหายังดึง Yahoo search ได้
6. **Imports**: ใช้ alias `@/` ตาม `tsconfig`
7. **ขอบเขต diff**: แก้เฉพาะไฟล์ที่จำเป็นต่องาน ไม่ refactor ยกก้อนโดยไม่ขอ
8. **ตรวจสอบก่อนจบงาน**: หลังแก้โค้ดให้รัน **`npm run lint`** และ **`npm run build`** จนกว่าจะผ่าน — ถือว่างานยังไม่จบถ้า build หรือ lint ล้มเหลว; แก้ error แล้วรันซ้ำจนกว่าจะ success
9. **Git commits**: เมื่อผู้ใช้ขอให้ commit **ห้าม**ใส่ trailer `Co-authored-by: Cursor <cursoragent@cursor.com>` (หรือ co-author ของ agent แบบเดียวกัน) ยกเว้นผู้ใช้ระบุชัดว่าต้องการให้ใส่

## คำสั่งที่ใช้บ่อย

หลัก:**ทุกครั้งที่แก้โปรเจกต์แล้ว** (โดยเฉพาะก่อนสรุปงาน / PR) รันตามลำดับ:

```bash
npm run lint
npm run build
```

รายการอื่นที่ใช้ระหว่างพัฒนา:

```bash
npm run dev    # Turbopack
```

## Environment

คัดลอกจาก `.env.example`: `MONGODB_URI` เป็นทางเลือก

## Git: ลบ `Co-authored-by` ของ Cursor

Cursor อาจแทรกบรรทัด `Co-authored-by: Cursor <cursoragent@cursor.com>` ตอน Agent รัน commit — **ไม่ใช่**สิ่งที่กฎใน repo ควบคุมได้

ถ้าต้องการให้ Git ลบบรรทัดนั้นอัตโนมัติใน repo นี้ รันครั้งเดียวที่ root ของโปรเจกต์:

```bash
git config core.hooksPath .githooks
```

จากนั้น hook ใน `.githooks/prepare-commit-msg` จะตัด trailer ดังกล่าวก่อน commit เสร็จ (ใช้ได้กับ Git for Windows / Bash)

## เมื่อเพิ่มฟีเจอร์ใหม่

- รายการหุ้น: ดู `StockMarketBrowser` + `GET /api/stocks`
- รายละเอียด/กราฟ: `StockDetailClient`, `StockChart`, `GET .../candles`, `GET .../predict`
- Favourites: `GET/POST/PATCH /api/favorites` + repository

หากมี skill โปรเจกต์ ให้อ่าน `.cursor/skills/stock-analyzer/SKILL.md` ก่อนลงมือแก้ฟีเจอร์ที่ซับซ้อน
