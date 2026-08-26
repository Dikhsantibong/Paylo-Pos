<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

/**
 * Spreadsheet version of the financial report.
 *
 * Mirrors the PDF: same branded header, same sections, same numbers — only the
 * medium differs. The logo is placed as a floating drawing when the uploaded
 * file is a raster image (PhpSpreadsheet cannot embed SVG).
 */
class FinancialReportExport implements FromView, WithColumnWidths, WithDrawings, WithTitle
{
    /** @param array<string, mixed> $report */
    public function __construct(
        private readonly array $report,
    ) {}

    public function title(): string
    {
        return 'Laporan';
    }

    /** @return array<string, int> */
    public function columnWidths(): array
    {
        return [
            'A' => 26,
            'B' => 22,
            'C' => 18,
            'D' => 18,
            'E' => 18,
            'F' => 16,
            'G' => 16,
        ];
    }

    public function view(): View
    {
        return view('reports.excel', $this->report + [
            'hasLogo' => $this->logoFile() !== null,
        ]);
    }

    /** @return Drawing|array<int, Drawing> */
    public function drawings()
    {
        $file = $this->logoFile();

        if ($file === null) {
            return [];
        }

        $drawing = new Drawing;
        $drawing->setName($this->report['shop']['name'] ?? 'Logo');
        $drawing->setDescription('Logo toko');
        $drawing->setPath($file);
        $drawing->setHeight(58);
        $drawing->setCoordinates('A1');
        $drawing->setOffsetX(6);
        $drawing->setOffsetY(6);

        return $drawing;
    }

    /**
     * Absolute path of the logo when it is a raster image PhpSpreadsheet can
     * embed; null for SVG or when no logo is set.
     */
    private function logoFile(): ?string
    {
        $path = $this->report['shop']['logo_path'] ?? null;

        if (! $path || ! is_file($path)) {
            return null;
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return in_array($extension, ['png', 'jpg', 'jpeg', 'gif'], true) ? $path : null;
    }
}
