import { motion } from 'motion/react';

export function FoodCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      <motion.div
        className="aspect-[4/3] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <motion.div
            className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-md"
            animate={{
              backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: '200% 100%',
              width: '70%',
            }}
          />
          <motion.div
            className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-md"
            animate={{
              backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: '200% 100%',
              width: '90%',
            }}
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <motion.div
            className="h-8 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-md"
            animate={{
              backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: '200% 100%',
            }}
          />
          <motion.div
            className="h-9 w-24 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-md"
            animate={{
              backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function MenuLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </div>
  );
}
