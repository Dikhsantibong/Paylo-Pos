import { Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    CreditCard,
    Image as ImageIcon,
    Percent,
    Receipt,
    Save,
    Settings as SettingsIcon,
    ShoppingCart,
    Smartphone,
    Timer,
    Trash2,
    Upload,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { InstallAppButton } from '@/components/app-runtime';
import { PageHeader, Panel, StatusBadge } from '@/components/paylo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { PosSettings } from '@/types';

type Props = {
    settings: PosSettings;
    logoUrl: string | null;
    sessionDefaults: { configured: number; foreverMinutes: number };
};

type FormState = PosSettings & { logo: File | null; remove_logo: boolean };

const SESSION_PRESETS = [
    {
        value: 0,
        label: 'Tanpa batas',
        hint: 'Terminal tetap login sampai keluar manual',
    },
    { value: 480, label: '8 jam', hint: 'Satu shift penuh' },
    { value: 720, label: '12 jam', hint: 'Shift panjang' },
    { value: 1440, label: '24 jam', hint: 'Satu hari operasional' },
];

/**
 * Settings — grouped into tabs so an owner can find one switch without
 * scrolling past everything else (design.md §11).
 */
export default function SettingsPosIndex({ settings, logoUrl }: Props) {
    const [form, setForm] = useState<FormState>({
        ...settings,
        logo: null,
        remove_logo: false,
    });
    const [preview, setPreview] = useState<string | null>(logoUrl);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileRef = useRef<HTMLInputElement>(null);
    const brandName = (usePage().props.brand as { name?: string } | undefined)
        ?.name;

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const dirty = useMemo(
        () =>
            form.logo !== null ||
            form.remove_logo ||
            (Object.keys(settings) as (keyof PosSettings)[]).some(
                (key) => settings[key] !== form[key],
            ),
        [form, settings],
    );

    const enabledPaymentCount = [
        form.payment_cash,
        form.payment_qris,
        form.payment_bank_transfer,
        form.payment_debit_card,
        form.payment_credit_card,
    ].filter(Boolean).length;

    const pickLogo = (file: File | null) => {
        if (!file) {
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran logo maksimal 2 MB.');

            return;
        }

        set('logo', file);
        set('remove_logo', false);
        setPreview(URL.createObjectURL(file));
    };

    const clearLogo = () => {
        set('logo', null);
        set('remove_logo', true);
        setPreview(null);

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/settings-pos', toPayload(form), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                set('logo', null);
                set('remove_logo', false);
            },
            onError: (bag) => {
                setErrors(bag as Record<string, string>);
                toast.error('Beberapa isian belum benar. Periksa kembali.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Pengaturan" />

            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-4 md:p-6 lg:p-8"
            >
                <PageHeader
                    icon={SettingsIcon}
                    title="Pengaturan"
                    description={`Konfigurasi ${brandName ?? 'toko'}, kasir, dan perangkat`}
                    actions={
                        <>
                            {dirty && (
                                <StatusBadge tone="warning">
                                    Belum disimpan
                                </StatusBadge>
                            )}
                            <Button
                                type="submit"
                                disabled={processing || !dirty}
                            >
                                <Save className="size-4" aria-hidden />
                                {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                            </Button>
                        </>
                    }
                />

                <Tabs defaultValue="shop" className="gap-6">
                    <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
                        <Tab value="shop" icon={Building2}>
                            Toko & logo
                        </Tab>
                        <Tab value="tax" icon={Percent}>
                            Pajak
                        </Tab>
                        <Tab value="payment" icon={CreditCard}>
                            Pembayaran
                        </Tab>
                        <Tab value="pos" icon={ShoppingCart}>
                            Kasir
                        </Tab>
                        <Tab value="receipt" icon={Receipt}>
                            Struk
                        </Tab>
                        <Tab value="device" icon={Smartphone}>
                            Sesi & perangkat
                        </Tab>
                    </TabsList>

                    {/* ── Shop & branding ──────────────────────── */}
                    <TabsContent value="shop" className="flex flex-col gap-6">
                        <Panel
                            title="Logo toko"
                            description="Dipakai di sidebar, struk, dan header ekspor laporan."
                        >
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Logo toko"
                                            className="size-full object-contain p-2"
                                        />
                                    ) : (
                                        <ImageIcon
                                            className="size-8 text-muted-foreground"
                                            aria-hidden
                                        />
                                    )}
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileRef.current?.click()
                                            }
                                        >
                                            <Upload
                                                className="size-4"
                                                aria-hidden
                                            />
                                            {preview
                                                ? 'Ganti logo'
                                                : 'Unggah logo'}
                                        </Button>

                                        {preview && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={clearLogo}
                                                className="text-destructive"
                                            >
                                                <Trash2
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                                Hapus
                                            </Button>
                                        )}
                                    </div>

                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        className="sr-only"
                                        onChange={(event) =>
                                            pickLogo(
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />

                                    <p className="text-xs leading-5 text-muted-foreground">
                                        PNG, JPG, WEBP, atau SVG. Maksimal 2 MB.
                                        Rasio 1:1 memberi hasil terbaik pada
                                        sidebar dan struk. Untuk PDF laporan
                                        gunakan PNG atau JPG.
                                    </p>

                                    {errors.logo && (
                                        <p className="text-xs text-destructive">
                                            {errors.logo}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Panel>

                        <Panel
                            title="Identitas toko"
                            description="Tampil pada struk pelanggan dan header laporan."
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field
                                    label="Nama toko"
                                    error={errors.shop_name}
                                    className="sm:col-span-2"
                                >
                                    <Input
                                        value={form.shop_name}
                                        onChange={(e) =>
                                            set('shop_name', e.target.value)
                                        }
                                        placeholder="Paylo Coffee"
                                    />
                                </Field>

                                <Field
                                    label="Tagline"
                                    help="Baris pendek di bawah nama toko. Opsional."
                                    error={errors.shop_tagline}
                                    className="sm:col-span-2"
                                >
                                    <Input
                                        value={form.shop_tagline}
                                        onChange={(e) =>
                                            set('shop_tagline', e.target.value)
                                        }
                                        placeholder="Specialty coffee & roastery"
                                    />
                                </Field>

                                <Field
                                    label="Alamat"
                                    error={errors.shop_address}
                                    className="sm:col-span-2"
                                >
                                    <Textarea
                                        value={form.shop_address}
                                        onChange={(e) =>
                                            set('shop_address', e.target.value)
                                        }
                                        rows={2}
                                        placeholder="Jl. Kopi No. 1, Bandung"
                                        className="resize-none"
                                    />
                                </Field>

                                <Field
                                    label="Telepon"
                                    error={errors.shop_phone}
                                >
                                    <Input
                                        value={form.shop_phone}
                                        onChange={(e) =>
                                            set('shop_phone', e.target.value)
                                        }
                                        placeholder="0812-0000-0000"
                                    />
                                </Field>

                                <Field label="Email" error={errors.shop_email}>
                                    <Input
                                        type="email"
                                        value={form.shop_email}
                                        onChange={(e) =>
                                            set('shop_email', e.target.value)
                                        }
                                        placeholder="halo@paylocoffee.id"
                                    />
                                </Field>
                            </div>
                        </Panel>
                    </TabsContent>

                    {/* ── Tax ──────────────────────────────────── */}
                    <TabsContent value="tax">
                        <Panel
                            title="Pajak"
                            description="Dihitung dari subtotal setelah diskon."
                        >
                            <div className="flex flex-col gap-5">
                                <Toggle
                                    label="Terapkan pajak pada setiap transaksi"
                                    help="Matikan jika harga menu sudah termasuk pajak."
                                    checked={form.tax_enabled}
                                    onChange={(v) => set('tax_enabled', v)}
                                />

                                {form.tax_enabled && (
                                    <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
                                        <Field
                                            label="Persentase pajak (%)"
                                            help="Contoh: 11 untuk PPN 11%."
                                            error={errors.tax_rate}
                                        >
                                            <Input
                                                inputMode="decimal"
                                                value={String(form.tax_rate)}
                                                onChange={(e) =>
                                                    set(
                                                        'tax_rate',
                                                        Number(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                                className="tabular"
                                            />
                                        </Field>

                                        <Field
                                            label="Label pajak"
                                            help="Nama yang tampil di struk."
                                            error={errors.tax_label}
                                        >
                                            <Input
                                                value={form.tax_label}
                                                onChange={(e) =>
                                                    set(
                                                        'tax_label',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="PPN"
                                            />
                                        </Field>
                                    </div>
                                )}
                            </div>
                        </Panel>
                    </TabsContent>

                    {/* ── Payment ──────────────────────────────── */}
                    <TabsContent value="payment">
                        <Panel
                            title="Metode pembayaran"
                            description="Hanya metode aktif yang muncul di layar kasir."
                            actions={
                                <StatusBadge
                                    tone={
                                        enabledPaymentCount > 0
                                            ? 'brand'
                                            : 'danger'
                                    }
                                >
                                    {enabledPaymentCount} aktif
                                </StatusBadge>
                            }
                            footer="Selain tunai, Paylo hanya mencatat label metodenya — tidak ada kode QR atau proses pembayaran di dalam aplikasi."
                        >
                            <div className="flex flex-col divide-y">
                                <Toggle
                                    label="Tunai"
                                    help="Satu-satunya metode yang menghitung kembalian."
                                    checked={form.payment_cash}
                                    onChange={(v) => set('payment_cash', v)}
                                />
                                <Toggle
                                    label="QRIS"
                                    help="QRIS, GoPay, OVO, Dana, ShopeePay. Dicatat sebagai label."
                                    checked={form.payment_qris}
                                    onChange={(v) => set('payment_qris', v)}
                                />
                                <Toggle
                                    label="Transfer bank"
                                    help="Transfer manual ke rekening toko."
                                    checked={form.payment_bank_transfer}
                                    onChange={(v) =>
                                        set('payment_bank_transfer', v)
                                    }
                                />
                                <Toggle
                                    label="Kartu debit"
                                    help="Diproses di mesin EDC."
                                    checked={form.payment_debit_card}
                                    onChange={(v) =>
                                        set('payment_debit_card', v)
                                    }
                                />
                                <Toggle
                                    label="Kartu kredit"
                                    help="Diproses di mesin EDC."
                                    checked={form.payment_credit_card}
                                    onChange={(v) =>
                                        set('payment_credit_card', v)
                                    }
                                />
                            </div>

                            {enabledPaymentCount === 0 && (
                                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                    Minimal satu metode harus aktif. Jika
                                    semuanya dimatikan, kasir otomatis kembali
                                    ke tunai.
                                </p>
                            )}
                        </Panel>
                    </TabsContent>

                    {/* ── POS behaviour ────────────────────────── */}
                    <TabsContent value="pos">
                        <Panel
                            title="Perilaku layar kasir"
                            description="Sembunyikan fitur yang tidak dipakai agar kasir lebih cepat."
                        >
                            <div className="flex flex-col divide-y">
                                <Toggle
                                    label="Add-on produk"
                                    help="Extra shot, boba, topping, dan sejenisnya. Matikan untuk menyembunyikan seluruh bagian add-on di layar kasir."
                                    checked={form.addon_enabled}
                                    onChange={(v) => set('addon_enabled', v)}
                                />
                                <Toggle
                                    label="Pilih pelanggan"
                                    help="Matikan jika semua transaksi dicatat sebagai walk-in."
                                    checked={form.customer_enabled}
                                    onChange={(v) => set('customer_enabled', v)}
                                />
                                <Toggle
                                    label="Diskon manual"
                                    help="Izinkan kasir memberi potongan nominal pada satu transaksi."
                                    checked={form.discount_enabled}
                                    onChange={(v) => set('discount_enabled', v)}
                                />
                                <Toggle
                                    label="Catatan pesanan"
                                    help="Kolom catatan bebas per transaksi."
                                    checked={form.order_note_enabled}
                                    onChange={(v) =>
                                        set('order_note_enabled', v)
                                    }
                                />
                            </div>
                        </Panel>
                    </TabsContent>

                    {/* ── Receipt ──────────────────────────────── */}
                    <TabsContent value="receipt">
                        <Panel
                            title="Struk"
                            description="Ditampilkan setelah transaksi tersimpan."
                        >
                            <div className="flex flex-col gap-5">
                                <Toggle
                                    label="Tampilkan struk setelah transaksi"
                                    help="Struk muncul otomatis dan siap dicetak lewat dialog print browser."
                                    checked={form.receipt_enabled}
                                    onChange={(v) => set('receipt_enabled', v)}
                                />

                                <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
                                    <Field
                                        label="Catatan kaki struk"
                                        error={errors.receipt_footer}
                                        className="sm:col-span-2"
                                    >
                                        <Textarea
                                            value={form.receipt_footer}
                                            onChange={(e) =>
                                                set(
                                                    'receipt_footer',
                                                    e.target.value,
                                                )
                                            }
                                            rows={2}
                                            placeholder="Terima kasih atas kunjungan Anda."
                                            className="resize-none"
                                        />
                                    </Field>

                                    <Field
                                        label="Nama printer"
                                        help="Catatan untuk operator. Pencetakan memakai dialog print browser."
                                        error={errors.printer_name}
                                    >
                                        <Input
                                            value={form.printer_name}
                                            onChange={(e) =>
                                                set(
                                                    'printer_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="POS-80"
                                        />
                                    </Field>
                                </div>
                            </div>
                        </Panel>
                    </TabsContent>

                    {/* ── Session & device ─────────────────────── */}
                    <TabsContent value="device" className="flex flex-col gap-6">
                        <Panel
                            title="Batas sesi"
                            description="Berapa lama terminal tetap login saat tidak ada aktivitas."
                            footer="Batas tanpa aktivitas hanya berlaku jika tab ditutup. Selama Paylo terbuka, sinyal jaga sesi menahan sesi tetap hidup."
                        >
                            <div className="flex flex-col gap-5">
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    {SESSION_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() =>
                                                set(
                                                    'session_lifetime',
                                                    preset.value,
                                                )
                                            }
                                            aria-pressed={
                                                form.session_lifetime ===
                                                preset.value
                                            }
                                            className={
                                                'rounded-lg border px-3.5 py-3 text-left transition-colors ' +
                                                (form.session_lifetime ===
                                                preset.value
                                                    ? 'border-primary bg-primary-soft'
                                                    : 'bg-card hover:bg-muted')
                                            }
                                        >
                                            <span className="flex items-center gap-2 text-sm leading-5 font-semibold">
                                                <Timer
                                                    className="size-4 text-muted-foreground"
                                                    aria-hidden
                                                />
                                                {preset.label}
                                            </span>
                                            <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
                                                {preset.hint}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <Field
                                    label="Atau tentukan sendiri (menit)"
                                    help="Isi 0 agar sesi tidak pernah kedaluwarsa."
                                    error={errors.session_lifetime}
                                    className="max-w-xs"
                                >
                                    <Input
                                        inputMode="numeric"
                                        value={String(form.session_lifetime)}
                                        onChange={(e) =>
                                            set(
                                                'session_lifetime',
                                                Number(
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                ) || 0,
                                            )
                                        }
                                        className="tabular"
                                    />
                                </Field>

                                <div className="border-t pt-5">
                                    <Toggle
                                        label="Jaga sesi tetap hidup"
                                        help="Paylo mengirim sinyal berkala selama tab terbuka, sehingga kasir yang standby berjam-jam tidak tiba-tiba diminta login ulang."
                                        checked={form.session_keepalive}
                                        onChange={(v) =>
                                            set('session_keepalive', v)
                                        }
                                    />
                                </div>
                            </div>
                        </Panel>

                        <Panel
                            title="Pasang sebagai aplikasi"
                            description="Paylo dapat dipasang di perangkat kasir dan berjalan tanpa bar browser."
                            footer="Nama, logo, dan alamat pada halaman panduan mengikuti Informasi toko di tab pertama."
                        >
                            <InstallAppButton />
                        </Panel>
                    </TabsContent>
                </Tabs>

                {/* Sticky save for long tabs */}
                <div className="flex justify-end border-t pt-4">
                    <Button
                        type="submit"
                        disabled={processing || !dirty}
                        size="lg"
                    >
                        <Save className="size-4" aria-hidden />
                        {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                    </Button>
                </div>
            </form>
        </>
    );
}

/**
 * The form is sent as multipart because it can carry a logo. Inertia turns
 * booleans into "1"/"0" and drops nulls, which is exactly what the server's
 * validation expects — the file just needs to be omitted when unchanged.
 */
function toPayload(
    form: FormState,
): Record<string, string | number | boolean | File> {
    const { logo, remove_logo, ...values } = form;

    const payload: Record<string, string | number | boolean | File> = {
        ...values,
        remove_logo,
    };

    if (logo) {
        payload.logo = logo;
    }

    return payload;
}

function Tab({
    value,
    icon: Icon,
    children,
}: {
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <TabsTrigger value={value} className="gap-2 px-3 py-2">
            <Icon className="size-4" aria-hidden />
            {children}
        </TabsTrigger>
    );
}

function Field({
    label,
    help,
    error,
    children,
    className,
}: {
    label: string;
    help?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
            <Label className="text-sm leading-5 font-medium">{label}</Label>
            {children}
            {error ? (
                <p className="text-xs leading-4 text-destructive">{error}</p>
            ) : help ? (
                <p className="text-xs leading-4 text-muted-foreground">
                    {help}
                </p>
            ) : null}
        </div>
    );
}

function Toggle({
    label,
    help,
    checked,
    onChange,
}: {
    label: string;
    help?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
                <p className="text-sm leading-5 font-medium">{label}</p>
                {help && (
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {help}
                    </p>
                )}
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

SettingsPosIndex.layout = {
    breadcrumbs: [{ title: 'Pengaturan', href: '/settings-pos' }],
};
