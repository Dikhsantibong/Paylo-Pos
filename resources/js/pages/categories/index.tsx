import { Head, Link, router, useForm } from '@inertiajs/react';
import { Layers, Package, Plus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { number } from '@/lib/format';

type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    products_count: number;
    active_products_count: number;
};

type Props = { categories: CategoryRow[] };

/**
 * Category management.
 *
 * Categories are the chip row at the top of the cashier screen, so the two
 * things that matter here are the order they appear in and whether they are
 * shown at all.
 */
export default function CategoriesIndex({ categories }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryRow | null>(null);

    const form = useForm({
        name: '',
        sort_order: categories.length + 1,
        is_active: true,
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        form.setData('sort_order', categories.length + 1);
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (category: CategoryRow) => {
        form.clearErrors();
        setEditing(category);
        form.setData({
            name: category.name,
            sort_order: category.sort_order,
            is_active: category.is_active,
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
            form.put(`/categories/${editing.id}`, {
                onSuccess,
                preserveScroll: true,
            });
        } else {
            form.post('/categories', { onSuccess, preserveScroll: true });
        }
    };

    const destroy = (category: CategoryRow) => {
        if (window.confirm(`Hapus kategori ${category.name}?`)) {
            router.delete(`/categories/${category.id}`, {
                preserveScroll: true,
            });
        }
    };

    const totalProducts = categories.reduce(
        (sum, c) => sum + c.products_count,
        0,
    );

    return (
        <>
            <Head title="Kategori" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={Layers}
                    title="Kategori"
                    description="Pengelompokan menu dan urutannya di layar kasir"
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <Link href="/products">
                                    <Package className="size-4" aria-hidden />
                                    Kelola produk
                                </Link>
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="size-4" aria-hidden />
                                Tambah kategori
                            </Button>
                        </>
                    }
                />

                <Panel
                    title="Daftar kategori"
                    description={`${number(categories.length)} kategori · ${number(totalProducts)} produk`}
                    padded={false}
                    footer="Kategori dengan urutan lebih kecil tampil lebih dulu di layar kasir. Kategori nonaktif disembunyikan dari kasir tanpa menghapus produknya."
                >
                    {categories.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th numeric className="w-20">
                                        Urutan
                                    </Th>
                                    <Th>Nama</Th>
                                    <Th>Slug</Th>
                                    <Th numeric>Produk</Th>
                                    <Th numeric>Aktif</Th>
                                    <Th>Status</Th>
                                    <Th className="w-24 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <Tr key={category.id}>
                                        <Td numeric muted>
                                            {category.sort_order}
                                        </Td>
                                        <Td className="font-medium">
                                            {category.name}
                                        </Td>
                                        <Td muted className="font-mono text-xs">
                                            {category.slug}
                                        </Td>
                                        <Td numeric>
                                            {number(category.products_count)}
                                        </Td>
                                        <Td numeric muted>
                                            {number(
                                                category.active_products_count,
                                            )}
                                        </Td>
                                        <Td>
                                            <StatusBadge
                                                tone={
                                                    category.is_active
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            >
                                                {category.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </StatusBadge>
                                        </Td>
                                        <Td>
                                            <RowActions
                                                label={category.name}
                                                onEdit={() =>
                                                    openEdit(category)
                                                }
                                                onDelete={
                                                    category.products_count ===
                                                    0
                                                        ? () =>
                                                              destroy(category)
                                                        : undefined
                                                }
                                            />
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={Layers}
                                title="Belum ada kategori"
                                description="Kategori mengelompokkan menu agar kasir cepat menemukan produk yang dicari."
                                action={
                                    <Button size="sm" onClick={openCreate}>
                                        Tambah kategori
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
                            {editing
                                ? `Ubah ${editing.name}`
                                : 'Tambah kategori'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Slug tidak berubah saat nama diganti, sehingga data lama tetap tertaut.'
                                : 'Slug dibuat otomatis dari nama kategori.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <Field
                            label="Nama kategori"
                            htmlFor="category-name"
                            error={form.errors.name}
                        >
                            <Input
                                id="category-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Coffee"
                                required
                                autoFocus
                            />
                        </Field>

                        <Field
                            label="Urutan tampil"
                            htmlFor="category-order"
                            help="Angka lebih kecil tampil lebih dulu."
                            error={form.errors.sort_order}
                        >
                            <Input
                                id="category-order"
                                type="number"
                                min={0}
                                value={form.data.sort_order}
                                onChange={(e) =>
                                    form.setData(
                                        'sort_order',
                                        Number(e.target.value) || 0,
                                    )
                                }
                                className="tabular w-32"
                            />
                        </Field>

                        <div className="rounded-lg border px-4">
                            <SwitchRow
                                label="Tampilkan di kasir"
                                help="Matikan untuk menyembunyikan kategori beserta produknya dari layar kasir."
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
                                      : 'Tambah kategori'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [{ title: 'Kategori', href: '/categories' }],
};
