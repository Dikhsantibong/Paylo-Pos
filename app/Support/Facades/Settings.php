<?php

namespace App\Support\Facades;

use App\Services\Settings\SettingsRepository;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array all()
 * @method static mixed get(string $key, mixed $default = null)
 * @method static bool bool(string $key, bool $default = false)
 * @method static int int(string $key, int $default = 0)
 * @method static float float(string $key, float $default = 0.0)
 * @method static string string(string $key, string $default = '')
 * @method static void put(array $values)
 * @method static void set(string $key, mixed $value)
 * @method static string putImage(string $key, \Illuminate\Http\UploadedFile $file)
 * @method static void forgetImage(string $key)
 * @method static string|null imageUrl(string $key)
 * @method static string|null imagePath(string $key)
 * @method static array validationRules()
 * @method static array forEditor()
 * @method static void flush()
 *
 * @see SettingsRepository
 */
class Settings extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return SettingsRepository::class;
    }
}
