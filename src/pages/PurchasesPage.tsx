import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { purchasesService } from "../services/purchasesService";
import { PurchaseItem } from "../types";
import Modal from "../components/common/Modal";
import { formatCurrency, formatDate, today } from "../utils/formatters";

interface PurchaseItemForm {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export default function PurchasesPage() {
  const {
    products,
    suppliers,
    purchases,
    refreshPurchases,
    refreshProducts,
    refreshMovements,
  } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [paymentDate, setPaymentDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemForm[]>([
    { productId: "", quantity: "1", unitPrice: "" },
  ]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, i) =>
          sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0),
        0,
      ),
    [items],
  );

  const remaining = total - (parseFloat(amountPaid) || 0);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { productId: "", quantity: "1", unitPrice: "" },
    ]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (
    idx: number,
    field: keyof PurchaseItemForm,
    value: string,
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "productId") {
        const p = products.find((p) => p.id === value);
        if (p) next[idx].unitPrice = String(p.purchasePrice);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      showToast("يرجى اختيار المورد", "error");
      return;
    }
    const validItems = items.filter(
      (i) => i.productId && parseFloat(i.quantity) > 0,
    );
    if (validItems.length === 0) {
      showToast("يرجى إضافة منتج واحد على الأقل", "error");
      return;
    }

    const purchaseItems: PurchaseItem[] = validItems.map((i) => ({
      productId: i.productId,
      quantity: parseFloat(i.quantity),
      unitPrice: parseFloat(i.unitPrice) || 0,
      total: parseFloat(i.quantity) * (parseFloat(i.unitPrice) || 0),
    }));

    purchasesService.add(
      {
        supplierId,
        invoiceDate,
        paymentDate: paymentDate || undefined,
        items: purchaseItems,
        total,
        amountPaid: parseFloat(amountPaid) || 0,
        remainingDebt: remaining < 0 ? 0 : remaining,
        notes,
      },
      currentUser?.id || "system",
    );

    refreshPurchases();
    refreshProducts();
    refreshMovements();
    showToast("تم تسجيل الفاتورة بنجاح", "success");
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSupplierId("");
    setInvoiceDate(today());
    setPaymentDate("");
    setAmountPaid("0");
    setNotes("");
    setItems([{ productId: "", quantity: "1", unitPrice: "" }]);
  };

  const totalPaid = useMemo(
    () => purchases.reduce((s, p) => s + p.amountPaid, 0),
    [purchases],
  );
  const totalRemaining = useMemo(
    () => purchases.reduce((s, p) => s + p.remainingDebt, 0),
    [purchases],
  );
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const supplier = suppliers.find((s) => s.id === p.supplierId);

      return supplier?.name
        .toLowerCase()
        .includes(searchSupplier.toLowerCase());
    });
  }, [purchases, suppliers, searchSupplier]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <button
          onClick={() => {
            setShowModal(true);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          فاتورة مشتريات جديدة
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            المشتريات (فواتير)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            إدارة فواتير الشراء والموردين
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">عدد الفواتير</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {purchases.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">إجمالي المدفوع</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">إجمالي المتبقي</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>
      {/* سيرش */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث باسم المورد..."
          value={searchSupplier}
          onChange={(e) => setSearchSupplier(e.target.value)}
          dir="rtl"
          className="w-full px-4 py-2 border rounded-lg 
    bg-white dark:bg-gray-700 
    text-gray-800 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                #
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                المورد
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                تاريخ الفاتورة
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                الإجمالي
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                المدفوع
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                المتبقي
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                عدد الأصناف
              </th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  لا توجد فواتير مشتريات
                </td>
              </tr>
            ) : (
              filteredPurchases.map((p, idx) => {
                const supplier = suppliers.find((s) => s.id === p.supplierId);
                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedPurchase(p);
                      setShowDetailsModal(true);
                    }}
                    className="cursor-pointer border-t border-gray-100 
 dark:border-gray-700 hover:bg-gray-50 
 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {supplier?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatDate(p.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {formatCurrency(p.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-red-600 font-medium">
                      {formatCurrency(p.remainingDebt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.items.length}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="فاتورة مشتريات جديدة"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                تاريخ الدفع (اختياري)
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                تاريخ الفاتورة
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
              المورد
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              dir="rtl"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm"
            >
              <option value="">اختر المورد</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 flex items-center justify-between">
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-[#2d5a8e] font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة صنف
              </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                الأصناف
              </span>
            </div>
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 gap-3 p-3 border-t border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block text-right">
                    سعر الوحدة
                  </label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, "unitPrice", e.target.value)
                    }
                    step="0.01"
                    min="0"
                    className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block text-right">
                    الكمية
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", e.target.value)
                    }
                    min="0"
                    step="0.001"
                    className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center"
                  />{" "}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block text-right">
                    المنتج
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(idx, "productId", e.target.value)
                    }
                    dir="rtl"
                    className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm"
                  >
                    <option value="">اختر...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Totals + payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                المبلغ المدفوع
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center"
              />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-right">
              <div className="flex justify-between text-sm mb-1">
                <span>إجمالي الفاتورة:</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>المدفوع:</span>
                <span className="text-green-600">
                  {formatCurrency(parseFloat(amountPaid) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-600 pt-1">
                <span>الدين المتبقي:</span>
                <span className="text-red-600">
                  {formatCurrency(remaining < 0 ? 0 : remaining)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
              ملاحظات
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              dir="rtl"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all"
          >
            حفظ الفاتورة
          </button>
        </form>
      </Modal>
      {/* Purchase Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="تفاصيل فاتورة الشراء"
        size="lg"
      >
        {selectedPurchase && (
          <div className="space-y-4 text-right text-gray-800 dark:text-gray-200">
            <div>
              <p>
                المورد:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {
                    suppliers.find((s) => s.id === selectedPurchase.supplierId)
                      ?.name
                  }
                </strong>
              </p>

              <p className="mt-2">
                التاريخ: {formatDate(selectedPurchase.invoiceDate)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-gray-700 dark:text-gray-200">
                      الصنف
                    </th>

                    <th className="text-gray-700 dark:text-gray-200">الكمية</th>

                    <th className="text-gray-700 dark:text-gray-200">السعر</th>

                    <th className="text-gray-700 dark:text-gray-200">
                      الإجمالي
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedPurchase.items.map((item: any) => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );

                    return (
                      <tr
                        key={item.productId}
                        className="
                    border-t 
                    border-gray-200 
                    dark:border-gray-700
                    hover:bg-gray-50
                    dark:hover:bg-gray-700/40
                  "
                      >
                        <td className="p-2">{product?.name}</td>

                        <td>{item.quantity}</td>

                        <td>{formatCurrency(item.unitPrice)}</td>

                        <td className="font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              className="
        border-t 
        border-gray-200 
        dark:border-gray-700 
        pt-3
      "
            >
              <p>
                الإجمالي:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {formatCurrency(selectedPurchase.total)}
                </strong>
              </p>

              <p className="text-green-600 dark:text-green-400 mt-2">
                المدفوع: {formatCurrency(selectedPurchase.amountPaid)}
              </p>

              <p className="text-red-600 dark:text-red-400 mt-2">
                المتبقي: {formatCurrency(selectedPurchase.remainingDebt)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
