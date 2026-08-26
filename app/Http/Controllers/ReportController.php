<?php

namespace App\Http\Controllers;

use App\Exports\FinancialReportExport;
use App\Services\Reporting\ReportPeriod;
use App\Services\Reporting\ReportService;
use App\Services\Settings\SettingsRepository;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reports,
        private readonly SettingsRepository $settings,
    ) {}

    public function index(Request $request): Response
    {
        $period = $this->resolvePeriod($request);

        return Inertia::render('reports/index', [
            'report' => $this->reports->build($period),
            'presets' => ReportPeriod::options(),
        ]);
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $period = $this->resolvePeriod($request);

        $pdf = Pdf::loadView('reports.pdf', $this->exportPayload($period))
            ->setPaper('a4')
            ->setOption('isRemoteEnabled', true);

        return $pdf->download($this->filename($period, 'pdf'));
    }

    public function exportExcel(Request $request): BinaryFileResponse
    {
        $period = $this->resolvePeriod($request);

        return Excel::download(
            new FinancialReportExport($this->exportPayload($period)),
            $this->filename($period, 'xlsx'),
        );
    }

    /**
     * Report data plus the branding an export header needs.
     *
     * @return array<string, mixed>
     */
    private function exportPayload(ReportPeriod $period): array
    {
        $report = $this->reports->build($period);

        $report['shop']['logo_path'] = $this->settings->imagePath('shop_logo');
        $report['generatedAt'] = now()->translatedFormat('d F Y, H:i');
        $report['generatedBy'] = request()->user()?->name;

        return $report;
    }

    private function resolvePeriod(Request $request): ReportPeriod
    {
        return ReportPeriod::make(
            $request->string('preset')->toString() ?: null,
            $request->string('start')->toString() ?: null,
            $request->string('end')->toString() ?: null,
        );
    }

    private function filename(ReportPeriod $period, string $extension): string
    {
        $shop = str($this->settings->string('shop_name', 'paylo'))->slug()->value();

        return "laporan-{$shop}-{$period->start->format('Ymd')}-{$period->end->format('Ymd')}.{$extension}";
    }
}
