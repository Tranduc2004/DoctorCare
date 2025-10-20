"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAfterHours = isAfterHours;
function isAfterHours(date) {
    // Simple rule: after hours = before 7:00 or after 18:00, or weekend
    const h = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6)
        return true;
    if (h < 7 || h >= 18)
        return true;
    return false;
}
