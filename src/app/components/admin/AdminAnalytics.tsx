import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles } from 'lucide-react';
import { Order } from '../../../types';

interface AdminAnalyticsProps {
  topFoods: any[];
  orders: Order[];
  foods: any[];
}

export function AdminAnalytics({ topFoods, orders, foods }: AdminAnalyticsProps) {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 bg-white shadow-lg border-0">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-7 h-7 text-yellow-500" />
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Eng ko'p sotilgan taomlar
            </h3>
          </div>
          <div className="space-y-4">
            {topFoods.map((food, index) => (
              <motion.div 
                key={food.id} 
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50/50 to-amber-50/50 hover:shadow-lg transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 10 }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold shadow-lg">
                  {index + 1}
                </div>
                <img
                  src={food.image}
                  alt={food.nameUz}
                  className="w-16 h-16 object-cover rounded-lg shadow-md"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex-1">
                  <h4 className="font-bold">{food.nameUz}</h4>
                  <p className="text-sm text-slate-600">{food.categoryUz}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-orange-600">{food.totalSold}</p>
                  <p className="text-sm text-slate-600">dona sotildi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {(food.price * food.totalSold).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600">so'm</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white shadow-lg border-0">
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Oxirgi buyurtmalar
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order: any, index: number) => (
              <motion.div 
                key={order.id} 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-xl hover:shadow-md transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div>
                  <p className="font-bold">Buyurtma #{order.id}</p>
                  <p className="text-sm text-slate-600">Stol #{order.table?.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {order.totalPrice?.toLocaleString() || 0} so'm
                  </p>
                  <Badge variant="outline" className="text-xs mt-1 border-orange-200">
                    {order.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-lg border-0">
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Kategoriyalar bo'yicha
          </h3>
          <div className="space-y-3">
            {Array.from(new Set(foods.map(f => f.categoryUz))).map((category, index) => {
              const count = foods.filter(f => f.categoryUz === category).length;
              return (
                <motion.div 
                  key={category as string} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-xl hover:shadow-md transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <p className="font-semibold">{category as string}</p>
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    {count} ta taom
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
