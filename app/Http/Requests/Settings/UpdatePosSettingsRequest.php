<?php

namespace App\Http\Requests\Settings;

use App\Support\Facades\Settings;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation is derived from config/paylo.php, so adding a setting there is
 * enough — no rule needs to be repeated here.
 */
class UpdatePosSettingsRequest extends FormRequest
{
    /**
     * The form is submitted as multipart (it can carry a logo), so every value
     * arrives as a string and blanks arrive as "". Normalise those to null so
     * the `nullable` rules behave, and cast the booleans back.
     */
    protected function prepareForValidation(): void
    {
        $definitions = config('paylo.settings', []);
        $normalised = [];

        foreach ($definitions as $key => $definition) {
            if ($definition['type'] === 'image' || ! $this->has($key)) {
                continue;
            }

            $value = $this->input($key);

            if ($definition['type'] === 'bool') {
                $normalised[$key] = $this->boolean($key);

                continue;
            }

            if ($value === '' || $value === null) {
                $normalised[$key] = in_array($definition['type'], ['int', 'float'], true)
                    ? $definition['default']
                    : null;
            }
        }

        if ($normalised !== []) {
            $this->merge($normalised);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return Settings::validationRules() + [
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'logo.mimes' => 'Logo harus berformat PNG, JPG, WEBP, atau SVG.',
            'logo.max' => 'Ukuran logo maksimal 2 MB.',
            'tax_rate.max' => 'Persentase pajak tidak boleh lebih dari 100.',
            'session_lifetime.max' => 'Batas sesi maksimal 525600 menit (1 tahun). Isi 0 untuk tanpa batas.',
        ];
    }

    /**
     * Only the declared setting keys — never the file or the remove flag.
     *
     * @return array<string, mixed>
     */
    public function settingValues(): array
    {
        return array_intersect_key($this->validated(), Settings::validationRules());
    }
}
