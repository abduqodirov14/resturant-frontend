import { motion } from 'motion/react';
import { Card } from '../ui/card';

interface AdminStatsProps {
  stats: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
  }[];
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
        >
          <Card className="p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-0.5">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}