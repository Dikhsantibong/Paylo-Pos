import { Head, Link, router, useForm } from '@inertiajs/react';
import { PlusCircle, Settings, Plus } from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    EmptyState,
    Field,
    PageHeader,
    Panel,
    RowActions,
    StatusBadge,
    SwitchRow,
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
import { number, rupiah } from '@/lib/format';
import type { ProductAddon } from '@/types';

type Props = {
    addons: ProductAddon[];
    featureEnabled: boolean;
};

/**
 * Add-on management — the paid extras a cashier can attach to any item.
 */
export default function ProductAddonsIndex({ addons, featureEnabled }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ProductAddon | null>(null);

    const form = useForm({ name: '', price: 0, is_active: true });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (addon: ProductAddon) => {
        form.clearErrors();
        setEditing(addon);
        form.setData({
            name: addon.name,
            price: addon.price,
            is_active: addon.is_active,
        });
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const onSuccess = () => {
            setOpen(false);
            form.reset();
        };

        if (editing) {
            form.put(`/product-addons/${editing.id}`, {
                onSuccess,
                preserveScroll: true,
            });
        } else {
            form.post('/product-addons', { onSuccess, preserveScroll: true });
        }
    };

    const destroy = (addon: ProductAddon) => {
        if (window.confirm(`Hapus add-on ${addon.name}?`)) {
            router.delete(`/product-addons/${addon.id}`, {
                preserveScroll: true,
            });
        }
    };

    const activeCount = addons.filter((a) => a.is_active).length;

    return (
        <>
            <Head title="Add-on" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={PlusCircle}
                    title="Add-on"
                    description="Tambahan berbayar seperti extra shot, susu oat, atau topping"
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="size-4" aria-hidden />
                            Tambah add-on
                        </Button>
                    }
                />

                {!featureEnabled && (
                    <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Settings
                                className="mt-0.5 size-4 shrink-0 text-warning"
                                aria-hidden
                            />
                            <div>
                                <p className="text-sm leading-5 font-semibold text-foreground">
                                    Fitur add-on sedang dimatikan
                                </p>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                    Add-on di bawah tetap tersimpan, tetapi
                                    tidak muncul di layar kasir sampai fiturnya
                                    dinyalakan kembali.
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="shrink-0 bg-card"
                        >
                            <Link href="/settings-pos">Buka pengaturan</Link>
                        </Button>
                    </div>
                )}

                <Panel
                    title="Daftar add-on"
                    description={`${number(addons.length)} add-on · ${number(activeCount)} aktif`}
                    padded={false}
                    footer="Add-on belum memiliki resep, jadi biayanya tidak ikut terhitung di HPP. Tetapkan harga jual di atas biaya bahannya."
                >
                    {addons.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th>Nama</Th>
                                    <Th numeric>Harga</Th>
                                    <Th>Status</Th>
                                    <Th className="w-24 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {addons.map((addon) => (
                                    <Tr key={addon.id}>
                                        <Td className="font-medium">
                                            {addon.name}
                                        </Td>
                                        <Td numeric>{rupiah(addon.price)}</Td>
                                        <Td>
                                            <StatusBadge
                                                tone={
                                                    addon.is_active
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            >
                                                {addon.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </StatusBadge>
                                        </Td>
                                        <Td>
                                            <RowActions
                                                label={addon.name}
                                                onEdit={() => openEdit(addon)}
                                                onDelete={() => destroy(addon)}
                                            />
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={PlusCircle}
                                title="Belum ada add-on"
                                description="Add-on memberi pelanggan pilihan tambahan dan menaikkan nilai rata-rata transaksi."
                                action={
                                    <Button size="sm" onClick={openCreate}>
                                        Tambah add-on
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
                            {editing ? `Ubah ${editing.name}` : 'Tambah add-on'}
                        </DialogTitle>
                        <DialogDescription>
                            Harga add-on ditambahkan ke harga item saat kasir
                            memilihnya.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <Field
                            label="Nama add-on"
                            htmlFor="addon-name"
                            error={form.errors.name}
                        >
                            <Input
                                id="addon-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Extra Shot"
                                required
                                autoFocus
                            />
                        </Field>

                        <Field
                            label="Harga (Rp)"
                            htmlFor="addon-price"
                            error={form.errors.price}
                        >
                            <CurrencyInput
                                id="addon-price"
                                value={form.data.price}
                                onChange={(val) =>
                                    form.setData(
                                        'price',
                                        Number(val) || 0,
                                    )
                                }
                                required
                                className="tabular"
                            />
                        </Field>

                        <div className="rounded-lg border px-4">
                            <SwitchRow
                                label="Tersedia di kasir"
                                help="Matikan untuk menyembunyikan add-on ini saja."
                                checked={form.data.is_active}
                                onChange={(v) => form.setData('is_active', v)}
                            />
                        </div>

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
                                      : 'Tambah add-on'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductAddonsIndex.layout = {
    breadcrumbs: [{ title: 'Add-on', href: '/product-addons' }],
};
