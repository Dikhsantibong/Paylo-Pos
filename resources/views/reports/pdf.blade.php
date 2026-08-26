@php
    /**
     * Financial report — print layout.
     *
     * DomPDF cannot fetch remote images reliably, so the logo is embedded as a
     * data URI from the absolute path resolved by the settings repository.
     */
    $logoData = null;
    $logoPath = $shop['logo_path'] ?? null;

    if ($logoPath && is_file($logoPath)) {
        $mime = @mime_content_type($logoPath) ?: 'image/png';
        $logoData = 'data:'.$mime.';base64,'.base64_encode(file_get_contents($logoPath));
    }

    $rupiah = fn ($v) => 'Rp '.number_format((int) $v, 0, ',', '.');
    $number = fn ($v) => number_format((int) $v, 0, ',', '.');
    $percent = fn ($v) => number_format((float) $v, 1, ',', '.').'%';
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan {{ $shop['name'] }} — {{ $period['label'] }}</title>
    <style>
        @page { margin: 26mm 16mm 22mm 16mm; }

        * { box-sizing: border-box; }

        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 9.5px;
            line-height: 1.5;
            color: #101828;
            margin: 0;
        }

        /* ---- Running header / footer ---- */
        header {
            position: fixed;
            top: -18mm; left: 0; right: 0;
            height: 16mm;
            border-bottom: 1.5px solid #2563EB;
        }
        header .brand { font-size: 11px; font-weight: bold; color: #101828; }
        header .meta  { font-size: 8px; color: #667085; }

        footer {
            position: fixed;
            bottom: -14mm; left: 0; right: 0;
            height: 12mm;
            border-top: 1px solid #EAECF0;
            padding-top: 4px;
            font-size: 7.5px;
            color: #98A2B3;
        }
        .pagenum:after { content: counter(page); }
        .pagecount:after { content: counter(pages); }

        /* ---- Cover block ---- */
        .doc-head { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        .doc-head td { vertical-align: top; padding: 0; }
        .logo-box { width: 62px; }
        .logo-box img { width: 56px; height: 56px; object-fit: contain; }
        .logo-fallback {
            width: 56px; height: 56px; border-radius: 8px;
            background: #2563EB; color: #fff;
            text-align: center; line-height: 56px;
            font-size: 20px; font-weight: bold;
        }
        .shop-name { font-size: 17px; font-weight: bold; color: #101828; letter-spacing: -0.2px; }
        .shop-tagline { font-size: 9px; color: #475467; margin-top: 1px; }
        .shop-contact { font-size: 8.5px; color: #667085; margin-top: 5px; }
        .doc-title-box { text-align: right; }
        .doc-kicker {
            display: inline-block;
            background: #EFF6FF; color: #155EEF;
            font-size: 7.5px; font-weight: bold; letter-spacing: 0.8px;
            padding: 3px 8px; border-radius: 4px;
            text-transform: uppercase;
        }
        .doc-title { font-size: 14px; font-weight: bold; margin-top: 6px; }
        .doc-period { font-size: 9px; color: #475467; }
        .doc-generated { font-size: 8px; color: #98A2B3; margin-top: 3px; }

        .rule { height: 2px; background: #101828; margin: 0 0 14px 0; }

        /* ---- Sections ---- */
        .section { margin-bottom: 16px; page-break-inside: avoid; }
        .section-title {
            font-size: 10px; font-weight: bold;
            text-transform: uppercase; letter-spacing: 0.7px;
            color: #101828;
            border-left: 3px solid #2563EB;
            padding-left: 7px;
            margin-bottom: 7px;
        }

        /* ---- KPI strip ---- */
        .kpi { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin-left: -6px; }
        .kpi td {
            width: 25%;
            border: 1px solid #EAECF0; border-radius: 6px;
            padding: 8px 9px;
            background: #FCFCFD;
        }
        .kpi .k-label { font-size: 7.5px; color: #667085; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi .k-value { font-size: 13px; font-weight: bold; color: #101828; padding-top: 2px; }
        .kpi .k-sub   { font-size: 7.5px; color: #667085; padding-top: 1px; }
        .up { color: #039855; }
        .down { color: #D92D20; }

        /* ---- Tables ---- */
        table.data { width: 100%; border-collapse: collapse; }
        table.data th {
            background: #F9FAFB;
            border-top: 1px solid #EAECF0;
            border-bottom: 1px solid #EAECF0;
            padding: 6px 7px;
            font-size: 7.5px; font-weight: bold;
            text-transform: uppercase; letter-spacing: 0.5px;
            color: #475467;
            text-align: left;
        }
        table.data td {
            border-bottom: 1px solid #F2F4F7;
            padding: 5px 7px;
        }
        table.data tr.total td {
            border-top: 1.5px solid #101828;
            border-bottom: none;
            font-weight: bold;
            background: #F9FAFB;
        }
        .num { text-align: right; font-family: "DejaVu Sans Mono", monospace; }
        .center { text-align: center; }
        .muted { color: #667085; }

        /* ---- P&L ---- */
        table.pl { width: 100%; border-collapse: collapse; }
        table.pl td { padding: 6px 8px; border-bottom: 1px solid #F2F4F7; }
        table.pl td.label { color: #475467; }
        table.pl td.value { text-align: right; font-family: "DejaVu Sans Mono", monospace; }
        table.pl tr.emphasis td { font-weight: bold; color: #101828; background: #F9FAFB; }
        table.pl tr.result td {
            border-top: 1.5px solid #101828;
            border-bottom: 1.5px solid #101828;
            font-weight: bold; font-size: 11px;
            background: #ECFDF3; color: #027A48;
        }
        .negative { color: #D92D20; }

        .badge {
            display: inline-block; padding: 1px 5px; border-radius: 3px;
            font-size: 7px; font-weight: bold; letter-spacing: 0.3px;
            background: #F2F4F7; color: #475467;
        }

        .empty { padding: 14px; text-align: center; color: #98A2B3; font-style: italic; border: 1px dashed #EAECF0; border-radius: 6px; }
    </style>
</head>
<body>

<header>
    <table style="width:100%; border-collapse:collapse;">
        <tr>
            <td style="padding:0; vertical-align:middle;">
                <span class="brand">{{ $shop['name'] }}</span>
            </td>
            <td style="padding:0; text-align:right; vertical-align:middle;">
                <span class="meta">Laporan Penjualan &amp; Laba · {{ $period['label'] }}</span>
            </td>
        </tr>
    </table>
</header>

<footer>
    <table style="width:100%; border-collapse:collapse;">
        <tr>
            <td style="padding:0;">
                Dicetak {{ $generatedAt }}@if(!empty($generatedBy)) oleh {{ $generatedBy }}@endif · Dokumen ini dihasilkan otomatis oleh Paylo POS
            </td>
            <td style="padding:0; text-align:right;">
                Halaman <span class="pagenum"></span> / <span class="pagecount"></span>
            </td>
        </tr>
    </table>
</footer>

{{-- ── Document head ───────────────────────────────────────── --}}
<table class="doc-head">
    <tr>
        <td class="logo-box">
            @if($logoData)
                <img src="{{ $logoData }}" alt="{{ $shop['name'] }}">
            @else
                <div class="logo-fallback">{{ strtoupper(mb_substr($shop['name'], 0, 1)) }}</div>
            @endif
        </td>
        <td style="padding-left:10px;">
            <div class="shop-name">{{ $shop['name'] }}</div>
            @if($shop['tagline'])
                <div class="shop-tagline">{{ $shop['tagline'] }}</div>
            @endif
            <div class="shop-contact">
                @if($shop['address']){{ $shop['address'] }}@endif
                @if($shop['phone'])<br>Telp {{ $shop['phone'] }}@endif
                @if($shop['email']) · {{ $shop['email'] }}@endif
            </div>
        </td>
        <td class="doc-title-box">
            <span class="doc-kicker">Laporan Penjualan</span>
            <div class="doc-title">Ringkasan Penjualan &amp; Laba</div>
            <div class="doc-period">Periode {{ $period['label'] }}</div>
            <div class="doc-generated">{{ $period['days'] }} hari · dicetak {{ $generatedAt }}</div>
        </td>
    </tr>
</table>

<div class="rule"></div>

{{-- ── KPI strip ───────────────────────────────────────────── --}}
<div class="section">
    <table class="kpi">
        <tr>
            <td>
                <div class="k-label">Pendapatan kotor</div>
                <div class="k-value">{{ $rupiah($summary['revenue']) }}</div>
                <div class="k-sub {{ $summary['revenueTrend'] >= 0 ? 'up' : 'down' }}">
                    {{ $summary['revenueTrend'] >= 0 ? '▲' : '▼' }} {{ $percent(abs($summary['revenueTrend'])) }} vs periode sebelumnya
                </div>
            </td>
            <td>
                <div class="k-label">Transaksi</div>
                <div class="k-value">{{ $number($summary['transactions']) }}</div>
                <div class="k-sub">{{ $number($summary['itemsSold']) }} item terjual</div>
            </td>
            <td>
                <div class="k-label">Laba kotor</div>
                <div class="k-value">{{ $rupiah($summary['grossProfit']) }}</div>
                <div class="k-sub">Margin {{ $percent($summary['marginPercent']) }}</div>
            </td>
            <td>
                <div class="k-label">Rata-rata transaksi</div>
                <div class="k-value">{{ $rupiah($summary['averageOrderValue']) }}</div>
                <div class="k-sub">{{ number_format($summary['averageItemsPerOrder'], 1, ',', '.') }} item / transaksi</div>
            </td>
        </tr>
    </table>
</div>

{{-- ── Profit & loss ───────────────────────────────────────── --}}
<div class="section">
    <div class="section-title">Laporan laba rugi</div>
    <table class="pl">
        <tr>
            <td class="label">Penjualan kotor (subtotal)</td>
            <td class="value">{{ $rupiah($summary['subtotal']) }}</td>
        </tr>
        <tr>
            <td class="label">Diskon</td>
            <td class="value negative">({{ $rupiah($summary['discount']) }})</td>
        </tr>
        <tr>
            <td class="label">{{ $shop['tax_label'] }}</td>
            <td class="value">{{ $rupiah($summary['tax']) }}</td>
        </tr>
        <tr class="emphasis">
            <td class="label">Total tertagih</td>
            <td class="value">{{ $rupiah($summary['revenue']) }}</td>
        </tr>
        <tr>
            <td class="label">Pendapatan bersih (di luar {{ $shop['tax_label'] }})</td>
            <td class="value">{{ $rupiah($summary['netRevenue']) }}</td>
        </tr>
        <tr>
            <td class="label">HPP — harga pokok penjualan</td>
            <td class="value negative">({{ $rupiah($summary['cogs']) }})</td>
        </tr>
        <tr class="result">
            <td class="label">Laba kotor</td>
            <td class="value">{{ $rupiah($summary['grossProfit']) }}</td>
        </tr>
    </table>

    <table class="data" style="margin-top:8px;">
        <tr>
            <th>Margin kotor</th>
            <th>Food cost</th>
            <th>Rata-rata harian</th>
            <th>Item per transaksi</th>
        </tr>
        <tr>
            <td class="num">{{ $percent($summary['marginPercent']) }}</td>
            <td class="num">{{ $percent($summary['foodCostPercent']) }}</td>
            <td class="num">{{ $rupiah($summary['dailyAverage']) }}</td>
            <td class="num">{{ number_format($summary['averageItemsPerOrder'], 1, ',', '.') }}</td>
        </tr>
    </table>
</div>

{{-- ── Products ────────────────────────────────────────────── --}}
<div class="section">
    <div class="section-title">Penjualan per produk</div>
    @if(count($products))
        <table class="data">
            <thead>
                <tr>
                    <th style="width:34%">Produk</th>
                    <th class="num" style="width:10%">Qty</th>
                    <th class="num" style="width:16%">Pendapatan</th>
                    <th class="num" style="width:16%">HPP</th>
                    <th class="num" style="width:16%">Laba</th>
                    <th class="num" style="width:8%">Margin</th>
                </tr>
            </thead>
            <tbody>
                @foreach(array_slice($products, 0, 40) as $row)
                <tr>
                    <td>{{ $row['name'] }}</td>
                    <td class="num">{{ $number($row['quantity']) }}</td>
                    <td class="num">{{ $rupiah($row['revenue']) }}</td>
                    <td class="num muted">{{ $rupiah($row['cost']) }}</td>
                    <td class="num">{{ $rupiah($row['profit']) }}</td>
                    <td class="num">{{ $percent($row['margin_percent']) }}</td>
                </tr>
                @endforeach
                <tr class="total">
                    <td>Total</td>
                    <td class="num">{{ $number(array_sum(array_column($products, 'quantity'))) }}</td>
                    <td class="num">{{ $rupiah(array_sum(array_column($products, 'revenue'))) }}</td>
                    <td class="num">{{ $rupiah(array_sum(array_column($products, 'cost'))) }}</td>
                    <td class="num">{{ $rupiah(array_sum(array_column($products, 'profit'))) }}</td>
                    <td class="num"></td>
                </tr>
            </tbody>
        </table>
        @if(count($products) > 40)
            <div class="muted" style="font-size:7.5px; margin-top:4px;">Menampilkan 40 produk teratas dari {{ count($products) }} produk.</div>
        @endif
    @else
        <div class="empty">Tidak ada penjualan pada periode ini.</div>
    @endif
</div>

{{-- ── Payment mix ─────────────────────────────────────────── --}}
<div class="section">
    <div class="section-title">Metode pembayaran</div>
    @if(count($payments))
        <table class="data">
            <thead>
                <tr>
                    <th style="width:40%">Metode</th>
                    <th class="num">Transaksi</th>
                    <th class="num">Nilai</th>
                    <th class="num">Porsi</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payments as $row)
                <tr>
                    <td>{{ $row['label'] }}</td>
                    <td class="num">{{ $number($row['transactions']) }}</td>
                    <td class="num">{{ $rupiah($row['revenue']) }}</td>
                    <td class="num">{{ $percent($row['share']) }}</td>
                </tr>
                @endforeach
                <tr class="total">
                    <td>Total</td>
                    <td class="num">{{ $number(array_sum(array_column($payments, 'transactions'))) }}</td>
                    <td class="num">{{ $rupiah(array_sum(array_column($payments, 'revenue'))) }}</td>
                    <td class="num">100,0%</td>
                </tr>
            </tbody>
        </table>
    @else
        <div class="empty">Belum ada pembayaran tercatat.</div>
    @endif
</div>

{{-- ── Cashier performance ─────────────────────────────────── --}}
@if(count($cashiers))
<div class="section">
    <div class="section-title">Kinerja kasir</div>
    <table class="data">
        <thead>
            <tr>
                <th style="width:40%">Kasir</th>
                <th class="num">Transaksi</th>
                <th class="num">Nilai</th>
                <th class="num">Rata-rata</th>
            </tr>
        </thead>
        <tbody>
            @foreach($cashiers as $row)
            <tr>
                <td>{{ $row['name'] }}</td>
                <td class="num">{{ $number($row['transactions']) }}</td>
                <td class="num">{{ $rupiah($row['revenue']) }}</td>
                <td class="num">{{ $rupiah($row['average']) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

{{-- ── Transaction ledger ──────────────────────────────────── --}}
<div class="section" style="page-break-before: always;">
    <div class="section-title">Rincian transaksi</div>
    @if(count($transactions))
        <table class="data">
            <thead>
                <tr>
                    <th style="width:15%">Waktu</th>
                    <th style="width:19%">Nomor</th>
                    <th style="width:18%">Pelanggan</th>
                    <th style="width:14%">Kasir</th>
                    <th class="num" style="width:7%">Qty</th>
                    <th class="center" style="width:12%">Metode</th>
                    <th class="num" style="width:15%">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $row)
                <tr>
                    <td class="muted">{{ $row['datetime'] }}</td>
                    <td>{{ $row['number'] }}</td>
                    <td>{{ $row['customer'] }}</td>
                    <td class="muted">{{ $row['cashier'] }}</td>
                    <td class="num">{{ $number($row['quantity']) }}</td>
                    <td class="center"><span class="badge">{{ $row['payment_label'] }}</span></td>
                    <td class="num">{{ $rupiah($row['total']) }}</td>
                </tr>
                @endforeach
                <tr class="total">
                    <td colspan="4">Total {{ count($transactions) }} transaksi</td>
                    <td class="num">{{ $number(array_sum(array_column($transactions, 'quantity'))) }}</td>
                    <td></td>
                    <td class="num">{{ $rupiah(array_sum(array_column($transactions, 'total'))) }}</td>
                </tr>
            </tbody>
        </table>
    @else
        <div class="empty">Tidak ada transaksi pada periode ini.</div>
    @endif
</div>

</body>
</html>
