/**
 * Last-resort fallback: print through whatever printer the operating system
 * already knows about (a Windows driver, an Android print service, a shared
 * network printer).
 *
 * It renders the receipt into a hidden iframe sized to the paper and prints
 * *that* — the Paylo window is never navigated away from and the app shell is
 * never part of the output. The OS print dialog still appears, because no
 * browser lets a page print silently; every other transport in this folder
 * exists to avoid needing this one.
 */

import { rupiah } from '@/lib/format';
import type { Receipt } from '@/types';
import type { PaperWidth } from './escpos';

const TEMPERATURE_LABEL: Record<string, string> = {
    hot: 'Panas',
    iced: 'Dingin',
};

const SUGAR_LABEL: Record<string, string> = {
    normal: 'Gula normal',
    less: 'Gula sedikit',
    more: 'Gula manis',
    none: 'Tanpa gula',
};

const IFRAME_ID = 'paylo-print-frame';

function escape(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function row(label: string, value: string, bold = false): string {
    const weight = bold ? ' style="font-weight:700"' : '';

    return `<div class="row"${weight}><span>${escape(label)}</span><span>${escape(value)}</span></div>`;
}

function receiptHtml(receipt: Receipt, paper: PaperWidth): string {
    const issued = new Date(receipt.created_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const items = receipt.items
        .map((item) => {
            const name = item.variant
                ? `${item.name} (${item.variant})`
                : item.name;

            const details = [
                item.temperature ? TEMPERATURE_LABEL[item.temperature] : null,
                item.sugar_level ? SUGAR_LABEL[item.sugar_level] : null,
                ...item.addons.map((addon) =>
                    addon.quantity > 1
                        ? `${addon.name} x${addon.quantity}`
                        : addon.name,
                ),
                item.notes ? `"${item.notes}"` : null,
            ]
                .filter(Boolean)
                .join(', ');

            return [
                `<div class="item">`,
                `<div>${escape(`${item.quantity}x ${name}`)}</div>`,
                details ? `<div class="muted">${escape(details)}</div>` : '',
                row(
                    `${item.quantity} @ ${rupiah(item.unit_price)}`,
                    rupiah(item.subtotal),
                ),
                `</div>`,
            ].join('');
        })
        .join('');

    return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${escape(receipt.number)}</title>
<style>
  @page { size: ${paper}mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 3mm;
    width: ${paper}mm;
    font: 11px/1.35 "Courier New", ui-monospace, monospace;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
  }
  .center { text-align: center; }
  .shop { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .muted { font-size: 10px; }
  .rule { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .row > span:last-child { white-space: nowrap; }
  .item { margin-bottom: 4px; }
  .total { font-size: 14px; font-weight: 700; }
</style>
</head>
<body>
  <div class="center">
    <div class="shop">${escape(receipt.shop.name)}</div>
    ${receipt.shop.tagline ? `<div class="muted">${escape(receipt.shop.tagline)}</div>` : ''}
    ${receipt.shop.address ? `<div class="muted">${escape(receipt.shop.address)}</div>` : ''}
    ${receipt.shop.phone ? `<div class="muted">Telp ${escape(receipt.shop.phone)}</div>` : ''}
  </div>
  <div class="rule"></div>
  <div>${escape(receipt.number)}</div>
  <div class="muted">${escape(issued)}</div>
  <div class="muted">Kasir ${escape(receipt.cashier ?? '-')}${receipt.customer ? ` / ${escape(receipt.customer)}` : ''}</div>
  <div class="rule"></div>
  ${items}
  <div class="rule"></div>
  ${row('Subtotal', rupiah(receipt.subtotal))}
  ${receipt.discount > 0 ? row('Diskon', `-${rupiah(receipt.discount)}`) : ''}
  ${receipt.tax_amount > 0 ? row(`${receipt.tax_label} ${Math.round(receipt.tax_rate)}%`, rupiah(receipt.tax_amount)) : ''}
  <div class="rule"></div>
  <div class="row total"><span>TOTAL</span><span>${escape(rupiah(receipt.total))}</span></div>
  ${row(receipt.payment_method_label, rupiah(receipt.payment_amount))}
  ${receipt.change_amount > 0 ? row('Kembalian', rupiah(receipt.change_amount)) : ''}
  <div class="rule"></div>
  ${receipt.notes ? `<div class="muted">Catatan: ${escape(receipt.notes)}</div>` : ''}
  <div class="center">
    ${receipt.footer ? `<div class="muted">${escape(receipt.footer)}</div>` : ''}
    <div class="muted" style="margin-top:6px;font-weight:700">Powered by Paylo</div>
    <div class="muted">Dari Kendari, Untuk Indonesia</div>
  </div>
</body>
</html>`;
}

/** Reuse one iframe so repeated prints do not leak nodes. */
function frame(): HTMLIFrameElement {
    const existing = document.getElementById(IFRAME_ID);

    if (existing instanceof HTMLIFrameElement) {
        return existing;
    }

    const created = document.createElement('iframe');

    created.id = IFRAME_ID;
    created.setAttribute('aria-hidden', 'true');
    created.style.position = 'fixed';
    created.style.right = '0';
    created.style.bottom = '0';
    created.style.width = '0';
    created.style.height = '0';
    created.style.border = '0';
    created.style.visibility = 'hidden';
    document.body.appendChild(created);

    return created;
}

export function printThroughBrowser(
    receipt: Receipt,
    paper: PaperWidth,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const target = frame();

        target.onload = () => {
            const view = target.contentWindow;

            if (!view) {
                reject(new Error('Tidak bisa menyiapkan dokumen cetak.'));

                return;
            }

            try {
                view.focus();
                view.print();
                resolve();
            } catch (error) {
                reject(error);
            }
        };

        target.srcdoc = receiptHtml(receipt, paper);
    });
}
