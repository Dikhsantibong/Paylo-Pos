/**
 * ESC/POS command builder — the byte language every thermal printer speaks.
 *
 * Rendering a receipt to bytes here (instead of to HTML) is what lets Paylo
 * print without a browser print dialog: the bytes go straight down whichever
 * transport is connected (BLE, USB, serial, or the RawBT bridge).
 *
 * References: Epson ESC/POS command reference. Clone printers sold as
 * "POS-58 / RPP02N / Panda" implement the same subset used below.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type PaperWidth = 58 | 80;

/** Printable columns in Font A for each paper size. */
export const COLUMNS: Record<PaperWidth, number> = { 58: 32, 80: 48 };

export type Align = 'left' | 'center' | 'right';

/**
 * Characters the receipt UI uses that a CP437 printer cannot render. Replaced
 * before encoding so a typographic dash never comes out as garbage.
 */
const TRANSLITERATE: Record<string, string> = {
    '×': 'x',
    '−': '-',
    '–': '-',
    '—': '-',
    '·': '.',
    '•': '*',
    '“': '"',
    '”': '"',
    '‘': "'",
    '’': "'",
    '…': '...',
    '\u00a0': ' ',
    '\u202f': ' ',
    '°': 'o',
    Rp: 'Rp',
};

/** Fold anything the printer cannot represent down to plain ASCII. */
export function sanitize(text: string): string {
    let out = text;

    for (const [from, to] of Object.entries(TRANSLITERATE)) {
        out = out.split(from).join(to);
    }

    // Strip diacritics (é -> e) then drop whatever is still non-ASCII.
    out = out.normalize('NFD').replace(/\p{Diacritic}/gu, '');

    return out.replace(/[^\x20-\x7e\n]/g, '');
}

/** Money without the currency symbol — columns are precious on 58mm paper. */
export function amount(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(Math.round(value));
}

/** Break `text` into lines no wider than `width`, preferring word breaks. */
export function wrap(text: string, width: number): string[] {
    const lines: string[] = [];

    for (const paragraph of sanitize(text).split('\n')) {
        let current = '';

        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            if (current === '') {
                current = word;
            } else if (current.length + 1 + word.length <= width) {
                current += ` ${word}`;
            } else {
                lines.push(current);
                current = word;
            }

            // A single word longer than the paper gets hard-split.
            while (current.length > width) {
                lines.push(current.slice(0, width));
                current = current.slice(width);
            }
        }

        lines.push(current);
    }

    return lines.length > 0 ? lines : [''];
}

/**
 * Accumulates ESC/POS bytes. Every method returns `this` so a receipt reads
 * top to bottom like the paper it produces.
 */
export class EscPos {
    private readonly chunks: number[] = [];

    constructor(public readonly width: number) {}

    raw(...bytes: number[]): this {
        this.chunks.push(...bytes);

        return this;
    }

    /** Reset, select CP437, left-align, single-size, no bold. */
    init(): this {
        return this.raw(ESC, 0x40) // ESC @  — initialise
            .raw(ESC, 0x74, 0x00) // ESC t 0 — codepage PC437
            .raw(ESC, 0x52, 0x00) // ESC R 0 — international charset USA
            .align('left')
            .bold(false)
            .size(1, 1);
    }

    align(align: Align): this {
        const n = align === 'center' ? 1 : align === 'right' ? 2 : 0;

        return this.raw(ESC, 0x61, n);
    }

    bold(on: boolean): this {
        return this.raw(ESC, 0x45, on ? 1 : 0);
    }

    underline(on: boolean): this {
        return this.raw(ESC, 0x2d, on ? 1 : 0);
    }

    /** Character magnification, 1–8 in each axis (`GS !`). */
    size(widthMultiplier: number, heightMultiplier: number): this {
        const w = Math.min(Math.max(widthMultiplier, 1), 8) - 1;
        const h = Math.min(Math.max(heightMultiplier, 1), 8) - 1;

        return this.raw(GS, 0x21, (w << 4) | h);
    }

    text(value: string): this {
        const encoded = sanitize(value);

        for (let i = 0; i < encoded.length; i += 1) {
            this.chunks.push(encoded.charCodeAt(i) & 0xff);
        }

        return this;
    }

    line(value = ''): this {
        return this.text(value).raw(LF);
    }

    /** Wrapped paragraph, respecting the current magnification. */
    paragraph(value: string, columns = this.width): this {
        for (const line of wrap(value, columns)) {
            this.line(line);
        }

        return this;
    }

    /** `label ............ value` on one row. */
    row(label: string, value: string, columns = this.width): this {
        const left = sanitize(label);
        const right = sanitize(value);
        const gap = columns - left.length - right.length;

        if (gap >= 1) {
            return this.line(left + ' '.repeat(gap) + right);
        }

        // Too long to share a row — value drops to its own right-aligned line.
        this.paragraph(left, columns);

        return this.line(right.padStart(columns).slice(-columns));
    }

    divider(char = '-'): this {
        return this.line(char.repeat(this.width));
    }

    feed(lines = 1): this {
        return this.raw(ESC, 0x64, Math.min(Math.max(lines, 0), 255));
    }

    /** Partial cut after feeding the paper clear of the head. */
    cut(): this {
        return this.feed(3).raw(GS, 0x56, 0x42, 0x00);
    }

    /** Buzzer, for printers that have one. Harmless on those that don't. */
    beep(times = 2): this {
        return this.raw(ESC, 0x42, Math.min(Math.max(times, 1), 9), 0x02);
    }

    build(): Uint8Array {
        return new Uint8Array(this.chunks);
    }
}
