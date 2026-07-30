import { Button } from './ui/button';
import { Card } from './ui/card';
import { UtensilsCrossed, ChefHat, LayoutDashboard, QrCode, TrendingUp, Shield, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigate: (page: 'menu' | 'chef' | 'admin') => void;
}

const features = [
  {
    icon: QrCode,
    title: 'QR Menu',
    description: "Har bir stol uchun QR kod. Mijozlar telefonlari orqali menuni ko'rib, buyurtma berishadi.",
  },
  {
    icon: Zap,
    title: 'Real-time Buyurtmalar',
    description: "Buyurtmalar darhol oshpaz paneliga tushadi. Statuslar real vaqt rejimida yangilanadi.",
  },
  {
    icon: ChefHat,
    title: 'Oshpaz Paneli',
    description: "Oshpazlar buyurtmalarni ko'rib, statuslarini boshqarishadi: Yangi, Tayyorlanmoqda, Tayyor.",
  },
  {
    icon: LayoutDashboard,
    title: 'Admin Dashboard',
    description: 'Stollarni boshqaring, ovqatlarni tahrirlang, statistikani kuzating.',
  },
  {
    icon: TrendingUp,
    title: 'Statistika',
    description: "Daromad, eng ko'p sotilgan taomlar, kunlik hisobotlar va boshqa ma'lumotlar.",
  },
  {
    icon: Shield,
    title: 'Menu Boshqaruvi',
    description: 'Ovqatlar, kategoriyalar, narxlar va rasmlarni oson boshqaring.',
  },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-orange-600 p-6 rounded-2xl shadow-lg">
              <UtensilsCrossed className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold text-slate-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            QR Restoran Tizimi
          </motion.h1>

          <motion.p
            className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Zamonaviy restoran boshqaruv tizimi. QR kod orqali buyurtma, real-time oshpaz paneli va professional admin dashboard.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-lg h-14 px-8 text-white font-semibold"
              onClick={() => onNavigate('menu')}
            >
              <QrCode className="w-5 h-5 mr-2" />
              Mijoz Menu
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg h-14 px-8 border-orange-300 hover:bg-orange-50 font-semibold"
              onClick={() => onNavigate('chef')}
            >
              <ChefHat className="w-5 h-5 mr-2" />
              Oshpaz Paneli
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg h-14 px-8 border-orange-300 hover:bg-orange-50 font-semibold"
              onClick={() => onNavigate('admin')}
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Admin Panel
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Asosiy Imkoniyatlar
          </h2>
          <p className="text-lg text-slate-600">
            Restoran biznesingizni keyingi bosqichga olib chiqing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow duration-200 bg-white border border-slate-200 h-full">
                <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            2026 QR Restoran Tizimi. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </div>
  );
}