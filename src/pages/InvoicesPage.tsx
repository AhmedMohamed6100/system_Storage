import { useState, useMemo } from "react";
import { Plus, Trash2, Printer, Pencil } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { invoicesService } from "../services/invoicesService";
import { dailyReportsService } from "../services/dailyReportsService";
import { Invoice, InvoiceItem, DailyReport } from "../types";
import Modal from "../components/common/Modal";
import PrintInvoice from "../components/common/PrintInvoice";
import { formatCurrency, formatDate, today } from "../utils/formatters";

interface InvoiceItemForm {
  productId: string;
  quantity: string;
  sellingPrice: string;
}

export default function InvoicesPage() {
  const {
    products,
    units,
    invoices,
    dailyReports,
    refreshInvoices,
    refreshProducts,
    refreshMovements,
    refreshDailyReports,
  } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [printInvoice, setPrintInvoice] = useState<{
    invoice: Invoice;
    index: number;
  } | null>(null);
  const [searchDate, setSearchDate] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceExpenses, setInvoiceExpenses] = useState("0");
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { productId: "", quantity: "1", sellingPrice: "" },
  ]);
  const [dailyReport, setDailyReport] = useState({
    date: today(),
    invoicesCount: "",
    totalSales: "",
    expenses: "",
    notes: "",
  });
  const filteredInvoices = useMemo(() => {
    if (!searchDate) return invoices;
    return invoices.filter((inv) => inv.invoiceDate === searchDate);
  }, [invoices, searchDate]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { productId: "", quantity: "1", sellingPrice: "" },
    ]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (
    idx: number,
    field: keyof InvoiceItemForm,
    value: string,
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        if (product) next[idx].sellingPrice = String(product.sellingPrice);
      }
      return next;
    });
  };

  const totalSales = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.sellingPrice) || 0;
        return sum + qty * price;
      }, 0),
    [items],
  );

  const totalExpenses = parseFloat(invoiceExpenses) || 0;
  const netProfit = totalSales - totalExpenses;
  const dailyNetProfit =
    (parseFloat(dailyReport.totalSales) || 0) -
    (parseFloat(dailyReport.expenses) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(
      (i) => i.productId && parseFloat(i.quantity) > 0,
    );
    if (validItems.length === 0) {
      showToast("يرجى إضافة منتج واحد على الأقل", "error");
      return;
    }
    const invoiceItems: InvoiceItem[] = validItems.map((i) => ({
      productId: i.productId,
      quantity: parseFloat(i.quantity),
      sellingPrice: parseFloat(i.sellingPrice) || 0,
      total: parseFloat(i.quantity) * (parseFloat(i.sellingPrice) || 0),
    }));
    invoicesService.add(
      {
        invoiceDate,
        items: invoiceItems,
        totalSales,
        totalExpenses,
        netProfit,
        notes: invoiceNotes,
      },
      currentUser?.id || "system",
    );
    refreshInvoices();
    refreshProducts();
    refreshMovements();
    showToast("تم إنشاء الفاتورة بنجاح", "success");
    setShowModal(false);
    resetForm();
  };
  const handleEditReport = (report: DailyReport) => {
    setEditingReportId(report.id);

    setDailyReport({
      date: report.date,
      invoicesCount: report.invoicesCount.toString(),
      totalSales: report.totalSales.toString(),
      expenses: report.expenses.toString(),
      notes: report.notes,
    });

    setShowDailyModal(true);
  };
  const handleDailyReport = (e: React.FormEvent) => {
    e.preventDefault();

    // منع تكرار التاريخ عند الإضافة فقط
    if (!editingReportId) {
      const exists = dailyReports.some((r) => r.date === dailyReport.date);

      if (exists) {
        showToast("يوجد تقرير لهذا التاريخ بالفعل", "error");
        return;
      }
    }

    const reportData = {
      date: dailyReport.date,
      invoicesCount: Number(dailyReport.invoicesCount),
      totalSales: Number(dailyReport.totalSales),
      expenses: Number(dailyReport.expenses),
      netProfit: dailyNetProfit,
      notes: dailyReport.notes,
    };

    if (editingReportId) {
      dailyReportsService.update(editingReportId, reportData);

      showToast("تم تعديل التقرير بنجاح", "success");
    } else {
      dailyReportsService.add(reportData);

      showToast("تم حفظ التقرير اليومي", "success");
    }

    refreshDailyReports();

    setEditingReportId(null);

    setShowDailyModal(false);

    setDailyReport({
      date: today(),
      invoicesCount: "",
      totalSales: "",
      expenses: "",
      notes: "",
    });
  };

  const resetForm = () => {
    setInvoiceDate(today());
    setInvoiceNotes("");
    setInvoiceExpenses("0");
    setItems([{ productId: "", quantity: "1", sellingPrice: "" }]);
  };

  const totalAllSales = useMemo(
    () => invoices.reduce((s, i) => s + i.totalSales, 0),
    [invoices],
  );
  const totalAllProfit = useMemo(
    () => invoices.reduce((s, i) => s + i.netProfit, 0),
    [invoices],
  );
  // const totalDailySales = useMemo(
  //   () => dailyReports.reduce((sum, r) => sum + r.totalSales, 0),
  //   [dailyReports],
  // );

  // const totalDailyProfit = useMemo(
  //   () => dailyReports.reduce((sum, r) => sum + r.netProfit, 0),
  //   [dailyReports],
  // );

  // const totalInvoicesCount = useMemo(
  //   () => dailyReports.reduce((sum, r) => sum + r.invoicesCount, 0),
  //   [dailyReports],
  // );
  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowModal(true);
              resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            فاتورة جديدة
          </button>

          <button
            onClick={() => setShowDailyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            تقرير يومي
          </button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            إجمالي الفواتير
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            إدارة فواتير البيع والمبيعات
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">عدد الفواتير</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {invoices.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">إجمالي المبيعات</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(totalAllSales)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-right">
          <p className="text-sm text-gray-500 mb-1">صافي الربح</p>
          <p
            className={`text-xl font-bold ${totalAllProfit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(totalAllProfit)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
        />
        <span className="text-sm text-gray-500">بحث بالتاريخ:</span>
        {searchDate && (
          <button
            onClick={() => setSearchDate("")}
            className="text-sm text-red-500 hover:underline"
          >
            مسح
          </button>
        )}
      </div>
      {/* كروت فوق التقرير اليومي */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">إجمالي الفواتير</p>

          <p className="text-2xl font-bold text-blue-600 mt-2">
            {totalInvoicesCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">إجمالي المبيعات</p>

          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(totalDailySales)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">إجمالي صافي الربح</p>

          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrency(totalDailyProfit)}
          </p>
        </div>
      </div> */}
      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                #
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                التاريخ
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                عدد الأصناف
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                إجمالي البيع
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                المصاريف
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                صافي الربح
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                ملاحظات
              </th>
              <th className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300 font-semibold">
                خيارات
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  لا توجد فواتير
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {formatDate(inv.invoiceDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {inv.items.length}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-600">
                    {formatCurrency(inv.totalSales)}
                  </td>
                  <td className="px-4 py-3 text-red-500">
                    {formatCurrency(inv.totalExpenses)}
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${inv.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(inv.netProfit)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {inv.notes || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        setPrintInvoice({ invoice: inv, index: idx + 1 })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d5a8e]/10 hover:bg-[#2d5a8e] text-[#2d5a8e] hover:text-white rounded-lg text-xs font-medium transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">عدد الفواتير</th>
              <th className="px-4 py-3 text-right">المبيعات</th>
              <th className="px-4 py-3 text-right">المصاريف</th>
              <th className="px-4 py-3 text-right">صافي الربح</th>
              <th className="px-4 py-3 text-right">ملاحظات</th>
              <th className="px-4 py-3 text-center">خيارات</th>
            </tr>
          </thead>

          <tbody>
            {dailyReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  لا توجد تقارير
                </td>
              </tr>
            ) : (
              [...dailyReports]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((report) => (
                  <tr
                    key={report.id}
                    className="border-t hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-3">{formatDate(report.date)}</td>

                    <td className="px-4 py-3">{report.invoicesCount}</td>

                    <td className="px-4 py-3 text-green-600 font-semibold">
                      {formatCurrency(report.totalSales)}
                    </td>

                    <td className="px-4 py-3 text-red-600 font-semibold">
                      {formatCurrency(report.expenses)}
                    </td>

                    <td
                      className={`px-4 py-3 font-bold ${
                        report.netProfit >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(report.netProfit)}
                    </td>

                    <td className="px-4 py-3">{report.notes || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditReport(report)}
                          className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm("هل تريد حذف هذا التقرير؟"))
                              return;

                            dailyReportsService.delete(report.id);

                            refreshDailyReports();

                            showToast("تم حذف التقرير", "success");
                          }}
                          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      {/* Print preview */}
      {printInvoice && (
        <PrintInvoice
          invoice={printInvoice.invoice}
          products={products}
          units={units}
          invoiceIndex={printInvoice.index}
          onClose={() => setPrintInvoice(null)}
        />
      )}

      {/* New Invoice Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="فاتورة بيع جديدة"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                ملاحظات
              </label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                مصاريف الفاتورة
              </label>
              <input
                type="number"
                value={invoiceExpenses}
                onChange={(e) => setInvoiceExpenses(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center"
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
                    سعر البيع
                  </label>
                  <input
                    type="number"
                    value={item.sellingPrice}
                    onChange={(e) =>
                      updateItem(idx, "sellingPrice", e.target.value)
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
                    min="1"
                    className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] text-sm text-center"
                  />
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

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 text-right space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">إجمالي البيع:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(totalSales)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المصاريف:</span>
              <span className="text-red-500">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-600 pt-1.5">
              <span>صافي الربح:</span>
              <span
                className={netProfit >= 0 ? "text-green-600" : "text-red-600"}
              >
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all"
          >
            حفظ الفاتورة
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
        title="إضافة تقرير يومي"
        size="md"
      >
        <form onSubmit={handleDailyReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-right">التاريخ</label>

              <input
                type="date"
                value={dailyReport.date}
                onChange={(e) =>
                  setDailyReport((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-right">
                عدد الفواتير
              </label>

              <input
                type="number"
                value={dailyReport.invoicesCount}
                onChange={(e) =>
                  setDailyReport((f) => ({
                    ...f,
                    invoicesCount: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-right">
                إجمالي المبيعات
              </label>

              <input
                type="number"
                value={dailyReport.totalSales}
                onChange={(e) =>
                  setDailyReport((f) => ({ ...f, totalSales: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-right">المصاريف</label>

              <input
                type="number"
                value={dailyReport.expenses}
                onChange={(e) =>
                  setDailyReport((f) => ({ ...f, expenses: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-right">ملاحظات</label>

            <input
              type="text"
              value={dailyReport.notes}
              onChange={(e) =>
                setDailyReport((f) => ({ ...f, notes: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-sm">صافي الربح</p>

            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(dailyNetProfit)}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            حفظ التقرير
          </button>
        </form>
      </Modal>
    </div>
  );
}
