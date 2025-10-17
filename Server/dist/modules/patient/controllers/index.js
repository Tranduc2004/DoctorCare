"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rescheduleAccept = exports.reschedulePropose = void 0;
// Patient Controllers Index
__exportStar(require("./appointmentController"), exports);
__exportStar(require("./medicalRecordController"), exports);
__exportStar(require("./prescriptionController"), exports);
__exportStar(require("./authController"), exports);
// new exports
var appointmentController_1 = require("./appointmentController");
Object.defineProperty(exports, "reschedulePropose", { enumerable: true, get: function () { return appointmentController_1.reschedulePropose; } });
Object.defineProperty(exports, "rescheduleAccept", { enumerable: true, get: function () { return appointmentController_1.rescheduleAccept; } });
