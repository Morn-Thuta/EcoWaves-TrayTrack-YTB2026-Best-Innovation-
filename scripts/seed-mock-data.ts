/**
 * Mock Data Seeder — Hotel Breakfast Buffet (90 days)
 * Run: npx tsx scripts/seed-mock-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import { addDays, format, subDays, startOfDay } from "date-fns";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Singapore public holidays 2025-2026 (approximate)
const PUBLIC_HOLIDAYS = new Set([
  "2025-01-01", // New Year
  "2025-01-29", // CNY Day 1
  "2025-01-30", // CNY Day 2
  "2025-04-18", // Good Friday
  "2025-05-01", // Labour Day
  "2025-05-12", // Vesak Day
  "2025-06-07", // Hari Raya Haji
  "2025-08-09", // National Day
  "2025-10-23", // Deepavali
  "2025-12-25", // Christmas
  "2026-01-01", // New Year
]);

// School holiday periods (Singapore)
function isSchoolHoliday(date: Date): boolean {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  return (
    (m === 3 && d >= 15 && d <= 23) || // March mid-term
    (m >= 6 && m <= 7 && d <= 5) ||    // June holidays (~6 weeks)
    (m === 9 && d >= 6 && d <= 14) ||  // September mid-term
    (m === 11 && d >= 22) ||           // November end
    m === 12                            // December
  );
}

function isYearEndPeak(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (m === 12 && d >= 15) || (m === 1 && d <= 5);
}

function getDayPax(date: Date): number {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = PUBLIC_HOLIDAYS.has(dateStr);
  const isSchool = isSchoolHoliday(date);
  const isPeak = isYearEndPeak(date);

  let base: number;
  if (isPeak) {
    base = 200 + Math.floor(Math.random() * 40); // 200-240
  } else if (isHoliday) {
    base = 180 + Math.floor(Math.random() * 40); // 180-220
  } else if (isSchool) {
    base = 150 + Math.floor(Math.random() * 30); // 150-180
  } else if (isWeekend) {
    base = 130 + Math.floor(Math.random() * 30); // 130-160
  } else {
    base = 80 + Math.floor(Math.random() * 40); // 80-120
  }

  // Small day-to-day variance (±10%)
  const variance = Math.floor(base * 0.1 * (Math.random() * 2 - 1));
  return Math.max(50, base + variance);
}

async function seedDishes() {
  console.log("Seeding dishes...");
  const dishes = [
    {
      name: "Nasi Lemak",
      category: "Main",
      dish_type: "cooked",
      full_tray_weight_grams: 8000,
      tare_weight_grams: 0,
      batch_size: 80,
      cook_trigger_percent: 30,
      average_cook_time_minutes: 25,
      popularity_score: 9,
      is_active: true,
    },
    {
      name: "Scrambled Eggs",
      category: "Eggs",
      dish_type: "cooked",
      full_tray_weight_grams: 5000,
      tare_weight_grams: 0,
      batch_size: 50,
      cook_trigger_percent: 25,
      average_cook_time_minutes: 10,
      popularity_score: 8,
      is_active: true,
    },
    {
      name: "Roti Prata",
      category: "Bread",
      dish_type: "cooked",
      full_tray_weight_grams: 4000,
      tare_weight_grams: 0,
      batch_size: 40,
      cook_trigger_percent: 30,
      average_cook_time_minutes: 15,
      popularity_score: 8,
      is_active: true,
    },
    {
      name: "Mixed Salad",
      category: "Salad",
      dish_type: "ready-to-serve",
      full_tray_weight_grams: 6000,
      tare_weight_grams: 0,
      batch_size: 60,
      cook_trigger_percent: 20,
      average_cook_time_minutes: 5,
      popularity_score: 5,
      is_active: true,
    },
    {
      name: "Assorted Fruits",
      category: "Fruits",
      dish_type: "ready-to-serve",
      full_tray_weight_grams: 7000,
      tare_weight_grams: 0,
      batch_size: 70,
      cook_trigger_percent: 20,
      average_cook_time_minutes: 5,
      popularity_score: 6,
      is_active: true,
    },
  ];

  const { data, error } = await supabase
    .from("dishes")
    .upsert(dishes, { onConflict: "name", ignoreDuplicates: false })
    .select();

  if (error) {
    console.error("Error seeding dishes:", error.message);
    return [];
  }
  console.log(`  ✓ ${data?.length} dishes seeded`);
  return data ?? [];
}

async function seedSensorAndTray(dish: { dish_id: string; name: string }) {
  console.log(`Seeding sensor/tray for ${dish.name}...`);

  // Create sensor
  const { data: sensor } = await supabase
    .from("sensors")
    .insert({
      sensor_type: "hx711_esp32",
      calibration_factor: -7050.0,
      firmware_version: "1.0.0",
      connection_status: "offline",
    })
    .select()
    .single();

  if (!sensor) return null;

  // Create tray linked to dish and sensor
  const { data: tray } = await supabase
    .from("trays")
    .insert({
      dish_id: dish.dish_id,
      sensor_id: sensor.sensor_id,
      tray_name: `Tray - ${dish.name}`,
      location: `Station ${Math.floor(Math.random() * 5) + 1}`,
      tare_weight_grams: 0,
      full_tray_weight_grams: 8000,
      status: "active",
      last_weight_grams: 0,
    })
    .select()
    .single();

  // Link sensor back to tray
  if (tray) {
    await supabase
      .from("sensors")
      .update({ tray_id: tray.tray_id })
      .eq("sensor_id", sensor.sensor_id);
  }

  return { sensor, tray };
}

async function seedOccupancy(days: number) {
  console.log(`Seeding ${days} days of occupancy data...`);
  const today = startOfDay(new Date());
  const records = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const expected = getDayPax(date);
    const actual = Math.round(expected * (0.9 + Math.random() * 0.2)); // ±10% from expected

    records.push({
      date: format(date, "yyyy-MM-dd"),
      expected_pax: expected,
      actual_pax: i > 0 ? actual : null, // Today's actual not filled yet
      source: "mock" as const,
      notes: null,
    });
  }

  const { error } = await supabase
    .from("daily_occupancy")
    .upsert(records, { onConflict: "date", ignoreDuplicates: false });

  if (error) {
    console.error("Error seeding occupancy:", error.message);
  } else {
    console.log(`  ✓ ${records.length} days of occupancy seeded`);
  }
}

async function seedSensorReadings(
  sensorId: string,
  trayId: string,
  dishFullWeightGrams: number,
  days: number
) {
  console.log(`  Seeding readings for tray ${trayId.slice(0, 8)}...`);
  const today = startOfDay(new Date());
  const READING_INTERVAL_SECONDS = 30; // One reading every 30 seconds
  const SERVICE_DURATION_HOURS = 2.5; // 2.5 hour breakfast service

  const allReadings: Array<{
    sensor_id: string;
    tray_id: string;
    weight_grams: number;
    recorded_at: string;
    is_averaged: boolean;
    batch_source_count: number;
  }> = [];

  for (let dayOffset = days - 1; dayOffset >= 1; dayOffset--) {
    const date = subDays(today, dayOffset);
    const pax = getDayPax(date);
    const popularityFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3

    // Breakfast starts at 7am
    const serviceStart = new Date(date);
    serviceStart.setHours(7, 0, 0, 0);

    const totalReadings = Math.floor((SERVICE_DURATION_HOURS * 3600) / READING_INTERVAL_SECONDS);
    const baseDepletionPerReading =
      (dishFullWeightGrams * (pax / 150) * popularityFactor) / totalReadings;

    let currentWeight = dishFullWeightGrams;
    let refillCount = 0;

    for (let r = 0; r < totalReadings; r++) {
      const timestamp = new Date(
        serviceStart.getTime() + r * READING_INTERVAL_SECONDS * 1000
      );

      // Deplete weight with some noise
      const depletion = baseDepletionPerReading * (0.8 + Math.random() * 0.4);
      currentWeight = Math.max(0, currentWeight - depletion);

      // Trigger refill when below 25%
      if (currentWeight < dishFullWeightGrams * 0.25 && refillCount < 3) {
        // Refill to 90-100%
        const refillTo = dishFullWeightGrams * (0.9 + Math.random() * 0.1);
        allReadings.push({
          sensor_id: sensorId,
          tray_id: trayId,
          weight_grams: Math.round(refillTo),
          recorded_at: timestamp.toISOString(),
          is_averaged: true,
          batch_source_count: 7,
        });
        currentWeight = refillTo;
        refillCount++;
        continue;
      }

      // Add noise (±20g)
      const noise = (Math.random() - 0.5) * 40;
      allReadings.push({
        sensor_id: sensorId,
        tray_id: trayId,
        weight_grams: Math.max(0, Math.round(currentWeight + noise)),
        recorded_at: timestamp.toISOString(),
        is_averaged: true,
        batch_source_count: 7,
      });
    }
  }

  // Batch insert in chunks of 1000
  const chunkSize = 1000;
  for (let i = 0; i < allReadings.length; i += chunkSize) {
    const chunk = allReadings.slice(i, i + chunkSize);
    const { error } = await supabase.from("sensor_readings").insert(chunk);
    if (error) {
      console.error(`  Error inserting readings chunk: ${error.message}`);
    }
  }

  console.log(`  ✓ ${allReadings.length} readings seeded`);
}

async function seedIngredients(dishes: Array<{ dish_id: string; name: string }>) {
  console.log("Seeding ingredients...");

  const ingredientMap: Record<string, Array<{ name: string; unit_of_measure: string; recipe_quantity: number }>> = {
    "Nasi Lemak": [
      { name: "Rice", unit_of_measure: "kg", recipe_quantity: 5 },
      { name: "Coconut Milk", unit_of_measure: "liters", recipe_quantity: 2 },
      { name: "Pandan Leaves", unit_of_measure: "pieces", recipe_quantity: 10 },
    ],
    "Scrambled Eggs": [
      { name: "Eggs", unit_of_measure: "pieces", recipe_quantity: 30 },
      { name: "Butter", unit_of_measure: "kg", recipe_quantity: 0.2 },
      { name: "Milk", unit_of_measure: "liters", recipe_quantity: 0.5 },
    ],
    "Roti Prata": [
      { name: "Flour", unit_of_measure: "kg", recipe_quantity: 3 },
      { name: "Ghee", unit_of_measure: "kg", recipe_quantity: 0.5 },
    ],
    "Mixed Salad": [
      { name: "Lettuce", unit_of_measure: "kg", recipe_quantity: 2 },
      { name: "Tomatoes", unit_of_measure: "kg", recipe_quantity: 1 },
      { name: "Cucumbers", unit_of_measure: "kg", recipe_quantity: 1 },
    ],
    "Assorted Fruits": [
      { name: "Watermelon", unit_of_measure: "kg", recipe_quantity: 3 },
      { name: "Papaya", unit_of_measure: "kg", recipe_quantity: 2 },
      { name: "Honeydew", unit_of_measure: "kg", recipe_quantity: 2 },
    ],
  };

  const allIngredients = dishes.flatMap((dish) => {
    const ings = ingredientMap[dish.name] ?? [];
    return ings.map((ing) => ({ ...ing, dish_id: dish.dish_id }));
  });

  const { error } = await supabase.from("ingredients").insert(allIngredients);
  if (error) {
    console.error("Error seeding ingredients:", error.message);
  } else {
    console.log(`  ✓ ${allIngredients.length} ingredients seeded`);
  }
}

async function main() {
  console.log("=== Seeding Mock Data ===\n");

  const DAYS = 90;

  // 1. Seed dishes
  const dishes = await seedDishes();
  if (dishes.length === 0) {
    console.error("No dishes seeded. Aborting.");
    process.exit(1);
  }

  // 2. Seed occupancy
  await seedOccupancy(DAYS);

  // 3. Seed ingredients
  await seedIngredients(dishes);

  // 4. For MVP: seed one sensor+tray+readings (for first dish)
  const mvpDish = dishes[0];
  console.log(`\nSeeding MVP tray (${mvpDish.name})...`);

  const sensorTray = await seedSensorAndTray(mvpDish);
  if (sensorTray?.tray && sensorTray?.sensor) {
    await seedSensorReadings(
      sensorTray.sensor.sensor_id,
      sensorTray.tray.tray_id,
      mvpDish.full_tray_weight_grams,
      DAYS
    );
  }

  console.log("\n=== Seeding Complete ===");
  console.log(`Seeded ${DAYS} days of data for the MVP demo.`);
}

main().catch(console.error);
