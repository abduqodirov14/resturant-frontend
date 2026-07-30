import { useEffect, useState } from 'react';
import { CartItem } from '../../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { cn } from '../ui/utils';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useIsMobile } from '../ui/use-mobile';

interface CartProps {
  items: CartItem[];
  onAdd: (food: CartItem['food']) => void;
  onRemove: (food: CartItem['food']) => void;
  onClear: (foodId: number) => void;
  onCheckout: () => Promise<boolean> | boolean;
  highlightToken?: number;
  lastAddedLabel?: string;
}

export function Cart({
  items,
  onAdd,
  onRemove,
  onClear,
  onCheckout,
  highlightToken,
  lastAddedLabel,
}: CartProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

  useEffect(() => {
    if (!highlightToken) return;

    setCartPulse(true);
    const timer = window.setTimeout(() => setCartPulse(false), 600);
    return () => window.clearTimeout(timer);
  }, [highlightToken]);

  const handleCheckout = async () => {
    try {
      setIsCheckoutLoading(true);
      const success = await onCheckout();
      if (success === false) return;
      setOpen(false);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isMobile && totalItems > 0 ? (
          <motion.button
            type="button"
            aria-label="Savatchani ochish"
            className={cn(
              'fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-slate-200 bg-white shadow-lg',
              cartPulse && 'ring-2 ring-orange-300'
            )}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 px-4 py-3 text-left">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600 text-white">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full border-2 border-white bg-red-500 px-1 text-xs text-white">
                  {totalItems}
                </Badge>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">Savat tayyor</p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {lastAddedLabel ? `${lastAddedLabel} savatda` : `${totalItems} ta mahsulot`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Jami</p>
                <p className="text-base font-bold text-orange-600">
                  {totalPrice.toLocaleString()} so'm
                </p>
              </div>
            </div>
          </motion.button>
        ) : (
          <motion.button
            type="button"
            aria-label="Savatchani ochish"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart className="h-6 w-6" />

            <AnimatePresence>
              {totalItems > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Badge className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 p-0 text-xs text-white">
                    {totalItems}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </SheetTrigger>

      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col overflow-hidden bg-white p-0',
          isMobile
            ? 'h-[88dvh] max-h-[88dvh] rounded-t-2xl border-t'
            : 'h-[100dvh] max-h-[100dvh] w-full border-l sm:max-w-md'
        )}
      >
        <SheetHeader className="shrink-0 border-b bg-white px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-600 p-2">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              Savatcha
            </SheetTitle>
            {totalItems > 0 && (
              <Badge className="ml-auto bg-orange-600">
                {totalItems} ta
              </Badge>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
              <ShoppingCart className="h-12 w-12 text-slate-400" />
            </div>
            <p className="mb-1 text-lg font-semibold text-slate-400">Savatcha bo'sh</p>
            <p className="text-sm text-slate-400">Buyurtma berishni boshlang</p>
          </div>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1 px-6 py-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.food.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                    >
                      <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="relative">
                          <img
                            src={item.food.image}
                            alt={item.food.nameUz || item.food.name}
                            className="h-16 w-16 rounded-lg object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                            {item.quantity}
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {item.food.nameUz || item.food.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onClear(item.food.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full bg-orange-50 px-1 py-1">
                              <Button
                                onClick={() => onRemove(item.food)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 rounded-full p-0 hover:bg-orange-100"
                              >
                                <Minus className="h-3 w-3 text-orange-600" />
                              </Button>
                              <span className="min-w-[2rem] text-center font-bold text-orange-600">
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() => onAdd(item.food)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 rounded-full p-0 hover:bg-orange-100"
                              >
                                <Plus className="h-3 w-3 text-orange-600" />
                              </Button>
                            </div>

                            <span className="font-bold text-orange-600">
                              {(item.food.price * item.quantity).toLocaleString()} so'm
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="sticky bottom-0 z-10 mt-auto shrink-0 space-y-3 border-t bg-white px-6 py-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-slate-700">Jami:</span>
                <span className="text-xl font-bold text-orange-600">
                  {totalPrice.toLocaleString()} so'm
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
                className="h-12 w-full bg-orange-600 text-base font-semibold text-white hover:bg-orange-700"
                size="lg"
              >
                {isCheckoutLoading ? 'Yuborilmoqda...' : 'Buyurtma berish'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}