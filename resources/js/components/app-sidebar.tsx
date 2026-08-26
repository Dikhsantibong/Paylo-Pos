import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Calculator,
    LayoutGrid,
    Layers,
    Package,
    PlusCircle,
    Settings,
    ShoppingCart,
    UserCog,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import type { Role, User } from '@/types/auth';

/**
 * Primary navigation — design.md §6.
 *
 * Two roles only: `owner` sees everything, `kasir` sees the operational
 * screens. Each entry maps to exactly one screen, and each screen owns one
 * kind of record — adding a module means adding one line here.
 */
const navigation: { label: string; items: NavItem[] }[] = [
    {
        label: 'Operasional',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
                roles: ['owner'],
            },
            {
                title: 'Kasir',
                href: '/pos',
                icon: ShoppingCart,
                roles: ['owner', 'kasir'],
            },
        ],
    },
    {
        label: 'Katalog',
        items: [
            {
                title: 'Produk',
                href: '/products',
                icon: Package,
                roles: ['owner', 'kasir'],
            },
            {
                title: 'Kategori',
                href: '/categories',
                icon: Layers,
                roles: ['owner', 'kasir'],
            },
            {
                title: 'Add-on',
                href: '/product-addons',
                icon: PlusCircle,
                roles: ['owner', 'kasir'],
            },
            {
                title: 'Resep',
                href: '/recipes',
                icon: BookOpen,
                roles: ['owner'],
            },
        ],
    },
    {
        label: 'Toko',
        items: [
            {
                title: 'Inventori',
                href: '/inventory',
                icon: Warehouse,
                roles: ['owner', 'kasir'],
            },
            {
                title: 'Pelanggan',
                href: '/customers',
                icon: Users,
                roles: ['owner', 'kasir'],
            },
        ],
    },
    {
        label: 'Analisis',
        items: [
            {
                title: 'HPP & margin',
                href: '/hpp',
                icon: Calculator,
                roles: ['owner'],
            },
            {
                title: 'Laporan',
                href: '/reports',
                icon: BarChart3,
                roles: ['owner'],
            },
        ],
    },
    {
        label: 'Administrasi',
        items: [
            {
                title: 'Pengguna',
                href: '/users',
                icon: UserCog,
                roles: ['owner'],
            },
            {
                title: 'Pengaturan',
                href: '/settings-pos',
                icon: Settings,
                roles: ['owner'],
            },
        ],
    },
];

export function AppSidebar() {
    const user = usePage().props.auth?.user as User | null | undefined;
    const role = user?.role as Role | undefined;

    const groups = navigation
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.roles || (role && item.roles.includes(role)),
            ),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-1">
                {groups.map((group) => (
                    <NavMain
                        key={group.label}
                        items={group.items}
                        label={group.label}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
