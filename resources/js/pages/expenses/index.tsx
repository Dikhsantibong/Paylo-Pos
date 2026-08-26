import { Head, router, useForm } from '@inertiajs/react';
import { PlusCircle, Receipt, ArrowDownToLine } from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    EmptyState,
    Field,
    PageHeader,
    Panel,
    RowActions,
    Td,
    Th,
    Tr,
} from '@/components/paylo';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { rupiah } from '@/lib/format';
import type { Expense } from '@/types';

type Props = {
    expenses: Expense[];
};

export default function ExpensesIndex({ expenses }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    const form = useForm({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: '',
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setOpen(true);
    };

    const openEdit = (expense: Expense) => {
        setEditing(expense);
        form.setData({
            date: expense.date,
            amount: Number(expense.amount),
            notes: expense.notes ?? '',
        });
        form.clearErrors();
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (editing) {
            form.put(`/expenses/${editing.id}`, {
                onSuccess: () => setOpen(false),
            });
        } else {
            form.post('/expenses', {
                onSuccess: () => setOpen(false),
            });
        }
    };

    const destroy = (expense: Expense) => {
        if (!confirm(`Hapus pengeluaran senilai ${rupiah(Number(expense.amount))}?`)) {
            return;
        }

        router.delete(`/expenses/${expense.id}`);
    };

    const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <>
            <Head title="Pengeluaran" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={Receipt}
                    title="Pengeluaran"
                    description="Catat pengeluaran toko seperti belanja bahan, operasional, atau tagihan."
                    actions={
                        <Button onClick={openCreate}>
                            <PlusCircle className="size-4" aria-hidden />
                            Catat pengeluaran
                        </Button>
                    }
                />

                <Panel>
                    {expenses.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th className="w-24">Tanggal</Th>
                                    <Th>Catatan</Th>
                                    <Th numeric>Jumlah</Th>
                                    <Th className="w-24 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <Tr key={expense.id}>
                                        <Td className="font-mono text-sm">
                                            {expense.date}
                                        </Td>
                                        <Td>
                                            {expense.notes || <span className="text-muted-foreground">—</span>}
                                        </Td>
                                        <Td numeric className="font-medium text-destructive">
                                            {rupiah(Number(expense.amount))}
                                        </Td>
                                        <Td>
                                            <RowActions
                                                label={`Pengeluaran ${expense.date}`}
                                                onEdit={() => openEdit(expense)}
                                                onDelete={() => destroy(expense)}
                                            />
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={ArrowDownToLine}
                                title="Belum ada pengeluaran"
                                description="Seluruh pengeluaran operasional dan harian dicatat di sini."
                                action={
                                    <Button size="sm" onClick={openCreate}>
                                        Catat pengeluaran
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </Panel>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Ubah pengeluaran' : 'Catat pengeluaran'}
                        </DialogTitle>
                        <DialogDescription>
                            Pengeluaran akan memotong laba bersih pada laporan sesuai tanggal yang dipilih.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <Field
                            label="Tanggal"
                            htmlFor="expense-date"
                            error={form.errors.date}
                        >
                            <Input
                                id="expense-date"
                                type="date"
                                value={form.data.date}
                                onChange={(e) =>
                                    form.setData('date', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field
                            label="Jumlah pengeluaran (Rp)"
                            htmlFor="expense-amount"
                            error={form.errors.amount}
                        >
                            <CurrencyInput
                                id="expense-amount"
                                value={form.data.amount}
                                onChange={(val) =>
                                    form.setData('amount', Number(val) || 0)
                                }
                                required
                                className="tabular"
                            />
                        </Field>

                        <Field
                            label="Catatan"
                            htmlFor="expense-notes"
                            error={form.errors.notes}
                            help="Opsional. Contoh: Beli es batu, tagihan listrik, dll."
                        >
                            <Textarea
                                id="expense-notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                rows={2}
                                className="resize-none"
                            />
                        </Field>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Menyimpan…'
                                    : editing
                                      ? 'Simpan perubahan'
                                      : 'Catat pengeluaran'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ExpensesIndex.layout = {
    breadcrumbs: [{ title: 'Pengeluaran', href: '/expenses' }],
};
