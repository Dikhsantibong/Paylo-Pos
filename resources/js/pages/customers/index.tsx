import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    DataTable,
    EmptyState,
    KpiCard,
    PageHeader,
    Panel,
    StatusBadge,
    Td,
    Th,
    Tr,
} from '@/components/paylo';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { number } from '@/lib/format';
import type { Customer } from '@/types';

type Props = { customers: Customer[] };

type Segment = 'all' | 'vip' | 'regular' | 'new';

const SEGMENTS: { value: Segment; label: string }[] = [
    { value: 'all', label: 'Semua pelanggan' },
    { value: 'vip', label: 'VIP · 100+ poin' },
    { value: 'regular', label: 'Reguler · 20–99 poin' },
    { value: 'new', label: 'Baru · di bawah 20 poin' },
];

function segmentOf(customer: Customer): Exclude<Segment, 'all'> {
    if (customer.loyalty_points >= 100) {
        return 'vip';
    }

    if (customer.loyalty_points >= 20) {
        return 'regular';
    }

    return 'new';
}

export default function CustomersIndex({ customers }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [segment, setSegment] = useState<Segment>('all');
    const [query, setQuery] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            phone: '',
            email: '',
        });

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return customers.filter((customer) => {
            if (segment !== 'all' && segmentOf(customer) !== segment) {
                return false;
            }

            if (!needle) {
                return true;
            }

            return (
                customer.name.toLowerCase().includes(needle) ||
                (customer.phone ?? '').includes(needle) ||
                (customer.email ?? '').toLowerCase().includes(needle)
            );
        });
    }, [customers, segment, query]);

    const stats = useMemo(
        () => ({
            total: customers.length,
            vip: customers.filter((c) => segmentOf(c) === 'vip').length,
            visits: customers.reduce(
                (sum, c) => sum + (c.transactions_count ?? 0),
                0,
            ),
            points: customers.reduce((sum, c) => sum + c.loyalty_points, 0),
        }),
        [customers],
    );

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (customer: Customer) => {
        clearErrors();
        setEditing(customer);
        setData({
            name: customer.name,
            phone: customer.phone ?? '',
            email: customer.email ?? '',
        });
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const onSuccess = () => {
            setOpen(false);
            reset();
        };

        if (editing) {
            put(`/customers/${editing.id}`, {
                onSuccess,
                preserveScroll: true,
            });
        } else {
            post('/customers', { onSuccess, preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Pelanggan" />

            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={Users}
                    title="Pelanggan"
                    description="Data pelanggan dan poin loyalitas"
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="size-4" aria-hidden />
                            Tambah pelanggan
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Total pelanggan"
                        value={number(stats.total)}
                        icon={Users}
                        accent="brand"
                    />
                    <KpiCard
                        label="Pelanggan VIP"
                        value={number(stats.vip)}
                        hint="100 poin atau lebih"
                    />
                    <KpiCard
                        label="Total kunjungan"
                        value={number(stats.visits)}
                        hint="Transaksi tercatat atas nama pelanggan"
                    />
                    <KpiCard
                        label="Total poin beredar"
                        value={number(stats.points)}
                    />
                </div>

                <Panel
                    title="Daftar pelanggan"
                    description={`${number(visible.length)} dari ${number(customers.length)} pelanggan`}
                    padded={false}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Cari nama atau telepon…"
                                    aria-label="Cari pelanggan"
                                    className="h-9 w-52 pl-8"
                                />
                            </div>

                            <Select
                                value={segment}
                                onValueChange={(value) =>
                                    setSegment(value as Segment)
                                }
                            >
                                <SelectTrigger className="h-9 w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEGMENTS.map((option) => (
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
                    }
                >
                    {visible.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th>Nama</Th>
                                    <Th>Telepon</Th>
                                    <Th>Email</Th>
                                    <Th>Segmen</Th>
                                    <Th numeric>Transaksi</Th>
                                    <Th numeric>Poin</Th>
                                    <Th className="w-16 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((customer) => {
                                    const tier = segmentOf(customer);

                                    return (
                                        <Tr key={customer.id}>
                                            <Td className="font-medium">
                                                {customer.name}
                                            </Td>
                                            <Td muted>
                                                {customer.phone || '—'}
                                            </Td>
                                            <Td muted>
                                                {customer.email || '—'}
                                            </Td>
                                            <Td>
                                                <StatusBadge
                                                    tone={
                                                        tier === 'vip'
                                                            ? 'brand'
                                                            : tier === 'regular'
                                                              ? 'success'
                                                              : 'neutral'
                                                    }
                                                >
                                                    {tier === 'vip'
                                                        ? 'VIP'
                                                        : tier === 'regular'
                                                          ? 'Reguler'
                                                          : 'Baru'}
                                                </StatusBadge>
                                            </Td>
                                            <Td numeric>
                                                {number(
                                                    customer.transactions_count ??
                                                        0,
                                                )}
                                            </Td>
                                            <Td
                                                numeric
                                                className="font-semibold"
                                            >
                                                {number(
                                                    customer.loyalty_points,
                                                )}
                                            </Td>
                                            <Td>
                                                <span className="flex justify-end">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEdit(customer)
                                                        }
                                                        aria-label={`Ubah ${customer.name}`}
                                                    >
                                                        <Pencil
                                                            className="size-4"
                                                            aria-hidden
                                                        />
                                                    </Button>
                                                </span>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={Users}
                                title={
                                    customers.length === 0
                                        ? 'Belum ada pelanggan'
                                        : 'Tidak ada pelanggan yang cocok'
                                }
                                description={
                                    customers.length === 0
                                        ? 'Catat pelanggan agar Anda tahu siapa yang paling sering datang dan bisa memberi program loyalitas.'
                                        : 'Coba kata kunci lain atau pilih segmen berbeda.'
                                }
                                action={
                                    customers.length === 0 ? (
                                        <Button size="sm" onClick={openCreate}>
                                            Tambah pelanggan
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    )}
                </Panel>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? `Ubah ${editing.name}`
                                : 'Tambah pelanggan'}
                        </DialogTitle>
                        <DialogDescription>
                            Nomor telepon memudahkan kasir menemukan pelanggan
                            saat transaksi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <Field label="Nama" error={errors.name}>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field label="Telepon" error={errors.phone}>
                            <Input
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                placeholder="0812-0000-0000"
                            />
                        </Field>

                        <Field label="Email" error={errors.email}>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="opsional"
                            />
                        </Field>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? 'Menyimpan…'
                                    : editing
                                      ? 'Simpan perubahan'
                                      : 'Tambah pelanggan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-sm leading-5 font-medium">{label}</Label>
            {children}
            {error && (
                <p className="text-xs leading-4 text-destructive">{error}</p>
            )}
        </div>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [{ title: 'Pelanggan', href: '/customers' }],
};
