<?php

namespace App\Http\Controllers;

use App\Services\Analytics\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboard,
    ) {}

    /**
     * The dashboard renders every chart immediately — no filters, no view
     * switcher. All shaping lives in DashboardService.
     */
    public function index(): Response
    {
        return Inertia::render('dashboard', $this->dashboard->payload());
    }
}
