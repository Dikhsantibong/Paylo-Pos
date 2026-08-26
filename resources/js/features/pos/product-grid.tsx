import { Coffee, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/paylo';
import { Input } from '@/components/ui/input';
import { rupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/types';

/**
 * Menu browser — design.md §8.
 *
 * Search is the primary control and stays pinned; categories are a single row
 * of chips; products are large touch targets showing name and price only.
 */
export function ProductGrid({
    products,
    categories,
    onSelect,
    searchRef,
    addonsAvailable = false,
}: {
    products: Product[];
    categories: Category[];
    onSelect: (product: Product) => void;
    searchRef?: React.RefObject<HTMLInputElement | null>;
    /** Add-ons open the options dialog for every product, so the badge follows. */
    addonsAvailable?: boolean;
}) {
    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState<number | 'all'>('all');
    const fallbackRef = useRef<HTMLInputElement>(null);
    const inputRef = searchRef ?? fallbackRef;

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return products.filter((product) => {
            if (categoryId !== 'all' && product.category_id !== categoryId) {
                return false;
            }

            if (!needle) {
                return true;
            }

            return (
                product.name.toLowerCase().includes(needle) ||
                (product.category?.name ?? '').toLowerCase().includes(needle)
            );
        });
    }, [products, query, categoryId]);

    const countFor = (id: number | 'all') =>
        id === 'all'
            ? products.length
            : products.filter((p) => p.category_id === id).length;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* Search + categories */}
            <div className="flex flex-col gap-3 border-b bg-card px-4 py-3 md:px-5">
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari produk… (F2)"
                        aria-label="Cari produk"
                        className="h-11 pr-9 pl-9 text-base"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="Bersihkan pencarian"
                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" aria-hidden />
                        </button>
                    )}
                </div>

                <div className="scroll-x -mx-1 flex gap-2 px-1 pb-1">
                    <CategoryChip
                        active={categoryId === 'all'}
                        onClick={() => setCategoryId('all')}
                        label="Semua"
                        count={countFor('all')}
                    />
                    {categories.map((category) => (
                        <CategoryChip
                            key={category.id}
                            active={categoryId === category.id}
                            onClick={() => setCategoryId(category.id)}
                            label={category.name}
                            count={countFor(category.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
                {visible.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {visible.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onSelect={onSelect}
                                addonsAvailable={addonsAvailable}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Coffee}
                        title={
                            query
                                ? `Tidak ada produk cocok dengan “${query}”`
                                : 'Belum ada produk di kategori ini'
                        }
                        description={
                            query
                                ? 'Coba kata kunci lain atau pilih kategori berbeda.'
                                : 'Tambahkan produk lewat menu Produk agar bisa dijual di kasir.'
                        }
                    />
                )}
            </div>
        </div>
    );
}

function CategoryChip({
    active,
    onClick,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm leading-5 font-medium transition-colors',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-muted',
            )}
        >
            {label}
            <span
                className={cn(
                    'tabular rounded px-1.5 text-xs leading-4',
                    active
                        ? 'bg-white/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                {count}
            </span>
        </button>
    );
}

function ProductCard({
    product,
    onSelect,
    addonsAvailable,
}: {
    product: Product;
    onSelect: (product: Product) => void;
    addonsAvailable: boolean;
}) {
    const variants = product.active_variants ?? product.variants ?? [];
    const hasOptions =
        variants.length > 0 ||
        product.has_temperature ||
        product.has_sugar_level ||
        addonsAvailable;

    return (
        <button
            type="button"
            onClick={() => onSelect(product)}
            className="group flex h-full min-h-[104px] flex-col justify-between gap-2 rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-primary hover:bg-primary-soft focus-visible:border-primary"
        >
            <span className="line-clamp-2 text-sm leading-5 font-semibold text-foreground">
                {product.name}
            </span>

            <span className="flex items-end justify-between gap-2">
                <span className="tabular text-sm leading-5 font-semibold text-primary">
                    {rupiah(product.base_price)}
                </span>
                {hasOptions && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs leading-4 text-muted-foreground">
                        Opsi
                    </span>
                )}
            </span>
        </button>
    );
}
