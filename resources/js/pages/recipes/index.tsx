import { Head, Link, router, useForm } from '@inertiajs/react';
import { BookOpen, Calculator, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    EmptyState,
    KpiCard,
    PageHeader,
    Panel,
    StatusBadge,
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    number,
    percent,
    quantity as formatQuantity,
    rupiah,
} from '@/lib/format';
import type { Ingredient, Product, Recipe } from '@/types';

type Props = {
    products: Product[];
    ingredients: Ingredient[];
};

/**
 * Recipes map a menu item to the ingredients it consumes. They drive two
 * things at once: automatic stock deduction at checkout, and the HPP shown on
 * the costing screen.
 */
export default function RecipesIndex({ products, ingredients }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Recipe | null>(null);

    const form = useForm({
        product_id: '',
        product_variant_id: '',
        ingredient_id: '',
        quantity: 0,
    });

    const costOf = (product: Product) =>
        Math.round(
            (product.recipes ?? []).reduce(
                (sum, recipe) =>
                    sum +
                    (recipe.ingredient?.cost_per_unit ?? 0) * recipe.quantity,
                0,
            ),
        );

    const withRecipes = useMemo(
        () => products.filter((p) => (p.recipes ?? []).length > 0),
        [products],
    );
    const withoutRecipes = useMemo(
        () => products.filter((p) => (p.recipes ?? []).length === 0),
        [products],
    );

    const selectedProduct = products.find(
        (p) => String(p.id) === form.data.product_id,
    );
    const variants = selectedProduct?.variants ?? [];

    const openCreate = (productId?: number) => {
        form.reset();
        form.clearErrors();

        if (productId) {
            form.setData('product_id', String(productId));
        }

        setEditing(null);
        setOpen(true);
    };

    const openEdit = (recipe: Recipe) => {
        form.clearErrors();
        setEditing(recipe);
        form.setData({
            product_id: String(recipe.product_id),
            product_variant_id: recipe.product_variant_id
                ? String(recipe.product_variant_id)
                : '',
            ingredient_id: String(recipe.ingredient_id),
            quantity: recipe.quantity,
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
            form.put(`/recipes/${editing.id}`, {
                onSuccess,
                preserveScroll: true,
            });
        } else {
            form.post('/recipes', { onSuccess, preserveScroll: true });
        }
    };

    const destroy = (recipe: Recipe) => {
        if (
            window.confirm(
                `Hapus ${recipe.ingredient?.name ?? 'bahan ini'} dari resep?`,
            )
        ) {
            router.delete(`/recipes/${recipe.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Resep" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={BookOpen}
                    title="Resep"
                    description="Komposisi bahan setiap menu — dasar pengurangan stok otomatis dan perhitungan HPP"
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <Link href="/hpp">
                                    <Calculator
                                        className="size-4"
                                        aria-hidden
                                    />
                                    Lihat HPP
                                </Link>
                            </Button>
                            <Button onClick={() => openCreate()}>
                                <Plus className="size-4" aria-hidden />
                                Tambah bahan
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <KpiCard
                        label="Total produk"
                        value={number(products.length)}
                        icon={BookOpen}
                        accent="brand"
                    />
                    <KpiCard
                        label="Sudah punya resep"
                        value={number(withRecipes.length)}
                        hint="HPP dan laba terhitung otomatis"
                        accent="success"
                    />
                    <KpiCard
                        label="Belum punya resep"
                        value={number(withoutRecipes.length)}
                        hint="HPP produk ini masih dihitung nol"
                        accent={
                            withoutRecipes.length > 0 ? 'warning' : 'neutral'
                        }
                    />
                </div>

                {withoutRecipes.length > 0 && (
                    <Panel
                        title="Produk tanpa resep"
                        description="Tambahkan komposisi bahan agar laporan laba akurat"
                    >
                        <div className="flex flex-wrap gap-2">
                            {withoutRecipes.map((product) => (
                                <Button
                                    key={product.id}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openCreate(product.id)}
                                >
                                    <Plus className="size-4" aria-hidden />
                                    {product.name}
                                </Button>
                            ))}
                        </div>
                    </Panel>
                )}

                {withRecipes.length > 0 ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {withRecipes.map((product) => {
                            const cost = costOf(product);
                            const margin =
                                product.base_price > 0
                                    ? ((product.base_price - cost) /
                                          product.base_price) *
                                      100
                                    : 0;

                            return (
                                <Panel
                                    key={product.id}
                                    title={product.name}
                                    description={
                                        product.category?.name ?? 'Menu'
                                    }
                                    padded={false}
                                    actions={
                                        <StatusBadge
                                            tone={
                                                margin >= 65
                                                    ? 'success'
                                                    : margin >= 55
                                                      ? 'warning'
                                                      : 'danger'
                                            }
                                        >
                                            {percent(margin)}
                                        </StatusBadge>
                                    }
                                    footer={
                                        <span className="flex items-center justify-between">
                                            <span>HPP per porsi</span>
                                            <span className="tabular font-semibold text-foreground">
                                                {rupiah(cost)}
                                            </span>
                                        </span>
                                    }
                                >
                                    <ul className="divide-y">
                                        {(product.recipes ?? []).map(
                                            (recipe) => (
                                                <li
                                                    key={recipe.id}
                                                    className="flex items-center justify-between gap-3 px-5 py-2.5"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm leading-5 font-medium">
                                                            {recipe.ingredient
                                                                ?.name ?? '—'}
                                                        </p>
                                                        <p className="tabular text-xs leading-4 text-muted-foreground">
                                                            {formatQuantity(
                                                                recipe.quantity,
                                                                recipe
                                                                    .ingredient
                                                                    ?.unit,
                                                            )}{' '}
                                                            ·{' '}
                                                            {rupiah(
                                                                Math.round(
                                                                    (recipe
                                                                        .ingredient
                                                                        ?.cost_per_unit ??
                                                                        0) *
                                                                        recipe.quantity,
                                                                ),
                                                            )}
                                                        </p>
                                                    </div>

                                                    <span className="flex shrink-0 gap-0.5">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8"
                                                            onClick={() =>
                                                                openEdit(recipe)
                                                            }
                                                            aria-label="Ubah takaran"
                                                        >
                                                            <Pencil
                                                                className="size-3.5"
                                                                aria-hidden
                                                            />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() =>
                                                                destroy(recipe)
                                                            }
                                                            aria-label="Hapus bahan"
                                                        >
                                                            <Trash2
                                                                className="size-3.5"
                                                                aria-hidden
                                                            />
                                                        </Button>
                                                    </span>
                                                </li>
                                            ),
                                        )}

                                        <li className="px-5 py-2.5">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start text-muted-foreground"
                                                onClick={() =>
                                                    openCreate(product.id)
                                                }
                                            >
                                                <Plus
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                                Tambah bahan
                                            </Button>
                                        </li>
                                    </ul>
                                </Panel>
                            );
                        })}
                    </div>
                ) : (
                    <Panel>
                        <EmptyState
                            icon={BookOpen}
                            title="Belum ada resep"
                            description="Hubungkan setiap menu dengan bahan bakunya agar stok berkurang otomatis saat terjual dan HPP terhitung sendiri."
                            action={
                                <Button size="sm" onClick={() => openCreate()}>
                                    Tambah resep pertama
                                </Button>
                            }
                        />
                    </Panel>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Ubah takaran' : 'Tambah bahan ke resep'}
                        </DialogTitle>
                        <DialogDescription>
                            Takaran adalah jumlah bahan yang terpakai untuk satu
                            porsi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        {!editing && (
                            <>
                                <Field
                                    label="Produk"
                                    error={form.errors.product_id}
                                >
                                    <Select
                                        value={form.data.product_id}
                                        onValueChange={(value) => {
                                            form.setData('product_id', value);
                                            form.setData(
                                                'product_variant_id',
                                                '',
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={String(product.id)}
                                                >
                                                    {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                {variants.length > 0 && (
                                    <Field
                                        label="Khusus varian"
                                        help="Kosongkan agar bahan ini berlaku untuk semua varian."
                                        error={form.errors.product_variant_id}
                                    >
                                        <Select
                                            value={
                                                form.data.product_variant_id ||
                                                'all'
                                            }
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'product_variant_id',
                                                    value === 'all'
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua varian
                                                </SelectItem>
                                                {variants.map((variant) => (
                                                    <SelectItem
                                                        key={variant.id}
                                                        value={String(
                                                            variant.id,
                                                        )}
                                                    >
                                                        {variant.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}

                                <Field
                                    label="Bahan baku"
                                    error={form.errors.ingredient_id}
                                >
                                    <Select
                                        value={form.data.ingredient_id}
                                        onValueChange={(value) =>
                                            form.setData('ingredient_id', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih bahan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ingredients.map((ingredient) => (
                                                <SelectItem
                                                    key={ingredient.id}
                                                    value={String(
                                                        ingredient.id,
                                                    )}
                                                >
                                                    {ingredient.name} ·{' '}
                                                    {rupiah(
                                                        ingredient.cost_per_unit,
                                                    )}
                                                    /{ingredient.unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </>
                        )}

                        <Field
                            label="Takaran per porsi"
                            error={form.errors.quantity}
                        >
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.data.quantity || ''}
                                onChange={(e) =>
                                    form.setData(
                                        'quantity',
                                        Number(e.target.value),
                                    )
                                }
                                required
                                autoFocus
                                className="tabular"
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
                                    : 'Simpan resep'}
                            </Button>
                        </DialogFooter>
                    </form>
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

RecipesIndex.layout = { breadcrumbs: [{ title: 'Resep', href: '/recipes' }] };
