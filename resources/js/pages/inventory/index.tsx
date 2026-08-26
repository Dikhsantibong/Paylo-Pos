import { Head, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    PackagePlus,
    Pencil,
    Plus,
    Search,
    Warehouse,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    DataTable,
    EmptyState,
    KpiCard,
    PageHeader,
    Panel,
    StatusBadge,
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { number, quantity as formatQuantity, rupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Ingredient } from '@/types';

type Props = { ingredients: Ingredient[] };

const UNITS = [
    { value: 'gram', label: 'Gram' },
    { value: 'ml', label: 'Mililiter' },
    { value: 'pcs', label: 'Pcs' },
    { value: 'pack', label: 'Pack' },
];

export default function InventoryIndex({ ingredients }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Ingredient | null>(null);
    const [restocking, setRestocking] = useState<Ingredient | null>(null);
    const [deleting, setDeleting] = useState<Ingredient | null>(null);
    const [status, setStatus] = useState<'all' | 'low' | 'normal'>('all');
    const [query, setQuery] = useState('');

    const deleteForm = useForm({});

    const createForm = useForm({
        name: '',
        unit: 'gram',
        current_stock: 0,
        min_stock: 0,
        cost_per_unit: 0,
    });
    const editForm = useForm({
        name: '',
        unit: 'gram',
        min_stock: 0,
        cost_per_unit: 0,
    });
    const stockForm = useForm({ type: 'in', quantity: 0, notes: '' });

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return ingredients.filter((ingredient) => {
            if (status === 'low' && !ingredient.is_low_stock) {
                return false;
            }

            if (status === 'normal' && ingredient.is_low_stock) {
                return false;
            }

            if (!needle) {
                return true;
            }

            return ingredient.name.toLowerCase().includes(needle);
        });
    }, [ingredients, status, query]);

    const stats = useMemo(() => {
        const low = ingredients.filter((i) => i.is_low_stock);

        return {
            total: ingredients.length,
            low: low.length,
            out: ingredients.filter((i) => i.current_stock <= 0).length,
            value: ingredients.reduce(
                (sum, i) => sum + i.current_stock * i.cost_per_unit,
                0,
            ),
        };
    }, [ingredients]);

    const openEdit = (ingredient: Ingredient) => {
        setEditing(ingredient);
        editForm.setData({
            name: ingredient.name,
            unit: ingredient.unit,
            min_stock: ingredient.min_stock,
            cost_per_unit: ingredient.cost_per_unit,
        });
    };

    const openRestock = (ingredient: Ingredient) => {
        setRestocking(ingredient);
        stockForm.setData({ type: 'in', quantity: 0, notes: '' });
        stockForm.clearErrors();
    };

    return (
        <>
            <Head title="Inventori" />

            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={Warehouse}
                    title="Inventori"
                    description="Stok bahan baku dan harga yang menjadi dasar perhitungan HPP"
                    actions={
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="size-4" aria-hidden />
                            Tambah bahan
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Jenis bahan"
                        value={number(stats.total)}
                        icon={Warehouse}
                        accent="brand"
                    />
                    <KpiCard
                        label="Stok menipis"
                        value={number(stats.low)}
                        hint="Berada di bawah batas minimum"
                        icon={AlertTriangle}
                        accent={stats.low > 0 ? 'warning' : 'neutral'}
                    />
                    <KpiCard
                        label="Stok habis"
                        value={number(stats.out)}
                        hint="Perlu restock segera"
                    />
                    <KpiCard
                        label="Nilai persediaan"
                        value={rupiah(Math.round(stats.value))}
                        hint="Stok saat ini × harga satuan"
                    />
                </div>

                <Panel
                    title="Daftar bahan"
                    description={`${number(visible.length)} dari ${number(ingredients.length)} bahan`}
                    padded={false}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Cari bahan…"
                                    aria-label="Cari bahan"
                                    className="h-9 w-44 pl-8"
                                />
                            </div>

                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setStatus(value as typeof status)
                                }
                            >
                                <SelectTrigger className="h-9 w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua bahan
                                    </SelectItem>
                                    <SelectItem value="low">
                                        Stok menipis
                                    </SelectItem>
                                    <SelectItem value="normal">
                                        Stok aman
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                >
                    {visible.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th>Bahan</Th>
                                    <Th numeric>Stok</Th>
                                    <Th numeric>Minimum</Th>
                                    <Th className="w-32">Level</Th>
                                    <Th>Digunakan di</Th>
                                    <Th numeric>Harga / satuan</Th>
                                    <Th numeric>Nilai stok</Th>
                                    <Th className="w-40 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((ingredient) => {
                                    const ratio =
                                        ingredient.min_stock > 0
                                            ? Math.min(
                                                  100,
                                                  (ingredient.current_stock /
                                                      (ingredient.min_stock *
                                                          3)) *
                                                      100,
                                              )
                                            : 100;

                                    return (
                                        <Tr key={ingredient.id}>
                                            <Td>
                                                <span className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {ingredient.name}
                                                    </span>
                                                    {ingredient.is_low_stock && (
                                                        <StatusBadge
                                                            tone={
                                                                ingredient.current_stock <=
                                                                0
                                                                    ? 'danger'
                                                                    : 'warning'
                                                            }
                                                        >
                                                            {ingredient.current_stock <=
                                                            0
                                                                ? 'Habis'
                                                                : 'Menipis'}
                                                        </StatusBadge>
                                                    )}
                                                </span>
                                            </Td>
                                            <Td
                                                numeric
                                                className={cn(
                                                    'font-semibold',
                                                    ingredient.is_low_stock &&
                                                        'text-destructive',
                                                )}
                                            >
                                                {formatQuantity(
                                                    ingredient.current_stock,
                                                    ingredient.unit,
                                                )}
                                            </Td>
                                            <Td numeric muted>
                                                {number(ingredient.min_stock)}
                                            </Td>
                                            <Td>
                                                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <span
                                                        className={cn(
                                                            'block h-full rounded-full',
                                                            ingredient.is_low_stock
                                                                ? 'bg-destructive'
                                                                : 'bg-success',
                                                        )}
                                                        style={{
                                                            width: `${Math.max(2, ratio)}%`,
                                                        }}
                                                    />
                                                </span>
                                            </Td>
                                            <Td>
                                                {ingredient.used_in?.length ? (
                                                    <div className="flex max-w-[200px] flex-wrap gap-1">
                                                        {ingredient.used_in.map((productName) => (
                                                            <span
                                                                key={productName}
                                                                className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                                                            >
                                                                {productName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </Td>
                                            <Td numeric>
                                                {rupiah(
                                                    ingredient.cost_per_unit,
                                                )}
                                            </Td>
                                            <Td numeric muted>
                                                {rupiah(
                                                    Math.round(
                                                        ingredient.current_stock *
                                                            ingredient.cost_per_unit,
                                                    ),
                                                )}
                                            </Td>
                                            <Td>
                                                <span className="flex justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openRestock(
                                                                ingredient,
                                                            )
                                                        }
                                                    >
                                                        <PackagePlus
                                                            className="size-4"
                                                            aria-hidden
                                                        />
                                                        Stok
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEdit(ingredient)
                                                        }
                                                        aria-label={`Ubah ${ingredient.name}`}
                                                    >
                                                        <Pencil
                                                            className="size-4"
                                                            aria-hidden
                                                        />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            setDeleting(ingredient)
                                                        }
                                                        aria-label={`Hapus ${ingredient.name}`}
                                                    >
                                                        <Trash2
                                                            className="size-4"
                                                            aria-hidden
                                                        />
                                                    </Button>
                                                </span>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={Warehouse}
                                title={
                                    ingredients.length === 0
                                        ? 'Belum ada bahan baku'
                                        : 'Tidak ada bahan yang cocok'
                                }
                                description={
                                    ingredients.length === 0
                                        ? 'Tambahkan bahan baku beserta harganya agar HPP setiap menu bisa dihitung otomatis.'
                                        : 'Ubah kata kunci atau pilih status stok yang lain.'
                                }
                                action={
                                    ingredients.length === 0 ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setCreateOpen(true)}
                                        >
                                            Tambah bahan
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    )}
                </Panel>
            </div>

            {/* Create */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah bahan</DialogTitle>
                        <DialogDescription>
                            Harga per satuan dipakai untuk menghitung HPP setiap
                            produk yang memakai bahan ini.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            createForm.post('/inventory', {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setCreateOpen(false);
                                    createForm.reset();
                                },
                            });
                        }}
                        className="flex flex-col gap-4"
                    >
                        <Field
                            label="Nama bahan"
                            error={createForm.errors.name}
                        >
                            <Input
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData('name', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field label="Satuan" error={createForm.errors.unit}>
                            <Select
                                value={createForm.data.unit}
                                onValueChange={(v) =>
                                    createForm.setData('unit', v)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map((unit) => (
                                        <SelectItem
                                            key={unit.value}
                                            value={unit.value}
                                        >
                                            {unit.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Stok awal"
                                error={createForm.errors.current_stock}
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={createForm.data.current_stock}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'current_stock',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="tabular"
                                />
                            </Field>

                            <Field
                                label="Stok minimum"
                                help="Peringatan muncul saat stok mencapai angka ini."
                                error={createForm.errors.min_stock}
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={createForm.data.min_stock}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'min_stock',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="tabular"
                                />
                            </Field>
                        </div>

                        <Field
                            label="Harga per satuan (Rp)"
                            error={createForm.errors.cost_per_unit}
                        >
                            <CurrencyInput
                                value={createForm.data.cost_per_unit}
                                onChange={(val) =>
                                    createForm.setData(
                                        'cost_per_unit',
                                        Number(val),
                                    )
                                }
                                className="tabular"
                            />
                        </Field>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                {createForm.processing
                                    ? 'Menyimpan…'
                                    : 'Tambah bahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit */}
            <Dialog
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ubah {editing?.name}</DialogTitle>
                        <DialogDescription>
                            Stok tidak diubah dari sini — gunakan tombol Stok
                            untuk menambah persediaan.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (!editing) {
                                return;
                            }

                            editForm.put(`/inventory/${editing.id}`, {
                                preserveScroll: true,
                                onSuccess: () => setEditing(null),
                            });
                        }}
                        className="flex flex-col gap-4"
                    >
                        <Field label="Nama bahan" error={editForm.errors.name}>
                            <Input
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field label="Satuan" error={editForm.errors.unit}>
                            <Select
                                value={editForm.data.unit}
                                onValueChange={(v) =>
                                    editForm.setData('unit', v)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map((unit) => (
                                        <SelectItem
                                            key={unit.value}
                                            value={unit.value}
                                        >
                                            {unit.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field
                            label="Stok minimum"
                            error={editForm.errors.min_stock}
                        >
                            <Input
                                type="number"
                                step="0.01"
                                value={editForm.data.min_stock}
                                onChange={(e) =>
                                    editForm.setData(
                                        'min_stock',
                                        Number(e.target.value),
                                    )
                                }
                                className="tabular"
                            />
                        </Field>

                        <Field
                            label="Harga per satuan (Rp)"
                            error={editForm.errors.cost_per_unit}
                        >
                            <CurrencyInput
                                value={editForm.data.cost_per_unit}
                                onChange={(val) =>
                                    editForm.setData(
                                        'cost_per_unit',
                                        Number(val),
                                    )
                                }
                                className="tabular"
                            />
                        </Field>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditing(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                {editForm.processing
                                    ? 'Menyimpan…'
                                    : 'Simpan perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Adjust Stock */}
            <Dialog
                open={restocking !== null}
                onOpenChange={(open) => !open && setRestocking(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Penyesuaian stok {restocking?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Stok saat ini{' '}
                            {restocking
                                ? formatQuantity(
                                      restocking.current_stock,
                                      restocking.unit,
                                  )
                                : '—'}
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (!restocking) {
                                return;
                            }

                            stockForm.post(
                                `/inventory/${restocking.id}/adjust-stock`,
                                {
                                    preserveScroll: true,
                                    onSuccess: () => setRestocking(null),
                                },
                            );
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Jenis"
                                error={stockForm.errors.type}
                            >
                                <Select
                                    value={stockForm.data.type}
                                    onValueChange={(v) =>
                                        stockForm.setData('type', v)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in">Barang Masuk</SelectItem>
                                        <SelectItem value="out">Barang Keluar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field
                                label={`Jumlah (${restocking?.unit ?? ''})`}
                                error={stockForm.errors.quantity}
                            >
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={stockForm.data.quantity || ''}
                                    onChange={(e) =>
                                        stockForm.setData(
                                            'quantity',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    autoFocus
                                    className="tabular"
                                />
                            </Field>
                        </div>

                        <Field
                            label="Catatan"
                            help={stockForm.data.type === 'in' ? "Misalnya nomor nota atau nama pemasok." : "Misalnya tumpah, basi, atau terbuang."}
                            error={stockForm.errors.notes}
                        >
                            <Textarea
                                value={stockForm.data.notes}
                                onChange={(e) =>
                                    stockForm.setData('notes', e.target.value)
                                }
                                rows={2}
                                className="resize-none"
                            />
                        </Field>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRestocking(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={stockForm.processing}
                            >
                                {stockForm.processing
                                    ? 'Menyimpan…'
                                    : 'Simpan stok'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus bahan baku?</DialogTitle>
                        <DialogDescription>
                            Bahan baku <strong className="text-foreground">{deleting?.name}</strong> akan dihapus permanen. 
                            Bahan ini tidak bisa dihapus jika sedang digunakan dalam resep.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteForm.processing}
                            onClick={() => {
                                deleteForm.delete(`/inventory/${deleting?.id}`, {
                                    preserveScroll: true,
                                    onSuccess: () => setDeleting(null),
                                });
                            }}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Field({
    label,
    help,
    error,
    children,
}: {
    label: string;
    help?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-sm leading-5 font-medium">{label}</Label>
            {children}
            {error ? (
                <p className="text-xs leading-4 text-destructive">{error}</p>
            ) : help ? (
                <p className="text-xs leading-4 text-muted-foreground">
                    {help}
                </p>
            ) : null}
        </div>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [{ title: 'Inventori', href: '/inventory' }],
};
