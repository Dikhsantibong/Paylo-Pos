import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    CalendarRange,
    Download,
    FileSpreadsheet,
    FileText,
    Receipt,
} from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { decimal, number, percent, rupiah, rupiahCompact } from '@/lib/format';
import type { Report } from '@/types';

type Props = {
    report: Report;
    presets: { value: string; label: string }[];
};

const timelineConfig = {
    revenue: { label: 'Pendapatan', color: 'var(--color-chart-1)' },
    profit: { label: 'Laba kotor', color: 'var(--color-chart-5)' },
} satisfies ChartConfig;

const paymentColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-6)',
];

export default function ReportsIndex({ report, presets }: Props) {
    const {
        period,
        summary,
        timeline,
        products,
        categories,
        payments,
        cashiers,
        transactions,
    } = report;

    const [preset, setPreset] = useState(period.preset);
    const [start, setStart] = useState(period.start);
    const [end, setEnd] = useState(period.end);

    const applyPreset = (value: string) => {
        setPreset(value);

        if (value !== 'custom') {
            router.get(
                '/reports',
                { preset: value },
                { preserveState: true, preserveScroll: true },
            );
        }
    };

    const applyCustom = () => {
        router.get(
            '/reports',
            { preset: 'custom', start, end },
            { preserveState: true, preserveScroll: true },
        );
    };

    const exportQuery = new URLSearchParams(
        preset === 'custom' ? { preset: 'custom', start, end } : { preset },
    ).toString();

    const maxCategoryRevenue = Math.max(1, ...categories.map((c) => c.revenue));

    const paymentConfig = Object.fromEntries(
        payments.map((slice, index) => [
            slice.method,
            {
                label: slice.label,
                color: paymentColors[index % paymentColors.length],
            },
        ]),
    ) satisfies ChartConfig;

    const hasSales = summary.transactions > 0;

    return (
        <>
            <Head title="Laporan" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={BarChart3}
                    title="Laporan penjualan"
                    description={`${period.label} · ${period.days} hari`}
                    actions={
                        <>
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={`/reports/export/excel?${exportQuery}`}
                                >
                                    <FileSpreadsheet
                                        className="size-4"
                                        aria-hidden
                                    />
                                    Excel
                                </a>
                            </Button>
                            <Button asChild size="sm">
                                <a href={`/reports/export/pdf?${exportQuery}`}>
                                    <FileText className="size-4" aria-hidden />
                                    PDF
                                </a>
                            </Button>
                        </>
                    }
                />

                {/* ── Period picker ────────────────────────────── */}
                <Panel padded={false}>
                    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-end md:gap-5 md:p-5">
                        <div className="flex flex-col gap-1.5 md:w-56">
                            <Label className="text-xs leading-4 font-medium text-muted-foreground">
                                Periode
                            </Label>
                            <Select value={preset} onValueChange={applyPreset}>
                                <SelectTrigger className="h-10 w-full">
                                    <CalendarRange
                                        className="size-4 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {presets.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {preset === 'custom' && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="start"
                                        className="text-xs leading-4 font-medium text-muted-foreground"
                                    >
                                        Dari
                                    </Label>
                                    <Input
                                        id="start"
                                        type="date"
                                        value={start}
                                        onChange={(event) =>
                                            setStart(event.target.value)
                                        }
                                        className="h-10"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="end"
                                        className="text-xs leading-4 font-medium text-muted-foreground"
                                    >
                                        Sampai
                                    </Label>
                                    <Input
                                        id="end"
                                        type="date"
                                        value={end}
                                        onChange={(event) =>
                                            setEnd(event.target.value)
                                        }
                                        className="h-10"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={applyCustom}
                                    className="h-10"
                                >
                                    Terapkan
                                </Button>
                            </>
                        )}

                        <p className="ml-auto text-xs leading-5 text-muted-foreground">
                            Dibandingkan dengan periode sebelumnya yang sama
                            panjang.
                        </p>
                    </div>
                </Panel>

                {!hasSales ? (
                    <Panel>
                        <EmptyState
                            icon={Receipt}
                            title="Tidak ada transaksi pada periode ini"
                            description="Pilih rentang tanggal lain, atau mulai mencatat penjualan lewat layar kasir."
                            action={
                                <Button asChild size="sm">
                                    <a href="/pos">Buka kasir</a>
                                </Button>
                            }
                        />
                    </Panel>
                ) : (
                    <>
                        {/* ── KPIs ─────────────────────────────── */}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <KpiCard
                                label="Pendapatan kotor"
                                value={rupiah(summary.revenue)}
                                trend={summary.revenueTrend}
                                trendLabel="vs periode lalu"
                                accent="brand"
                            />
                            <KpiCard
                                label="Transaksi"
                                value={number(summary.transactions)}
                                trend={summary.transactionsTrend}
                                trendLabel="vs periode lalu"
                            />
                            <KpiCard
                                label="Laba kotor"
                                value={rupiah(summary.grossProfit)}
                                trend={summary.profitTrend}
                                trendLabel="vs periode lalu"
                                accent="success"
                            />
                            <KpiCard
                                label="Rata-rata transaksi"
                                value={rupiah(summary.averageOrderValue)}
                                hint={`${decimal(summary.averageItemsPerOrder)} item per transaksi`}
                            />
                        </div>

                        {/* ── P&L + timeline ───────────────────── */}
                        <div className="grid gap-6 xl:grid-cols-3">
                            <Panel
                                title="Tren periode"
                                description="Pendapatan dan laba kotor sepanjang periode"
                                className="xl:col-span-2"
                            >
                                <ChartContainer
                                    config={timelineConfig}
                                    className="h-[300px] w-full"
                                >
                                    <AreaChart
                                        data={timeline}
                                        margin={{ left: 4, right: 8, top: 8 }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="reportRevenue"
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
                                            <linearGradient
                                                id="reportProfit"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="var(--color-profit)"
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="var(--color-profit)"
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
                                            minTickGap={20}
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
                                        <Area
                                            dataKey="revenue"
                                            type="monotone"
                                            stroke="var(--color-revenue)"
                                            strokeWidth={2}
                                            fill="url(#reportRevenue)"
                                        />
                                        <Area
                                            dataKey="profit"
                                            type="monotone"
                                            stroke="var(--color-profit)"
                                            strokeWidth={2}
                                            fill="url(#reportProfit)"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </Panel>

                            <Panel
                                title="Laba rugi"
                                description="Ringkasan keuangan periode ini"
                            >
                                <dl className="flex flex-col text-sm">
                                    <PlRow
                                        label="Penjualan kotor"
                                        value={rupiah(summary.subtotal)}
                                    />
                                    <PlRow
                                        label="Diskon"
                                        value={`− ${rupiah(summary.discount)}`}
                                        tone="negative"
                                    />
                                    <PlRow
                                        label={report.shop.tax_label}
                                        value={rupiah(summary.tax)}
                                    />
                                    <PlRow
                                        label="Total tertagih"
                                        value={rupiah(summary.revenue)}
                                        emphasis
                                    />
                                    <PlRow
                                        label="Pendapatan bersih"
                                        value={rupiah(summary.netRevenue)}
                                    />
                                    <PlRow
                                        label="HPP bahan baku"
                                        value={`− ${rupiah(summary.cogs)}`}
                                        tone="negative"
                                    />

                                    <div className="mt-2 flex items-baseline justify-between rounded-lg bg-success-soft px-3 py-3">
                                        <dt className="text-sm leading-5 font-semibold text-success">
                                            Laba kotor
                                        </dt>
                                        <dd className="tabular text-lg leading-7 font-bold text-success">
                                            {rupiah(summary.grossProfit)}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                                    <Figure
                                        label="Margin kotor"
                                        value={percent(summary.marginPercent)}
                                    />
                                    <Figure
                                        label="Food cost"
                                        value={percent(summary.foodCostPercent)}
                                    />
                                    <Figure
                                        label="Rata-rata harian"
                                        value={rupiahCompact(
                                            summary.dailyAverage,
                                        )}
                                    />
                                    <Figure
                                        label="Item terjual"
                                        value={number(summary.itemsSold)}
                                    />
                                </div>
                            </Panel>
                        </div>

                        {/* ── Products / categories / payments ─── */}
                        <div className="grid gap-6 xl:grid-cols-3">
                            <Panel
                                title="Produk terlaris"
                                description="Peringkat berdasarkan pendapatan"
                                className="xl:col-span-2"
                                padded={false}
                            >
                                <DataTable maxHeight="420px">
                                    <thead>
                                        <tr>
                                            <Th>Produk</Th>
                                            <Th numeric>Qty</Th>
                                            <Th numeric>Pendapatan</Th>
                                            <Th numeric>HPP</Th>
                                            <Th numeric>Laba</Th>
                                            <Th numeric>Margin</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((row) => (
                                            <Tr key={row.name}>
                                                <Td className="font-medium">
                                                    {row.name}
                                                </Td>
                                                <Td numeric>
                                                    {number(row.quantity)}
                                                </Td>
                                                <Td numeric>
                                                    {rupiah(row.revenue)}
                                                </Td>
                                                <Td numeric muted>
                                                    {rupiah(row.cost)}
                                                </Td>
                                                <Td
                                                    numeric
                                                    className="font-semibold"
                                                >
                                                    {rupiah(row.profit)}
                                                </Td>
                                                <Td numeric>
                                                    <StatusBadge
                                                        tone={
                                                            row.margin_percent >=
                                                            60
                                                                ? 'success'
                                                                : row.margin_percent >=
                                                                    40
                                                                  ? 'warning'
                                                                  : 'danger'
                                                        }
                                                        dot={false}
                                                    >
                                                        {percent(
                                                            row.margin_percent,
                                                        )}
                                                    </StatusBadge>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </tbody>
                                </DataTable>
                            </Panel>

                            <div className="flex flex-col gap-6">
                                <Panel
                                    title="Metode pembayaran"
                                    description="Porsi nilai transaksi"
                                >
                                    <ChartContainer
                                        config={paymentConfig}
                                        className="mx-auto h-[160px] w-full"
                                    >
                                        <PieChart>
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        nameKey="label"
                                                        formatter={(value) =>
                                                            rupiah(
                                                                Number(value),
                                                            )
                                                        }
                                                    />
                                                }
                                            />
                                            <Pie
                                                data={payments}
                                                dataKey="revenue"
                                                nameKey="label"
                                                innerRadius="58%"
                                                outerRadius="88%"
                                                paddingAngle={2}
                                                strokeWidth={0}
                                            >
                                                {payments.map(
                                                    (slice, index) => (
                                                        <Cell
                                                            key={slice.method}
                                                            fill={
                                                                paymentColors[
                                                                    index %
                                                                        paymentColors.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>

                                    <ul className="mt-3 flex flex-col gap-2">
                                        {payments.map((slice, index) => (
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
                                                    {percent(slice.share)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </Panel>

                                <Panel
                                    title="Kategori"
                                    description="Kontribusi pendapatan"
                                >
                                    <div className="flex flex-col gap-4">
                                        {categories.map((category) => (
                                            <MetricBar
                                                key={category.name}
                                                label={category.name}
                                                value={percent(category.share)}
                                                ratio={
                                                    category.revenue /
                                                    maxCategoryRevenue
                                                }
                                                caption={rupiahCompact(
                                                    category.revenue,
                                                )}
                                                tone="success"
                                            />
                                        ))}
                                    </div>
                                </Panel>
                            </div>
                        </div>

                        {/* ── Cashiers ─────────────────────────── */}
                        {cashiers.length > 0 && (
                            <Panel
                                title="Kinerja kasir"
                                description="Nilai transaksi yang diproses tiap kasir"
                            >
                                <ChartContainer
                                    config={{
                                        revenue: {
                                            label: 'Pendapatan',
                                            color: 'var(--color-chart-3)',
                                        },
                                    }}
                                    className="h-[220px] w-full"
                                >
                                    <BarChart
                                        data={cashiers}
                                        margin={{ left: 4, right: 8, top: 8 }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            strokeDasharray="3 3"
                                            stroke="var(--color-border)"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
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
                                        <Bar
                                            dataKey="revenue"
                                            fill="var(--color-revenue)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </Panel>
                        )}

                        {/* ── Ledger ───────────────────────────── */}
                        <Panel
                            title="Rincian transaksi"
                            description={`${transactions.length} transaksi terbaru pada periode ini`}
                            padded={false}
                            actions={
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={`/reports/export/excel?${exportQuery}`}
                                    >
                                        <Download
                                            className="size-4"
                                            aria-hidden
                                        />
                                        Unduh semua
                                    </a>
                                </Button>
                            }
                        >
                            <DataTable maxHeight="520px">
                                <thead>
                                    <tr>
                                        <Th>Waktu</Th>
                                        <Th>Nomor</Th>
                                        <Th>Pelanggan</Th>
                                        <Th>Kasir</Th>
                                        <Th>Metode</Th>
                                        <Th numeric>Qty</Th>
                                        <Th numeric>Total</Th>
                                        <Th numeric>Laba</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((row) => (
                                        <Tr key={row.id}>
                                            <Td
                                                muted
                                                className="whitespace-nowrap"
                                            >
                                                {row.datetime}
                                            </Td>
                                            <Td className="font-medium whitespace-nowrap">
                                                {row.number}
                                            </Td>
                                            <Td className="max-w-[160px] truncate">
                                                {row.customer}
                                            </Td>
                                            <Td
                                                muted
                                                className="max-w-[140px] truncate"
                                            >
                                                {row.cashier}
                                            </Td>
                                            <Td>
                                                <StatusBadge
                                                    tone="neutral"
                                                    dot={false}
                                                >
                                                    {row.payment_label}
                                                </StatusBadge>
                                            </Td>
                                            <Td numeric>
                                                {number(row.quantity)}
                                            </Td>
                                            <Td
                                                numeric
                                                className="font-semibold"
                                            >
                                                {rupiah(row.total)}
                                            </Td>
                                            <Td numeric muted>
                                                {rupiah(row.profit)}
                                            </Td>
                                        </Tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        </Panel>

                        <p className="text-xs leading-5 text-muted-foreground">
                            Ekspor PDF dan Excel memuat logo, identitas toko,
                            periode, dan tanggal cetak — lengkap dengan
                            ringkasan laba rugi serta rincian transaksi yang
                            sama seperti di layar ini.
                        </p>
                    </>
                )}
            </div>
        </>
    );
}

function PlRow({
    label,
    value,
    tone,
    emphasis,
}: {
    label: string;
    value: string;
    tone?: 'negative';
    emphasis?: boolean;
}) {
    return (
        <div
            className={
                'flex items-baseline justify-between border-b py-2.5 last:border-b-0 ' +
                (emphasis ? 'font-semibold' : '')
            }
        >
            <dt
                className={
                    emphasis ? 'text-foreground' : 'text-muted-foreground'
                }
            >
                {label}
            </dt>
            <dd
                className={`tabular ${tone === 'negative' ? 'text-destructive' : 'text-foreground'}`}
            >
                {value}
            </dd>
        </div>
    );
}

function Figure({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs leading-4 font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="tabular mt-0.5 text-base leading-6 font-semibold">
                {value}
            </p>
        </div>
    );
}

ReportsIndex.layout = { breadcrumbs: [{ title: 'Laporan', href: '/reports' }] };
