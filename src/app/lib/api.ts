const env = (import.meta as any).env || {};
const rawApiUrl =
  env.VITE_API_URL ||
  env.NEXT_PUBLIC_API_URL ||
  "/api";
const API_URL = String(rawApiUrl).replace(/\/$/, "");

export const DEFAULT_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop";

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};

  const defaultToken = env.VITE_ADMIN_TOKEN || "admin123";
  const savedToken = localStorage.getItem("adminToken") || "";
  const token = savedToken || defaultToken;

  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface ApiResponse<T> {
  status?: string;
  data?: T;
  message?: string;
  [key: string]: any;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("API serverga ulanib bo'lmadi. Backend server va VITE_API_URL ni tekshiring.");
  }

  const raw = await response.text();
  let parsed: ApiResponse<T> = {};

  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Serverdan noto'g'ri javob keldi");
  }

  if (!response.ok) {
    throw new Error(parsed.message || "So'rovda xatolik yuz berdi");
  }

  if (parsed.status === "success" && parsed.data) {
    return { ...parsed, ...parsed.data } as T;
  }

  return parsed as unknown as T;
}

export const api = {
  request,
  menu: () => request<{ categories: any[] }>("/menu"),
  categories: () => request<{ categories: any[] }>("/menu/categories"),
  tables: () => request<{ tables: any[] }>("/tables"),
  createTable: (payload: { number: number; name?: string }) =>
    request<{ table: any }>("/tables", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteTable: (id: number) =>
    request<{ removedOrders: number }>(`/tables/${id}`, {
      method: "DELETE",
    }),
  createOrder: (payload: { tableId?: number; tableNumber?: number; items: Array<{ foodId: number; quantity: number }>; note?: string }) =>
    request<{ order: any }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  orders: (params?: { status?: string; limit?: number; page?: number; details?: boolean }) => {
    const query = new URLSearchParams();

    if (params?.status) query.set("status", params.status.toUpperCase());
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.page) query.set("page", String(params.page));
    if (params?.details) query.set("details", "true");

    const suffix = query.toString();
    return request<any>(`/orders${suffix ? `?${suffix}` : ""}`);
  },
  orderSummary: () => request<{ counts: Record<string, number>; updatedAt: string }>("/orders/summary"),
  order: (id: number) => request<{ order: any }>(`/orders/${id}`),
  updateOrderStatus: (id: number, status: string) =>
    request<{ order: any }>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: status.toUpperCase() }),
    }),
  payOrder: (id: number) =>
    request<{ order: any; receipt: any }>(`/orders/${id}/pay`, {
      method: "POST",
    }),
  stats: () => request<any>("/admin/stats"),
  expenses: (query?: string | { date?: string; from?: string; to?: string; limit?: number }) => {
    const params = new URLSearchParams();

    if (typeof query === "string") {
      params.set("date", query);
    } else if (query) {
      if (query.date) params.set("date", query.date);
      if (query.from) params.set("from", query.from);
      if (query.to) params.set("to", query.to);
      if (query.limit) params.set("limit", String(query.limit));
    }

    const suffix = params.toString();
    return request<any>(`/admin/expenses${suffix ? `?${suffix}` : ""}`);
  },
  createExpense: (payload: { amount: number; description?: string; date?: string }) =>
    request<{ expense: any }>("/admin/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  closeDay: (payload: { date?: string; note?: string }) =>
    request<{ dailyClose: any }>("/admin/close-day", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  dayCloses: (limit = 30) =>
    request<{ dayCloses: any[] }>(`/admin/day-closes?limit=${limit}`),
  createCategory: (payload: { name: string }) =>
    request<{ category: any }>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createFood: (form: FormData) =>
    request<{ food: any }>("/menu/foods", {
      method: "POST",
      body: form,
    }),
  updateFood: (id: number, form: FormData) =>
    request<{ food: any }>(`/menu/foods/${id}`, {
      method: "PATCH",
      body: form,
    }),
  deletedFoods: () => request<{ foods: any[] }>("/menu/foods/deleted"),
  restoreFood: (id: number) =>
    request<{ food: any }>(`/menu/foods/${id}/restore`, {
      method: "PATCH",
    }),
  deleteFood: (id: number) =>
    request<{ food: any }>(`/menu/foods/${id}`, {
      method: "DELETE",
    }),
};
