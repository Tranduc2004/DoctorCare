import React, { useEffect, useState } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminGetBankAccounts,
  adminCreateBankAccount,
  adminUpdateBankAccount,
  adminDeleteBankAccount,
} from "../../api/adminApi";

type BankAccount = {
  _id?: string;
  name?: string;
  bankName?: string;
  accountNumber?: string;
  branch?: string;
  note?: string;
  active?: boolean;
};

const BankAccountsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  // Common banks list used for select dropdown. Values should match what
  // downstream QR generator or banks expect; keep them as display names.
  const BANK_OPTIONS = [
    "ACB - Ngân hàng TMCP Á Châu",
    "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    "MB - Ngân hàng TMCP Quân đội",
    "VCB - Ngân hàng Vietcombank",
    "TCB - Ngân hàng Techcombank",
    "VIB - Ngân hàng VIB",
    "BIDV",
    "TPB - Ngân hàng TPBank",
    "SCB - Ngân hàng SCB",
    "MB Bank",
    "MB - Ngân hàng TMCP Quân đội",
    "Other",
  ];

  const load = async () => {
    try {
      setLoading(true);
      const resp = await adminGetBankAccounts(token!);
      setItems(resp.data || []);
    } catch (err) {
      console.error("Load bank accounts failed", err);
      alert("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (payload: BankAccount) => {
    try {
      if (payload._id) {
        await adminUpdateBankAccount(token!, payload._id, payload);
      } else {
        await adminCreateBankAccount(token!, payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      console.error("Save failed", err);
      alert("Lưu không thành công");
    }
  };

  const remove = async (id?: string) => {
    if (!id) return;
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
      await adminDeleteBankAccount(token!, id);
      await load();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Xóa không thành công");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Tài khoản nhận chuyển khoản</h2>
        <button
          onClick={() => setEditing({ active: true })}
          className="px-3 py-2 bg-teal-600 text-white rounded-md"
        >
          Thêm tài khoản
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Tên người thụ hưởng</th>
                <th className="py-2">Ngân hàng</th>
                <th className="py-2">Số tài khoản</th>
                <th className="py-2">Chi nhánh</th>
                <th className="py-2">Hoạt động</th>
                <th className="py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="py-2">{it.name}</td>
                  <td className="py-2">{it.bankName}</td>
                  <td className="py-2">{it.accountNumber}</td>
                  <td className="py-2">{it.branch}</td>
                  <td className="py-2">{it.active ? "Có" : "Không"}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(it)}
                        className="px-2 py-1 bg-gray-100 rounded"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => remove(it._id)}
                        className="px-2 py-1 bg-red-100 rounded text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Simple Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editing._id ? "Sửa tài khoản" : "Thêm tài khoản"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Tên người thụ hưởng"
                value={editing.name || ""}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                className="p-2 border rounded"
              />
              <input placeholder="Ngân hàng" className="p-2 border rounded" />
              <div>
                <select
                  value={
                    BANK_OPTIONS.includes(editing.bankName || "")
                      ? editing.bankName
                      : "Other"
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "Other") {
                      // set to empty so manual input can be filled
                      setEditing({ ...editing, bankName: "" });
                    } else {
                      setEditing({ ...editing, bankName: v });
                    }
                  }}
                  className="p-2 border rounded w-full"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b === "Other" ? "Other" : b}>
                      {b}
                    </option>
                  ))}
                </select>
                {/* If bankName is empty (user selected 'Other'), show manual field */}
                {(!editing.bankName || editing.bankName === "") && (
                  <input
                    placeholder="Nhập tên ngân hàng (khác)"
                    value={editing.bankName || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, bankName: e.target.value })
                    }
                    className="p-2 border rounded mt-2 w-full"
                  />
                )}
              </div>
              <input
                placeholder="Số tài khoản"
                value={editing.accountNumber || ""}
                onChange={(e) =>
                  setEditing({ ...editing, accountNumber: e.target.value })
                }
                className="p-2 border rounded"
              />
              <input
                placeholder="Chi nhánh"
                value={editing.branch || ""}
                onChange={(e) =>
                  setEditing({ ...editing, branch: e.target.value })
                }
                className="p-2 border rounded"
              />
              <input
                placeholder="Ghi chú"
                value={editing.note || ""}
                onChange={(e) =>
                  setEditing({ ...editing, note: e.target.value })
                }
                className="p-2 border rounded col-span-2"
              />
              <label className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editing.active}
                  onChange={(e) =>
                    setEditing({ ...editing, active: e.target.checked })
                  }
                />{" "}
                Kích hoạt
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 bg-gray-100 rounded"
              >
                Hủy
              </button>
              <button
                onClick={() => save(editing)}
                className="px-3 py-2 bg-teal-600 text-white rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsPage;
