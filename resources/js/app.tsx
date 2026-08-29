import { createInertiaApp } from '@inertiajs/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Paylo';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            // Public, shell-less pages.
            case name === 'welcome':
            case name === 'install':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        // Toasts and the PWA/session runtime live inside the layouts, where the
        // Inertia page context is available.
        return <TooltipProvider delayDuration={0}>{app}</TooltipProvider>;
    },
    progress: {
        color: '#2563eb',
        delay: 150,
    },
});

import { router } from '@inertiajs/react';

// This will set light / dark mode on load...
initializeTheme();

router.on('exception', (event) => {
    // Suppress network error modals
    if (event.detail.exception.message === 'Network Error' || !navigator.onLine) {
        event.preventDefault();
        console.warn('Network error suppressed to prevent JSON modal.');
    }
});
