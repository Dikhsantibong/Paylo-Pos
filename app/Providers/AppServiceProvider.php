<?php

namespace App\Providers;

use App\Services\Analytics\DashboardService;
use App\Services\Costing\HppService;
use App\Services\Pos\CheckoutService;
use App\Services\Reporting\ReportService;
use App\Services\Settings\SettingsRepository;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Settings are read many times per request; one instance keeps the
        // resolved bag warm for the whole lifecycle.
        $this->app->singleton(SettingsRepository::class);

        // Domain services are stateless — scoped keeps them to one per request.
        $this->app->scoped(HppService::class);
        $this->app->scoped(CheckoutService::class);
        $this->app->scoped(ReportService::class);
        $this->app->scoped(DashboardService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureLocale();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Dates on the dashboard, reports and exports are shown in Indonesian.
     */
    protected function configureLocale(): void
    {
        CarbonImmutable::setLocale('id');
        Carbon::setLocale('id');
    }
}
