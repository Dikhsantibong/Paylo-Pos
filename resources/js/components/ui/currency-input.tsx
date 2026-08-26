import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

type CurrencyInputProps = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
    value: number | '';
    onChange: (value: number | '') => void;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, className, ...props }, ref) => {
        // Format the numeric value to a string with dots as thousands separators
        const displayValue = value === '' ? '' : new Intl.NumberFormat('id-ID').format(value);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Strip out everything except digits
            const rawValue = e.target.value.replace(/\D/g, '');
            if (rawValue === '') {
                onChange('');
            } else {
                onChange(Number(rawValue));
            }
        };

        return (
            <Input
                ref={ref}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                className={className}
                {...props}
            />
        );
    },
);

CurrencyInput.displayName = 'CurrencyInput';
