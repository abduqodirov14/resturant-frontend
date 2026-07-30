import { useMemo, useState } from 'react';
import { Order, OrderStatus, ReceiptData } from '../../../types';
import { api } from '../../lib/api';
import {
  buildReceiptFromOrder,
  buildReceiptPrintHtml,
  formatMoney,
  getOrderStatusClass,
  getOrderStatusLabel,
} from '../../lib/admin';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Clock3, Printer, ReceiptText, Wallet } from 'lucide-react';
import { toast } from 'sonner';

type OrderFilter = 'all' | OrderStatus;

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: (silent?: boolean) => Promise<void> | void;
}

const filterOptions: OrderFilter[] = ['all', 'ready', 'pending', 'preparing', 'paid'];

const filterLabel = (filter: OrderFilter) =>
  filter === 'all' ? 'Barchasi' : getOrderStatusLabel(filter);

export function AdminOrders({ orders, onRefresh }: AdminOrdersProps) {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (activeFilter === 'all') return sorted;
    return sorted.filter((order) => order.status === activeFilter);
  }, [activeFilter, orders]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      ready: orders.filter((order) => order.status === 'ready').length,
      paid: orders.filter((order) => order.status === 'paid').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
    }),
    [orders]
  );

  const openReceipt = (order: Order) => {
    setReceipt(buildReceiptFromOrder(order));
  };

  const printReceipt = (data: ReceiptData) => {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      toast.error("Print oynasini ochib bo'lmadi");
      return;
    }

    popup.document.open();
    popup.document.write(buildReceiptPrintHtml(data));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const handlePay = async (order: Order) => {
    try {
      setPayingOrderId(order.id);
      const response = await api.payOrder(order.id);
      const nextReceipt = response.receipt || buildReceiptFromOrder(order);
      setReceipt(nextReceipt);
      toast.success(`Buyurtma #${order.id} uchun to'lov qabul qilindi`);
      await onRefresh(true);
    } catch (error: any) {
      toast.error(error.message || "To'lovni amalga oshirib bo'lmadi");
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              className={
                activeFilter === filter
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'border-orange-200 bg-white hover:bg-orange-50'
              }
              onClick={() => setActiveFilter(filter)}
            >
              {filterLabel(filter)}
              <Badge className="ml-2 border-0 bg-white/20 text-current">{counts[filter]}</Badge>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border-0 bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Buyurtma #{order.id}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Stol #{order.table?.number} | {order.createdAt.toLocaleString()}
                  </p>
                </div>

                <Badge variant="outline" className={`border ${getOrderStatusClass(order.status)}`}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.food.nameUz || item.food.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.quantity} x {formatMoney(Number(item.unitPrice || item.price || 0))}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-700">
                      {formatMoney(Number(item.lineTotal || item.price * item.quantity || 0))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm text-slate-500">Jami summa</p>
                  <p className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
                    {formatMoney(order.totalPrice)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {order.status === 'ready' && (
                    <Button
                      onClick={() => handlePay(order)}
                      disabled={payingOrderId === order.id}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {payingOrderId === order.id ? "To'lov..." : "To'lov qilish"}
                    </Button>
                  )}

                  {order.status === 'paid' && (
                    <Button
                      variant="outline"
                      onClick={() => openReceipt(order)}
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <ReceiptText className="mr-2 h-4 w-4" />
                      Chekni ko'rish
                    </Button>
                  )}
                </div>
              </div>

              {order.status !== 'paid' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  To'lovdan keyin chek avtomatik tayyor bo'ladi.
                </div>
              )}
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <Card className="border-0 bg-white p-16 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-500">
              Bu bo'limda buyurtmalar topilmadi
            </p>
          </Card>
        )}
      </div>

      <Dialog open={Boolean(receipt)} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-2xl bg-white">
          {receipt && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">To'lov cheki</DialogTitle>
                <DialogDescription>
                  Receipt #{receipt.receiptNo} | Stol #{receipt.tableNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-slate-500">Buyurtma</p>
                    <p className="font-semibold">#{receipt.orderId}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-slate-500">To'langan vaqt</p>
                    <p className="font-semibold">
                      {new Date(receipt.paidAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                    <span>Taom</span>
                    <span>Soni</span>
                    <span>Narxi</span>
                    <span>Jami</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {receipt.lines.map((line) => (
                      <div
                        key={`${line.foodId}-${line.name}`}
                        className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-slate-800">{line.name}</span>
                        <span>{line.quantity}</span>
                        <span>{Number(line.unitPrice).toLocaleString()}</span>
                        <span>{Number(line.lineTotal).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-5 py-4">
                  <p className="text-slate-600">Umumiy summa</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatMoney(receipt.total)}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setReceipt(null)}>
                    Yopish
                  </Button>
                  <Button
                    onClick={() => printReceipt(receipt)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Chekni chiqarish
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
