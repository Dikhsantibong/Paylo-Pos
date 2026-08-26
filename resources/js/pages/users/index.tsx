import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    EmptyState,
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
import { initials, number } from '@/lib/format';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    transactions_count: number;
    created_at: string;
};

type RoleOption = { value: string; label: string; description: string };

type Props = { users: UserRow[]; roles: RoleOption[] };

export default function UsersIndex({ users, roles }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            password: '',
            role: 'kasir',
        });

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (user: UserRow) => {
        clearErrors();
        setEditing(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
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
            put(`/users/${editing.id}`, { onSuccess, preserveScroll: true });
        } else {
            post('/users', { onSuccess, preserveScroll: true });
        }
    };

    const destroy = (user: UserRow) => {
        if (
            window.confirm(
                `Hapus akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            router.delete(`/users/${user.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Pengguna" />

            <div className="flex w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    icon={UserCog}
                    title="Pengguna"
                    description="Kelola akun dan hak akses tim Anda"
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="size-4" aria-hidden />
                            Tambah pengguna
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    {roles.map((role) => (
                        <div
                            key={role.value}
                            className="rounded-xl border bg-card p-4 shadow-xs"
                        >
                            <StatusBadge
                                tone={
                                    role.value === 'owner' ? 'brand' : 'neutral'
                                }
                            >
                                {role.label}
                            </StatusBadge>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                {role.description}
                            </p>
                        </div>
                    ))}
                </div>

                <Panel
                    title="Daftar pengguna"
                    description={`${number(users.length)} akun terdaftar`}
                    padded={false}
                >
                    {users.length > 0 ? (
                        <DataTable>
                            <thead>
                                <tr>
                                    <Th>Nama</Th>
                                    <Th>Email</Th>
                                    <Th>Peran</Th>
                                    <Th numeric>Transaksi</Th>
                                    <Th>Bergabung</Th>
                                    <Th className="w-24 text-right">Aksi</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <Tr key={user.id}>
                                        <Td>
                                            <span className="flex items-center gap-2.5">
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                                    {initials(user.name)}
                                                </span>
                                                <span className="font-medium">
                                                    {user.name}
                                                </span>
                                            </span>
                                        </Td>
                                        <Td muted>{user.email}</Td>
                                        <Td>
                                            <StatusBadge
                                                tone={
                                                    user.role === 'owner'
                                                        ? 'brand'
                                                        : 'neutral'
                                                }
                                            >
                                                {user.role_label}
                                            </StatusBadge>
                                        </Td>
                                        <Td numeric>
                                            {number(user.transactions_count)}
                                        </Td>
                                        <Td muted>{user.created_at}</Td>
                                        <Td>
                                            <span className="flex justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        openEdit(user)
                                                    }
                                                    aria-label={`Ubah ${user.name}`}
                                                >
                                                    <Pencil
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        destroy(user)
                                                    }
                                                    aria-label={`Hapus ${user.name}`}
                                                >
                                                    <Trash2
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                </Button>
                                            </span>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </DataTable>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                icon={UserCog}
                                title="Belum ada pengguna"
                                description="Tambahkan akun kasir agar tim Anda bisa mulai bertransaksi."
                                action={
                                    <Button size="sm" onClick={openCreate}>
                                        Tambah pengguna
                                    </Button>
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
                                : 'Tambah pengguna'}
                        </DialogTitle>
                        <DialogDescription>
                            Peran menentukan menu apa saja yang bisa dibuka
                            pengguna ini.
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

                        <Field label="Email" error={errors.email}>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field
                            label={editing ? 'Password baru' : 'Password'}
                            help={
                                editing
                                    ? 'Kosongkan jika tidak ingin mengganti password.'
                                    : 'Minimal 8 karakter.'
                            }
                            error={errors.password}
                        >
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                required={!editing}
                                autoComplete="new-password"
                            />
                        </Field>

                        <Field
                            label="Peran"
                            help={
                                roles.find((role) => role.value === data.role)
                                    ?.description
                            }
                            error={errors.role}
                        >
                            <Select
                                value={data.role}
                                onValueChange={(value) =>
                                    setData('role', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                      : 'Tambah pengguna'}
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
    help,
    error,
    children,
}: {
    label: string;
    help?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
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

UsersIndex.layout = { breadcrumbs: [{ title: 'Pengguna', href: '/users' }] };
