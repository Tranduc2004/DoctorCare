// Quick helper: compute HMAC-SHA256(JSON.stringify(data)) for a given JSON file
// Usage (PowerShell):
// $env:PAYOS_CHECKSUM_KEY="your_key"; node tools/compute_payos_hmac.js tools/sample_payload.json

const fs = require("fs");
const crypto = require("crypto");

if (process.argv.length < 3) {
  console.error("Usage: node tools/compute_payos_hmac.js <path-to-json>");
  process.exit(2);
}

const p = process.argv[2];
if (!fs.existsSync(p)) {
  console.error("File not found:", p);
  process.exit(3);
}

let raw = fs.readFileSync(p, "utf8");
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error("Failed to parse JSON file:", e.message);
  process.exit(4);
}

const data = parsed.data || parsed;
const key = (process.env.PAYOS_CHECKSUM_KEY || "").trim();
if (!key) {
  console.error("PAYOS_CHECKSUM_KEY not set in environment.");
  process.exit(5);
}

const canonicalize = (obj) => {
  if (!obj || typeof obj !== "object") return "";
  const parts = [];
  const keys = Object.keys(obj)
    .filter((k) => k !== "code" && k !== "desc")
    .sort();
  for (const k of keys) {
    const v = obj[k];
    let s;
    if (v === null || v === undefined) s = "";
    else if (typeof v === "object") {
      try {
        s = JSON.stringify(v);
      } catch (e) {
        s = "";
      }
    } else s = String(v);
    parts.push(`${k}=${s}`);
  }
  return parts.join("&");
};

const canonical = canonicalize(data);
const h = crypto.createHmac("sha256", key).update(canonical).digest("hex");
console.log("canonical", canonical);
console.log("expected hmac:", h);
console.log("signature in file:", parsed.signature || "---");

if (parsed.signature) {
  console.log(
    "match?",
    h.toLowerCase() === String(parsed.signature).toLowerCase()
  );
}
