import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    Clock,
    Coffee,
    CreditCard,
    Info,
    Lightbulb,
    Package,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import {
    DataTable,
    EmptyState,
    KpiCard,
    MetricBar,
    PageHeader,
    Panel,
    StatusBadge,
    Td,
    Th,
    Tr,
} from '@/components/paylo';
import { Button } from '@/components/ui/button';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { decimal, number, percent, rupiah, rupiahCompact } from '@/lib/format';
import type {
    CategorySlice,
    DashboardKpis,
    Highlight,
    HourlyTraffic,
    LowStockItem,
    PaymentSlice,
    ProfitPoint,
    RecentTransaction,
    SalesPoint,
    TopCustomer,
    TopProduct,
    WeekdayPoint,
} from '@/types';
import type { Brand } from '@/types/auth';

type Props = {
    generatedAt: string;
    kpis: DashboardKpis;
    salesTrend: SalesPoint[];
    hourlyTraffic: HourlyTraffic;
    topProducts: TopProduct[];
    categoryMix: CategorySlice[];
    paymentMix: PaymentSlice[];
    weekdayPerformance: WeekdayPoint[];
    profitTrend: ProfitPoint[];
    lowStock: LowStockItem[];
    recentTransactions: RecentTransaction[];
    topCustomers: TopCustomer[];
    highlights: Highlight[];
};

const salesConfig = {
    revenue: { label: 'Pendapatan', color: 'var(--color-chart-1)' },
    transactions: { label: 'Transaksi', color: 'var(--color-chart-2)' },
} satisfies ChartConfig;

const trafficConfig = {
    transactions: { label: 'Transaksi', color: 'var(--color-chart-1)' },
} satisfies ChartConfig;

const profitConfig = {
    revenue: { label: 'Pendapatan', color: 'var(--color-chart-1)' },
    cost: { label: 'HPP', color: 'var(--color-chart-4)' },
    profit: { label: 'Laba kotor', color: 'var(--color-chart-5)' },
} satisfies ChartConfig;

const weekdayConfig = {
    revenue: { label: 'Pendapatan rata-rata', color: 'var(--color-chart-3)' },
} satisfies ChartConfig;

const paymentColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-6)',
];

export default function Dashboard({
    kpis,
    salesTrend,
    hourlyTraffic,
    topProducts,
    categoryMix,
    paymentMix,
    weekdayPerformance,
    profitTrend,
    lowStock,
    recentTransactions,
    topCustomers,
    highlights,
}: Props) {
    const brand = usePage().props.brand as Brand | undefined;

    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const paymentConfig = Object.fromEntries(
        paymentMix.map((slice, index) => [
            slice.method,
            {
                label: slice.label,
                color: paymentColors[index % paymentColors.length],
            },
        ]),
    ) satisfies ChartConfig;

    const maxProductQty = Math.max(1, ...topProducts.map((p) => p.quantity));
    const maxCategoryRevenue = Math.max(
        1,
        ...categoryMix.map((c) => c.revenue),
    );
    const totalPaymentRevenue = paymentMix.reduce(
        (sum, slice) => sum + slice.revenue,
        0,
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Dashboard"
                    description={`${brand?.name ?? 'Paylo'} · ${today}`}
                    actions={
                        <>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/reports">
                                    Laporan lengkap
                                    <ArrowRight
                                        className="size-4"
                                        aria-hidden
                                    />
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/pos">
                                    <ShoppingCart
                                        className="size-4"
                                        aria-hidden
                                    />
                                    Buka kasir
                                </Link>
                            </Button>
                        </>
                    }
                />

                {/* ── Callouts ─────────────────────────────────── */}
                {highlights.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {highlights.map((highlight) => (
                            <HighlightCard
                                key={highlight.title}
                                highlight={highlight}
                            />
                        ))}
                    </div>
                )}

                {/* ── KPI row ──────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Penjualan hari ini"
                        value={rupiah(kpis.revenue.value)}
                        trend={kpis.revenue.trend}
                        icon={Wallet}
                        accent="brand"
                    />
                    <KpiCard
                        label="Transaksi"
                        value={number(kpis.transactions.value)}
                        trend={kpis.transactions.trend}
                        icon={Receipt}
                    />
                    <KpiCard
                        label="Item terjual"
                        value={number(kpis.itemsSold.value)}
                        trend={kpis.itemsSold.trend}
                        icon={Coffee}
                    />
                    <KpiCard
                        label="Rata-rata transaksi"
                        value={rupiah(kpis.averageOrder.value)}
                        trend={kpis.averageOrder.trend}
                        icon={TrendingUp}
                    />
                </div>

                {/* ── Profitability strip ──────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Laba bersih hari ini"
                        value={rupiah(kpis.netProfit.value)}
                        trend={kpis.netProfit.trend}
                        icon={Banknote}
                        accent="success"
                    />
                    <KpiCard
                        label="Pengeluaran hari ini"
                        value={rupiah(kpis.expenses.value)}
                        trend={kpis.expenses.trend}
                        icon={TrendingUp}
                    />
                    <KpiCard
                        label="Laba kotor hari ini"
                        value={rupiah(kpis.grossProfit.value)}
                        trend={kpis.grossProfit.trend}
                        icon={Banknote}
                        accent="success"
                    />
                    <KpiCard
                        label="Margin kotor"
                        value={percent(kpis.marginPercent)}
                        hint="Pendapatan dikurangi HPP bahan baku"
                        icon={TrendingUp}
                        accent={
                            kpis.marginPercent >= 60 ? 'success' : 'warning'
                        }
                    />
                    <KpiCard
                        label="HPP hari ini"
                        value={rupiah(kpis.cogs)}
                        hint="Biaya bahan baku yang terpakai"
                        icon={Package}
                    />
                    <KpiCard
                        label={`Bulan ${kpis.monthToDate.label}`}
                        value={rupiah(kpis.monthToDate.revenue)}
                        hint={`${number(kpis.monthToDate.transactions)} transaksi · laba ${rupiahCompact(kpis.monthToDate.profit)}`}
                        icon={Wallet}
                        accent="brand"
                    />
                </div>

                {/* ── Sales trend + payment mix ────────────────── */}
                <div className="grid gap-6 xl:grid-cols-3">
                    <Panel
                        title="Tren penjualan"
                        description="Pendapatan harian selama 14 hari terakhir"
                        className="xl:col-span-2"
                    >
                        {salesTrend.some((point) => point.revenue > 0) ? (
                            <ChartContainer
                                config={salesConfig}
                                className="h-[280px] w-full"
                            >
                                <AreaChart
                                    data={salesTrend}
                                    margin={{ left: 4, right: 8, top: 8 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="revenueFill"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="var(--color-border)"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        minTickGap={16}
                                        fontSize={11}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={64}
                                        fontSize={11}
                                        tickFormatter={(value) =>
                                            rupiahCompact(Number(value))
                                        }
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) =>
                                                    name === 'revenue'
                                                        ? rupiah(Number(value))
                                                        : `${number(Number(value))} transaksi`
                                                }
                                            />
                                        }
                                    />
                                    <Area
                                        dataKey="revenue"
                                        type="monotone"
                                        stroke="var(--color-revenue)"
                                        strokeWidth={2}
                                        fill="url(#revenueFill)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <EmptyState
                                icon={TrendingUp}
                                title="Belum ada penjualan"
                                description="Grafik tren akan muncul setelah transaksi pertama tercatat."
                                action={
                                    <Button asChild size="sm">
                                        <Link href="/pos">Buka kasir</Link>
                                    </Button>
                                }
                            />
                        )}
                    </Panel>

                    <Panel
                        title="Metode pembayaran"
                        description="Porsi nilai transaksi, 30 hari terakhir"
                    >
                        {paymentMix.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                <ChartContainer
                                    config={paymentConfig}
                                    className="mx-auto h-[180px] w-full"
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="label"
                                                    formatter={(value) =>
                                                        rupiah(Number(value))
                                                    }
                                                />
                                            }
                                        />
                                        <Pie
                                            data={paymentMix}
                                            dataKey="revenue"
                                            nameKey="label"
                                            innerRadius="58%"
                                            outerRadius="88%"
                                            paddingAngle={2}
                                            strokeWidth={0}
                                        >
                                            {paymentMix.map((slice, index) => (
                                                <Cell
                                                    key={slice.method}
                                                    fill={
                                                        paymentColors[
                                                            index %
                                                                paymentColors.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>

                                <ul className="flex flex-col gap-2">
                                    {paymentMix.map((slice, index) => (
                                        <li
                                            key={slice.method}
                                            className="flex items-center justify-between gap-3 text-sm"
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <span
                                                    className="size-2.5 shrink-0 rounded-sm"
                                                    style={{
                                                        background:
                                                            paymentColors[
                                                                index %
                                                                    paymentColors.length
                                                            ],
                                                    }}
                                                    aria-hidden
                                                />
                                                <span className="truncate">
                                                    {slice.label}
                                                </span>
                                            </span>
                                            <span className="tabular shrink-0 text-muted-foreground">
                                                {percent(slice.share)} ·{' '}
                                                {rupiahCompact(slice.revenue)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <p className="border-t pt-3 text-xs text-muted-foreground">
                                    Total {rupiah(totalPaymentRevenue)} dari{' '}
                                    {number(
                                        paymentMix.reduce(
                                            (sum, s) => sum + s.transactions,
                                            0,
                                        ),
                                    )}{' '}
                                    transaksi.
                                </p>
                            </div>
                        ) : (
                            <EmptyState
                                icon={CreditCard}
                                compact
                                title="Belum ada pembayaran"
                                description="Distribusi metode pembayaran muncul setelah ada transaksi."
                            />
                        )}
                    </Panel>
                </div>

                {/* ── Peak hours ───────────────────────────────── */}
                <Panel
                    title="Jam paling ramai"
                    description={`Jumlah transaksi per jam selama ${hourlyTraffic.windowDays} hari terakhir`}
                    actions={
                        hourlyTraffic.peakHourLabel ? (
                            <StatusBadge tone="brand">
                                Puncak {hourlyTraffic.peakHourLabel}
                            </StatusBadge>
                        ) : undefined
                    }
                >
                    {hourlyTraffic.series.some(
                        (point) => point.transactions > 0,
                    ) ? (
                        <>
                            <ChartContainer
                                config={trafficConfig}
                                className="h-[240px] w-full"
                            >
                                <BarChart
                                    data={hourlyTraffic.series}
                                    margin={{ left: 4, right: 8, top: 8 }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="var(--color-border)"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        fontSize={11}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={36}
                                        fontSize={11}
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(label) =>
                                                    `Pukul ${label}`
                                                }
                                                formatter={(value) =>
                                                    `${number(Number(value))} transaksi`
                                                }
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="transactions"
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {hourlyTraffic.series.map((point) => (
                                            <Cell
                                                key={point.hour}
                                                fill={
                                                    point.hour ===
                                                    hourlyTraffic.peakHour
                                                        ? 'var(--color-chart-1)'
                                                        : 'var(--color-brand-200)'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>

                            <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
                                <Figure
                                    label="Jam tersibuk"
                                    value={hourlyTraffic.peakHourLabel ?? '—'}
                                    caption={`${number(hourlyTraffic.peakHourTransactions)} transaksi terkumpul`}
                                />
                                <Figure
                                    label="Jam tersibuk hari ini"
                                    value={
                                        hourlyTraffic.peakHourToday !== null
                                            ? `${String(hourlyTraffic.peakHourToday).padStart(2, '0')}:00`
                                            : 'Belum ada'
                                    }
                                    caption="Berdasarkan transaksi hari ini"
                                />
                                <Figure
                                    label="Jam operasional terpantau"
                                    value={`${hourlyTraffic.series[0]?.label ?? '—'} – ${hourlyTraffic.series.at(-1)?.label ?? '—'}`}
                                    caption="Rentang jam dengan aktivitas penjualan"
                                />
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={Clock}
                            title="Belum ada pola jam ramai"
                            description="Setelah beberapa hari berjualan, Paylo akan menunjukkan jam tersibuk toko Anda."
                        />
                    )}
                </Panel>

                {/* ── Products & categories ────────────────────── */}
                <div className="grid gap-6 xl:grid-cols-3">
                    <Panel
                        title="Produk paling laris"
                        description="Berdasarkan jumlah porsi terjual, 30 hari terakhir"
                        className="xl:col-span-2"
                    >
                        {topProducts.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {topProducts.map((product, index) => (
                                    <MetricBar
                                        key={product.name}
                                        rank={index + 1}
                                        label={product.name}
                                        value={`${number(product.quantity)} porsi`}
                                        ratio={product.quantity / maxProductQty}
                                        caption={`${rupiahCompact(product.revenue)} · margin ${percent(product.margin_percent)}`}
                                        tone={index === 0 ? 'brand' : 'brand'}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Coffee}
                                title="Belum ada produk terjual"
                                description="Peringkat produk terlaris muncul setelah transaksi pertama."
                            />
                        )}
                    </Panel>

                    <Panel
                        title="Kontribusi kategori"
                        description="Porsi pendapatan per kategori menu"
                    >
                        {categoryMix.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {categoryMix.map((category) => (
                                    <MetricBar
                                        key={category.name}
                                        label={category.name}
                                        value={percent(category.share)}
                                        ratio={
                                            category.revenue /
                                            maxCategoryRevenue
                                        }
                                        caption={`${rupiahCompact(category.revenue)} · ${number(category.quantity)} item`}
                                        tone="success"
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Package}
                                compact
                                title="Belum ada data kategori"
                            />
                        )}
                    </Panel>
                </div>

                {/* ── Profit + weekday ─────────────────────────── */}
                <div className="grid gap-6 xl:grid-cols-3">
                    <Panel
                        title="Pendapatan vs HPP"
                        description="Selisih keduanya adalah laba kotor harian"
                        className="xl:col-span-2"
                    >
                        {profitTrend.some((p) => p.revenue > 0) ? (
                            <ChartContainer
                                config={profitConfig}
                                className="h-[260px] w-full"
                            >
                                <LineChart
                                    data={profitTrend}
                                    margin={{ left: 4, right: 8, top: 8 }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        stroke="var(--color-border)"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        minTickGap={16}
                                        fontSize={11}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={64}
                                        fontSize={11}
                                        tickFormatter={(value) =>
                                            rupiahCompact(Number(value))
                                        }
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value) =>
                                                    rupiah(Number(value))
                                                }
                                            />
                                        }
                                    />
                                    <Line
                                        dataKey="revenue"
                                        type="monotone"
                                        stroke="var(--color-revenue)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        dataKey="cost"
                                        type="monotone"
                                        stroke="var(--color-cost)"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                    />
                                    <Line
                                        dataKey="profit"
                                        type="monotone"
                                        stroke="var(--color-profit)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <EmptyState
                                icon={Banknote}
                                title="Belum ada data laba"
                                description="Pastikan setiap produk punya resep agar HPP dan laba terhitung otomatis."
                                action={
                                    <Button asChild size="sm" variant="outline">
                                        <Link href="/hpp">Cek HPP produk</Link>
                                    </Button>
                                }
                            />
                        )}
                    </Panel>

                    <Panel
                        title="Performa per hari"
                        description="Rata-rata pendapatan, 8 minggu terakhir"
                    >
                        <ChartContainer
                            config={weekdayConfig}
                            className="h-[260px] w-full"
                        >
                            <BarChart
                                data={weekdayPerformance}
                                margin={{ left: 4, right: 8, top: 8 }}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    stroke="var(--color-border)"
                                />
                                <XAxis
                                    dataKey="weekday"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    interval={0}
                                    fontSize={11}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={56}
                                    fontSize={11}
                                    tickFormatter={(value) =>
                                        rupiahCompact(Number(value))
                                    }
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value) =>
                                                rupiah(Number(value))
                                            }
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--color-revenue)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </Panel>
                </div>

                {/* ── Operations ───────────────────────────────── */}
                <div className="grid gap-6 xl:grid-cols-3">
                    <Panel
                        title="Transaksi terakhir"
                        description="Delapan transaksi paling baru"
                        className="xl:col-span-2"
                        padded={false}
                        actions={
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/reports">Lihat semua</Link>
                            </Button>
                        }
                    >
                        {recentTransactions.length > 0 ? (
                            <DataTable>
                                <thead>
                                    <tr>
                                        <Th>Waktu</Th>
                                        <Th>Nomor</Th>
                                        <Th>Pelanggan</Th>
                                        <Th>Metode</Th>
                                        <Th numeric>Item</Th>
                                        <Th numeric>Total</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map((transaction) => (
                                        <Tr key={transaction.id}>
                                            <Td
                                                muted
                                                className="whitespace-nowrap"
                                            >
                                                {transaction.time}
                                            </Td>
                                            <Td className="font-medium whitespace-nowrap">
                                                {transaction.number}
                                            </Td>
                                            <Td className="max-w-[140px] truncate">
                                                {transaction.customer}
                                            </Td>
                                            <Td>
                                                <StatusBadge
                                                    tone="neutral"
                                                    dot={false}
                                                >
                                                    {transaction.payment_label}
                                                </StatusBadge>
                                            </Td>
                                            <Td numeric>
                                                {number(transaction.items)}
                                            </Td>
                                            <Td
                                                numeric
                                                className="font-semibold"
                                            >
                                                {rupiah(transaction.total)}
                                            </Td>
                                        </Tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        ) : (
                            <div className="p-5">
                                <EmptyState
                                    icon={Receipt}
                                    title="Belum ada transaksi"
                                    description="Transaksi yang diselesaikan di kasir akan muncul di sini."
                                    action={
                                        <Button asChild size="sm">
                                            <Link href="/pos">
                                                Buat transaksi
                                            </Link>
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </Panel>

                    <div className="flex flex-col gap-6">
                        <Panel
                            title="Stok menipis"
                            description="Bahan yang mencapai batas minimum"
                            actions={
                                lowStock.length > 0 ? (
                                    <StatusBadge tone="warning">
                                        {lowStock.length} bahan
                                    </StatusBadge>
                                ) : undefined
                            }
                        >
                            {lowStock.length > 0 ? (
                                <ul className="flex flex-col gap-3">
                                    {lowStock.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-start justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm leading-5 font-medium">
                                                    {item.name}
                                                </p>
                                                <p className="tabular text-xs leading-4 text-muted-foreground">
                                                    Sisa{' '}
                                                    {decimal(
                                                        item.current_stock,
                                                        0,
                                                    )}{' '}
                                                    dari minimum{' '}
                                                    {decimal(item.min_stock, 0)}{' '}
                                                    {item.unit}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                tone={
                                                    item.is_out
                                                        ? 'danger'
                                                        : 'warning'
                                                }
                                            >
                                                {item.is_out
                                                    ? 'Habis'
                                                    : `${item.ratio}%`}
                                            </StatusBadge>
                                        </li>
                                    ))}
                                    <li className="pt-1">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Link href="/inventory">
                                                Kelola inventori
                                            </Link>
                                        </Button>
                                    </li>
                                </ul>
                            ) : (
                                <EmptyState
                                    icon={Package}
                                    compact
                                    title="Semua stok aman"
                                    description="Tidak ada bahan yang berada di bawah batas minimum."
                                />
                            )}
                        </Panel>

                        <Panel
                            title="Pelanggan teratas"
                            description="Berdasarkan belanja 90 hari terakhir"
                        >
                            {topCustomers.length > 0 ? (
                                <ul className="flex flex-col gap-3">
                                    {topCustomers.map((customer, index) => (
                                        <li
                                            key={customer.id}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <span className="flex min-w-0 items-center gap-2.5">
                                                <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                                                    {index + 1}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm leading-5 font-medium">
                                                        {customer.name}
                                                    </span>
                                                    <span className="block text-xs leading-4 text-muted-foreground">
                                                        {number(
                                                            customer.visits,
                                                        )}{' '}
                                                        kunjungan
                                                    </span>
                                                </span>
                                            </span>
                                            <span className="tabular shrink-0 text-sm font-semibold">
                                                {rupiahCompact(customer.spent)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState
                                    icon={Users}
                                    compact
                                    title="Belum ada pelanggan terdaftar"
                                    description="Catat pelanggan di kasir untuk melihat siapa yang paling sering datang."
                                />
                            )}
                        </Panel>
                    </div>
                </div>
            </div>
        </>
    );
}

function Figure({
    label,
    value,
    caption,
}: {
    label: string;
    value: string;
    caption: string;
}) {
    return (
        <div>
            <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="tabular mt-1 text-base leading-6 font-semibold text-foreground">
                {value}
            </p>
            <p className="text-xs leading-4 text-muted-foreground">{caption}</p>
        </div>
    );
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
    const tones = {
        info: { wrap: 'bg-info-soft text-info', Icon: Info },
        success: { wrap: 'bg-success-soft text-success', Icon: Lightbulb },
        warning: { wrap: 'bg-warning-soft text-warning', Icon: AlertTriangle },
    } as const;

    const { wrap, Icon } = tones[highlight.tone];

    return (
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${wrap}`}
            >
                <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="text-sm leading-5 font-semibold text-foreground">
                    {highlight.title}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {highlight.body}
                </p>
            </div>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};
