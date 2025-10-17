import QRCode from "qrcode";

// Utility to build a simple EMVCo/VietQR payload for domestic bank transfer.
// This is a minimal builder for the common fields used by many Vietnamese banks.
// It constructs ID-length-value entries per EMVCo and returns the full payload.

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function buildVietQR({
  accountNumber,
  bankName,
  beneficiaryName,
  amount, // number in VND
  note,
}: {
  accountNumber: string;
  bankName?: string;
  beneficiaryName?: string;
  amount?: number;
  note?: string;
}) {
  // Payload format (simplified):
  // 00 - Payload Format Indicator (01)
  // 01 - Point of Initiation (12 static / 11 dynamic)
  // 26 - Merchant Account Information (subfields: 00 - GuiID, 01 - account)
  // 52 - Merchant Category Code
  // 53 - Transaction Currency (704 = VND)
  // 54 - Transaction Amount (optional)
  // 58 - Country Code (VN)
  // 59 - Merchant Name
  // 60 - Merchant City (optional)
  // 62 - Additional data field (e.g., bill number or reference)

  const parts: string[] = [];
  parts.push(tlv("00", "01"));
  // Dynamic payload (so amount can be present) - use '12'
  parts.push(tlv("01", "12"));

  // Merchant/beneficiary info - put account number in tag 26/01 for simplicity
  const maiSub = [] as string[];
  // Use a generic GUI for VietQR
  maiSub.push(tlv("00", "A0000007270123")); // Example GUI used by many banks
  if (accountNumber) maiSub.push(tlv("01", accountNumber));
  if (bankName) maiSub.push(tlv("02", bankName));
  parts.push(tlv("26", maiSub.join("")));

  parts.push(tlv("52", "0000")); // MCC unknown - set generic
  parts.push(tlv("53", "704")); // VND

  if (amount !== undefined && amount !== null) {
    // Use dot as decimal separator (EMVCo allows decimal amounts)
    // Format with two decimals (many banks expect decimal format like 10000.00)
    const amtStr = Number(amount).toFixed(2).replace(/\.00$/, "");
    parts.push(tlv("54", amtStr));
  }

  parts.push(tlv("58", "VN"));
  if (beneficiaryName)
    parts.push(tlv("59", String(beneficiaryName).slice(0, 25)));
  // Merchant city - use branch or default to HCM so some banks will display it
  parts.push(tlv("60", "HCM"));

  if (note) {
    // Put order info into 62/01 (bill number or reference) and 62/05 for extra compatibility
    const adf: string[] = [];
    adf.push(tlv("01", String(note).slice(0, 25)));
    // additional field for some banks
    adf.push(tlv("05", String(note).slice(0, 50)));
    parts.push(tlv("62", adf.join("")));
  }

  // Join and compute CRC (tag '63') per EMVCo: CRC16/CCITT-FALSE
  const payloadWithoutCRC = parts.join("");

  // Compute CRC16-CCITT (False) as hex uppercase
  const crc = computeCrc16(payloadWithoutCRC + "63" + "04");
  const full = payloadWithoutCRC + tlv("63", crc);
  return full;
}

// CRC16-CCITT-FALSE
function computeCrc16(input: string) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export async function renderQrDataUrl(payload: string) {
  // generate a PNG data URL; qrcode library supports data URL generation
  const dataUrl = await QRCode.toDataURL(payload, { margin: 1, scale: 8 });
  return dataUrl;
}

export default { buildVietQR, renderQrDataUrl };
