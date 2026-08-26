@php
    /**
     * Financial report — spreadsheet layout.
     *
     * Maatwebsite renders this HTML table into the worksheet, so styling stays
     * inline. Numbers are emitted raw (no "Rp") where a real number is more
     * useful to the reader, and formatted where the cell is a label.
     */
    $rupiah = fn ($v) => 'Rp '.number_format((int) $v, 0, ',', '.');
    $percent = fn ($v) => number_format((float) $v, 1, ',', '.').'%';

    $ink = '#101828';
    $muted = '#667085';
    $line = '#EAECF0';
    $brand = '#2563EB';
    $soft = '#F9FAFB';

    $th = "background-color:#F2F4F7; color:#475467; font-weight:bold; border:1px solid {$line};";
    $td = "border:1px solid {$line};";
    $num = "border:1px solid {$line}; text-align:right;";
    $sectionBar = "background-color:{$brand}; color:#FFFFFF; font-weight:bold; height:26px;";
@endphp
<table>
    <tbody>

    {{-- ── Branded header ─────────────────────────────────── --}}
    <tr>
        <td rowspan="4" style="width:26px;">{{ $hasLogo ? '' : '' }}</td>
        <td colspan="6" style="font-size:18px; font-weight:bold; color:{{ $ink }};">{{ $shop['name'] }}</td>
    </tr>
    <tr>
        <td colspan="6" style="font-size:11px; color:{{ $muted }};">{{ $shop['tagline'] ?: 'Laporan penjualan & laba' }}</td>
    </tr>
    <tr>
        <td colspan="6" style="font-size:10px; color:{{ $muted }};">{{ $shop['address'] }}{{ $shop['phone'] ? ' · Telp '.$shop['phone'] : '' }}{{ $shop['email'] ? ' · '.$shop['email'] : '' }}</td>
    </tr>
    <tr>
        <td colspan="6" style="font-size:10px; color:{{ $muted }};">Periode {{ $period['label'] }} ({{ $period['days'] }} hari) · Dicetak {{ $generatedAt }}@if(!empty($generatedBy)) oleh {{ $generatedBy }}@endif</td>
    </tr>
    <tr><td colspan="7" style="height:6px; background-color:{{ $ink }};"></td></tr>
    <tr><td colspan="7" style="height:10px;"></td></tr>

    {{-- ── Ringkasan ──────────────────────────────────────── --}}
    <tr><td colspan="7" style="{{ $sectionBar }}">  RINGKASAN EKSEKUTIF</td></tr>
    <tr>
        <td style="{{ $th }}">  Indikator</td>
        <td colspan="2" style="{{ $th }} text-align:right;">Nilai  </td>
        <td style="{{ $th }}">  Indikator</td>
        <td colspan="3" style="{{ $th }} text-align:right;">Nilai  </td>
    </tr>
    <tr>
        <td style="{{ $td }}">  Pendapatan kotor</td>
        <td colspan="2" style="{{ $num }} font-weight:bold;">{{ $rupiah($summary['revenue']) }}  </td>
        <td style="{{ $td }}">  Transaksi</td>
        <td colspan="3" style="{{ $num }}">{{ number_format($summary['transactions'], 0, ',', '.') }}  </td>
    </tr>
    <tr>
        <td style="{{ $td }}">  Laba kotor</td>
        <td colspan="2" style="{{ $num }} font-weight:bold; color:#027A48;">{{ $rupiah($summary['grossProfit']) }}  </td>
        <td style="{{ $td }}">  Item terjual</td>
        <td colspan="3" style="{{ $num }}">{{ number_format($summary['itemsSold'], 0, ',', '.') }}  </td>
    </tr>
    <tr>
        <td style="{{ $td }}">  Margin kotor</td>
        <td colspan="2" style="{{ $num }}">{{ $percent($summary['marginPercent']) }}  </td>
        <td style="{{ $td }}">  Rata-rata transaksi</td>
        <td colspan="3" style="{{ $num }}">{{ $rupiah($summary['averageOrderValue']) }}  </td>
    </tr>
    <tr>
        <td style="{{ $td }}">  Food cost</td>
        <td colspan="2" style="{{ $num }}">{{ $percent($summary['foodCostPercent']) }}  </td>
        <td style="{{ $td }}">  Rata-rata harian</td>
        <td colspan="3" style="{{ $num }}">{{ $rupiah($summary['dailyAverage']) }}  </td>
    </tr>
    <tr><td colspan="7" style="height:10px;"></td></tr>

    {{-- ── Laba rugi ──────────────────────────────────────── --}}
    <tr><td colspan="7" style="{{ $sectionBar }}">  LAPORAN LABA RUGI</td></tr>
    <tr>
        <td colspan="4" style="{{ $td }}">  Penjualan kotor (subtotal)</td>
        <td colspan="3" style="{{ $num }}">{{ $rupiah($summary['subtotal']) }}  </td>
    </tr>
    <tr>
        <td colspan="4" style="{{ $td }}">  Diskon</td>
        <td colspan="3" style="{{ $num }} color:#D92D20;">({{ $rupiah($summary['discount']) }})  </td>
    </tr>
    <tr>
        <td colspan="4" style="{{ $td }}">  {{ $shop['tax_label'] }}</td>
        <td colspan="3" style="{{ $num }}">{{ $rupiah($summary['tax']) }}  </td>
    </tr>
    <tr>
        <td colspan="4" style="{{ $td }} background-color:{{ $soft }}; font-weight:bold;">  Total tertagih</td>
        <td colspan="3" style="{{ $num }} background-color:{{ $soft }}; font-weight:bold;">{{ $rupiah($summary['revenue']) }}  </td>
    </tr>
    <tr>
        <td colspan="4" style="{{ $td }}">  Pendapatan bersih (di luar {{ $shop['tax_label'] }})</td>
        <td colspan="3" style="{{ $num }}">{{ $rupiah($summary['netRevenue']) }}  </td>
    </tr>
    <tr>
        <td colspan="4" style="{{ $td }}">  HPP — harga pokok penjualan</td>
        <td colspan="3" style="{{ $num }} color:#D92D20;">({{ $rupiah($summary['cogs']) }})  </td>
    </tr>
    <tr>
        <td colspan="4" style="{{ $td }} background-color:#ECFDF3; font-weight:bold; color:#027A48;">  LABA KOTOR</td>
        <td colspan="3" style="{{ $num }} background-color:#ECFDF3; font-weight:bold; color:#027A48;">{{ $rupiah($summary['grossProfit']) }}  </td>
    </tr>
    <tr><td colspan="7" style="height:10px;"></td></tr>

    {{-- ── Produk ─────────────────────────────────────────── --}}
    @if(count($products))
    <tr><td colspan="7" style="{{ $sectionBar }}">  PENJUALAN PER PRODUK</td></tr>
    <tr>
        <td style="{{ $th }}">  Produk</td>
        <td style="{{ $th }} text-align:right;">Qty  </td>
        <td style="{{ $th }} text-align:right;">Pendapatan  </td>
        <td style="{{ $th }} text-align:right;">HPP  </td>
        <td style="{{ $th }} text-align:right;">Laba  </td>
        <td colspan="2" style="{{ $th }} text-align:right;">Margin  </td>
    </tr>
    @foreach($products as $row)
    <tr>
        <td style="{{ $td }}">  {{ $row['name'] }}</td>
        <td style="{{ $num }}">{{ $row['quantity'] }}  </td>
        <td style="{{ $num }}">{{ $rupiah($row['revenue']) }}  </td>
        <td style="{{ $num }} color:{{ $muted }};">{{ $rupiah($row['cost']) }}  </td>
        <td style="{{ $num }}">{{ $rupiah($row['profit']) }}  </td>
        <td colspan="2" style="{{ $num }}">{{ $percent($row['margin_percent']) }}  </td>
    </tr>
    @endforeach
    <tr>
        <td style="{{ $td }} font-weight:bold; background-color:{{ $soft }};">  TOTAL</td>
        <td style="{{ $num }} font-weight:bold; background-color:{{ $soft }};">{{ array_sum(array_column($products, 'quantity')) }}  </td>
        <td style="{{ $num }} font-weight:bold; background-color:{{ $soft }};">{{ $rupiah(array_sum(array_column($products, 'revenue'))) }}  </td>
        <td style="{{ $num }} font-weight:bold; background-color:{{ $soft }};">{{ $rupiah(array_sum(array_column($products, 'cost'))) }}  </td>
        <td style="{{ $num }} font-weight:bold; background-color:{{ $soft }};">{{ $rupiah(array_sum(array_column($products, 'profit'))) }}  </td>
        <td colspan="2" style="{{ $num }} background-color:{{ $soft }};">  </td>
    </tr>
    <tr><td colspan="7" style="height:10px;"></td></tr>
    @endif

    {{-- ── Metode pembayaran ──────────────────────────────── --}}
    @if(count($payments))
    <tr><td colspan="7" style="{{ $sectionBar }}">  METODE PEMBAYARAN</td></tr>
    <tr>
        <td colspan="2" style="{{ $th }}">  Metode</td>
        <td style="{{ $th }} text-align:right;">Transaksi  </td>
        <td colspan="2" style="{{ $th }} text-align:right;">Nilai  </td>
        <td colspan="2" style="{{ $th }} text-align:right;">Porsi  </td>
    </tr>
    @foreach($payments as $row)
    <tr>
        <td colspan="2" style="{{ $td }}">  {{ $row['label'] }}</td>
        <td style="{{ $num }}">{{ $row['transactions'] }}  </td>
        <td colspan="2" style="{{ $num }}">{{ $rupiah($row['revenue']) }}  </td>
        <td colspan="2" style="{{ $num }}">{{ $percent($row['share']) }}  </td>
    </tr>
    @endforeach
    <tr><td colspan="7" style="height:10px;"></td></tr>
    @endif

    {{-- ── Kasir ──────────────────────────────────────────── --}}
    @if(count($cashiers))
    <tr><td colspan="7" style="{{ $sectionBar }}">  KINERJA KASIR</td></tr>
    <tr>
        <td colspan="2" style="{{ $th }}">  Kasir</td>
        <td style="{{ $th }} text-align:right;">Transaksi  </td>
        <td colspan="2" style="{{ $th }} text-align:right;">Nilai  </td>
        <td colspan="2" style="{{ $th }} text-align:right;">Rata-rata  </td>
    </tr>
    @foreach($cashiers as $row)
    <tr>
        <td colspan="2" style="{{ $td }}">  {{ $row['name'] }}</td>
        <td style="{{ $num }}">{{ $row['transactions'] }}  </td>
        <td colspan="2" style="{{ $num }}">{{ $rupiah($row['revenue']) }}  </td>
        <td colspan="2" style="{{ $num }}">{{ $rupiah($row['average']) }}  </td>
    </tr>
    @endforeach
    <tr><td colspan="7" style="height:10px;"></td></tr>
    @endif

    {{-- ── Rincian transaksi ──────────────────────────────── --}}
    @if(count($transactions))
    <tr><td colspan="7" style="{{ $sectionBar }}">  RINCIAN TRANSAKSI</td></tr>
    <tr>
        <td style="{{ $th }}">  Waktu</td>
        <td style="{{ $th }}">  Nomor</td>
        <td style="{{ $th }}">  Pelanggan</td>
        <td style="{{ $th }}">  Kasir</td>
        <td style="{{ $th }} text-align:right;">Qty  </td>
        <td style="{{ $th }}">  Metode</td>
        <td style="{{ $th }} text-align:right;">Total  </td>
    </tr>
    @foreach($transactions as $row)
    <tr>
        <td style="{{ $td }}">  {{ $row['datetime'] }}</td>
        <td style="{{ $td }}">  {{ $row['number'] }}</td>
        <td style="{{ $td }}">  {{ $row['customer'] }}</td>
        <td style="{{ $td }}">  {{ $row['cashier'] }}</td>
        <td style="{{ $num }}">{{ $row['quantity'] }}  </td>
        <td style="{{ $td }}">  {{ $row['payment_label'] }}</td>
        <td style="{{ $num }}">{{ $rupiah($row['total']) }}  </td>
    </tr>
    @endforeach
    <tr>
        <td colspan="4" style="{{ $td }} font-weight:bold; background-color:{{ $soft }};">  TOTAL {{ count($transactions) }} TRANSAKSI</td>
        <td style="{{ $num }} font-weight:bold; background-color:{{ $soft }};">{{ array_sum(array_column($transactions, 'quantity')) }}  </td>
        <td style="{{ $td }} background-color:{{ $soft }};"></td>
        <td style="{{ $num }} font-weight:bold; background-color:{{ $soft }};">{{ $rupiah(array_sum(array_column($transactions, 'total'))) }}  </td>
    </tr>
    @endif

    <tr><td colspan="7" style="height:16px;"></td></tr>
    <tr>
        <td colspan="7" style="font-size:10px; color:#98A2B3; font-style:italic;">Dokumen ini dihasilkan otomatis oleh Paylo POS.</td>
    </tr>
    </tbody>
</table>
