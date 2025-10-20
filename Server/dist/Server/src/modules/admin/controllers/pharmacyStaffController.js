"use strict";
// DEPRECATED: This controller is replaced by pharmacy module StaffController
// TODO: Remove this file after migration is complete
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPharmacyStaffStats = exports.deletePharmacyStaff = exports.togglePharmacyStaffStatus = exports.updatePharmacyStaffPermissions = exports.rejectPharmacyStaff = exports.approvePharmacyStaff = exports.createPharmacyStaff = exports.getPharmacyStaffById = exports.getAllPharmacyStaff = void 0;
// Temporary empty exports to prevent routing errors
const getAllPharmacyStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff instead.",
    });
});
exports.getAllPharmacyStaff = getAllPharmacyStaff;
const getPharmacyStaffById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id instead.",
    });
});
exports.getPharmacyStaffById = getPharmacyStaffById;
const createPharmacyStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({ success: false, error: "This endpoint is deprecated." });
});
exports.createPharmacyStaff = createPharmacyStaff;
const approvePharmacyStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id/approve instead.",
    });
});
exports.approvePharmacyStaff = approvePharmacyStaff;
const rejectPharmacyStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id/reject instead.",
    });
});
exports.rejectPharmacyStaff = rejectPharmacyStaff;
const updatePharmacyStaffPermissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({ success: false, error: "This endpoint is deprecated." });
});
exports.updatePharmacyStaffPermissions = updatePharmacyStaffPermissions;
const togglePharmacyStaffStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id/status instead.",
    });
});
exports.togglePharmacyStaffStatus = togglePharmacyStaffStatus;
const deletePharmacyStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id instead.",
    });
});
exports.deletePharmacyStaff = deletePharmacyStaff;
const getPharmacyStaffStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(501)
        .json({
        success: false,
        error: "This endpoint is deprecated. Use /api/admin/pharmacy/staff/stats instead.",
    });
});
exports.getPharmacyStaffStats = getPharmacyStaffStats;
