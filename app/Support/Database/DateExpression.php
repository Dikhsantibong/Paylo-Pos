<?php

namespace App\Support\Database;

use Illuminate\Support\Facades\DB;

/**
 * Portable SQL fragments for the date grouping the analytics screens do.
 *
 * MySQL, PostgreSQL and SQLite each spell "the hour of this timestamp"
 * differently, and the test suite runs on SQLite while production runs on
 * MySQL. Keeping the dialect differences in one place means a report never has
 * to care which database it is talking to.
 */
final class DateExpression
{
    /** Calendar date, formatted as `YYYY-MM-DD`. */
    public static function date(string $column): string
    {
        return match (self::driver()) {
            'sqlite' => "date({$column})",
            'pgsql' => "TO_CHAR({$column}, 'YYYY-MM-DD')",
            'sqlsrv' => "CONVERT(date, {$column})",
            default => "DATE({$column})",
        };
    }

    /** Hour of the day, 0–23, as an integer. */
    public static function hour(string $column): string
    {
        return match (self::driver()) {
            'sqlite' => "CAST(strftime('%H', {$column}) AS INTEGER)",
            'pgsql' => "CAST(EXTRACT(HOUR FROM {$column}) AS INTEGER)",
            'sqlsrv' => "DATEPART(hour, {$column})",
            default => "HOUR({$column})",
        };
    }

    /**
     * Day of the week using MySQL's numbering: 1 = Sunday … 7 = Saturday.
     * Every driver is normalised to that scale so callers need one mapping.
     */
    public static function weekday(string $column): string
    {
        return match (self::driver()) {
            'sqlite' => "CAST(strftime('%w', {$column}) AS INTEGER) + 1",
            'pgsql' => "CAST(EXTRACT(DOW FROM {$column}) AS INTEGER) + 1",
            'sqlsrv' => "DATEPART(weekday, {$column})",
            default => "DAYOFWEEK({$column})",
        };
    }

    private static function driver(): string
    {
        return DB::connection()->getDriverName();
    }
}
