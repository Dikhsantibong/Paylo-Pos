<?php

namespace App\Services\Reporting;

use Carbon\CarbonImmutable;

/**
 * A resolved reporting window.
 *
 * Reports are requested with a preset ("today", "this_month", …) or an explicit
 * start/end pair. This value object normalises both into a concrete range plus
 * a human label, and knows the immediately preceding window of equal length so
 * every report can show a comparison.
 */
final class ReportPeriod
{
    public const PRESETS = [
        'today' => 'Hari ini',
        'yesterday' => 'Kemarin',
        'last_7_days' => '7 hari terakhir',
        'last_30_days' => '30 hari terakhir',
        'this_month' => 'Bulan ini',
        'last_month' => 'Bulan lalu',
        'this_year' => 'Tahun ini',
        'custom' => 'Rentang kustom',
    ];

    private function __construct(
        public readonly string $preset,
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
        public readonly string $label,
    ) {}

    public static function make(?string $preset, ?string $start = null, ?string $end = null): self
    {
        $preset = $preset && array_key_exists($preset, self::PRESETS) ? $preset : 'last_30_days';
        $now = CarbonImmutable::now();

        if ($preset === 'custom') {
            $from = $start ? CarbonImmutable::parse($start)->startOfDay() : $now->startOfMonth();
            $to = $end ? CarbonImmutable::parse($end)->endOfDay() : $now->endOfDay();

            if ($to->lessThan($from)) {
                [$from, $to] = [$to->startOfDay(), $from->endOfDay()];
            }

            return new self($preset, $from, $to, self::describe($from, $to));
        }

        [$from, $to] = match ($preset) {
            'today' => [$now->startOfDay(), $now->endOfDay()],
            'yesterday' => [$now->subDay()->startOfDay(), $now->subDay()->endOfDay()],
            'last_7_days' => [$now->subDays(6)->startOfDay(), $now->endOfDay()],
            'this_month' => [$now->startOfMonth(), $now->endOfDay()],
            'last_month' => [$now->subMonth()->startOfMonth(), $now->subMonth()->endOfMonth()],
            'this_year' => [$now->startOfYear(), $now->endOfDay()],
            default => [$now->subDays(29)->startOfDay(), $now->endOfDay()],
        };

        return new self($preset, $from, $to, self::describe($from, $to));
    }

    /** The window of equal length immediately before this one. */
    public function previous(): self
    {
        $length = $this->start->diffInSeconds($this->end);
        $end = $this->start->subSecond();
        $start = $end->subSeconds($length);

        return new self($this->preset, $start, $end, self::describe($start, $end));
    }

    /** Group by hour for a single day, otherwise by day. */
    public function granularity(): string
    {
        return $this->start->diffInDays($this->end) < 1 ? 'hour' : 'day';
    }

    public function days(): int
    {
        return max(1, (int) $this->start->diffInDays($this->end) + 1);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'preset' => $this->preset,
            'start' => $this->start->format('Y-m-d'),
            'end' => $this->end->format('Y-m-d'),
            'label' => $this->label,
            'days' => $this->days(),
        ];
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(
            fn ($value, $label) => ['value' => $value, 'label' => $label],
            array_keys(self::PRESETS),
            array_values(self::PRESETS),
        );
    }

    private static function describe(CarbonImmutable $from, CarbonImmutable $to): string
    {
        if ($from->isSameDay($to)) {
            return $from->translatedFormat('d F Y');
        }

        if ($from->year === $to->year) {
            return $from->translatedFormat('d M').' – '.$to->translatedFormat('d M Y');
        }

        return $from->translatedFormat('d M Y').' – '.$to->translatedFormat('d M Y');
    }
}
