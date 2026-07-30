export type OrderStatus = "pending" | "preparing" | "ready" | "paid" | "cancelled";

export interface Food {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId?: number;
  categoryName?: string;
  isAvailable?: boolean;
  nameUz?: string;
  descriptionUz?: string;
  image?: string;
  category?: string;
  categoryUz?: string;
  available?: boolean;
}

export interface Table {
  id: number;
  number: number;
  createdAt: Date;
  qrCode?: string;
}

export interface OrderItem {
  id: number;
  foodId: number;
  food: Food;
  quantity: number;
  price: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface Order {
  id: number;
  tableId: number;
  table: Table;
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  food: Food;
  quantity: number;
}

export interface Expense {
  id: number;
  amount: number;
  description?: string | null;
  expenseDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DayClose {
  id: number;
  closeDate: string;
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  orderCount: number;
  expenseCount: number;
  note?: string | null;
  closedAt: Date;
  updatedAt: Date;
}

export interface ReceiptLine {
  foodId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptData {
  receiptNo: string;
  orderId: number;
  tableNumber: number;
  issuedAt: string;
  paidAt: string;
  total: number;
  lines: ReceiptLine[];
}
