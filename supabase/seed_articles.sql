-- ============================================================
-- Seed knowledge base articles
-- Run in Supabase SQL editor at supabase.com/dashboard
-- ============================================================

-- Article 1: Turning On the Propane Fridge (Unique)
insert into public.knowledge_articles (title, slug, content, category_id, is_published)
select
  'Starting the Unique Propane Fridge',
  'starting-the-unique-propane-fridge',
  $article$
## Overview

The cottage fridge is a **Unique** absorption refrigerator. It runs on propane and has no compressor — the cooling is powered entirely by heat from the propane burner. This means it is completely silent when running.

**How it works:** The burner heats an ammonia-water solution. The ammonia vaporizes, rises, condenses, and absorbs heat from inside the fridge — this is what makes it cold. The cycle is continuous as long as propane is flowing and the burner is lit.

---

## Before You Start

**Check these things first:**

1. **The fridge must be level** — absorption fridges stop working if tilted more than 3 degrees. If the cottage has settled over winter, verify the fridge is still sitting level (use a small bubble level on a shelf inside).
2. **Propane tank is not empty** — check the gauge on the exterior tank. If below 20%, order a refill before relying on it.
3. **Propane valve is open** — the main shutoff at the tank and the valve at the back of the fridge should both be open (handle parallel to pipe = open).
4. **Ventilation is clear** — there is a vent at the back and/or bottom of the fridge for the burner exhaust. Make sure nothing is blocking it (mice sometimes nest there over winter — check carefully).

---

## Starting Procedure

### Step 1 — Set the thermostat to OFF
Turn the thermostat dial to the **OFF** position before you do anything else. This prevents gas from flowing before the pilot is established.

### Step 2 — Access the burner
The ignition access panel is usually at the **bottom front** of the fridge (behind a small kick-plate cover) or at the **back**. Open it.

### Step 3 — Light the pilot / ignite the burner

**If your model has a piezo igniter (newer models):**
1. Turn the control knob to the **pilot** or **ignite** position
2. Press and hold the knob in — this allows gas to flow
3. While holding, press the igniter button repeatedly (it will click and spark)
4. Once lit, **continue holding the knob for 30–60 seconds** to heat the thermocouple safety device
5. Slowly release — the flame should stay lit

**If your model has a match-light burner (older models):**
1. Light a long match or barbecue lighter
2. Hold flame near the burner jet
3. Turn the control knob to pilot position
4. Once lit, hold for 30–60 seconds then release slowly

> **If the flame goes out when you release:** The thermocouple needs more time. Hold the knob for a full 60 seconds and try again. Repeat up to 3 times.

### Step 4 — Set the thermostat
Once the burner is running, turn the thermostat dial to **4** (out of 5) as a starting point. Setting 5 is maximum cold, setting 1 is warmest.

### Step 5 — Close the access panel
Replace the kick-plate cover.

---

## Cooling Down

Allow **4–8 hours** for the fridge to reach operating temperature. The fridge is working correctly if:
- You can hear a faint hiss from the burner (propane flame)
- The back of the fridge feels warm (the boiler section runs hot — this is normal)
- After 4+ hours, the interior is noticeably cool

**Don't pack the fridge full right away.** Let it reach temperature first, then load food gradually. A fully loaded warm fridge on a hot day can take up to 12 hours.

---

## Temperature Adjustment

| Setting | Approximate Temp | Use When |
|---------|-----------------|----------|
| 1 | ~10°C (50°F) | Rarely used |
| 2–3 | ~5–7°C (41–45°F) | Mild days, light load |
| **4** | **~3–4°C (37–39°F)** | **Normal use — start here** |
| 5 | ~1–2°C (34–36°F) | Hot weather, full load |

> **Freezer section note:** The small freezer compartment inside does not maintain deep-freeze temperatures like a home freezer. It will keep things frozen if the fridge is running well, but ice cream will be soft.

---

## Daily Propane Use

At normal settings, the Unique fridge burns approximately **1 lb (0.45 kg) of propane per day**. A standard 20 lb barbecue tank lasts about 3 weeks. A 100 lb tank (forklift cylinder) lasts about 3 months.

---

## Troubleshooting

**Pilot won't stay lit:**
- Hold the igniter button for longer before releasing (full 60 seconds)
- Thermocouple may be dirty or worn — it needs time to heat up
- Check that propane is actually flowing (listen for faint hiss when you turn the knob to pilot)

**Fridge is running but not cooling:**
- Is the fridge level? This is the most common cause — check with a level
- Has it had enough time? Give it 8+ hours on a warm day
- Is the back vent clear? Blocked ventilation prevents heat from escaping

**Fridge is too cold / freezing food:**
- Turn the thermostat down to 2 or 3

**Fridge smells like propane:**
- Turn off the propane valve immediately
- Open windows and doors
- Do not operate light switches or flames
- Check all connections with soapy water (bubbles = leak)
- Do not use until leak is found and fixed

---

## Shutting Down

To turn off for the season or before leaving:
1. Turn thermostat to **OFF**
2. Close the propane valve at the back of the fridge
3. Close the main tank valve if shutting down for winter

See the **Closing for Winter** guide for full winterization procedure.

---

## Safety Notes

- The burner area gets very hot — keep flammable items away
- Do not store items directly on top of the fridge (heat from the boiler rises)
- The fridge must always have adequate airflow at the back
- Carbon monoxide is produced by the burner — ensure the cottage has a working CO detector
$article$,
  (select id from public.knowledge_categories where slug = 'propane'),
  true
on conflict (slug) do update set
  content = excluded.content,
  updated_at = now();
