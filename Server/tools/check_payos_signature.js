const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

function stableStringifySorted(v) {
  if (v === null || v === undefined) return JSON.stringify(v);
  if (typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v))
    return "[" + v.map((i) => stableStringifySorted(i)).join(",") + "]";
  const keys = Object.keys(v).sort();
  const parts = [];
  for (const k of keys)
    parts.push(JSON.stringify(k) + ":" + stableStringifySorted(v[k]));
  return "{" + parts.join(",") + "}";
}

function loadJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return { raw, parsed: JSON.parse(raw) };
  } catch (e) {
    return { raw, parsed: null };
  }
}

function computeHmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

function run(file) {
  const f = loadJsonFile(file);
  const payload = f.parsed || {};
  const signature = String(
    (payload &&
      (payload.signature || (payload.data && payload.data.signature))) ||
      ""
  ).toLowerCase();
  console.log("\nTesting", file);
  console.log("signature:", signature);

  const key = process.env.PAYOS_CHECKSUM_KEY || "";
  if (!key) {
    console.error("PAYOS_CHECKSUM_KEY not provided in env");
    process.exit(2);
  }

  const candidates = [];
  // raw data substring
  try {
    const re = /"data"\s*:\s*(\{[\s\S]*\})/m;
    const m = re.exec(f.raw);
    if (m && m[1]) {
      const rawData = m[1];
      candidates.push({ label: "raw_data", v: rawData });
      candidates.push({
        label: "raw_data_minified",
        v: rawData.replace(/\s+/g, ""),
      });
    }
  } catch (e) {}
  // full raw
  candidates.push({ label: "full_raw", v: f.raw });
  candidates.push({ label: "full_raw_minified", v: f.raw.replace(/\s+/g, "") });

  // payload.data minified and normal
  if (payload && payload.data) {
    try {
      candidates.push({ label: "data_json", v: JSON.stringify(payload.data) });
    } catch (e) {}
    try {
      candidates.push({
        label: "data_json_minified",
        v: JSON.stringify(payload.data).replace(/\s+/g, ""),
      });
    } catch (e) {}
    try {
      candidates.push({
        label: "data_sorted",
        v: stableStringifySorted(payload.data),
      });
    } catch (e) {}
  }

  // payload full
  try {
    candidates.push({ label: "payload_json", v: JSON.stringify(payload) });
  } catch (e) {}
  try {
    candidates.push({
      label: "payload_json_minified",
      v: JSON.stringify(payload).replace(/\s+/g, ""),
    });
  } catch (e) {}
  try {
    candidates.push({
      label: "payload_sorted",
      v: stableStringifySorted(payload),
    });
  } catch (e) {}

  const results = candidates.map((c) => {
    const hex = computeHmac(key, c.v).toLowerCase();
    return { label: c.label, len: c.v.length, hex };
  });

  let matched = results.find((r) => r.hex === signature);
  if (matched) {
    console.log("MATCH! candidate:", matched);
  } else {
    console.log("No match. Tried:");
    console.table(results);
  }
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files || files.length === 0) {
    console.error("Usage: node check_payos_signature.js <jsonfile> ...");
    process.exit(1);
  }
  for (const f of files) run(path.resolve(f));
}
