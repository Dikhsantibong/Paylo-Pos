/**
 * Formatting helpers shared by every screen.
 *
 * All monetary values in Paylo are whole rupiah stored as integers, so nothing
 * here ever deals with fractional currency.
 */

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID');

/**
 * Numbers can arrive from the API as strings (a MySQL DECIMAL column
 * serialises that way through some casts), so every formatter coerces first.
 */
export type Numeric = number | string | null | undefined;

function toNumber(value: Numeric): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

/** `Rp 128.450` */
export function rupiah(amount: Numeric): string {
    return rupiahFormatter.format(toNumber(amount));
}

/**
 * Abbreviated rupiah for axis labels and dense cards: `Rp 128,4 jt`.
 */
export function rupiahCompact(amount: Numeric): string {
    const value = toNumber(amount);
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) {
        return `Rp ${trim(value / 1_000_000_000)} m`;
    }

    if (abs >= 1_000_000) {
        return `Rp ${trim(value / 1_000_000)} jt`;
    }

    if (abs >= 1_000) {
        return `Rp ${trim(value / 1_000)} rb`;
    }

    return `Rp ${numberFormatter.format(value)}`;
}

export function number(value: Numeric): string {
    return numberFormatter.format(toNumber(value));
}

export function percent(value: Numeric, digits = 1): string {
    return `${toNumber(value).toFixed(digits).replace('.', ',')}%`;
}

/** `+12,8%` / `−4,1%` — signed, for trend indicators. */
export function signedPercent(value: Numeric, digits = 1): string {
    const v = toNumber(value);
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';

    return `${sign}${Math.abs(v).toFixed(digits).replace('.', ',')}%`;
}

export function decimal(value: Numeric, digits = 1): string {
    return toNumber(value).toFixed(digits).replace('.', ',');
}

/** Quantity with its unit, e.g. `250 gram`. */
export function quantity(value: Numeric, unit?: string | null): string {
    const v = toNumber(value);
    const text = Number.isInteger(v)
        ? numberFormatter.format(v)
        : decimal(v, 2);

    return unit ? `${text} ${unit}` : text;
}

export function initials(name: string | null | undefined): string {
    if (!name) {
        return '?';
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function trim(value: number): string {
    return value.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}
