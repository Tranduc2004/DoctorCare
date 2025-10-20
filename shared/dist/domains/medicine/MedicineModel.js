"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitConverter = void 0;
/**
 * Unit Conversion Utilities
 */
class UnitConverter {
    /**
     * Convert any unit to tablets based on packaging specs
     */
    static toTablets(quantity, unit, packaging) {
        switch (unit) {
            case "viên":
                return quantity;
            case "vỉ":
                return quantity * packaging.tabletsPerStrip;
            case "hộp":
                return quantity * packaging.stripsPerBox * packaging.tabletsPerStrip;
            case "thùng":
                return (quantity *
                    packaging.boxesPerCarton *
                    packaging.stripsPerBox *
                    packaging.tabletsPerStrip);
            default:
                throw new Error(`Unsupported unit: ${unit}`);
        }
    }
    /**
     * Convert tablets to any unit based on packaging specs
     */
    static fromTablets(tablets, unit, packaging) {
        switch (unit) {
            case "viên":
                return tablets;
            case "vỉ":
                return tablets / packaging.tabletsPerStrip;
            case "hộp":
                return tablets / (packaging.stripsPerBox * packaging.tabletsPerStrip);
            case "thùng":
                return (tablets /
                    (packaging.boxesPerCarton *
                        packaging.stripsPerBox *
                        packaging.tabletsPerStrip));
            default:
                throw new Error(`Unsupported unit: ${unit}`);
        }
    }
    /**
     * Get conversion rate for a unit
     */
    static getConversionRate(unit, packaging) {
        return this.toTablets(1, unit, packaging);
    }
    /**
     * Validate packaging specifications
     */
    static validatePackaging(packaging) {
        return (packaging.tabletsPerStrip > 0 &&
            packaging.stripsPerBox > 0 &&
            packaging.boxesPerCarton > 0);
    }
    /**
     * Format quantity display with appropriate unit
     */
    static formatQuantity(tablets, packaging) {
        const cartons = Math.floor(tablets /
            (packaging.boxesPerCarton *
                packaging.stripsPerBox *
                packaging.tabletsPerStrip));
        const remainingAfterCartons = tablets %
            (packaging.boxesPerCarton *
                packaging.stripsPerBox *
                packaging.tabletsPerStrip);
        const boxes = Math.floor(remainingAfterCartons /
            (packaging.stripsPerBox * packaging.tabletsPerStrip));
        const remainingAfterBoxes = remainingAfterCartons %
            (packaging.stripsPerBox * packaging.tabletsPerStrip);
        const strips = Math.floor(remainingAfterBoxes / packaging.tabletsPerStrip);
        const remainingTablets = remainingAfterBoxes % packaging.tabletsPerStrip;
        const parts = [];
        if (cartons > 0)
            parts.push(`${cartons} thùng`);
        if (boxes > 0)
            parts.push(`${boxes} hộp`);
        if (strips > 0)
            parts.push(`${strips} vỉ`);
        if (remainingTablets > 0)
            parts.push(`${remainingTablets} viên`);
        return parts.length > 0 ? parts.join(" + ") : "0 viên";
    }
}
exports.UnitConverter = UnitConverter;
//# sourceMappingURL=MedicineModel.js.map