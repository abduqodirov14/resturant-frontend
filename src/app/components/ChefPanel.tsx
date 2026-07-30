import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, CheckCircle, ChefHat, Clock, Flame, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AnimatePresence, motion } from 'motion/react';
import { api, createWebSocket, DEFAULT_FOOD_IMAGE } from '../lib/api';
import { resolveImageUrl } from '../lib/image';
import React from 'react';

type ChefOrderStatus = Extract<OrderStatus, 'pending' | 'preparing' | 'ready'>;

const statusConfig = {
  pending: { label: 'Yangi', icon: Clock, color: 'bg-yellow-500' },
  preparing: { label: 'Tayyorlanmoqda', icon: ChefHat, color: 'bg-blue-500' },
  ready: { label: 'Tayyor', icon: CheckCircle, color: 'bg-green-500' },
} satisfies Record<ChefOrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }>;

const statusFlow: ChefOrderStatus[] = ['pending', 'preparing', 'ready'];

export function ChefPanel({ onBack }: { onBack?: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<ChefOrderStatus>('pending');
  const [counts, setCounts] = useState<Record<ChefOrderStatus, number>>({
    pending: 0,
    preparing: 0,
    ready: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const mapOrders = (rawOrders: any[]): Order[] =>
    rawOrders.map((order: any) => ({
      ...order,
      status: String(order.status || '').toLowerCase() as OrderStatus,
      totalPrice: Number(order.total || 0),
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      items: (order.items || []).map((item: any) => ({
        ...item,
        price: Number(item.unitPrice || item.price || 0),
        unitPrice: Number(item.unitPrice || item.price || 0),
        lineTotal: Number(item.lineTotal || 0),
        food: {
          ...item.food,
          price: Number(item.food?.price || 0),
          nameUz: item.food?.name,
          descriptionUz: item.food?.description || '',
          image: resolveImageUrl(item.food?.imageUrl, DEFAULT_FOOD_IMAGE),
          categoryUz: item.food?.category?.name || item.food?.categoryName || '',
          available: item.food?.isAvailable ?? true,
        },
      })),
    }));

  const loadOrders = useCallback(async (status: ChefOrderStatus, silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const [summaryRes, ordersRes] = await Promise.all([
        api.orderSummary(),
        api.orders({ status, limit: 120, details: true }),
      ]);

      setCounts({
        pending: Number(summaryRes.counts?.pending || 0),
        preparing: Number(summaryRes.counts?.preparing || 0),
        ready: Number(summaryRes.counts?.ready || 0),
      });
      setOrders(mapOrders(ordersRes.orders || []));
    } catch (error: any) {
      if (!silent) toast.error(error.message || "Buyurtmalarni yuklab bo'lmadi");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(activeTab);
  }, [activeTab]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let fallbackTimer: ReturnType<typeof setInterval>;

    const connect = () => {
      const ws = createWebSocket("chef-room");
      if (!ws) {
        // Fallback to polling if WebSocket not available
        fallbackTimer = setInterval(() => loadOrders(activeTabRef.current, true), 15000);
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log("Chef WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const { event: wsEvent } = JSON.parse(event.data);
          if (wsEvent === "new_order" || wsEvent === "order_status_updated") {
            loadOrders(activeTabRef.current, true);
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    // Fallback polling every 15s (in case WebSocket misses something)
    fallbackTimer = setInterval(() => loadOrders(activeTabRef.current, true), 15000);

    return () => {
      clearTimeout(reconnectTimer);
      clearInterval(fallbackTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, newStatus: ChefOrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success(`Buyurtma #${orderId} holati yangilandi`);
      loadOrders(activeTab, true);
    } catch (error: any) {
      toast.error(error.message || "Holatni yangilab bo'lmadi");
    }
  };

  const groupedOrders = useMemo(() => {
    const groups = new Map<number, { tableNumber: number; orders: Order[] }>();

    orders.forEach((order) => {
      const tableNumber = Number(order.table?.number || order.tableId);
      const existing = groups.get(tableNumber);

      if (existing) {
        existing.orders.push(order);
      } else {
        groups.set(tableNumber, { tableNumber, orders: [order] });
      }
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        orders: group.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      }))
      .sort((a, b) => a.tableNumber - b.tableNumber);
  }, [orders]);

  const getNextStatus = (currentStatus: ChefOrderStatus): ChefOrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 1) return 'Hozirgina';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    return `${Math.floor(minutes / 60)} soat oldin`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-3 rounded-xl">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Oshpaz Paneli
                </h1>
                <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                  {wsConnected ? (
                    <><Wifi className="w-3.5 h-3.5 text-green-500" /> Real-time ulangan</>
                  ) : (
                    <><WifiOff className="w-3.5 h-3.5 text-slate-400" /> Polling rejimida</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {counts.pending > 0 && (
                <div className="hidden md:flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm font-semibold text-red-600">
                    {counts.pending} yangi buyurtma
                  </span>
                </div>
              )}

              {onBack && (
                <Button variant="outline" onClick={onBack} className="rounded-lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Orqaga
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {statusFlow.map((status, index) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Card className="p-5 bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`${config.color} p-2.5 rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">{config.label}</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {counts[status]}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChefOrderStatus)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1.5 rounded-lg border border-slate-200">
            {statusFlow.map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md transition-colors"
              >
                {statusConfig[status].label}
                {counts[status] > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 px-1 bg-red-500 border-none text-white">
                    {counts[status]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {statusFlow.map((status) => (
            <TabsContent key={status} value={status} className="mt-4">
              <AnimatePresence mode="wait">
                {isLoading && groupedOrders.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="p-12 text-center bg-white border border-slate-200">
                      <p className="text-slate-500 text-lg font-semibold">Buyurtmalar yuklanmoqda...</p>
                    </Card>
                  </motion.div>
                ) : groupedOrders.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="p-12 text-center bg-white border border-slate-200">
                      <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        {React.createElement(statusConfig[status].icon, { className: 'w-10 h-10 text-slate-400' })}
                      </div>
                      <p className="text-slate-400 text-lg font-semibold">Buyurtmalar yo'q</p>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {groupedOrders.map((group, index) => (
                      <motion.div
                        key={`${status}-table-${group.tableNumber}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="p-5 border border-slate-200 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">
                              Stol #{group.tableNumber}
                            </h3>
                            <Badge className="bg-orange-600">
                              {group.orders.length} ta buyurtma
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {group.orders.map((order) => {
                              const nextStatus = getNextStatus(order.status as ChefOrderStatus);

                              return (
                                <div key={order.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800">Buyurtma #{order.id}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatTime(order.createdAt)}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-white">
                                        <img
                                          src={resolveImageUrl(item.food.image || item.food.imageUrl, DEFAULT_FOOD_IMAGE)}
                                          alt={item.food.nameUz || item.food.name}
                                          className="w-10 h-10 object-cover rounded-lg"
                                          loading="lazy"
                                          decoding="async"
                                        />
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm text-slate-900">{item.food.nameUz || item.food.name}</p>
                                          <p className="text-slate-500 text-xs">
                                            {item.quantity}x {Number(item.price).toLocaleString()} so'm
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <span className="font-semibold text-slate-700">Jami:</span>
                                    <span className="text-lg font-bold text-orange-600">
                                      {order.totalPrice.toLocaleString()} so'm
                                    </span>
                                  </div>

                                  {nextStatus && (
                                    <Button
                                      onClick={() => handleStatusChange(order.id, nextStatus)}
                                      className="w-full bg-orange-600 hover:bg-orange-700 font-semibold"
                                    >
                                      {nextStatus === 'preparing' && (
                                        <>
                                          <Flame className="w-4 h-4 mr-2" />
                                          Tayyorlashni boshlash
                                        </>
                                      )}
                                      {nextStatus === 'ready' && 'Tayyor deb belgilash'}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}