import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Calculator, ShoppingCart } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import type { Brand } from '@/types/auth';

const HIGHLIGHTS = [
    {
        icon: ShoppingCart,
        title: 'Kasir cepat',
        body: 'Cari produk, atur varian, dan tutup transaksi dalam hitungan detik.',
    },
    {
        icon: Calculator,
        title: 'HPP otomatis',
        body: 'Margin tiap menu terhitung sendiri dari resep dan harga bahan.',
    },
    {
        icon: BarChart3,
        title: 'Laporan siap cetak',
        body: 'Penjualan, laba, dan metode pembayaran dalam satu dokumen.',
    },
];

/**
 * Sign-in shell — design.md §4 and §23.
 *
 * A restrained two-column split: brand panel on the left, form on the right.
 * Everything is local; no remote images, so the screen still renders on a
 * terminal with no internet.
 */
export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const brand = usePage().props.brand as Brand | undefined;
    const name = brand?.name || 'Paylo';

    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4 md:p-6 lg:p-10">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-md lg:grid-cols-2">
                {/* Brand panel */}
                <div className="relative hidden flex-col justify-between bg-brand-700 p-10 lg:flex lg:p-12">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                        aria-hidden
                    />

                    <div className="relative">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-3"
                        >
                            <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white/15">
                                {brand?.logo ? (
                                    <img
                                        src={brand.logo}
                                        alt={name}
                                        className="size-full object-contain p-1"
                                    />
                                ) : (
                                    <span className="text-base font-bold text-white">
                                        {name.slice(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </span>
                            <span className="text-lg font-semibold text-white">
                                {name}
                            </span>
                        </Link>
                    </div>

                    <div className="relative">
                        <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">
                            Point of sale
                        </p>
                        <h2 className="mt-3 text-3xl leading-10 font-bold tracking-tight text-white">
                            Kelola kasir, stok, dan laba
                            <br />
                            dari satu tempat.
                        </h2>

                        <ul className="mt-8 flex flex-col gap-5">
                            {HIGHLIGHTS.map(
                                ({ icon: Icon, title: heading, body }) => (
                                    <li
                                        key={heading}
                                        className="flex items-start gap-3"
                                    >
                                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white">
                                            <Icon
                                                className="size-4"
                                                aria-hidden
                                            />
                                        </span>
                                        <span>
                                            <span className="block text-sm leading-5 font-semibold text-white">
                                                {heading}
                                            </span>
                                            <span className="block text-xs leading-5 text-white/70">
                                                {body}
                                            </span>
                                        </span>
                                    </li>
                                ),
                            )}
                        </ul>
                    </div>

                    <p className="relative text-xs text-white/50">
                        © {new Date().getFullYear()} {name}
                    </p>
                </div>

                {/* Form panel */}
                <div className="flex w-full flex-col justify-center p-8 md:p-12 lg:p-14">
                    <div className="mx-auto w-full max-w-sm">
                        <div className="mb-8 lg:hidden">
                            <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg border bg-card">
                                {brand?.logo ? (
                                    <img
                                        src={brand.logo}
                                        alt={name}
                                        className="size-full object-contain p-1"
                                    />
                                ) : (
                                    <span className="flex size-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                                        {name.slice(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="mb-7">
                            <h1 className="text-2xl leading-8 font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
