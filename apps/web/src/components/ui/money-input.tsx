import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number;
    onChange: (value: number) => void;
}

export const MoneyInput = ({ value, onChange, className, ...props }: MoneyInputProps) => {
    const [displayValue, setDisplayValue] = useState("");

    const formatCurrency = useCallback((val: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
        }).format(val);
    }, []);

    useEffect(() => {
        setDisplayValue(formatCurrency(value));
    }, [value, formatCurrency]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // Remove non-digit characters
        const digits = inputValue.replace(/\D/g, "");

        // Convert to number (divide by 100 to handle cents)
        const numberValue = Number(digits) / 100;

        onChange(numberValue);
    };

    return (
        <Input
            {...props}
            className={className}
            value={displayValue}
            onChange={handleChange}
        />
    );
};
