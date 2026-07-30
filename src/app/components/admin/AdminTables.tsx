import { useState } from 'react';
import { Table } from '../../../types';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { motion } from 'motion/react';
import { Download, Plus, QrCode as QrCodeIcon, Table as TableIcon, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface AdminTablesProps {
  tables: Table[];
  onRefresh: (silent?: boolean) => Promise<void> | void;
}

export function AdminTables({ tables, onRefresh }: AdminTablesProps) {
  const [newTableNumber, setNewTableNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [removingTableId, setRemovingTableId] = useState<number | null>(null);

  const handleAddTable = async () => {
    const number = parseInt(newTableNumber, 10);
    if (!number || number <= 0) {
      toast.error("Iltimos, to'g'ri stol raqamini kiriting");
      return;
    }

    try {
      await api.createTable({ number });
      setNewTableNumber('');
      toast.success(`Stol #${number} qo'shildi`);
      await Promise.resolve(onRefresh(true));
    } catch (error: any) {
      toast.error(error.message || 'Bu stol raqami mavjud yoki tizim xatosi');
    }
  };

  const handleDeleteTable = async (table: Table) => {
    const accepted = window.confirm(
      `Stol #${table.number} o'chirilsinmi? Shu stolga tegishli orderlar ham o'chadi.`
    );
    if (!accepted) return;

    try {
      setRemovingTableId(table.id);
      const response = await api.deleteTable(table.id);
      toast.success(`Stol #${table.number} o'chirildi. ${response.removedOrders || 0} ta order tozalandi.`);
      await Promise.resolve(onRefresh(true));
    } catch (error: any) {
      toast.error(error.message || "Stolni o'chirib bo'lmadi");
    } finally {
      setRemovingTableId(null);
    }
  };

  const generateQRCode = async (tableNumber: number) => {
    try {
      const table = tables.find((item) => item.number === tableNumber);
      const url = table?.qrCode || `${window.location.origin}/menu?table=${tableNumber}`;
      const qrUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      setQrCodeUrl(qrUrl);
      setSelectedTable(tableNumber);
    } catch (_error) {
      toast.error('QR kod yaratishda xatolik');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedTable) return;

    const link = document.createElement('a');
    link.download = `stol-${selectedTable}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success('QR kod yuklab olindi');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-lg">
          <h3 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-xl font-bold text-transparent">
            Yangi stol qo'shish
          </h3>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              placeholder="Stol raqami"
              value={newTableNumber}
              onChange={(event) => setNewTableNumber(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleAddTable()}
              className="border-2 border-orange-200 focus:border-orange-400"
            />
            <Button
              onClick={handleAddTable}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Qo'shish
            </Button>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {tables.map((table, index) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className="border-0 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 shadow-lg">
                  <TableIcon className="h-10 w-10 text-orange-600" />
                </div>

                <div>
                  <h3 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
                    Stol #{table.number}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(table.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => generateQRCode(table.number)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700"
                      >
                        <QrCodeIcon className="mr-2 h-4 w-4" />
                        QR kod
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-orange-50/30">
                      <DialogHeader>
                        <DialogTitle className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl text-transparent">
                          Stol #{selectedTable} QR kodi
                        </DialogTitle>
                        <DialogDescription>
                          Mijoz shu QR orqali menuga kiradi va buyurtma beradi
                        </DialogDescription>
                      </DialogHeader>
                      {qrCodeUrl && (
                        <motion.div
                          className="space-y-4"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <div className="flex justify-center rounded-xl bg-white p-6 shadow-xl">
                            <img
                              src={qrCodeUrl}
                              alt="QR Code"
                              className="h-72 w-72 rounded-lg"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <Button
                            onClick={downloadQRCode}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            QR kodni yuklab olish
                          </Button>
                        </motion.div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={() => handleDeleteTable(table)}
                    disabled={removingTableId === table.id}
                    className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {removingTableId === table.id ? "O'chirilmoqda..." : "O'chirish"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
