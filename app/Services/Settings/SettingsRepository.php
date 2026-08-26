<?php

namespace App\Services\Settings;

use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Typed, cached access to the `settings` table.
 *
 * Every key is declared in config/paylo.php with a type + default, so callers
 * always get a correctly cast value even before the row exists in the database.
 * Registered as a singleton in AppServiceProvider and reachable through the
 * `Settings` facade / `settings()` helper.
 */
class SettingsRepository
{
    /** @var array<string, mixed>|null */
    private ?array $resolved = null;

    /** @return array<string, array<string, mixed>> */
    public function definitions(): array
    {
        return config('paylo.settings', []);
    }

    public function definition(string $key): ?array
    {
        return $this->definitions()[$key] ?? null;
    }

    /**
     * All settings, cast to their declared type, with defaults filled in.
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        if ($this->resolved !== null) {
            return $this->resolved;
        }

        $raw = Cache::remember(
            config('paylo.cache_key'),
            config('paylo.cache_ttl'),
            fn () => Setting::query()->pluck('value', 'key')->all()
        );

        $resolved = [];

        foreach ($this->definitions() as $key => $definition) {
            $resolved[$key] = array_key_exists($key, $raw) && $raw[$key] !== null
                ? $this->cast($raw[$key], $definition['type'])
                : $definition['default'];
        }

        return $this->resolved = $resolved;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $all = $this->all();

        if (array_key_exists($key, $all)) {
            return $all[$key];
        }

        return $default;
    }

    public function bool(string $key, bool $default = false): bool
    {
        return (bool) ($this->get($key) ?? $default);
    }

    public function int(string $key, int $default = 0): int
    {
        return (int) ($this->get($key) ?? $default);
    }

    public function float(string $key, float $default = 0.0): float
    {
        return (float) ($this->get($key) ?? $default);
    }

    public function string(string $key, string $default = ''): string
    {
        return (string) ($this->get($key) ?? $default);
    }

    /**
     * Persist one or many settings. Unknown keys are ignored.
     *
     * @param  array<string, mixed>  $values
     */
    public function put(array $values): void
    {
        $definitions = $this->definitions();

        foreach ($values as $key => $value) {
            if (! isset($definitions[$key])) {
                continue;
            }

            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $this->serialize($value, $definitions[$key]['type'])]
            );
        }

        $this->flush();
    }

    public function set(string $key, mixed $value): void
    {
        $this->put([$key => $value]);
    }

    /**
     * Store an uploaded branding image and return its public path.
     * Any previously stored file for that key is removed.
     */
    public function putImage(string $key, UploadedFile $file): string
    {
        $disk = Storage::disk(config('paylo.branding_disk'));

        $this->forgetImage($key);

        $name = $key.'-'.now()->format('YmdHis').'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs(config('paylo.branding_path'), $name, [
            'disk' => config('paylo.branding_disk'),
        ]);

        $this->set($key, $path);

        // Touch the disk so a misconfigured driver fails loudly here, not later.
        $disk->exists($path);

        return $path;
    }

    public function forgetImage(string $key): void
    {
        $existing = (string) $this->get($key);

        if ($existing !== '') {
            Storage::disk(config('paylo.branding_disk'))->delete($existing);
        }

        $this->set($key, '');
    }

    /**
     * Public URL for an image setting, or null when unset.
     */
    public function imageUrl(string $key): ?string
    {
        $path = (string) $this->get($key);

        if ($path === '') {
            return null;
        }

        return Storage::disk(config('paylo.branding_disk'))->url($path);
    }

    /**
     * Absolute filesystem path for an image setting — needed by DomPDF, which
     * cannot fetch remote URLs reliably.
     */
    public function imagePath(string $key): ?string
    {
        $path = (string) $this->get($key);

        if ($path === '') {
            return null;
        }

        $absolute = Storage::disk(config('paylo.branding_disk'))->path($path);

        return is_file($absolute) ? $absolute : null;
    }

    /**
     * Validation rules for every writable (non-image) setting.
     *
     * @return array<string, string>
     */
    public function validationRules(): array
    {
        $rules = [];

        foreach ($this->definitions() as $key => $definition) {
            if ($definition['type'] === 'image') {
                continue;
            }

            $rules[$key] = $definition['rules'];
        }

        return $rules;
    }

    /**
     * Settings shaped for the settings screen: value + metadata per group.
     *
     * @return array<string, mixed>
     */
    public function forEditor(): array
    {
        $values = $this->all();
        $groups = [];

        foreach (config('paylo.groups') as $groupKey => $group) {
            $groups[$groupKey] = $group + ['key' => $groupKey, 'fields' => []];
        }

        foreach ($this->definitions() as $key => $definition) {
            $group = $definition['group'];

            $groups[$group]['fields'][] = [
                'key' => $key,
                'type' => $definition['type'],
                'label' => $definition['label'],
                'help' => $definition['help'],
            ];
        }

        return [
            'values' => $values,
            'groups' => array_values($groups),
        ];
    }

    public function flush(): void
    {
        $this->resolved = null;
        Cache::forget(config('paylo.cache_key'));
    }

    private function cast(mixed $value, string $type): mixed
    {
        return match ($type) {
            'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'int' => (int) $value,
            'float' => (float) $value,
            default => (string) $value,
        };
    }

    private function serialize(mixed $value, string $type): string
    {
        return match ($type) {
            'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
            'int' => (string) (int) $value,
            'float' => (string) (float) $value,
            default => (string) ($value ?? ''),
        };
    }
}
