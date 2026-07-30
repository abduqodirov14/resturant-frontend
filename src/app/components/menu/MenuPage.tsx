import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CartItem, Food } from '../../../types';
import { api, DEFAULT_FOOD_IMAGE } from '../../lib/api';
import { resolveImageUrl } from '../../lib/image';
import { FoodCard } from './FoodCard';
import { Cart } from './Cart';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { MenuLoadingSkeleton } from './LoadingSkeleton';
import { AnimatePresence, motion } from 'motion/react';
import { Search, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface MenuPageProps {
  tableNumber?: number;
}

type CartActivity = {
  id: number;
  label: string;
  subtitle: string;
  image?: string;
};

const RECENT_ADD_TIMEOUT = 1400;
const CART_ACTIVITY_TIMEOUT = 2200;

export function MenuPage({ tableNumber }: MenuPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [isLoading, setIsLoading] = useState(true);
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<string[]>(['Barchasi']);
  const [highlightToken, setHighlightToken] = useState(0);
  const [lastAddedLabel, setLastAddedLabel] = useState('');
  const [recentlyAddedFoodId, setRecentlyAddedFoodId] = useState<number | null>(null);
  const [cartActivity, setCartActivity] = useState<CartActivity | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const mapFood = (food: any, categoryName: string): Food => ({
    ...food,
    price: Number(food.price || 0),
    categoryName,
    nameUz: food.name,
    descriptionUz: food.description || '',
    image: resolveImageUrl(food.imageUrl, DEFAULT_FOOD_IMAGE),
    categoryUz: categoryName,
    available: food.isAvailable ?? true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.menu();
        const nextFoods = (response.categories || []).flatMap((category: any) =>
          (category.foods || []).map((food: any) => mapFood(food, category.name))
        );

        setFoods(nextFoods);
        setCategories([
          'Barchasi',
          ...Array.from(new Set(nextFoods.map((food) => food.categoryUz || '').filter(Boolean))),
        ]);
      } catch (error: any) {
        toast.error("Menyuni yuklashda xatolik yuz berdi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!recentlyAddedFoodId) return;

    const timer = window.setTimeout(() => setRecentlyAddedFoodId(null), RECENT_ADD_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [recentlyAddedFoodId]);

  useEffect(() => {
    if (!cartActivity) return;

    const timer = window.setTimeout(() => setCartActivity(null), CART_ACTIVITY_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [cartActivity]);

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const normalizedDeferredSearch = deferredSearchQuery.toLowerCase();
      const matchesSearch =
        (food.nameUz || food.name || '').toLowerCase().includes(normalizedDeferredSearch) ||
        (food.descriptionUz || food.description || '').toLowerCase().includes(normalizedDeferredSearch);
      const matchesCategory =
        selectedCategory === 'Barchasi' || food.categoryUz === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [deferredSearchQuery, foods, selectedCategory]);

  const cartTotals = useMemo(() => {
    return cart.reduce(
      (summary, item) => {
        summary.items += item.quantity;
        summary.total += item.food.price * item.quantity;
        return summary;
      },
      { items: 0, total: 0 }
    );
  }, [cart]);

  const pushCartFeedback = (label: string, subtitle: string, image?: string) => {
    const token = Date.now();
    setHighlightToken(token);
    setLastAddedLabel(label);
    setCartActivity({
      id: token,
      label,
      subtitle,
      image,
    });
  };

  const mergeFoodIntoCart = (food: Food, quantity = 1) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.food.id === food.id);
      if (existing) {
        return previous.map((item) =>
          item.food.id === food.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...previous, { food, quantity }];
    });
  };

  const handleAddToCart = (food: Food) => {
    mergeFoodIntoCart(food, 1);
    setRecentlyAddedFoodId(food.id);
    pushCartFeedback(food.nameUz || food.name, "Savatga qo'shildi", food.image);
    toast.success(`${food.nameUz || food.name} savatga qo'shildi`);
  };

  const handleRemoveFromCart = (food: Food) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.food.id === food.id);
      if (!existing) return previous;

      if (existing.quantity === 1) {
        return previous.filter((item) => item.food.id !== food.id);
      }

      return previous.map((item) =>
        item.food.id === food.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const handleClearItem = (foodId: number) => {
    setCart((previous) => previous.filter((item) => item.food.id !== foodId));
    toast.info('Mahsulot savatdan olib tashlandi');
  };

  const handleCheckout = async (): Promise<boolean> => {
    if (cart.length === 0) {
      toast.info("Savatcha hali bo'sh");
      return false;
    }

    if (!tableNumber) {
      toast.error('Buyurtma berish uchun stol QR kodini skaner qiling');
      return false;
    }

    try {
      await api.createOrder({
        tableNumber,
        items: cart.map((item) => ({
          foodId: item.food.id,
          quantity: item.quantity,
        })),
      });

      toast.success("Buyurtmangiz qabul qilindi. Oshxona tayyorlashni boshladi.");
      setCart([]);
      setLastAddedLabel('');
      setCartActivity({
        id: Date.now(),
        label: 'Buyurtma yuborildi',
        subtitle: `Stol #${tableNumber} uchun oshxonaga uzatildi`,
      });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Buyurtma berishda xatolik yuz berdi");
      return false;
    }
  };

  const getQuantityInCart = (foodId: number) =>
    cart.find((item) => item.food.id === foodId)?.quantity || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2.5 rounded-xl">
                <UtensilsCrossed className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Restoran Menu
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {tableNumber ? (
                    <Badge className="bg-orange-600 text-white border-none">
                      Stol #{tableNumber}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-200 text-orange-700">
                      QR skanerdan keyin stol avtomatik aniqlanadi
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Ovqat qidiring..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 rounded-xl border-2 border-slate-200 bg-white pl-12 transition-colors focus:border-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[130px] z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1 pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Food grid */}
      <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${cartTotals.items > 0 ? 'pb-32 md:pb-10' : ''}`}>
        {isLoading ? (
          <MenuLoadingSkeleton />
        ) : (
          <>
            {filteredFoods.length === 0 ? (
              <div className="py-24 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-500">Hech narsa topilmadi</p>
                <p className="mt-1 text-sm text-slate-400">
                  Boshqa kategoriya yoki qidiruv so'zi bilan urinib ko'ring
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFoods.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <FoodCard
                      food={food}
                      quantity={getQuantityInCart(food.id)}
                      isRecentlyAdded={recentlyAddedFoodId === food.id}
                      onAdd={handleAddToCart}
                      onRemove={handleRemoveFromCart}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart activity toast */}
      <AnimatePresence>
        {cartActivity && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-24 left-4 right-4 z-40 md:left-auto md:right-6 md:w-[360px]"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
              {cartActivity.image ? (
                <img
                  src={cartActivity.image}
                  alt={cartActivity.label}
                  className="h-12 w-12 rounded-xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{cartActivity.label}</p>
                <p className="truncate text-xs text-slate-500">{cartActivity.subtitle}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart */}
      <div className="relative z-50">
        <Cart
          items={cart}
          onAdd={handleAddToCart}
          onRemove={handleRemoveFromCart}
          onClear={handleClearItem}
          onCheckout={handleCheckout}
          highlightToken={highlightToken}
          lastAddedLabel={lastAddedLabel}
        />
      </div>
    </div>
  );
}