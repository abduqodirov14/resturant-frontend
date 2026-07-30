import { useEffect, useMemo, useState } from "react";
import {
  ChefHat,
  LayoutDashboard,
  Table as TableIcon,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { DayClose, Expense, Food, Order, Table } from "../../types";
import { getTodayDayKey } from "../lib/admin";
import { api, DEFAULT_FOOD_IMAGE } from "../lib/api";
import { resolveImageUrl } from "../lib/image";
import { AdminAnalytics } from "./admin/AdminAnalytics";
import { AdminFinance } from "./admin/AdminFinance";
import { AdminFoods } from "./admin/AdminFoods";
import { AdminOrders } from "./admin/AdminOrders";
import { AdminStats } from "./admin/AdminStats";
import { AdminTables } from "./admin/AdminTables";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type CategoryOption = {
  id: number;
  name: string;
};

export function AdminDashboard({ onBack }: { onBack?: () => void }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [dayCloses, setDayCloses] = useState<DayClose[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    todayRevenue: 0,
    orders: 0,
    preparing: 0,
    ready: 0,
  });
  const [financeDate, setFinanceDate] = useState(getTodayDayKey());
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);

  const mapFood = (food: any, categoryName?: string): Food => ({
    ...food,
    price: Number(food.price || 0),
    categoryName: categoryName || food.category?.name,
    nameUz: food.name,
    descriptionUz: food.description || "",
    image: resolveImageUrl(food.imageUrl, DEFAULT_FOOD_IMAGE),
    categoryUz: categoryName || food.category?.name || "",
    available: food.isAvailable ?? true,
  });

  const mapOrder = (order: any): Order => ({
    ...order,
    status: String(order.status || "").toLowerCase() as any,
    totalPrice: Number(order.total || 0),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    paidAt: order.paidAt ? new Date(order.paidAt) : null,
    items: (order.items || []).map((item: any) => ({
      ...item,
      price: Number(item.unitPrice || item.price || 0),
      unitPrice: Number(item.unitPrice || item.price || 0),
      lineTotal: Number(item.lineTotal || 0),
      food: mapFood(item.food, item.food?.category?.name),
    })),
  });

  const mapExpense = (expense: any): Expense => ({
    ...expense,
    amount: Number(expense.amount || 0),
    createdAt: new Date(expense.createdAt),
    updatedAt: new Date(expense.updatedAt),
  });

  const mapDayClose = (dayClose: any): DayClose => ({
    ...dayClose,
    totalRevenue: Number(dayClose.totalRevenue || 0),
    totalExpense: Number(dayClose.totalExpense || 0),
    totalProfit: Number(dayClose.totalProfit || 0),
    closedAt: new Date(dayClose.closedAt),
    updatedAt: new Date(dayClose.updatedAt),
  });

  const applyOrdersAndStats = (ordersRes: any, statsRes: any) => {
    setOrders((ordersRes.orders || []).map((order: any) => mapOrder(order)));
    setStats({
      revenue: Number(statsRes.revenue || 0),
      todayRevenue: Number(statsRes.todayRevenue || 0),
      orders: Number(statsRes.orders || 0),
      preparing: Number(statsRes.preparing || 0),
      ready: Number(statsRes.ready || 0),
    });
  };

  const loadAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [tablesRes, ordersRes, categoriesRes, statsRes, expensesRes, closesRes] = await Promise.all([
        api.tables(),
        api.orders({ limit: 180, details: true }),
        api.categories(),
        api.stats(),
        api.expenses({ limit: 500 }),
        api.dayCloses(365),
      ]);

      setTables(
        (tablesRes.tables || []).map((table: any) => ({
          ...table,
          createdAt: new Date(table.createdAt),
        }))
      );
      applyOrdersAndStats(ordersRes, statsRes);
      setAllExpenses((expensesRes.expenses || []).map((expense: any) => mapExpense(expense)));
      setDayCloses((closesRes.dayCloses || []).map((dayClose: any) => mapDayClose(dayClose)));

      const categories = categoriesRes.categories || [];
      setCategories(
        categories.map((category: any) => ({
          id: Number(category.id),
          name: category.name,
        }))
      );
      const mappedFoods = categories.flatMap((category: any) =>
        (category.foods || []).map((food: any) => mapFood(food, category.name))
      );
      setFoods(mappedFoods);
    } catch (error: any) {
      toast.error(error.message || "Admin ma'lumotlarini yuklashda xatolik");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadOrdersSnapshot = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.orders({ limit: 180, details: true }),
        api.stats(),
      ]);

      applyOrdersAndStats(ordersRes, statsRes);
    } catch (error: any) {
      toast.error(error.message || "Buyurtma snapshotini yangilab bo'lmadi");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab !== "orders") return;

    loadOrdersSnapshot();
    const timer = setInterval(() => {
      loadOrdersSnapshot();
    }, 20000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const todayOrdersCount = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter((order) => order.createdAt.toDateString() === today).length;
  }, [orders]);

  const financeExpenses = useMemo(
    () => allExpenses.filter((expense) => expense.expenseDate === financeDate),
    [allExpenses, financeDate]
  );

  const topFoods = useMemo(() => {
    const soldMap = new Map<number, { food: Food; totalSold: number }>();

    orders.forEach((order) => {
      if (order.status === "cancelled") return;

      order.items.forEach((item) => {
        const current = soldMap.get(item.foodId);
        if (current) {
          current.totalSold += item.quantity;
        } else {
          soldMap.set(item.foodId, {
            food: item.food,
            totalSold: item.quantity,
          });
        }
      });
    });

    return Array.from(soldMap.values())
      .map(({ food, totalSold }) => ({ ...food, totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
  }, [orders]);

  const statsConfig = [
    {
      icon: TrendingUp,
      label: "Umumiy daromad",
      value: `${stats.revenue.toLocaleString()} so'm`,
      color: "bg-green-500",
    },
    {
      icon: Wallet,
      label: "Bugungi tushum",
      value: `${stats.todayRevenue.toLocaleString()} so'm`,
      color: "bg-emerald-500",
    },
    {
      icon: ChefHat,
      label: "Oshxona navbati",
      value: stats.preparing + stats.ready,
      color: "bg-blue-500",
    },
    {
      icon: TableIcon,
      label: "Bugungi buyurtmalar",
      value: todayOrdersCount,
      color: "bg-orange-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-3 rounded-xl">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Admin Panel
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                To'lov, chek, kunlik hisobot va restoran boshqaruvi bir joyda
              </p>
            </div>
          </div>

          {onBack && (
            <Button variant="outline" onClick={onBack} className="rounded-lg">
              Orqaga
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdminStats stats={statsConfig} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 flex flex-col">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 rounded-lg bg-white p-1.5 border border-slate-200 md:grid-cols-5">
            <TabsTrigger value="orders" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-colors border-none">
              <Wallet className="w-4 h-4 mr-2" />
              Buyurtmalar
            </TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-colors border-none">
              <TrendingUp className="w-4 h-4 mr-2" />
              Moliya
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-colors border-none">
              <TableIcon className="w-4 h-4 mr-2" />
              Stollar
            </TabsTrigger>
            <TabsTrigger value="foods" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-colors border-none">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Ovqatlar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-colors border-none">
              <ChefHat className="w-4 h-4 mr-2" />
              Analitika
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="outline-none border-none">
            <AdminOrders orders={orders} onRefresh={loadAll} />
          </TabsContent>

          <TabsContent value="finance" className="outline-none border-none">
            <AdminFinance
              orders={orders}
              expenses={financeExpenses}
              dayCloses={dayCloses}
              selectedDate={financeDate}
              onDateChange={setFinanceDate}
              onRefresh={loadAll}
            />
          </TabsContent>

          <TabsContent value="tables" className="outline-none border-none">
            <AdminTables tables={tables} onRefresh={loadAll} />
          </TabsContent>

          <TabsContent value="foods" className="outline-none border-none">
            <AdminFoods foods={foods} categories={categories} onRefresh={loadAll} />
          </TabsContent>

          <TabsContent value="analytics" className="outline-none border-none">
            <AdminAnalytics topFoods={topFoods} orders={orders} foods={foods} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}