/**
 * Turns a `Receipt` into ESC/POS bytes.
 *
 * This is the print path. The React `ReceiptDialog` is only the on-screen
 * confirmation — nothing on screen is ever handed to the printer, so what
 * comes out of the paper is not affected by the app's CSS or zoom level.
 */

import type { Receipt } from '@/types';
import type { PaperWidth } from './escpos';
import { amount, COLUMNS, EscPos, wrap } from './escpos';

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

export type RenderOptions = {
    paper: PaperWidth;
    /** Send the partial-cut command after the footer. */
    cut: boolean;
    /** Sound the buzzer once the receipt is out. */
    beep: boolean;
    /** Blank lines fed after the footer — how much paper to leave to tear. */
    feed: number;
    /** Printed under the number on a re-print, so staff can tell copies apart. */
    label?: string;
};

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
    paper: 58,
    cut: true,
    beep: false,
    feed: 4,
};

function issuedAt(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Options line under an item: temperature, sugar, add-ons, note. */
function itemDetails(item: Receipt['items'][number]): string {
    return [
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
}

export function renderReceipt(
    receipt: Receipt,
    options: RenderOptions = DEFAULT_RENDER_OPTIONS,
): Uint8Array {
    const width = COLUMNS[options.paper];
    const p = new EscPos(width).init();

    // ── Shop header ───────────────────────────────────
    p.align('center')
        .bold(true)
        .size(2, 2)
        .paragraph(receipt.shop.name, Math.floor(width / 2));
    p.size(1, 1).bold(false);

    if (receipt.shop.tagline) {
        p.paragraph(receipt.shop.tagline);
    }

    if (receipt.shop.address) {
        p.paragraph(receipt.shop.address);
    }

    if (receipt.shop.phone) {
        p.paragraph(`Telp ${receipt.shop.phone}`);
    }

    // ── Transaction meta ──────────────────────────────
    p.align('left').divider();
    p.line(receipt.number);
    p.line(issuedAt(receipt.created_at));
    p.line(
        `Kasir ${receipt.cashier ?? '-'}${receipt.customer ? ` / ${receipt.customer}` : ''}`,
    );

    if (options.label) {
        p.bold(true).line(options.label).bold(false);
    }

    // ── Items ─────────────────────────────────────────
    p.divider();

    for (const item of receipt.items) {
        const name = item.variant
            ? `${item.name} (${item.variant})`
            : item.name;

        p.paragraph(`${item.quantity}x ${name}`);

        const details = itemDetails(item);

        if (details) {
            // Indented, so the options read as belonging to the line above.
            for (const line of wrap(details, width - 2)) {
                p.line(`  ${line}`);
            }
        }

        p.row(
            `  ${item.quantity} @ ${amount(item.unit_price)}`,
            amount(item.subtotal),
        );
    }

    // ── Totals ────────────────────────────────────────
    p.divider();
    p.row('Subtotal', amount(receipt.subtotal));

    if (receipt.discount > 0) {
        p.row('Diskon', `-${amount(receipt.discount)}`);
    }

    if (receipt.tax_amount > 0) {
        const rate = Math.round(receipt.tax_rate);

        p.row(`${receipt.tax_label} ${rate}%`, amount(receipt.tax_amount));
    }

    p.divider();
    p.bold(true).size(1, 2).row('TOTAL', amount(receipt.total), width);
    p.size(1, 1).bold(false);

    p.row(receipt.payment_method_label, amount(receipt.payment_amount));

    if (receipt.change_amount > 0) {
        p.row('Kembalian', amount(receipt.change_amount));
    }

    // ── Footer ────────────────────────────────────────
    p.divider();

    if (receipt.notes) {
        p.paragraph(`Catatan: ${receipt.notes}`);
        p.line();
    }

    p.align('center');

    if (receipt.footer) {
        p.paragraph(receipt.footer);
    }

    p.line();
    p.bold(true).line('Powered by Paylo').bold(false);
    p.line('Dari Kendari, Untuk Indonesia');
    p.align('left');

    if (options.beep) {
        p.beep();
    }

    if (options.cut) {
        p.cut();
    } else {
        p.feed(options.feed);
    }

    return p.build();
}

/**
 * A short self-test page. Prints the alignment, the magnifications and the
 * column count so an operator can confirm the paper size is right before the
 * first real sale.
 */
export function renderTestPage(
    shopName: string,
    options: RenderOptions = DEFAULT_RENDER_OPTIONS,
): Uint8Array {
    const width = COLUMNS[options.paper];
    const p = new EscPos(width).init();

    p.align('center').bold(true).size(2, 2).line('TES CETAK');
    p.size(1, 1).bold(false).paragraph(shopName);
    p.align('left').divider();
    p.row('Lebar kertas', `${options.paper} mm`);
    p.row('Kolom', String(width));
    p.row('Potong otomatis', options.cut ? 'ya' : 'tidak');
    p.divider();
    p.line('1234567890'.repeat(Math.ceil(width / 10)).slice(0, width));
    p.line('abcdefghijklmnopqrstuvwxyz'.slice(0, width));
    p.bold(true).line('Tebal / bold').bold(false);
    p.size(1, 2).line('Tinggi ganda').size(1, 1);
    p.align('center').line('Rata tengah').align('right').line('Rata kanan');
    p.align('left').divider();
    p.align('center').paragraph(
        'Jika baris di atas rapi dan tidak terpotong, printer siap dipakai.',
    );
    p.align('left');

    if (options.beep) {
        p.beep(1);
    }

    if (options.cut) {
        p.cut();
    } else {
        p.feed(options.feed);
    }

    return p.build();
}
