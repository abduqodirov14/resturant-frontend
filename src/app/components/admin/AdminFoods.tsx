import { useEffect, useMemo, useState } from 'react';
import { Food } from '../../../types';
import { api, DEFAULT_FOOD_IMAGE } from '../../lib/api';
import { resolveImageUrl } from '../../lib/image';
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
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { AnimatePresence, motion } from 'motion/react';
import { Archive, PencilLine, Plus, RefreshCcw, Save, Tag } from 'lucide-react';
import { toast } from 'sonner';

type CategoryOption = {
  id: number;
  name: string;
};

type FoodFormState = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
  imageFile: File | null;
};

interface AdminFoodsProps {
  foods: Food[];
  categories: CategoryOption[];
  onRefresh: (silent?: boolean) => Promise<void> | void;
}

const EMPTY_FORM: FoodFormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  isAvailable: true,
  imageFile: null,
};

const mapFood = (food: any): Food => ({
  ...food,
  price: Number(food.price || 0),
  nameUz: food.name,
  descriptionUz: food.description || '',
  image: resolveImageUrl(food.imageUrl, DEFAULT_FOOD_IMAGE),
  categoryUz: food.category?.name || food.categoryName || '',
  categoryName: food.category?.name || food.categoryName || '',
  available: food.isAvailable ?? true,
});

export function AdminFoods({ foods, categories, onRefresh }: AdminFoodsProps) {
  const [archivedFoods, setArchivedFoods] = useState<Food[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [form, setForm] = useState<FoodFormState>(EMPTY_FORM);
  const [activeView, setActiveView] = useState<'active' | 'archived'>('active');
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [processingFoodId, setProcessingFoodId] = useState<number | null>(null);
  const [loadingArchived, setLoadingArchived] = useState(true);

  const activeFoods = useMemo(
    () =>
      [...foods]
        .filter((food) => food.available !== false)
        .sort((a, b) => (a.nameUz || a.name).localeCompare(b.nameUz || b.name)),
    [foods]
  );

  const loadArchivedFoods = async () => {
    try {
      setLoadingArchived(true);
      const response = await api.deletedFoods();
      setArchivedFoods((response.foods || []).map((food: any) => mapFood(food)));
    } catch (error: any) {
      toast.error(error.message || "Arxivdagi taomlarni yuklab bo'lmadi");
    } finally {
      setLoadingArchived(false);
    }
  };

  useEffect(() => {
    loadArchivedFoods();
  }, []);

  const resetForm = (food?: Food | null) => {
    if (!food) {
      setEditingFood(null);
      setForm(EMPTY_FORM);
      return;
    }

    setEditingFood(food);
    setForm({
      name: food.nameUz || food.name || '',
      description: food.descriptionUz || food.description || '',
      price: String(Number(food.price || 0)),
      categoryId: String(food.categoryId || categories.find((item) => item.name === food.categoryUz)?.id || ''),
      isAvailable: food.available !== false,
      imageFile: null,
    });
  };

  const openCreateDialog = () => {
    resetForm(null);
    setDialogOpen(true);
  };

  const openEditDialog = (food: Food) => {
    resetForm(food);
    setDialogOpen(true);
  };

  const refreshEverything = async () => {
    await Promise.all([Promise.resolve(onRefresh(true)), loadArchivedFoods()]);
  };

  const handleSaveFood = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error("Nom, narx va kategoriya majburiy");
      return;
    }

    try {
      setIsSavingFood(true);

      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('description', form.description.trim());
      payload.append('price', form.price);
      payload.append('categoryId', form.categoryId);
      payload.append('isAvailable', String(form.isAvailable));
      if (form.imageFile) payload.append('image', form.imageFile);

      if (editingFood) {
        await api.updateFood(editingFood.id, payload);
        toast.success(`${editingFood.nameUz || editingFood.name} yangilandi`);
      } else {
        await api.createFood(payload);
        toast.success("Yangi taom qo'shildi");
      }

      setDialogOpen(false);
      resetForm(null);
      await refreshEverything();
    } catch (error: any) {
      toast.error(error.message || "Taomni saqlab bo'lmadi");
    } finally {
      setIsSavingFood(false);
    }
  };

  const handleArchiveFood = async (food: Food) => {
    const accepted = window.confirm(
      `${food.nameUz || food.name} ni aktiv menyudan olib tashlab, arxivga yuboraymi?`
    );
    if (!accepted) return;

    try {
      setProcessingFoodId(food.id);
      await api.deleteFood(food.id);
      toast.success(`${food.nameUz || food.name} arxivga olindi`);
      await refreshEverything();
    } catch (error: any) {
      toast.error(error.message || "Taomni arxivga olib bo'lmadi");
    } finally {
      setProcessingFoodId(null);
    }
  };

  const handleRestoreFood = async (food: Food) => {
    try {
      setProcessingFoodId(food.id);
      await api.restoreFood(food.id);
      toast.success(`${food.nameUz || food.name} qayta tiklandi`);
      await refreshEverything();
    } catch (error: any) {
      toast.error(error.message || "Taomni tiklab bo'lmadi");
    } finally {
      setProcessingFoodId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Kategoriya nomini kiriting");
      return;
    }

    try {
      setIsSavingCategory(true);
      await api.createCategory({ name: categoryName.trim() });
      setCategoryName('');
      toast.success('Kategoriya qo\'shildi');
      await Promise.resolve(onRefresh(true));
    } catch (error: any) {
      toast.error(error.message || "Kategoriya yaratilmadi");
    } finally {
      setIsSavingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Menu boshqaruvi</h3>
              <p className="text-slate-500">
                Taom qo'shish, tahrirlash, arxivlash va restore shu yerda ishlaydi
              </p>
            </div>

            <Button
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yangi taom
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 p-4">
              <p className="text-sm text-slate-500">Aktiv taomlar</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{activeFoods.length}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
              <p className="text-sm text-slate-500">Arxivdagilar</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{archivedFoods.length}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
              <p className="text-sm text-slate-500">Kategoriya</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{categories.length}</p>
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Kategoriya qo'shish</h3>
              <p className="text-sm text-slate-500">Masalan: Combo, Nonushta, Desert</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Yangi kategoriya nomi"
              className="border-orange-200"
            />
            <Button
              onClick={handleCreateCategory}
              disabled={isSavingCategory}
              className="bg-gradient-to-r from-slate-900 to-slate-700 text-white"
            >
              {isSavingCategory ? 'Saqlanmoqda...' : "Kategoriya qo'shish"}
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant={activeView === 'active' ? 'default' : 'outline'}
          onClick={() => setActiveView('active')}
          className={activeView === 'active' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'border-orange-200 bg-white'}
        >
          Aktiv menu
        </Button>
        <Button
          variant={activeView === 'archived' ? 'default' : 'outline'}
          onClick={() => setActiveView('archived')}
          className={activeView === 'archived' ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white' : 'border-slate-200 bg-white'}
        >
          Arxiv va restore
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'active' ? (
          <motion.div
            key="active-foods"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {activeFoods.map((food, index) => (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <Card className="overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={food.image}
                      alt={food.nameUz || food.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <Badge
                      className={`absolute right-3 top-3 shadow-lg ${
                        food.available ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'
                      }`}
                    >
                      {food.available ? 'Mavjud' : "Yo'q"}
                    </Badge>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{food.nameUz || food.name}</h4>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {food.descriptionUz || food.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        {food.categoryUz || 'Kategoriya yo\'q'}
                      </Badge>
                      <p className="text-lg font-bold text-orange-600">
                        {Number(food.price || 0).toLocaleString()} so'm
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => openEditDialog(food)}
                        className="border-orange-200 hover:bg-orange-50"
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Tahrirlash
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleArchiveFood(food)}
                        disabled={processingFoodId === food.id}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Arxivlash
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="archived-foods"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {loadingArchived ? (
              <Card className="border-0 bg-white p-12 text-center shadow-lg">
                <p className="text-slate-500">Arxiv yuklanmoqda...</p>
              </Card>
            ) : archivedFoods.length === 0 ? (
              <Card className="border-0 bg-white p-12 text-center shadow-lg">
                <p className="text-slate-500">Hozircha arxivdagi taomlar yo'q.</p>
              </Card>
            ) : (
              archivedFoods.map((food) => (
                <Card key={food.id} className="border-0 bg-white p-4 shadow-lg">
                  <div className="grid gap-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                    <img
                      src={food.image}
                      alt={food.nameUz || food.name}
                      className="h-[120px] w-full rounded-2xl object-cover md:w-[120px]"
                      loading="lazy"
                      decoding="async"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900">{food.nameUz || food.name}</h4>
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {food.categoryUz || 'Arxiv'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {food.descriptionUz || food.description || 'Izoh yo\'q'}
                      </p>
                      <p className="mt-3 font-bold text-orange-600">
                        {Number(food.price || 0).toLocaleString()} so'm
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => handleRestoreFood(food)}
                        disabled={processingFoodId === food.id}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openEditDialog(food)}
                        className="border-orange-200 hover:bg-orange-50"
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Tahrirlab qaytarish
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingFood ? 'Taomni tahrirlash' : "Yangi taom qo'shish"}
            </DialogTitle>
            <DialogDescription>
              Menu ma'lumotlari shu formadan yangilanadi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Taom nomi</p>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Masalan: Tovuq set"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Narxi</p>
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="32000"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Kategoriya</p>
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                >
                  <option value="">Kategoriyani tanlang</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Rasm</p>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
                <p className="mt-2 text-xs text-slate-500">
                  Rasm tanlanmasa eski rasm saqlanadi
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isAvailable: event.target.checked }))
                  }
                />
                <div>
                  <p className="font-medium text-slate-900">Menyuda ko'rinsin</p>
                  <p className="text-xs text-slate-500">
                    O'chirib qo'ysangiz taom aktiv menyuda ko'rinmaydi
                  </p>
                </div>
              </label>

              {editingFood && (
                <div className="overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={editingFood.image}
                    alt={editingFood.nameUz || editingFood.name}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Tavsif</p>
            <Textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Taom haqida qisqa izoh"
              className="min-h-[120px]"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveFood}
              disabled={isSavingFood}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingFood ? 'Saqlanmoqda...' : editingFood ? 'Saqlash' : "Taom qo'shish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
