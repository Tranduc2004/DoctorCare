import mongoose, { Connection } from "mongoose";
import { IMedicine, IMedicineBatch, IStockTransaction, IMedicineStock } from "../domains/medicine/MedicineModel";
export declare function getMedicineModel(conn: Connection): mongoose.Model<IMedicine, {}, {}, {}, mongoose.Document<unknown, {}, IMedicine, {}, {}> & IMedicine & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare function getMedicineBatchModel(conn: Connection): mongoose.Model<IMedicineBatch, {}, {}, {}, mongoose.Document<unknown, {}, IMedicineBatch, {}, {}> & IMedicineBatch & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare function getStockTransactionModel(conn: Connection): mongoose.Model<IStockTransaction, {}, {}, {}, mongoose.Document<unknown, {}, IStockTransaction, {}, {}> & IStockTransaction & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export declare function getMedicineStockModel(conn: Connection): mongoose.Model<IMedicineStock, {}, {}, {}, mongoose.Document<unknown, {}, IMedicineStock, {}, {}> & IMedicineStock & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=MedicineModels.d.ts.map