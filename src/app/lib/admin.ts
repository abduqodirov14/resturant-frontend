import { Order, OrderStatus, ReceiptData } from "../../types";

export const formatMoney = (value: number) => `${Number(value || 0).toLocaleString()} so'm`;

export const formatDayKey = (value?: Date | string | null) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getTodayDayKey = () => formatDayKey(new Date());

export const getOrderStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "Yangi";
    case "preparing":
      return "Tayyorlanmoqda";
    case "ready":
      return "Tayyor";
    case "paid":
      return "To'langan";
    case "cancelled":
      return "Bekor qilingan";
    default:
      return status;
  }
};

export const getOrderStatusClass = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "preparing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "ready":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "paid":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const formatReceiptNo = (orderId: number, paidAt: Date) => {
  const yyyy = paidAt.getFullYear();
  const mm = String(paidAt.getMonth() + 1).padStart(2, "0");
  const dd = String(paidAt.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${String(orderId).padStart(5, "0")}`;
};

export const buildReceiptFromOrder = (order: Order): ReceiptData => {
  const paidAt = order.paidAt || order.updatedAt;

  return {
    receiptNo: formatReceiptNo(order.id, paidAt),
    orderId: order.id,
    tableNumber: Number(order.table?.number || order.tableId),
    issuedAt: order.createdAt.toISOString(),
    paidAt: paidAt.toISOString(),
    total: Number(order.totalPrice || 0),
    lines: order.items.map((item) => ({
      foodId: item.foodId,
      name: item.food.nameUz || item.food.name,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || item.price || 0),
      lineTotal: Number(item.lineTotal || item.price * item.quantity || 0),
    })),
  };
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const buildReceiptPrintHtml = (receipt: ReceiptData) => {
  const linesHtml = receipt.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)}</td>
          <td style="text-align:center">${line.quantity}</td>
          <td style="text-align:right">${Number(line.unitPrice).toLocaleString()}</td>
          <td style="text-align:right">${Number(line.lineTotal).toLocaleString()}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt #${receipt.receiptNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          .wrap { max-width: 720px; margin: 0 auto; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          th { text-align: left; color: #475569; }
          .total { margin-top: 24px; text-align: right; font-size: 22px; font-weight: 700; }
          .muted { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Restaurant Receipt</h1>
          <p><strong>Receipt:</strong> ${receipt.receiptNo}</p>
          <p><strong>Order:</strong> #${receipt.orderId}</p>
          <p><strong>Table:</strong> #${receipt.tableNumber}</p>
          <p class="muted"><strong>Issued:</strong> ${new Date(receipt.issuedAt).toLocaleString()}</p>
          <p class="muted"><strong>Paid:</strong> ${new Date(receipt.paidAt).toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Taom</th>
                <th style="text-align:center">Soni</th>
                <th style="text-align:right">Narxi</th>
                <th style="text-align:right">Jami</th>
              </tr>
            </thead>
            <tbody>${linesHtml}</tbody>
          </table>
          <div class="total">Jami: ${Number(receipt.total).toLocaleString()} so'm</div>
        </div>
      </body>
    </html>
  `;
};
