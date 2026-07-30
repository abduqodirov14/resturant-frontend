import { Food } from '../../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Check, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface FoodCardProps {
  food: Food;
  quantity?: number;
  isRecentlyAdded?: boolean;
  onAdd: (food: Food) => void;
  onRemove: (food: Food) => void;
}

export function FoodCard({
  food,
  quantity = 0,
  isRecentlyAdded = false,
  onAdd,
  onRemove,
}: FoodCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-lg">
        {isRecentlyAdded && (
          <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-center gap-2 rounded-full bg-slate-900/85 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Check className="h-4 w-4 text-emerald-400" />
            Savatga tushdi
          </div>
        )}

        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={food.image}
            alt={food.nameUz || food.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />

          {!food.available && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <span className="rounded-full bg-red-500 px-5 py-2 font-semibold text-white">
                Mavjud emas
              </span>
            </div>
          )}

          {quantity > 0 && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 font-bold text-white shadow-md">
              <span>{quantity}</span>
              <Check className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">{food.nameUz || food.name}</h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
              {food.descriptionUz || food.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-orange-600">
                {food.price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">so'm</span>
            </div>

            {quantity === 0 ? (
              <Button
                onClick={() => onAdd(food)}
                disabled={!food.available}
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                Qo'shish
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-orange-50 px-2 py-1">
                <Button
                  onClick={() => onRemove(food)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0 hover:bg-orange-100"
                >
                  <Minus className="h-4 w-4 text-orange-600" />
                </Button>
                <span className="min-w-[2rem] text-center font-bold text-orange-600">
                  {quantity}
                </span>
                <Button
                  onClick={() => onAdd(food)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0 hover:bg-orange-100"
                >
                  <Plus className="h-4 w-4 text-orange-600" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}