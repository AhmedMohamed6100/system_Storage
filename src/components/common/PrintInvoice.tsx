import { useRef } from "react";
import { Printer, Download, X } from "lucide-react";
import { Invoice, Product, Unit } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

interface PrintInvoiceProps {
  invoice: Invoice;
  products: Product[];
  units: Unit[];
  invoiceIndex: number;
  onClose: () => void;
}

export default function PrintInvoice({
  invoice,
  products,
  units,
  invoiceIndex,
  onClose,
}: PrintInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalBody = document.body.innerHTML;
    const originalTitle = document.title;

    document.title = `فاتورة رقم ${invoiceIndex}`;
    document.body.innerHTML = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
          <style>
            * { font-family: 'Cairo', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
            body { direction: rtl; background: white; }
            @page { margin: 15mm; size: A4; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `;

    window.print();

    document.body.innerHTML = originalBody;
    document.title = originalTitle;
    window.location.reload();
  };

  const handleSavePDF = () => {
    handlePrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 animate-fade-in overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl animate-slide-up">
        {/* Action bar */}
        <div className="flex items-center justify-between bg-[#1e3a5f] text-white px-5 py-3 rounded-t-xl no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSavePDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              حفظ PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e3a5f] hover:bg-gray-100 rounded-lg text-sm font-bold transition-all"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <span className="text-sm font-semibold">معاينة الفاتورة</span>
          </div>
        </div>

        {/* Invoice content */}
        <div
          ref={printRef}
          className="bg-white rounded-b-xl shadow-2xl overflow-hidden"
          style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl" }}
        >
          <InvoiceTemplate
            invoice={invoice}
            products={products}
            units={units}
            invoiceIndex={invoiceIndex}
          />
        </div>
      </div>
    </div>
  );
}

function InvoiceTemplate({
  invoice,
  products,
  units,
  invoiceIndex,
}: Omit<PrintInvoiceProps, "onClose">) {
  const now = new Date();
  const printTime = now.toLocaleString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const printDate = now.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        padding: "32px",
        background: "white",
        fontFamily: "'Cairo', sans-serif",
        direction: "rtl",
        color: "#1a1a1a",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          paddingBottom: "20px",
          borderBottom: "3px solid #1e3a5f",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            تاريخ الطباعة:
          </p>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
            {printDate}
          </p>
          <p style={{ fontSize: "12px", color: "#888" }}>{printTime}</p>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#1e3a5f",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <div style={{ textAlign: "right" }}>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1e3a5f",
                  margin: "0",
                  letterSpacing: "1px",
                }}
              >
                A-E STORAGE
              </h1>
              <p style={{ fontSize: "11px", color: "#888", margin: "0" }}>
                نظام إدارة المستودعات
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              background: "#1e3a5f",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              display: "inline-block",
              marginBottom: "6px",
            }}
          >
            <p style={{ fontSize: "12px", margin: "0", opacity: 0.8 }}>
              رقم الفاتورة
            </p>
            <p style={{ fontSize: "18px", fontWeight: "800", margin: "0" }}>
              #{String(invoiceIndex).padStart(4, "0")}
            </p>
          </div>
          <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>
            تاريخ الفاتورة: <strong>{formatDate(invoice.invoiceDate)}</strong>
          </p>
        </div>
      </div>

      {/* Invoice info bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "نوع المستند", value: "فاتورة بيع" },
          { label: "عدد الأصناف", value: `${invoice.items.length} صنف` },
          { label: "الملاحظات", value: invoice.notes || "لا يوجد" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 14px",
              textAlign: "right",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                margin: "0 0 4px",
                fontWeight: "600",
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#1e293b",
                margin: "0",
                fontWeight: "700",
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Items table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "24px",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr style={{ background: "#1e3a5f", color: "white" }}>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "right",
                fontWeight: "700",
                borderRadius: "0",
              }}
            >
              #
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "right",
                fontWeight: "700",
              }}
            >
              اسم الصنف
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              الوحدة
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              الكمية
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              سعر الوحدة
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              الإجمالي
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            const unit = product
              ? units.find((u) => u.id === product.unitId)
              : null;
            return (
              <tr
                key={idx}
                style={{
                  background: idx % 2 === 0 ? "white" : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    textAlign: "right",
                    color: "#64748b",
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  {product?.name || "منتج محذوف"}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  {unit?.name || "-"}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1e3a5f",
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    color: "#475569",
                  }}
                >
                  {formatCurrency(item.sellingPrice)}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#16a34a",
                  }}
                >
                  {formatCurrency(item.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            width: "260px",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "9px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontWeight: "700", color: "#16a34a" }}>
              {formatCurrency(invoice.totalSales)}
            </span>
            <span style={{ color: "#475569", fontSize: "13px" }}>
              إجمالي المبيعات
            </span>
          </div>
          {invoice.totalExpenses > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 16px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <span style={{ fontWeight: "700", color: "#dc2626" }}>
                {formatCurrency(invoice.totalExpenses)}
              </span>
              <span style={{ color: "#475569", fontSize: "13px" }}>
                المصاريف
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#1e3a5f",
            }}
          >
            <span
              style={{
                fontWeight: "800",
                color: invoice.netProfit >= 0 ? "#86efac" : "#fca5a5",
                fontSize: "16px",
              }}
            >
              {formatCurrency(invoice.netProfit)}
            </span>
            <span
              style={{ color: "white", fontWeight: "700", fontSize: "14px" }}
            >
              صافي الربح
            </span>
          </div>
        </div>
      </div>

      {/* Signature area */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {["المدير", "المحاسب", "المستلم"].map((role) => (
          <div
            key={role}
            style={{
              textAlign: "center",
              paddingTop: "40px",
              borderTop: "1px dashed #cbd5e1",
            }}
          >
            <p
              style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}
            >
              {role}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          paddingTop: "16px",
          borderTop: "2px solid #e2e8f0",
        }}
      >
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0" }}>
          تم التطوير بواسطة:
          <strong style={{ color: "#1e3a5f" }}> Abdallah Elshemey</strong>
          <span> - 01102346158</span>
          <span style={{ margin: "0 8px" }}>|</span>
          <strong style={{ color: "#1e3a5f" }}> Ahmed Mohamed</strong>
          <span> - 01070495013</span>
          <span style={{ margin: "0 8px" }}>|</span>© A-E Storage 2025 جميع
          الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
