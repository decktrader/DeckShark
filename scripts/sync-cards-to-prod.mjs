/**
 * Batch-copy card_cache from local Supabase to production.
 *
 * Usage: node scripts/sync-cards-to-prod.mjs
 *
 * Reads local DB via .env.development credentials,
 * upserts to production via .env.production.local credentials.
 * Batches of 500 rows to stay under REST payload limits.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv(filePath) {
  const vars = {};
  const content = readFileSync(resolve(filePath), "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return vars;
}

const localEnv = loadEnv(".env.development");
const prodEnv = loadEnv(".env.production.local");

const local = createClient(
  localEnv.NEXT_PUBLIC_SUPABASE_URL,
  localEnv.SUPABASE_SERVICE_ROLE_KEY,
);

const prod = createClient(
  prodEnv.NEXT_PUBLIC_SUPABASE_URL,
  prodEnv.SUPABASE_SERVICE_ROLE_KEY,
);

const BATCH_SIZE = 500;
let offset = 0;
let total = 0;
let errors = 0;

console.log("Starting card_cache sync: local → production");

while (true) {
  const { data: rows, error } = await local
    .from("card_cache")
    .select("*")
    .range(offset, offset + BATCH_SIZE - 1)
    .order("scryfall_id");

  if (error) {
    console.error(`Fetch error at offset ${offset}:`, error.message);
    break;
  }

  if (!rows || rows.length === 0) break;

  const { error: upsertError } = await prod
    .from("card_cache")
    .upsert(rows, { onConflict: "scryfall_id" });

  if (upsertError) {
    console.error(
      `Upsert error at offset ${offset}:`,
      upsertError.message,
    );
    errors++;
  }

  total += rows.length;
  process.stdout.write(`\r  Synced ${total} rows...`);

  if (rows.length < BATCH_SIZE) break;
  offset += BATCH_SIZE;
}

console.log(`\nDone. Total: ${total}, Errors: ${errors}`);
