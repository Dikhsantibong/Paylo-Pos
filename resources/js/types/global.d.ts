import type { Auth, Brand, SessionInfo } from '@/types/auth';
import type { Receipt } from '@/types/pos';
import type { FlashToast } from '@/types/ui';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            brand: Brand;
            session: SessionInfo;
            flash: FlashToast | null;
            receipt: Receipt | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
