import { Head, Link, router, useForm } from '@inertiajs/react';
import { Layers, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { number, percent, rupiah } from '@/lib/format';
import type { Category, ProductVariant } from '@/types';

type ProductRow = {
    id: number;
    category_id: number;
    category: { id: number; name: string } | null;
    name: string;
    description: string | null;
    base_price: number;
    is_active: boolean;
    has_variants: boolean;
    has_temperature: boolean;
    has_sugar_level: boolean;
    variants: ProductVariant[];
    hpp: number;
    margin_percent: number;
    has_recipe: boolean;
};

type Props = {
    products: ProductRow[];
    categories: Category[];
};

/**
 * Product catalogue.
 *
 * Categories and add-ons used to live here as tabs; each now has its own screen
 * so this page is only ever about menu items.
 */
export default function ProductsIndex({ products, categories }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ProductRow | null>(null);
    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState('all');

    const form = useForm({
        category_id: '',
        name: '',
        description: '',
        base_price: 0,
        is_active: true,
        has_variants: false,
        has_temperature: true,
        has_sugar_level: true,
        variants: [] as {
            id?: number;
            name: string;
            price_adjustment: number;
        }[],
    });

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return products.filter((product) => {
            if (
                categoryId !== 'all' &&
                String(product.category_id) !== categoryId
            ) {
                return false;
            }

            return !needle || product.name.toLowerCase().includes(needle);
        });
    }, [products, query, categoryId]);

    const withoutRecipe = products.filter((p) => !p.has_recipe).length;

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        form.setData(
            'category_id',
            categories[0] ? String(categories[0].id) : '',
        );
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (product: ProductRow) => {
        form.clearErrors();
        setEditing(product);
        form.setData({
            category_id: String(product.category_id),
            name: product.name,
            description: product.description ?? '',
            base_price: product.base_price,
            is_active: product.is_active,
            has_variants: product.has_variants,
            has_temperature: product.has_temperature,
            has_sugar_level: product.has_sugar_level,
            variants: product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price_adjustment: v.price_adjustment,
            })),
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
            form.put(`/products/${editing.id}`, {
                onSuccess,
                preserveScroll: true,
            });
        } else {
            form.post('/products', { onSuccess, preserveScroll: true });
        }
    };

    const destroy = (product: ProductRow) => {
        if (window.confirm(`Hapus produk ${product.name}?`)) {
            router.delete(`/products/${product.id}`, { preserveScroll: true });
        }
    };

    const setVariant = (
        index: number,
        patch: Partial<{ name: string; price_adjustment: number }>,
    ) => {
        const next = [...form.data.variants];
        next[index] = { ...next[index], ...patch };
        form.setData('variants', next);
    };

    return (
        <>
            <Head title="Produk" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={Package}
                    title="Produk"
                    description="Menu yang dijual di kasir, beserta harga dan variannya"
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <Link href="/categories">
                                    <Layers className="size-4" aria-hidden />
                                    Kategori
                                </Link>
                            </Button>
                            <Button
                                onClick={openCreate}
                                disabled={categories.length === 0}
                            >
                                <Plus className="size-4" aria-hidden />
                                Tambah produk
                            </Button>
                        </>
                    }
                />

                {categories.length === 0 && (
                    <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm leading-5 font-semibold">
                                Belum ada kategori aktif
                            </p>
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                Setiap produk harus berada dalam sebuah
                                kategori. Buat kategori terlebih dahulu.
                            </p>
                        </div>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="shrink-0 bg-card"
                        >
                            <Link href="/categories">Buat kategori</Link>
                        </Button>
                    </div>
                )}

                {withoutRecipe > 0 && (
                    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm leading-5 font-semibold">
                                {number(withoutRecipe)} produk belum punya resep
                            </p>
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                HPP dan laba produk tersebut dihitung nol, dan
                                stok bahannya tidak berkurang saat terjual.
                            </p>
                        </div>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                        >
                            <Link href="/recipes">Kelola resep</Link>
                        </Button>
                    </div>
                )}

                <Panel
                    title="Daftar produk"
                    description={`${number(visible.length)} dari ${number(products.length)} produk`}
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
                                    placeholder="Cari produk…"
                                    aria-label="Cari produk"
                                    className="h-9 w-44 pl-8"
                                />
                            </div>

                            <Select
                                value={categoryId}
                                onValueChange={setCategoryId}
                            >
                                <SelectTrigger className="h-9 w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua kategori
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    }
                >
                    {visible.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th>Produk</Th>
                                    <Th>Kategori</Th>
                                    <Th numeric>Harga</Th>
                                    <Th numeric>HPP</Th>
                                    <Th numeric>Margin</Th>
                                    <Th>Varian</Th>
                                    <Th>Status</Th>
                                    <Th className="w-24 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((product) => (
                                    <Tr key={product.id}>
                                        <Td className="font-medium">
                                            {product.name}
                                        </Td>
                                        <Td muted>
                                            {product.category?.name ?? '—'}
                                        </Td>
                                        <Td numeric>
                                            {rupiah(product.base_price)}
                                        </Td>
                                        <Td numeric muted>
                                            {product.has_recipe
                                                ? rupiah(product.hpp)
                                                : '—'}
                                        </Td>
                                        <Td numeric>
                                            {product.has_recipe ? (
                                                <StatusBadge
                                                    tone={
                                                        product.margin_percent >=
                                                        65
                                                            ? 'success'
                                                            : product.margin_percent >=
                                                                55
                                                              ? 'warning'
                                                              : 'danger'
                                                    }
                                                    dot={false}
                                                >
                                                    {percent(
                                                        product.margin_percent,
                                                    )}
                                                </StatusBadge>
                                            ) : (
                                                <StatusBadge
                                                    tone="neutral"
                                                    dot={false}
                                                >
                                                    Tanpa resep
                                                </StatusBadge>
                                            )}
                                        </Td>
                                        <Td muted>
                                            {product.variants.length > 0
                                                ? product.variants
                                                      .map((v) => v.name)
                                                      .join(', ')
                                                : '—'}
                                        </Td>
                                        <Td>
                                            <StatusBadge
                                                tone={
                                                    product.is_active
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            >
                                                {product.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </StatusBadge>
                                        </Td>
                                        <Td>
                                            <RowActions
                                                label={product.name}
                                                onEdit={() => openEdit(product)}
                                                onDelete={() =>
                                                    destroy(product)
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
                                icon={Package}
                                title={
                                    products.length === 0
                                        ? 'Belum ada produk'
                                        : 'Tidak ada produk yang cocok'
                                }
                                description={
                                    products.length === 0
                                        ? 'Tambahkan menu pertama Anda agar bisa dijual di layar kasir.'
                                        : 'Coba kata kunci lain atau pilih kategori berbeda.'
                                }
                                action={
                                    products.length === 0 &&
                                    categories.length > 0 ? (
                                        <Button size="sm" onClick={openCreate}>
                                            Tambah produk
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    )}
                </Panel>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? `Ubah ${editing.name}` : 'Tambah produk'}
                        </DialogTitle>
                        <DialogDescription>
                            Harga dasar adalah harga varian standar; varian lain
                            menyesuaikan lewat selisih harga.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <Field label="Kategori" error={form.errors.category_id}>
                            <Select
                                value={form.data.category_id}
                                onValueChange={(value) =>
                                    form.setData('category_id', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field
                            label="Nama produk"
                            htmlFor="product-name"
                            error={form.errors.name}
                        >
                            <Input
                                id="product-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field
                            label="Deskripsi"
                            htmlFor="product-desc"
                            error={form.errors.description}
                        >
                            <Textarea
                                id="product-desc"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                rows={2}
                                className="resize-none"
                            />
                        </Field>

                        <Field
                            label="Harga dasar (Rp)"
                            htmlFor="product-price"
                            error={form.errors.base_price}
                        >
                            <CurrencyInput
                                id="product-price"
                                value={form.data.base_price}
                                onChange={(val) =>
                                    form.setData(
                                        'base_price',
                                        Number(val) || 0,
                                    )
                                }
                                required
                                className="tabular"
                            />
                        </Field>

                        <div className="flex flex-col divide-y rounded-lg border px-4">
                            <SwitchRow
                                label="Tampil di kasir"
                                checked={form.data.is_active}
                                onChange={(v) => form.setData('is_active', v)}
                            />
                            <SwitchRow
                                label="Pilihan suhu"
                                help="Panas atau dingin."
                                checked={form.data.has_temperature}
                                onChange={(v) =>
                                    form.setData('has_temperature', v)
                                }
                            />
                            <SwitchRow
                                label="Pilihan tingkat gula"
                                checked={form.data.has_sugar_level}
                                onChange={(v) =>
                                    form.setData('has_sugar_level', v)
                                }
                            />
                            <SwitchRow
                                label="Punya varian ukuran"
                                checked={form.data.has_variants}
                                onChange={(v) =>
                                    form.setData('has_variants', v)
                                }
                            />
                        </div>

                        {form.data.has_variants && (
                            <div className="flex flex-col gap-3 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm leading-5 font-medium">
                                        Varian ukuran
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            form.setData('variants', [
                                                ...form.data.variants,
                                                {
                                                    name: '',
                                                    price_adjustment: 0,
                                                },
                                            ])
                                        }
                                    >
                                        <Plus className="size-4" aria-hidden />
                                        Tambah varian
                                    </Button>
                                </div>

                                {form.data.variants.length === 0 && (
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Belum ada varian. Contoh: Small −5.000,
                                        Medium 0, Large +5.000.
                                    </p>
                                )}

                                {form.data.variants.map((variant, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <Input
                                            placeholder="Nama varian"
                                            value={variant.name}
                                            onChange={(e) =>
                                                setVariant(index, {
                                                    name: e.target.value,
                                                })
                                            }
                                            aria-label={`Nama varian ${index + 1}`}
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Selisih harga"
                                            value={variant.price_adjustment}
                                            onChange={(e) =>
                                                setVariant(index, {
                                                    price_adjustment:
                                                        Number(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                            aria-label={`Selisih harga varian ${index + 1}`}
                                            className="tabular w-32"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() =>
                                                form.setData(
                                                    'variants',
                                                    form.data.variants.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            aria-label="Hapus varian"
                                        >
                                            <Trash2
                                                className="size-4"
                                                aria-hidden
                                            />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

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
                                      : 'Tambah produk'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [{ title: 'Produk', href: '/products' }],
};
