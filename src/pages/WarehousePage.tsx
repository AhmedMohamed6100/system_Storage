import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit3,
} from "lucide-react";
import Select from "react-select";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { productsService } from "../services/productsService";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatCurrency } from "../utils/formatters";
import type { Product } from "../types";

interface ProductForm {
  name: string;
  categoryId: string;
  unitId: string;
  purchasePrice: string;
  sellingPrice: string;
  openingQuantity: string;
}

interface MovementForm {
  productId: string;
  quantity: string;
  price?: string; // لو محتاجه في الصادر
  supplierId?: string; // لو محتاجه في الوارد
  date: string;
  notes: string;
  shift: "morning" | "evening" | ""; // ← الجديد
}
interface EditForm {
  name: string;
  categoryId: string;
  unitId: string;
  purchasePrice: string;
  sellingPrice: string;
  newQuantity: string;
  quantityNote: string;
  shift: "morning" | "evening";
}

const emptyProductForm: ProductForm = {
  name: "",
  categoryId: "",
  unitId: "",
  purchasePrice: "0.00",
  sellingPrice: "0.00",
  openingQuantity: "0.00",
};
export const formatQuantity = (value: number) => {
  return Number(value).toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
export default function WarehousePage() {
  const {
    categories,
    units,
    products,
    suppliers,
    refreshProducts,
    refreshMovements,
    // refreshDailyReports,
  } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    categoryId: "",
    unitId: "",
    purchasePrice: "0.00",
    sellingPrice: "0.00",
    newQuantity: "0.00",
    quantityNote: "",
    shift: "morning",
  });
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [movementForm, setMovementForm] = useState<MovementForm>({
    productId: "",
    quantity: "",
    price: "",
    supplierId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    shift: "",
  });
  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} (متوفر: ${p.currentQuantity})`,
        isDisabled: p.currentQuantity === 0,
      })),
    [products],
  );

  const toggleCategory = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        products.some(
          (p) => p.categoryId === cat.id && p.name.toLowerCase().includes(q),
        ),
    );
  }, [categories, products, search]);

  const getProductsByCategory = (catId: string) => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.categoryId === catId &&
        (!search.trim() || p.name.toLowerCase().includes(q)),
    );
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !productForm.name.trim() ||
      !productForm.categoryId ||
      !productForm.unitId
    ) {
      showToast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }
    const qty = parseFloat(productForm.openingQuantity) || 0;
    productsService.add({
      name: productForm.name.trim(),
      categoryId: productForm.categoryId,
      unitId: productForm.unitId,
      purchasePrice: parseFloat(productForm.purchasePrice) || 0,
      sellingPrice: parseFloat(productForm.sellingPrice) || 0,
      openingQuantity: qty,
      currentQuantity: qty,
    });
    refreshProducts();
    showToast("تم إضافة المادة بنجاح", "success");
    setShowAddModal(false);
    setProductForm(emptyProductForm);
  };

  const handleIncoming = (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseFloat(movementForm.quantity) || 0;
    if (!movementForm.productId || qty <= 0 || !movementForm.shift) {
      showToast("يرجى ملء الحقول المطلوبة (المنتج، الكمية، الوردية)", "error");
      return;
    }

    productsService.addIncoming(
      movementForm.productId,
      qty,
      movementForm.price ? parseFloat(movementForm.price) : undefined,
      movementForm.supplierId || undefined,
      movementForm.date || new Date().toISOString().split("T")[0],
      movementForm.notes || "",
      movementForm.shift as "morning" | "evening",
      currentUser?.id || "system",
    );

    refreshProducts();
    refreshMovements();
    showToast("تمت عملية الوارد بنجاح", "success");
    setShowIncomingModal(false);
    resetMovementForm();
  };

  const handleOutgoing = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(movementForm.quantity) || 0;
    if (!movementForm.productId || qty <= 0 || !movementForm.shift) {
      showToast("يرجى ملء الحقول المطلوبة (المنتج، الكمية، الوردية)", "error");
      return;
    }

    const success = productsService.addOutgoing(
      movementForm.productId,
      qty,
      movementForm.date || new Date().toISOString().split("T")[0],
      movementForm.notes || "",
      movementForm.shift as "morning" | "evening",
      currentUser?.id || "system",
    );
    if (!success) {
      showToast("الكمية المطلوبة أكبر من المخزون المتاح", "error");
      return;
    }
    refreshProducts();
    refreshMovements();
    showToast("تمت عملية الصادر بنجاح", "success");
    setShowOutgoingModal(false);
    resetMovementForm();
  };

  const resetMovementForm = () =>
    setMovementForm({
      productId: "",
      quantity: "",
      price: "",
      supplierId: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      shift: "",
    });

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      categoryId: product.categoryId,
      unitId: product.unitId,
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      newQuantity: String(product.currentQuantity),
      quantityNote: "",
      shift: "morning",
    });
    setShowEditModal(true);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editForm.name.trim() || !editForm.categoryId || !editForm.unitId) {
      showToast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }
    const newQty = parseFloat(editForm.newQuantity) || 0;
    const qtyChanged = newQty !== editingProduct.currentQuantity;

    productsService.update(editingProduct.id, {
      name: editForm.name.trim(),
      categoryId: editForm.categoryId,
      unitId: editForm.unitId,
      purchasePrice: parseFloat(editForm.purchasePrice) || 0,
      sellingPrice: parseFloat(editForm.sellingPrice) || 0,
    });

    if (qtyChanged) {
      productsService.manualEdit(
        editingProduct.id,
        newQty,
        editForm.quantityNote,
        editForm.shift,
        currentUser?.id || "system",
      );
      refreshMovements();
    }

    refreshProducts();
    showToast("تم تعديل المادة بنجاح", "success");
    setShowEditModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة مادة جديدة
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            مخزن المواد (المستودع)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            إدارة الكميات والعمليات حسب الأقسام
          </p>
        </div>
      </div>

      {/* Action buttons + search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الفئة من جميع الأقسام..."
            dir="rtl"
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg text-right bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          onClick={() => {
            setShowIncomingModal(true);
            resetMovementForm();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all text-sm"
        >
          <TrendingUp className="w-4 h-4" />
          إضافة وارد
        </button>
        <button
          onClick={() => {
            setShowOutgoingModal(true);
            resetMovementForm();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all text-sm"
        >
          <TrendingDown className="w-4 h-4" />
          إضافة صادر
        </button>
      </div>

      {/* Categories list */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 shadow-sm">
            لا توجد أقسام. قم بإضافة أقسام أولاً.
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const catProducts = getProductsByCategory(cat.id);
            const isOpen = expanded.has(cat.id);
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    يحتوي على {catProducts.length} مادة
                  </span>
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-bold text-gray-800 dark:text-white">
                      {cat.name}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {catProducts.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-sm">
                        لا توجد مواد في هذا القسم
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50/70 dark:bg-gray-700/30">
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                اسم المادة
                              </th>
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                الوحدة
                              </th>
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                سعر الشراء
                              </th>
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                سعر البيع
                              </th>
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                رصيد افتتاحي
                              </th>
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                المتوفر
                              </th>
                              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-semibold">
                                خيارات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {catProducts.map((p) => {
                              const unit = units.find((u) => u.id === p.unitId);
                              return (
                                <tr
                                  key={p.id}
                                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                                    {p.name}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {unit?.name || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {formatCurrency(p.purchasePrice)}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {formatCurrency(p.sellingPrice)}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {p.openingQuantity}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`font-bold ${p.currentQuantity <= 5 ? "text-red-600" : p.currentQuantity <= 20 ? "text-yellow-600" : "text-green-600"}`}
                                    >
                                      {p.currentQuantity}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => openEditModal(p)}
                                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="تعديل"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteProductId(p.id)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="إنشاء مادة جديدة"
        size="md"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                وحدة القياس
              </label>
              <select
                value={productForm.unitId}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, unitId: e.target.value }))
                }
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              >
                <option value="">اختر الوحدة</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                القسم
              </label>
              <select
                value={productForm.categoryId}
                onChange={(e) =>
                  setProductForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              >
                <option value="">اختر القسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
              اسم المادة
            </label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) =>
                setProductForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="مثال: صنف جديد"
              dir="rtl"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                المخزون الحالي
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={productForm.openingQuantity}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9.,]/g, "") // السماح فقط بالأرقام والفاصلة/النقطة
                    .replace(/,/g, "."); // تحويل الفاصلة إلى نقطة
                  setProductForm((f) => ({
                    ...f,
                    openingQuantity: value,
                  }));
                }}
                placeholder="0.00"
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                سعر البيع
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={productForm.sellingPrice}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9.,]/g, "")
                    .replace(/,/g, ".");
                  setProductForm((f) => ({
                    ...f,
                    sellingPrice: value,
                  }));
                }}
                placeholder="0.00"
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                سعر الشراء
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={productForm.purchasePrice}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9.,]/g, "")
                    .replace(/,/g, ".");
                  setProductForm((f) => ({
                    ...f,
                    purchasePrice: value,
                  }));
                }}
                placeholder="0.00"
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all"
          >
            حفظ الصنف
          </button>
        </form>
      </Modal>

      {/* Incoming Modal */}
      <Modal
        isOpen={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
        title="إضافة وارد"
        size="md"
      >
        <form onSubmit={handleIncoming} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                المورد (اختياري)
              </label>
              <select
                value={movementForm.supplierId}
                onChange={(e) =>
                  setMovementForm((f) => ({
                    ...f,
                    shift: e.target.value as "morning" | "evening",
                  }))
                }
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              >
                <option value="">بدون مورد</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                المنتج
              </label>
              <select
                value={movementForm.productId}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, productId: e.target.value }))
                }
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              >
                <option value="">اختر المنتج</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                الكمية
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={movementForm.quantity}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, quantity: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                السعر (اختياري)
              </label>
              <input
                type="number"
                value={movementForm.price}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, price: e.target.value }))
                }
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                التاريخ
              </label>
              <input
                type="date"
                value={movementForm.date}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
              ملاحظات
            </label>
            <input
              type="text"
              value={movementForm.notes}
              onChange={(e) =>
                setMovementForm((f) => ({ ...f, notes: e.target.value }))
              }
              dir="rtl"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all"
          >
            تأكيد الوارد
          </button>
        </form>
      </Modal>

      {/* Outgoing Modal */}
      <Modal
        isOpen={showOutgoingModal}
        onClose={() => setShowOutgoingModal(false)}
        title="إضافة صادر"
        size="md"
      >
        <form onSubmit={handleOutgoing} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                الكمية
              </label>
              <input
                type="number"
                value={movementForm.quantity}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, quantity: e.target.value }))
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                المنتج
              </label>
              <Select
                options={productOptions}
                placeholder="ابحث عن المنتج..."
                isSearchable
                noOptionsMessage={() => "لا يوجد منتج"}
                value={
                  productOptions.find(
                    (option) => option.value === movementForm.productId,
                  ) || null
                }
                onChange={(selected) =>
                  setMovementForm((f) => ({
                    ...f,
                    productId: selected?.value || "",
                  }))
                }
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "46px",
                    borderRadius: "8px",
                    direction: "rtl",
                    textAlign: "right",
                  }),
                  menu: (base) => ({
                    ...base,
                    direction: "rtl",
                    textAlign: "right",
                  }),
                  option: (base) => ({
                    ...base,
                    direction: "rtl",
                    textAlign: "right",
                  }),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* الوردية الجديدة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                الوردية
              </label>
              <select
                value={movementForm.shift}
                onChange={(e) =>
                  setMovementForm((f) => ({
                    ...f,
                    shift: e.target.value as "morning" | "evening",
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
                required
              >
                <option value="">اختر الوردية</option>
                <option value="morning">صباحية</option>
                <option value="evening">مسائية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                التاريخ
              </label>
              <input
                type="date"
                value={movementForm.date}
                onChange={(e) =>
                  setMovementForm((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
              ملاحظات
            </label>
            <input
              type="text"
              value={movementForm.notes}
              onChange={(e) =>
                setMovementForm((f) => ({ ...f, notes: e.target.value }))
              }
              dir="rtl"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
          >
            تأكيد الصادر
          </button>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        title="تعديل المادة"
        size="md"
      >
        <form onSubmit={handleEditProduct} className="space-y-5">
          {/* Section 1: Product Details */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-r-4 border-[#2d5a8e] pr-2">
              تعديل البيانات
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  وحدة القياس
                </label>
                <select
                  value={editForm.unitId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, unitId: e.target.value }))
                  }
                  dir="rtl"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
                >
                  <option value="">اختر الوحدة</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  القسم
                </label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  dir="rtl"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
                >
                  <option value="">اختر القسم</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                اسم المادة
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                dir="rtl"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  سعر الشراء
                </label>
                <input
                  type="number"
                  value={editForm.purchasePrice}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      purchasePrice: e.target.value,
                    }))
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  سعر البيع
                </label>
                <input
                  type="number"
                  value={editForm.sellingPrice}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, sellingPrice: e.target.value }))
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quantity Adjustment */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-r-4 border-green-500 pr-2">
              تعديل الكمية
            </h3>

            {editingProduct && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 mb-3 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
                <span>
                  الكمية الحالية:{" "}
                  <span className="font-bold text-gray-800 dark:text-white">
                    {Number(editingProduct.currentQuantity || 0).toFixed(2)}
                  </span>
                </span>
                <span>
                  رصيد افتتاحي:{" "}
                  <span className="font-bold text-gray-800 dark:text-white">
                    {Number(editingProduct.openingQuantity || 0).toFixed(2)}
                  </span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  الكمية الجديدة
                </label>
                <input
                  type="number"
                  value={editForm.newQuantity}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, newQuantity: e.target.value }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  سبب التعديل (اختياري)
                </label>
                <input
                  type="text"
                  value={editForm.quantityNote}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, quantityNote: e.target.value }))
                  }
                  placeholder="مثال: جرد، تالف، إلخ"
                  dir="rtl"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#2d5a8e] transition-all text-sm"
                />
              </div>
            </div>

            {editingProduct && editForm.newQuantity && (
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 text-right">
                سيتم تسجيل تغيير الكمية في سجل الحركات (
                {Number(editForm.newQuantity) >
                Number(editingProduct.currentQuantity)
                  ? "+"
                  : ""}
                {(
                  Number(editForm.newQuantity) -
                  Number(editingProduct.currentQuantity)
                ).toFixed(2)}
                )
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2d5a8e] hover:bg-[#1e4070] text-white font-medium rounded-lg transition-all"
          >
            حفظ التعديلات
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        onConfirm={() => {
          if (deleteProductId) {
            productsService.delete(deleteProductId);
            refreshProducts();
            showToast("تم حذف المنتج بنجاح", "success");
            setDeleteProductId(null);
          }
        }}
        title="حذف المنتج"
        message="هل أنت متأكد من حذف هذا المنتج؟"
      />
    </div>
  );
}
