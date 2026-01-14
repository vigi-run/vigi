import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: string;
    onChange: (value: string) => void;
    mask: string | ((val: string) => string);
}

export const MaskedInput = ({ value, onChange, mask, className, ...props }: MaskedInputProps) => {
    const [displayValue, setDisplayValue] = useState(value);

    // Helper to apply mask
    const applyMask = (val: string, maskPattern: string) => {
        let result = "";

        // Remove all non-alphanumeric characters from value to process raw data
        // But keep the logic simple: verify character by character against mask
        // 9: numeric, a: alpha, *: alphanumeric

        // Simple implementation for common masks like CPF/CNPJ where literals are fixed
        // A more robust implementation would process raw values.

        // Let's use a simpler replace approach for now if mask is a string
        // This is a naive implementation, meant for simple fixed length masks.

        // Better approach: strip non-digits, then apply mask
        const cleanVal = val.replace(/\D/g, "");

        let maskIndex = 0;
        let valIndex = 0;

        while (maskIndex < maskPattern.length && valIndex < cleanVal.length) {
            const maskChar = maskPattern[maskIndex];
            const valChar = cleanVal[valIndex];

            if (maskChar === '9') {
                result += valChar;
                valIndex++;
            } else {
                result += maskChar;
                if (valChar === maskChar) {
                    valIndex++; // If user typed the separator, move past it
                }
            }
            maskIndex++;
        }

        return result;
    };

    useEffect(() => {
        // Determine the mask pattern
        const maskPattern = typeof mask === 'function' ? mask(value) : mask;
        if (value && maskPattern) {
            setDisplayValue(applyMask(value, maskPattern));
        } else {
            setDisplayValue(value);
        }
    }, [value, mask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const maskPattern = typeof mask === 'function' ? mask(val) : mask;

        // Calculate raw value or masked value
        // Ideally we want to pass the raw value or the masked value depending on requirement
        // Usually masking components pass the raw value up or controlled value. 
        // Here we will pass the "clean" value up if we want to store raw, or masked if we want to store masked.
        // The requirement is usually to store raw or masked? 
        // Usually CPF/CNPJ are stored stripped or masked. Let's assume we want to call onChange with the NEW value the user typed, 
        // but we enforce masking on display.

        // However, for Simplicity in this custom component without external libs:
        // We will just format what the user types and call onChange with the formatted value 
        // (or maybe raw value? standard is usually raw).

        // Let's implement a standard "strip then mask" flow.
        const clean = val.replace(/\D/g, "");
        const masked = applyMask(clean, maskPattern);

        onChange(masked);
    };

    return (
        <Input
            {...props}
            className={className}
            value={displayValue}
            onChange={handleChange}
            maxLength={typeof mask === 'string' ? mask.length : undefined}
        />
    );
};
