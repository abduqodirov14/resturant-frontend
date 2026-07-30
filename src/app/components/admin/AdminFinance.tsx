import { useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, ReceiptText, Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DayClose, Expense, Order } from "../../../types";
import { api } from "../../lib/api";
import { formatDayKey, formatMoney, getTodayDayKey } from "../../lib/admin";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface AdminFinanceProps {
  orders: Order[];
  expenses: Expense[];
  dayCloses: DayClose[];
  selectedDate: string;
  onDateChange: (value: string) => void;
  onRefresh: (silent?: boolean) => Promise<void> | void;
}

export function AdminFinance({
  orders,
  expenses,
  dayCloses,
  selectedDate,
  onDateChange,
  onRefresh,
}: AdminFinanceProps) {
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);

  const paidOrdersForDay = useMemo(
    () => orders.filter((order) => order.status === "paid" && formatDayKey(order.paidAt) === selectedDate),
    [orders, selectedDate]
  );

  const dayRevenue = useMemo(
    () => paidOrdersForDay.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    [paidOrdersForDay]
  );

  const dayExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const selectedClose = useMemo(
    () => dayCloses.find((dayClose) => dayClose.closeDate === selectedDate) || null,
    [dayCloses, selectedDate]
  );

  const saveExpense = async () => {
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) {
      toast.error("Xarajat summasini to'g'ri kiriting");
      return;
    }

    try {
      setIsSavingExpense(true);
      await api.createExpense({
        amount,
        description: expenseDescription.trim() || undefined,
        date: selectedDate,
      });
      setExpenseAmount("");
      setExpenseDescription("");
      toast.success("Xarajat saqlandi");
      await onRefresh(true);
    } catch (error: any) {
      toast.error(error.message || "Xarajatni saqlab bo'lmadi");
    } finally {
      setIsSavingExpense(false);
    }
  };

  const saveDayClose = async () => {
    try {
      setIsClosingDay(true);
      await api.closeDay({
        date: selectedDate,
        note: closeNote.trim() || undefined,
      });
      toast.success("Kunlik hisobot saqlandi");
      await onRefresh(true);
    } catch (error: any) {
      toast.error(error.message || "Kunlik hisobotni saqlab bo'lmadi");
    } finally {
      setIsClosingDay(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kun tushumi</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(dayRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3">
              <CircleDollarSign className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kun xarajati</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(dayExpense)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-100 p-3">
              <ReceiptText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sof foyda</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(dayRevenue - dayExpense)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pullik buyurtmalar</p>
              <p className="text-xl font-bold text-slate-900">{paidOrdersForDay.length} ta</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="p-6 bg-white border-0 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Kunlik moliya</h3>
              <p className="text-slate-500">Xarajat kiriting va kunlik hisobotni saqlang</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value || getTodayDayKey())}
                className="w-[180px]"
              />
              {selectedClose && (
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Hisobot saqlangan
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_auto] gap-3 mb-4">
            <Input
              type="number"
              min="0"
              placeholder="Xarajat summasi"
              value={expenseAmount}
              onChange={(event) => setExpenseAmount(event.target.value)}
            />
            <Input
              placeholder="Xarajat izohi"
              value={expenseDescription}
              onChange={(event) => setExpenseDescription(event.target.value)}
            />
            <Button
              onClick={saveExpense}
              disabled={isSavingExpense}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            >
              {isSavingExpense ? "Saqlanmoqda..." : "Xarajat qo'shish"}
            </Button>
          </div>

          <Textarea
            placeholder="Kunlik hisobot uchun izoh yoki eslatma"
            value={closeNote}
            onChange={(event) => setCloseNote(event.target.value)}
            className="min-h-[110px]"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Hisobot saqlansa, kunlik revenue/xarajat/profit tarixda qoladi.
            </div>
            <Button
              onClick={saveDayClose}
              disabled={isClosingDay}
              className="bg-gradient-to-r from-slate-900 to-slate-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isClosingDay ? "Saqlanmoqda..." : "Kunlik hisobotni saqlash"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Tanlangan sana xarajatlari</h3>
          <div className="space-y-3">
            {expenses.length === 0 && (
              <p className="text-slate-500">Tanlangan sana uchun xarajat yo'q.</p>
            )}

            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {expense.description || "Izohsiz xarajat"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(expense.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-rose-600">{formatMoney(expense.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border-0 shadow-lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Saqlangan kunlik hisobotlar</h3>
            <p className="text-slate-500">Har bir kunning revenue, expense va profit tarixi</p>
          </div>
        </div>

        <div className="space-y-3">
          {dayCloses.length === 0 && (
            <p className="text-slate-500">Hali birorta kunlik hisobot saqlanmagan.</p>
          )}

          {dayCloses.map((dayClose) => (
            <div
              key={dayClose.id}
              className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_1fr_auto] gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
            >
              <div>
                <p className="text-sm text-slate-500">Sana</p>
                <p className="font-semibold text-slate-900">{dayClose.closeDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="font-semibold text-slate-900">{formatMoney(dayClose.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Expense</p>
                <p className="font-semibold text-slate-900">{formatMoney(dayClose.totalExpense)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Profit</p>
                <p className="font-semibold text-emerald-600">{formatMoney(dayClose.totalProfit)}</p>
              </div>
              <div className="text-sm text-slate-500">
                <p>{dayClose.orderCount} ta order</p>
                <p>{dayClose.expenseCount} ta expense</p>
              </div>
              {dayClose.note && (
                <div className="md:col-span-5 rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                  {dayClose.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
