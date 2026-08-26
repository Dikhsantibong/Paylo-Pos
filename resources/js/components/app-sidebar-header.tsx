import { usePage } from '@inertiajs/react';
import { Clock, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { initials } from '@/lib/format';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { User } from '@/types/auth';

/**
 * Top bar — design.md §4. 64px tall, breadcrumbs on the left, operational
 * context on the right: clock, connection state, and who is signed in.
 *
 * Connection state matters on a POS: an offline terminal cannot charge.
 */
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const user = usePage().props.auth?.user as User | null | undefined;
    const online = useOnlineStatus();
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000);

        return () => window.clearInterval(timer);
    }, []);

    const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const date = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm md:px-6 print:hidden">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 text-xs leading-5 text-muted-foreground lg:flex">
                    <Clock className="size-3.5" aria-hidden />
                    <span className="tabular font-medium text-foreground">
                        {time}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{date}</span>
                </div>

                <span
                    className={
                        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs leading-4 font-medium ring-1 ring-inset ' +
                        (online
                            ? 'bg-success-soft text-success ring-success/20'
                            : 'bg-warning-soft text-warning ring-warning/25')
                    }
                    title={
                        online
                            ? 'Terhubung ke server'
                            : 'Perangkat sedang offline'
                    }
                >
                    {online ? (
                        <Wifi className="size-3.5" aria-hidden />
                    ) : (
                        <WifiOff className="size-3.5" aria-hidden />
                    )}
                    <span className="hidden sm:inline">
                        {online ? 'Online' : 'Offline'}
                    </span>
                </span>

                {user && (
                    <div className="flex items-center gap-2 border-l pl-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-xs leading-4 font-semibold text-foreground">
                                {user.name}
                            </p>
                            <p className="text-xs leading-4 text-muted-foreground">
                                {user.role_label ?? user.role}
                            </p>
                        </div>
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                            {initials(user.name)}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
}
