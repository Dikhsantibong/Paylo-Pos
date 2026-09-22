import {
    AlertTriangle,
    BluetoothSearching,
    Check,
    CircleHelp,
    Loader2,
    Plug,
    PlugZap,
    Printer,
    RefreshCw,
    Smartphone,
    Unplug,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Panel, StatusBadge } from '@/components/paylo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePrinter } from '@/hooks/use-printer';
import { RAWBT_PLAY_URL, transportOptions } from '@/lib/printing';
import type {
    Diagnostic,
    PaperWidth,
    PrinterDevice,
    TransportChoice,
} from '@/lib/printing';
import type { PrinterTransportSetting } from '@/types';

export type PrinterFormValues = {
    printer_name: string;
    printer_transport: PrinterTransportSetting;
    printer_paper: number;
    printer_auto_print: boolean;
    printer_copies: number;
    printer_cut: boolean;
    printer_beep: boolean;
};

const TRANSPORT_LABELS: Record<string, string> = {
    auto: 'Otomatis',
    native: 'Aplikasi Paylo (mandiri)',
    bluetooth: 'Bluetooth (BLE)',
    usb: 'USB',
    serial: 'Serial / COM',
    rawbt: 'RawBT',
    browser: 'Printer sistem',
};

/**
 * Printer setup — the screen an operator opens when the receipt does not come
 * out.
 *
 * It does three things beyond storing preferences: it opens the real device
 * chooser (which only works from a click), it prints a self-test so the paper
 * size can be confirmed, and it reports exactly which browser capability is
 * missing. That last part matters because the usual complaint — "the Play
 * Store printer app connects but Paylo does not" — has a specific cause that
 * is invisible otherwise, explained at the bottom of this panel.
 */
export function PrinterPanel({
    values,
    onChange,
    errors,
    shopName,
}: {
    values: PrinterFormValues;
    onChange: <K extends keyof PrinterFormValues>(
        key: K,
        value: PrinterFormValues[K],
    ) => void;
    errors: Record<string, string>;
    shopName: string;
}) {
    // Feed the pending form values to the manager so "Tes cetak" honours a
    // paper size the operator has changed but not saved yet.
    const printer = usePrinter({
        transport: values.printer_transport,
        paper: (values.printer_paper === 80 ? 80 : 58) as PaperWidth,
        autoPrint: values.printer_auto_print,
        copies: values.printer_copies,
        cut: values.printer_cut,
        beep: values.printer_beep,
        name: values.printer_name,
    });

    const { state, resolved } = printer;
    const [busy, setBusy] = useState<'connect' | 'test' | 'probe' | null>(null);
    const [paired, setPaired] = useState<PrinterDevice[]>([]);
    // "Periksa ulang" only needs to force a render — the checks themselves are
    // a plain read of `navigator`, cheap enough to redo on every pass.
    const [, setRecheck] = useState(0);
    const checks: Diagnostic[] = printer.diagnostics();

    const options = transportOptions();
    const rawbtNeeded =
        resolved === 'rawbt' || values.printer_transport === 'rawbt';

    const connect = async () => {
        setBusy('connect');

        const device = await printer.connect(
            values.printer_transport as TransportChoice,
        );

        setBusy(null);

        if (device) {
            toast.success(`Terhubung ke ${device.name}.`);

            // Remember the device name so another terminal knows what to pair.
            if (!values.printer_name) {
                onChange('printer_name', device.name);
            }

            return;
        }

        if (state.error) {
            toast.error(state.error, { description: state.hint ?? undefined });
        }
    };

    const test = async () => {
        setBusy('test');

        const outcome = await printer.test(shopName || 'Paylo');

        setBusy(null);

        if (outcome.ok) {
            toast.success('Tes cetak dikirim ke printer.');

            return;
        }

        toast.error(outcome.error ?? 'Tes cetak gagal.', {
            description: outcome.hint,
        });
    };

    /**
     * The single question worth answering first: is this printer BLE, or
     * Classic-only? A successful connect means the free in-browser route
     * works; a failure says exactly why it never will.
     */
    const probeBle = async () => {
        setBusy('probe');

        const device = await printer.connect('bluetooth');

        setBusy(null);

        if (device) {
            toast.success(`${device.name} mendukung BLE.`, {
                description:
                    'Printer ini bisa dipakai langsung dari browser, tanpa aplikasi tambahan. Pilih jalur Bluetooth (BLE) lalu simpan.',
            });

            return;
        }

        toast.error(state.error ?? 'Printer tidak bisa dibuka lewat BLE.', {
            description: state.hint ?? undefined,
        });
    };

    const loadPaired = async () => {
        setPaired(await printer.nativeDevices());
    };

    // Read the pairings once the shell is there. The setState lands in a
    // promise callback, not in the effect body — this is a subscription to an
    // external system, not derived state.
    const { nativeAvailable, nativeDevices } = printer;

    useEffect(() => {
        if (!nativeAvailable) {
            return;
        }

        let cancelled = false;

        void nativeDevices().then((list) => {
            if (!cancelled) {
                setPaired(list);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [nativeAvailable, nativeDevices]);

    const pickPaired = async (candidate: PrinterDevice) => {
        setBusy('connect');

        const device = await printer.connectToNative(candidate.id);

        setBusy(null);

        if (device) {
            onChange('printer_transport', 'native');
            onChange('printer_name', device.name);
            toast.success(`Terhubung ke ${device.name}.`);

            return;
        }

        toast.error(state.error ?? 'Gagal membuka printer.', {
            description: state.hint ?? undefined,
        });
    };

    return (
        <>
            {/* ── Connection ───────────────────────────── */}
            <Panel
                title="Koneksi printer"
                description="Hubungkan sekali per perangkat. Izinnya disimpan browser, jadi Paylo menyambung ulang sendiri setiap kali dibuka."
                actions={<ConnectionBadge status={state.status} />}
                footer={`Jalur yang dipakai sekarang: ${TRANSPORT_LABELS[resolved] ?? resolved}.`}
            >
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm leading-5 font-semibold">
                            <Printer
                                className="size-4 text-muted-foreground"
                                aria-hidden
                            />
                            {state.device?.name ??
                                values.printer_name ??
                                'Belum ada printer'}
                        </span>
                        <span className="text-xs leading-5 text-muted-foreground">
                            {state.device
                                ? 'Siap menerima struk. Cetak tidak memunculkan dialog apa pun.'
                                : 'Tekan "Hubungkan printer", lalu pilih perangkat pada daftar yang muncul.'}
                        </span>
                    </div>

                    {state.error && (
                        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                            <AlertTriangle
                                className="mt-0.5 size-4 shrink-0 text-destructive"
                                aria-hidden
                            />
                            <div className="min-w-0">
                                <p className="text-sm leading-5 font-medium text-destructive">
                                    {state.error}
                                </p>
                                {state.hint && (
                                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                        {state.hint}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={connect}
                            disabled={busy !== null}
                        >
                            {busy === 'connect' ? (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden
                                />
                            ) : (
                                <PlugZap className="size-4" aria-hidden />
                            )}
                            {state.device
                                ? 'Hubungkan printer lain'
                                : 'Hubungkan printer'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={test}
                            disabled={busy !== null}
                        >
                            {busy === 'test' ? (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden
                                />
                            ) : (
                                <Printer className="size-4" aria-hidden />
                            )}
                            Tes cetak
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={probeBle}
                            disabled={busy !== null}
                        >
                            {busy === 'probe' ? (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden
                                />
                            ) : (
                                <BluetoothSearching
                                    className="size-4"
                                    aria-hidden
                                />
                            )}
                            Uji printer BLE
                        </Button>

                        {state.device && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => void printer.disconnect()}
                                disabled={busy !== null}
                            >
                                <Unplug className="size-4" aria-hidden />
                                Putuskan
                            </Button>
                        )}
                    </div>

                    {rawbtNeeded && (
                        <p className="text-xs leading-5 text-muted-foreground">
                            RawBT adalah aplikasi pihak ketiga dengan lisensinya
                            sendiri, dan Paylo tidak membutuhkannya. Jalur
                            mandiri ada di panel{' '}
                            <span className="font-medium">
                                Cetak mandiri tanpa aplikasi tambahan
                            </span>{' '}
                            di bawah.{' '}
                            <a
                                href={RAWBT_PLAY_URL}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="font-medium text-primary underline"
                            >
                                Halaman RawBT
                            </a>
                        </p>
                    )}
                </div>
            </Panel>

            {/* ── Paired printers, when Paylo is its own app ─ */}
            {printer.nativeAvailable && (
                <Panel
                    title="Printer terpasang di perangkat"
                    description="Dibaca langsung dari pairing Bluetooth Android. Termasuk printer Bluetooth Classic, yang tidak bisa dilihat browser."
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={loadPaired}
                            disabled={busy !== null}
                        >
                            <RefreshCw className="size-4" aria-hidden />
                            Muat ulang
                        </Button>
                    }
                >
                    {paired.length === 0 ? (
                        <p className="text-sm leading-5 text-muted-foreground">
                            Belum ada printer terbaca. Pasangkan printer di
                            Pengaturan Android → Bluetooth, lalu tekan Muat
                            ulang.
                        </p>
                    ) : (
                        <ul className="flex flex-col divide-y">
                            {paired.map((candidate) => (
                                <li
                                    key={candidate.id}
                                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm leading-5 font-medium">
                                            {candidate.name}
                                        </p>
                                        <p className="truncate text-xs leading-5 text-muted-foreground">
                                            {candidate.id}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            state.device?.id === candidate.id
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        disabled={busy !== null}
                                        onClick={() => pickPaired(candidate)}
                                    >
                                        {state.device?.id === candidate.id
                                            ? 'Terpakai'
                                            : 'Pakai ini'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            )}

            {/* ── Transport ────────────────────────────── */}
            <Panel
                title="Jalur pengiriman"
                description="Cara Paylo mengirim struk ke printer. Biarkan otomatis jika tidak yakin."
            >
                <div className="grid gap-2 sm:grid-cols-2">
                    <TransportCard
                        id="auto"
                        label="Otomatis"
                        description={`Paylo memilih jalur terbaik yang didukung perangkat ini — sekarang: ${TRANSPORT_LABELS[resolved] ?? resolved}.`}
                        usable
                        reason={null}
                        active={values.printer_transport === 'auto'}
                        onSelect={() => onChange('printer_transport', 'auto')}
                    />

                    {options.map((option) => (
                        <TransportCard
                            key={option.id}
                            id={option.id}
                            label={option.label}
                            description={option.description}
                            usable={option.support.usable}
                            reason={option.support.reason}
                            active={values.printer_transport === option.id}
                            onSelect={() =>
                                onChange(
                                    'printer_transport',
                                    option.id as PrinterTransportSetting,
                                )
                            }
                        />
                    ))}
                </div>

                {errors.printer_transport && (
                    <p className="mt-3 text-xs text-destructive">
                        {errors.printer_transport}
                    </p>
                )}
            </Panel>

            {/* ── Paper & behaviour ────────────────────── */}
            <Panel
                title="Kertas & perilaku cetak"
                description="Sesuaikan dengan printer yang dipakai agar struk tidak terpotong."
            >
                <div className="flex flex-col gap-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm leading-5 font-medium">
                                Lebar kertas
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {([58, 80] as const).map((paper) => (
                                    <button
                                        key={paper}
                                        type="button"
                                        onClick={() =>
                                            onChange('printer_paper', paper)
                                        }
                                        aria-pressed={
                                            values.printer_paper === paper
                                        }
                                        className={
                                            'rounded-lg border px-3.5 py-2.5 text-left transition-colors ' +
                                            (values.printer_paper === paper
                                                ? 'border-primary bg-primary-soft'
                                                : 'bg-card hover:bg-muted')
                                        }
                                    >
                                        <span className="block text-sm leading-5 font-semibold">
                                            {paper} mm
                                        </span>
                                        <span className="block text-xs leading-4 text-muted-foreground">
                                            {paper === 58
                                                ? '32 karakter'
                                                : '48 karakter'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {errors.printer_paper && (
                                <p className="text-xs leading-4 text-destructive">
                                    {errors.printer_paper}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm leading-5 font-medium">
                                Nama printer
                            </Label>
                            <Input
                                value={values.printer_name}
                                onChange={(event) =>
                                    onChange('printer_name', event.target.value)
                                }
                                placeholder="POS-58 / RPP02N"
                            />
                            <p className="text-xs leading-4 text-muted-foreground">
                                {errors.printer_name ??
                                    'Nama perangkat seperti saat pairing. Dipakai untuk menyambung ulang otomatis.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm leading-5 font-medium">
                                Jumlah salinan
                            </Label>
                            <Input
                                inputMode="numeric"
                                value={String(values.printer_copies)}
                                onChange={(event) =>
                                    onChange(
                                        'printer_copies',
                                        Math.min(
                                            5,
                                            Math.max(
                                                1,
                                                Number(
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                ) || 1,
                                            ),
                                        ),
                                    )
                                }
                                className="tabular max-w-24"
                            />
                            <p className="text-xs leading-4 text-muted-foreground">
                                {errors.printer_copies ??
                                    'Salinan kedua ditandai "SALINAN".'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col divide-y border-t pt-2">
                        <PrinterToggle
                            label="Cetak otomatis setelah bayar"
                            help="Struk langsung keluar begitu transaksi tersimpan — kasir tidak perlu menekan apa pun."
                            checked={values.printer_auto_print}
                            onChange={(v) => onChange('printer_auto_print', v)}
                        />
                        <PrinterToggle
                            label="Potong kertas otomatis"
                            help="Matikan jika printer tidak punya pemotong; kertas hanya dimajukan agar mudah disobek."
                            checked={values.printer_cut}
                            onChange={(v) => onChange('printer_cut', v)}
                        />
                        <PrinterToggle
                            label="Bunyikan buzzer"
                            help="Menandai struk selesai. Diabaikan printer yang tidak punya buzzer."
                            checked={values.printer_beep}
                            onChange={(v) => onChange('printer_beep', v)}
                        />
                    </div>
                </div>
            </Panel>

            {/* ── Diagnostics ──────────────────────────── */}
            <Panel
                title="Diagnosa koneksi"
                description="Dibaca langsung dari browser di perangkat ini."
                actions={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRecheck((value) => value + 1)}
                    >
                        <RefreshCw className="size-4" aria-hidden />
                        Periksa ulang
                    </Button>
                }
            >
                <ul className="flex flex-col divide-y">
                    {checks.map((check) => (
                        <li
                            key={check.label}
                            className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <span
                                className={
                                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ' +
                                    (check.ok
                                        ? 'bg-success-soft text-success'
                                        : 'bg-warning-soft text-warning')
                                }
                            >
                                {check.ok ? (
                                    <Check className="size-3" aria-hidden />
                                ) : (
                                    <X className="size-3" aria-hidden />
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm leading-5 font-medium">
                                    {check.label}
                                </p>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                    {check.detail}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </Panel>

            {/* ── Routes that need no third-party app ──── */}
            <Panel
                title="Cetak mandiri tanpa aplikasi tambahan"
                description="Empat jalur yang seluruhnya milik Paylo. Coba dari atas."
                footer="Panduan lengkap beserta perintah build ada di docs/PRINTER.md pada repositori Paylo."
            >
                <div className="flex flex-col gap-4 text-sm leading-6">
                    <div className="flex gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                        <CircleHelp
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                        />
                        <p className="text-xs leading-5 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                Batas yang tidak bisa dilewati kode mana pun:
                            </span>{' '}
                            browser tidak punya API untuk membuka socket
                            Bluetooth <em>Classic</em> (SPP), dan printer struk
                            murah hampir selalu Classic. Itulah sebabnya
                            aplikasi dari Play Store bisa memakai pairing yang
                            sudah Anda simpan sementara tab browser tidak.
                            Supaya Paylo mandiri sepenuhnya, Paylo-lah yang
                            harus menjadi aplikasinya — langkah 4 di bawah.
                        </p>
                    </div>

                    <ol className="flex flex-col gap-3">
                        <Step
                            icon={BluetoothSearching}
                            title="1. Cek dulu: printer Anda mungkin BLE"
                            body='Tekan "Uji printer BLE" di panel paling atas lalu pilih printer Anda. Banyak printer yang dijual sebagai "Bluetooth" ternyata juga punya jalur BLE. Kalau berhasil, selesai — tidak perlu aplikasi apa pun, tinggal pilih jalur Bluetooth (BLE) dan simpan.'
                        />
                        <Step
                            icon={Plug}
                            title="2. Kabel USB OTG — paling pasti, gratis"
                            body="Sambungkan printer ke tablet dengan kabel USB OTG, pilih jalur USB, tekan Hubungkan printer. Chrome Android akan meminta izin sekali. Jalur ini melewati Bluetooth sepenuhnya, jadi berlaku untuk printer Classic maupun BLE. Di terminal Windows, printer Bluetooth Classic yang sudah dipasangkan juga bisa dipakai lewat jalur Serial/COM."
                        />
                        <Step
                            icon={AlertTriangle}
                            title="3. Pastikan Paylo dibuka lewat HTTPS"
                            body="Bluetooth, USB, dan Serial dimatikan browser pada alamat http biasa. Kalau baris HTTPS di Diagnosa bertanda silang, tombol Hubungkan tidak akan pernah memunculkan daftar perangkat — apa pun printernya. Ini sering jadi satu-satunya penyebab."
                        />
                        <Step
                            icon={Smartphone}
                            title="4. Jadikan Paylo aplikasi Android sendiri"
                            body="Jawaban permanen untuk printer Bluetooth Classic. Bungkus Paylo dengan Capacitor menjadi APK milik Anda sendiri — gratis, tanpa lisensi pihak ketiga. Di dalam APK itu Paylo membaca daftar printer yang sudah dipasangkan Android dan membuka socket SPP-nya langsung; panel 'Printer terpasang di perangkat' akan muncul di halaman ini. Perintah build dan kode jembatannya ada di docs/PRINTER.md."
                        />
                    </ol>
                </div>
            </Panel>
        </>
    );
}

function ConnectionBadge({ status }: { status: string }) {
    if (status === 'printing') {
        return <StatusBadge tone="brand">Mencetak…</StatusBadge>;
    }

    if (status === 'connecting') {
        return <StatusBadge tone="brand">Menghubungkan…</StatusBadge>;
    }

    if (status === 'ready') {
        return <StatusBadge tone="success">Terhubung</StatusBadge>;
    }

    if (status === 'error') {
        return <StatusBadge tone="danger">Gagal</StatusBadge>;
    }

    return <StatusBadge tone="warning">Belum terhubung</StatusBadge>;
}

function TransportCard({
    id,
    label,
    description,
    usable,
    reason,
    active,
    onSelect,
}: {
    id: string;
    label: string;
    description: string;
    usable: boolean;
    reason: string | null;
    active: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={active}
            aria-describedby={`transport-${id}-help`}
            className={
                'flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-colors ' +
                (active
                    ? 'border-primary bg-primary-soft'
                    : 'bg-card hover:bg-muted')
            }
        >
            <span className="flex items-center justify-between gap-2">
                <span className="text-sm leading-5 font-semibold">{label}</span>
                {!usable && (
                    <StatusBadge tone="warning" dot={false}>
                        Tidak tersedia
                    </StatusBadge>
                )}
            </span>
            <span
                id={`transport-${id}-help`}
                className="text-xs leading-5 text-muted-foreground"
            >
                {reason ?? description}
            </span>
        </button>
    );
}

function Step({
    icon: Icon,
    title,
    body,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
}) {
    return (
        <li className="flex gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0">
                <p className="text-sm leading-5 font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {body}
                </p>
            </div>
        </li>
    );
}

function PrinterToggle({
    label,
    help,
    checked,
    onChange,
}: {
    label: string;
    help: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
                <p className="text-sm leading-5 font-medium">{label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {help}
                </p>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onChange}
                aria-label={label}
                className="mt-0.5 shrink-0"
            />
        </div>
    );
}
