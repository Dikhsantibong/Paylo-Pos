import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Calculator,
    ChevronDown,
    ChevronRight,
    PackageSearch,
    Percent,
    Search,
    TrendingUp,
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
import type { StatusTone } from '@/components/paylo';
import { Button } from '@/components/ui/button';
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
import type { CostHealth, HppProduct, HppSummary, Ingredient } from '@/types';

type Props = {
    products: HppProduct[];
    summary: HppSummary;
    ingredients: Ingredient[];
};

const HEALTH: Record<
    CostHealth,
    { label: string; tone: StatusTone; hint: string }
> = {
    healthy: {
        label: 'Sehat',
        tone: 'success',
        hint: 'Food cost 35% atau kurang',
    },
    watch: { label: 'Perlu dicek', tone: 'warning', hint: 'Food cost 35–45%' },
    critical: {
        label: 'Kritis',
        tone: 'danger',
        hint: 'Food cost di atas 45%',
    },
    unknown: {
        label: 'Belum ada resep',
        tone: 'neutral',
        hint: 'HPP belum bisa dihitung',
    },
};

/**
 * HPP — Harga Pokok Penjualan.
 *
 * Shows what one cup actually costs to make, what margin it leaves, and where
 * the food-cost percentage sits against the F&B rule of thumb (≤35% healthy).
 * The cost comes from each product's recipe × ingredient price, so it stays
 * accurate as soon as ingredient prices are updated in Inventory.
 */
export default function HppIndex({ products, summary, ingredients }: Props) {
    const [query, setQuery] = useState('');
    const [health, setHealth] = useState<'all' | CostHealth>('all');
    const [expanded, setExpanded] = useState<number | null>(null);
    const [targetFoodCost, setTargetFoodCost] = useState(30);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return products.filter((product) => {
            if (health !== 'all' && product.health !== health) {
                return false;
            }

            if (!needle) {
                return true;
            }

            return (
                product.name.toLowerCase().includes(needle) ||
                (product.category ?? '').toLowerCase().includes(needle)
            );
        });
    }, [products, query, health]);

    const suggestedFor = (hpp: number) =>
        hpp > 0 && targetFoodCost > 0
            ? Math.ceil(hpp / (targetFoodCost / 100) / 500) * 500
            : 0;

    return (
        <>
            <Head title="HPP & margin" />

            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={Calculator}
                    title="HPP & margin"
                    description="Biaya bahan baku per porsi, margin, dan food cost setiap menu"
                    actions={
                        <Button asChild variant="outline" size="sm">
                            <Link href="/recipes">Kelola resep</Link>
                        </Button>
                    }
                />

                {/* ── Summary ──────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Produk terhitung"
                        value={`${number(summary.productsCosted)} / ${number(summary.productsTotal)}`}
                        hint="Produk yang sudah punya resep lengkap"
                        icon={PackageSearch}
                        accent="brand"
                    />
                    <KpiCard
                        label="Rata-rata margin"
                        value={percent(summary.averageMarginPercent)}
                        hint="Selisih harga jual dan HPP"
                        icon={TrendingUp}
                        accent={
                            summary.averageMarginPercent >= 65
                                ? 'success'
                                : 'warning'
                        }
                    />
                    <KpiCard
                        label="Rata-rata food cost"
                        value={percent(summary.averageFoodCostPercent)}
                        hint="Target industri F&B: 30% atau lebih rendah"
                        icon={Percent}
                        accent={
                            summary.averageFoodCostPercent <= 35
                                ? 'success'
                                : 'warning'
                        }
                    />
                    <KpiCard
                        label="Perlu perhatian"
                        value={number(
                            summary.watchCount + summary.criticalCount,
                        )}
                        hint={`${number(summary.criticalCount)} kritis · ${number(summary.watchCount)} perlu dicek`}
                        icon={AlertTriangle}
                        accent={
                            summary.criticalCount > 0 ? 'warning' : 'neutral'
                        }
                    />
                </div>

                {/* ── Products without a recipe ────────────────── */}
                {summary.productsWithoutRecipe.length > 0 && (
                    <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <AlertTriangle
                                className="mt-0.5 size-4 shrink-0 text-warning"
                                aria-hidden
                            />
                            <div>
                                <p className="text-sm leading-5 font-semibold text-foreground">
                                    {summary.productsWithoutRecipe.length}{' '}
                                    produk belum punya resep
                                </p>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                    HPP dan laba produk ini dihitung nol,
                                    sehingga laporan margin belum akurat. Belum
                                    ada resep untuk:{' '}
                                    {summary.productsWithoutRecipe
                                        .slice(0, 4)
                                        .map((p) => p.name)
                                        .join(', ')}
                                    {summary.productsWithoutRecipe.length > 4
                                        ? `, dan ${summary.productsWithoutRecipe.length - 4} lainnya`
                                        : ''}
                                    .
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="shrink-0 bg-card"
                        >
                            <Link href="/recipes">Tambah resep</Link>
                        </Button>
                    </div>
                )}

                {/* ── Pricing simulator ────────────────────────── */}
                <Panel
                    title="Simulasi harga jual"
                    description="Tentukan target food cost, lalu lihat harga jual yang disarankan untuk setiap menu."
                >
                    <div className="flex flex-wrap items-end gap-5">
                        <div className="flex flex-col gap-1.5">
                            <Label
                                htmlFor="target"
                                className="text-xs leading-4 font-medium text-muted-foreground"
                            >
                                Target food cost (%)
                            </Label>
                            <Input
                                id="target"
                                inputMode="numeric"
                                value={String(targetFoodCost)}
                                onChange={(event) =>
                                    setTargetFoodCost(
                                        Math.min(
                                            90,
                                            Math.max(
                                                5,
                                                Number(
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                ) || 0,
                                            ),
                                        ),
                                    )
                                }
                                className="tabular h-10 w-28"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[25, 30, 35, 40].map((value) => (
                                <Button
                                    key={value}
                                    type="button"
                                    variant={
                                        targetFoodCost === value
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setTargetFoodCost(value)}
                                >
                                    {value}%
                                </Button>
                            ))}
                        </div>

                        <p className="min-w-[240px] flex-1 text-xs leading-5 text-muted-foreground">
                            Harga saran dibulatkan ke kelipatan Rp 500 agar
                            langsung bisa dipakai di menu. Angka ini hanya
                            memperhitungkan bahan baku — tambahkan biaya sewa,
                            gaji, dan operasional lain sebelum memutuskan harga
                            akhir.
                        </p>
                    </div>
                </Panel>

                {/* ── Costing table ────────────────────────────── */}
                <Panel
                    title="Rincian HPP per produk"
                    description="Klik satu baris untuk melihat komposisi bahan dan varian"
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
                                value={health}
                                onValueChange={(value) =>
                                    setHealth(value as typeof health)
                                }
                            >
                                <SelectTrigger className="h-9 w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua status
                                    </SelectItem>
                                    <SelectItem value="healthy">
                                        Sehat
                                    </SelectItem>
                                    <SelectItem value="watch">
                                        Perlu dicek
                                    </SelectItem>
                                    <SelectItem value="critical">
                                        Kritis
                                    </SelectItem>
                                    <SelectItem value="unknown">
                                        Belum ada resep
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
                                    <Th className="w-8" />
                                    <Th>Produk</Th>
                                    <Th>Kategori</Th>
                                    <Th numeric>Harga jual</Th>
                                    <Th numeric>HPP</Th>
                                    <Th numeric>Margin</Th>
                                    <Th numeric>Margin %</Th>
                                    <Th numeric>Food cost</Th>
                                    <Th numeric>Harga saran</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((product) => {
                                    const open = expanded === product.id;
                                    const suggested = suggestedFor(product.hpp);

                                    return (
                                        <>
                                            <Tr
                                                key={product.id}
                                                onClick={() =>
                                                    setExpanded(
                                                        open
                                                            ? null
                                                            : product.id,
                                                    )
                                                }
                                                className="cursor-pointer"
                                            >
                                                <Td>
                                                    {open ? (
                                                        <ChevronDown
                                                            className="size-4 text-muted-foreground"
                                                            aria-hidden
                                                        />
                                                    ) : (
                                                        <ChevronRight
                                                            className="size-4 text-muted-foreground"
                                                            aria-hidden
                                                        />
                                                    )}
                                                </Td>
                                                <Td className="font-medium">
                                                    {product.name}
                                                </Td>
                                                <Td muted>
                                                    {product.category ?? '—'}
                                                </Td>
                                                <Td numeric>
                                                    {rupiah(product.price)}
                                                </Td>
                                                <Td numeric muted>
                                                    {product.has_recipe
                                                        ? rupiah(product.hpp)
                                                        : '—'}
                                                </Td>
                                                <Td
                                                    numeric
                                                    className="font-semibold"
                                                >
                                                    {product.has_recipe
                                                        ? rupiah(product.margin)
                                                        : '—'}
                                                </Td>
                                                <Td numeric>
                                                    {product.has_recipe
                                                        ? percent(
                                                              product.margin_percent,
                                                          )
                                                        : '—'}
                                                </Td>
                                                <Td numeric>
                                                    {product.has_recipe
                                                        ? percent(
                                                              product.food_cost_percent,
                                                          )
                                                        : '—'}
                                                </Td>
                                                <Td
                                                    numeric
                                                    className={
                                                        suggested >
                                                        product.price
                                                            ? 'text-warning'
                                                            : 'text-muted-foreground'
                                                    }
                                                >
                                                    {suggested > 0
                                                        ? rupiah(suggested)
                                                        : '—'}
                                                </Td>
                                                <Td>
                                                    <StatusBadge
                                                        tone={
                                                            HEALTH[
                                                                product.health
                                                            ].tone
                                                        }
                                                    >
                                                        {
                                                            HEALTH[
                                                                product.health
                                                            ].label
                                                        }
                                                    </StatusBadge>
                                                </Td>
                                            </Tr>

                                            {open && (
                                                <tr
                                                    key={`${product.id}-detail`}
                                                >
                                                    <td
                                                        colSpan={10}
                                                        className="border-b bg-muted/30 px-5 py-4"
                                                    >
                                                        <ProductBreakdown
                                                            product={product}
                                                            suggested={
                                                                suggested
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={Calculator}
                                title="Tidak ada produk yang cocok"
                                description="Ubah kata kunci atau pilih status lain."
                            />
                        </div>
                    )}
                </Panel>

                {/* ── Ingredient prices ────────────────────────── */}
                <Panel
                    title="Harga bahan baku"
                    description="HPP dihitung dari harga ini. Perbarui di Inventori agar perhitungan tetap akurat."
                    padded={false}
                    actions={
                        <Button asChild variant="outline" size="sm">
                            <Link href="/inventory">Buka inventori</Link>
                        </Button>
                    }
                >
                    <DataTable maxHeight="360px">
                        <thead>
                            <tr>
                                <Th>Bahan</Th>
                                <Th>Satuan</Th>
                                <Th numeric>Harga per satuan</Th>
                                <Th numeric>Stok saat ini</Th>
                                <Th numeric>Nilai stok</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredients.map((ingredient) => (
                                <Tr key={ingredient.id}>
                                    <Td className="font-medium">
                                        {ingredient.name}
                                    </Td>
                                    <Td muted>{ingredient.unit}</Td>
                                    <Td numeric>
                                        {rupiah(ingredient.cost_per_unit)}
                                    </Td>
                                    <Td numeric>
                                        {formatQuantity(
                                            ingredient.current_stock,
                                            ingredient.unit,
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
                                </Tr>
                            ))}
                        </tbody>
                    </DataTable>
                </Panel>
            </div>
        </>
    );
}

function ProductBreakdown({
    product,
    suggested,
}: {
    product: HppProduct;
    suggested: number;
}) {
    if (!product.has_recipe) {
        return (
            <EmptyState
                compact
                icon={Calculator}
                title={`${product.name} belum punya resep`}
                description="Tambahkan komposisi bahan agar HPP, margin, dan laba produk ini ikut terhitung."
                action={
                    <Button asChild size="sm" variant="outline">
                        <Link href="/recipes">Tambah resep</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div>
                <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                    Komposisi bahan (per porsi)
                </p>
                <ul className="mt-2 flex flex-col divide-y rounded-lg border bg-card">
                    {product.ingredients.map((line) => (
                        <li
                            key={line.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                            <span className="min-w-0">
                                <span className="block truncate font-medium">
                                    {line.name}
                                </span>
                                <span className="tabular block text-xs text-muted-foreground">
                                    {formatQuantity(line.quantity, line.unit)} ×{' '}
                                    {rupiah(line.cost_per_unit)}
                                </span>
                            </span>
                            <span className="tabular shrink-0 font-medium">
                                {rupiah(line.cost)}
                            </span>
                        </li>
                    ))}
                    <li className="flex items-center justify-between gap-3 bg-muted/50 px-3 py-2 text-sm font-semibold">
                        <span>Total HPP</span>
                        <span className="tabular">{rupiah(product.hpp)}</span>
                    </li>
                </ul>
            </div>

            <div className="flex flex-col gap-4">
                {product.variants.length > 0 && (
                    <div>
                        <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                            Per varian
                        </p>
                        <ul className="mt-2 flex flex-col divide-y rounded-lg border bg-card">
                            {product.variants.map((variant) => (
                                <li
                                    key={variant.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">
                                            {variant.name}
                                        </span>
                                        <span className="tabular block text-xs text-muted-foreground">
                                            Jual {rupiah(variant.price)} · HPP{' '}
                                            {rupiah(variant.hpp)}
                                        </span>
                                    </span>
                                    <StatusBadge
                                        tone={HEALTH[variant.health].tone}
                                        dot={false}
                                    >
                                        {percent(variant.margin_percent)}
                                    </StatusBadge>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="rounded-lg border bg-card p-4">
                    <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                        Ringkasan
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                        <Stat
                            label="Markup"
                            value={percent(product.markup_percent)}
                        />
                        <Stat
                            label="Laba per porsi"
                            value={rupiah(product.margin)}
                        />
                        <Stat
                            label="Food cost"
                            value={percent(product.food_cost_percent)}
                        />
                        <Stat
                            label="Harga saran"
                            value={suggested > 0 ? rupiah(suggested) : '—'}
                            hint={
                                suggested > product.price
                                    ? 'Harga saat ini di bawah target'
                                    : 'Harga saat ini sudah memenuhi target'
                            }
                        />
                    </dl>
                    <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">
                        {HEALTH[product.health].hint}.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Stat({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div>
            <dt className="text-xs leading-4 text-muted-foreground">{label}</dt>
            <dd className="tabular text-sm leading-5 font-semibold">{value}</dd>
            {hint && (
                <p className="text-xs leading-4 text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
}

HppIndex.layout = { breadcrumbs: [{ title: 'HPP & margin', href: '/hpp' }] };
