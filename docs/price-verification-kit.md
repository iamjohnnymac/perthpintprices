# Price verification kit

## Google Form fields

Create a Google Form with these fields. Title: **"Arvo Price Check"**

### Fields

1. **Your name** (Short answer, required)

2. **Suburb** (Dropdown, required)
   - Perth CBD
   - Northbridge
   - Fremantle
   - Scarborough
   - Cottesloe
   - Subiaco
   - Leederville

3. **Pub name** (Short answer, required)
   - Helper text: "Exactly as it appears on the sign"

4. **Cheapest pint price** (Short answer, required)
   - Helper text: "e.g. 9.50 (numbers only, no $)"
   - Validation: Number, between 3 and 30

5. **Beer type** (Short answer, required)
   - Helper text: "e.g. Swan Draught, Emu Export, Hahn SuperDry"

6. **Happy hour price?** (Short answer, optional)
   - Helper text: "If they have a happy hour deal on pints, what's the price? Leave blank if none"

7. **Happy hour times** (Short answer, optional)
   - Helper text: "e.g. Mon-Fri 4-6pm"

8. **Photo of menu/tap prices** (File upload, required)
   - Helper text: "Photo of the menu board, tap list, or price display"

9. **Notes** (Paragraph, optional)
   - Helper text: "Anything else worth knowing? Closed down? Moved? Cash only? Good vibes?"

---

## Backpacker brief

Copy-paste this into your Gumtree/Airtasker/Facebook post:

---

**Casual work: Visit Perth pubs, photograph beer prices ($30/hr)**

We run perthpintprices.com, a free site that tracks the cheapest pints in Perth. We need people to walk into pubs, check the price of the cheapest pint on tap, and fill in a quick form with a photo.

**What you do:**
- Walk into the pub
- Find the cheapest pint price (check the tap list, menu board, or ask the bar staff)
- Note the beer type (e.g. Swan Draught)
- Take a photo of the price list
- Fill in our Google Form (takes 30 seconds per pub)
- Move to the next pub

**Details:**
- $30/hr, 4-6 hour shifts
- We give you a list of pubs in one suburb area
- Expect to cover 10-15 pubs per shift
- Weekday afternoons work best (pubs are open, not too busy)
- You'll need your phone and comfy shoes

**Suburbs we need covered:**
Perth CBD, Northbridge, Fremantle, Scarborough, Cottesloe, Subiaco, Leederville

DM with your availability and which suburb(s) work for you.

---

## Pub lists by suburb

Export these from Supabase and print/share with each worker:

```sql
SELECT name, address, suburb, price, price_verified
FROM pubs
WHERE suburb IN ('Perth CBD', 'Northbridge', 'Fremantle', 'Scarborough', 'Cottesloe', 'Subiaco', 'Leederville')
ORDER BY suburb, name;
```

Give each worker a printed checklist for their suburb with columns:
- [ ] Pub name
- [ ] Address
- [ ] Current price (from our data)
- [ ] Status: Verified / Price changed / Closed / Couldn't access

## Budget estimate

| Item | Cost |
|------|------|
| 7 suburbs x ~15 pubs each = ~105 pubs | |
| ~7 shifts x 4hrs x $30/hr | ~$840 |
| Could combine nearby suburbs (CBD + Northbridge, Subi + Leederville) into single shifts | |
| **Realistic total** | **$600-$840** |

## After collection

1. Export the Google Form responses as CSV
2. Match pub names to existing database entries
3. Update prices and set `price_verified = true`
4. Add `last_verified` timestamp
5. Any new happy hour data gets added too
