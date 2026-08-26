import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Calculator,
    Check,
    CheckCircle2,
    Copy,
    Download,
    Gauge,
    MonitorSmartphone,
    Share,
    ShoppingCart,
    Smartphone,
    Warehouse,
    WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { usePwa } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

type Props = {
    shop: {
        name: string;
        tagline: string;
        address: string;
        phone: string;
        logo: string | null;
    };
    shareUrl: string;
    isSignedIn: boolean;
};

type Platform = 'android' | 'ios' | 'desktop';

const FEATURES = [
    {
        icon: ShoppingCart,
        title: 'Kasir',
        body: 'Cari produk, atur ukuran dan add-on, lalu tutup transaksi dalam hitungan detik.',
    },
    {
        icon: Calculator,
        title: 'HPP & margin',
        body: 'Biaya bahan per porsi terhitung otomatis dari resep, lengkap dengan food cost.',
    },
    {
        icon: Warehouse,
        title: 'Inventori',
        body: 'Stok bahan berkurang sendiri setiap kali menu terjual, dengan peringatan stok menipis.',
    },
    {
        icon: BarChart3,
        title: 'Laporan',
        body: 'Penjualan, laba, jam ramai, dan metode pembayaran — siap diekspor ke PDF atau Excel.',
    },
];

const BENEFITS = [
    {
        icon: MonitorSmartphone,
        title: 'Layar penuh',
        body: 'Berjalan seperti aplikasi biasa, tanpa bar alamat browser yang memakan tempat.',
    },
    {
        icon: Gauge,
        title: 'Buka lebih cepat',
        body: 'Ikon di layar utama dan aset tersimpan di perangkat, jadi tidak perlu memuat ulang.',
    },
    {
        icon: WifiOff,
        title: 'Tahan gangguan',
        body: 'Saat koneksi putus, Paylo memberi tahu dengan jelas alih-alih menampilkan halaman rusak.',
    },
];

const INSTRUCTIONS: Record<
    Platform,
    { label: string; icon: typeof Smartphone; steps: string[] }
> = {
    android: {
        label: 'Android',
        icon: Smartphone,
        steps: [
            'Buka tautan ini di Chrome.',
            'Ketuk menu tiga titik di pojok kanan atas.',
            'Pilih “Tambahkan ke layar utama” atau “Install app”.',
            'Konfirmasi, lalu ikon Paylo muncul di layar utama.',
        ],
    },
    ios: {
        label: 'iPhone & iPad',
        icon: Share,
        steps: [
            'Buka tautan ini di Safari — Chrome di iOS tidak bisa memasang aplikasi.',
            'Ketuk tombol Bagikan (kotak dengan panah ke atas).',
            'Gulir ke bawah, pilih “Add to Home Screen”.',
            'Ketuk “Add”, lalu ikon Paylo muncul di layar utama.',
        ],
    },
    desktop: {
        label: 'Windows & Mac',
        icon: MonitorSmartphone,
        steps: [
            'Buka tautan ini di Chrome atau Microsoft Edge.',
            'Klik ikon pasang di ujung kanan bilah alamat, atau menu ⋮ → “Install Paylo”.',
            'Klik “Install”.',
            'Paylo terbuka di jendelanya sendiri dan tersedia di menu Start atau Launchpad.',
        ],
    },
};

/** Best guess at the visitor's platform, read once before the first paint. */
function detectPlatform(): Platform {
    if (typeof navigator === 'undefined') {
        return 'desktop';
    }

    const ua = navigator.userAgent;

    if (/iPad|iPhone|iPod/.test(ua)) {
        return 'ios';
    }

    // iPadOS 13+ reports itself as a Mac; touch points give it away.
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) {
        return 'ios';
    }

    if (/Android/.test(ua)) {
        return 'android';
    }

    return 'desktop';
}

/**
 * Public install page — a link the shop can hand to anyone.
 *
 * Renders without the app shell (see the layout switch in app.tsx) and needs no
 * session, so it works for a prospect who has never signed in.
 */
export default function Install({ shop, shareUrl, isSignedIn }: Props) {
    const { canInstall, installed, install } = usePwa();
    const [platform, setPlatform] = useState<Platform>(detectPlatform);
    const [copied, copy] = useClipboard();

    const guide = INSTRUCTIONS[platform];

    return (
        <>
            <Head title={`Pasang ${shop.name}`} />

            <div className="min-h-svh bg-background">
                {/* ── Top bar ─────────────────────────────────── */}
                <header className="border-b bg-card">
                    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
                        <span className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-card">
                                {shop.logo ? (
                                    <img
                                        src={shop.logo}
                                        alt={shop.name}
                                        className="size-full object-contain p-0.5"
                                    />
                                ) : (
                                    <span className="flex size-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                                        {shop.name.slice(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm leading-5 font-semibold">
                                    {shop.name}
                                </span>
                                <span className="block truncate text-xs leading-4 text-muted-foreground">
                                    {shop.tagline || 'Point of sale'}
                                </span>
                            </span>
                        </span>

                        <Button asChild variant="outline" size="sm">
                            <Link href={isSignedIn ? '/' : '/login'}>
                                {isSignedIn ? 'Buka aplikasi' : 'Masuk'}
                                <ArrowRight className="size-4" aria-hidden />
                            </Link>
                        </Button>
                    </div>
                </header>

                <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 md:px-6 md:py-16">
                    {/* ── Hero ────────────────────────────────── */}
                    <section className="flex flex-col items-center text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-1 text-xs leading-4 font-semibold tracking-wide text-primary uppercase">
                            <Download className="size-3.5" aria-hidden />
                            Pasang aplikasi
                        </span>

                        <h1 className="mt-5 max-w-2xl text-3xl leading-10 font-bold tracking-tight text-foreground md:text-4xl md:leading-[3rem]">
                            Jalankan {shop.name} langsung dari layar utama
                            perangkat Anda
                        </h1>

                        <p className="mt-4 max-w-xl text-base leading-6 text-muted-foreground">
                            Paylo adalah aplikasi kasir untuk coffee shop —
                            transaksi, stok bahan, HPP, dan laporan penjualan
                            dalam satu tempat. Tidak perlu unduh dari toko
                            aplikasi; cukup pasang dari halaman ini.
                        </p>

                        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                            {installed ? (
                                <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-success-soft px-5 text-sm leading-5 font-semibold text-success ring-1 ring-success/20 ring-inset">
                                    <CheckCircle2
                                        className="size-4"
                                        aria-hidden
                                    />
                                    Sudah terpasang di perangkat ini
                                </span>
                            ) : (
                                <Button
                                    size="lg"
                                    className="h-11 flex-1 text-base sm:flex-none sm:px-8"
                                    disabled={!canInstall}
                                    onClick={() => void install()}
                                >
                                    <Download className="size-4" aria-hidden />
                                    {canInstall
                                        ? 'Pasang sekarang'
                                        : 'Ikuti langkah di bawah'}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="lg"
                                className="h-11 flex-1 sm:flex-none"
                                onClick={() => void copy(shareUrl)}
                            >
                                {copied === shareUrl ? (
                                    <>
                                        <Check className="size-4" aria-hidden />
                                        Tautan disalin
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" aria-hidden />
                                        Salin tautan
                                    </>
                                )}
                            </Button>
                        </div>

                        {!installed && !canInstall && (
                            <p className="mt-3 max-w-md text-xs leading-5 text-muted-foreground">
                                Browser ini belum menawarkan tombol pasang
                                otomatis. Langkah manual untuk perangkat Anda
                                ada di bawah — hasilnya sama persis.
                            </p>
                        )}

                        <p className="mt-6 font-mono text-xs break-all text-muted-foreground">
                            {shareUrl}
                        </p>
                    </section>

                    {/* ── Why install ─────────────────────────── */}
                    <section className="grid gap-4 sm:grid-cols-3">
                        {BENEFITS.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="rounded-xl border bg-card p-5 shadow-xs"
                            >
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                                    <Icon className="size-4.5" aria-hidden />
                                </span>
                                <h2 className="mt-3 text-sm leading-5 font-semibold text-foreground">
                                    {title}
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </section>

                    {/* ── Step-by-step ────────────────────────── */}
                    <section className="rounded-xl border bg-card shadow-xs">
                        <header className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base leading-6 font-semibold text-foreground">
                                    Cara memasang
                                </h2>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                    Pilih perangkat yang Anda pakai.
                                </p>
                            </div>

                            <div
                                className="flex flex-wrap gap-1.5"
                                role="tablist"
                            >
                                {(Object.keys(INSTRUCTIONS) as Platform[]).map(
                                    (key) => {
                                        const Icon = INSTRUCTIONS[key].icon;
                                        const active = platform === key;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() => setPlatform(key)}
                                                className={cn(
                                                    'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm leading-5 font-medium transition-colors',
                                                    active
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'bg-card hover:bg-muted',
                                                )}
                                            >
                                                <Icon
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                                {INSTRUCTIONS[key].label}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </header>

                        <ol className="flex flex-col gap-4 p-5">
                            {guide.steps.map((step, index) => (
                                <li
                                    key={step}
                                    className="flex items-start gap-3"
                                >
                                    <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm leading-6 text-foreground">
                                        {step}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* ── What you get ────────────────────────── */}
                    <section>
                        <h2 className="text-xl leading-7 font-bold tracking-tight text-foreground">
                            Yang Anda dapatkan
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            Semua modul tersedia begitu Anda masuk dengan akun
                            yang diberikan pemilik toko.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {FEATURES.map(({ icon: Icon, title, body }) => (
                                <div
                                    key={title}
                                    className="flex items-start gap-3 rounded-xl border bg-card p-5 shadow-xs"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                                        <Icon
                                            className="size-4.5"
                                            aria-hidden
                                        />
                                    </span>
                                    <div>
                                        <h3 className="text-sm leading-5 font-semibold text-foreground">
                                            {title}
                                        </h3>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Closing CTA ─────────────────────────── */}
                    <section className="rounded-xl border bg-brand-700 px-6 py-8 text-center">
                        <h2 className="text-xl leading-7 font-bold tracking-tight text-white">
                            Sudah punya akun?
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-white/70">
                            Akun kasir dibuat oleh pemilik toko. Hubungi{' '}
                            {shop.name} bila Anda belum menerimanya.
                        </p>
                        <Button
                            asChild
                            size="lg"
                            variant="secondary"
                            className="mt-5 h-11"
                        >
                            <Link href={isSignedIn ? '/' : '/login'}>
                                {isSignedIn
                                    ? 'Buka aplikasi'
                                    : 'Masuk ke Paylo'}
                            </Link>
                        </Button>
                    </section>
                </main>

                <footer className="border-t bg-card">
                    <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-xs leading-5 text-muted-foreground md:px-6">
                        <p className="font-medium text-foreground">
                            {shop.name}
                        </p>
                        {shop.address && <p>{shop.address}</p>}
                        {shop.phone && <p>Telp {shop.phone}</p>}
                        <p className="mt-2">
                            © {new Date().getFullYear()} {shop.name} · Ditenagai
                            Paylo POS
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
