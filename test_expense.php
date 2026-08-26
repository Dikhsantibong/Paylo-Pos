<?php
use App\Models\Expense;
use App\Services\Reporting\ReportService;
use App\Services\Reporting\ReportPeriod;
use App\Services\Analytics\DashboardService;
use Illuminate\Support\Facades\App;
use Carbon\CarbonImmutable;

echo "\n--- Creating Expense ---\n";
$expense = Expense::create([
    'date' => CarbonImmutable::now()->format('Y-m-d'),
    'amount' => 50000,
    'notes' => 'Test Expense'
]);
echo "Expense ID: {$expense->id}\n";

echo "\n--- Dashboard KPI Test ---\n";
$dashboard = App::make(DashboardService::class);
$kpis = $dashboard->kpis();
echo "Dashboard Gross Profit: " . $kpis['grossProfit']['value'] . "\n";
echo "Dashboard Net Profit: " . $kpis['netProfit']['value'] . "\n";
echo "Dashboard Expenses: " . $kpis['expenses']['value'] . "\n";

echo "\n--- ReportService Test ---\n";
$report = App::make(ReportService::class);
$period = ReportPeriod::make('today');
$summary = $report->summary($period);
echo "Report Gross Profit: " . $summary['grossProfit'] . "\n";
echo "Report Net Profit: " . $summary['netProfit'] . "\n";
echo "Report Expenses: " . $summary['expenses'] . "\n";

$expense->delete();
echo "\n--- Test Complete ---\n";
