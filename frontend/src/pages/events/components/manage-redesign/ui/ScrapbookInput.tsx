import React, { useState } from 'react';

interface ScrapbookInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onFocus' | 'onBlur'> {
    label: string;
    example?: string;
    multiline?: boolean;
    rows?: number;
    onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

// These input types always have an internal value displayed by the browser,
// so we want the label to always show (not wait for focus/content).
const ALWAYS_SHOW_LABEL_TYPES = ['datetime-local', 'date', 'time', 'number', 'range', 'color', 'file'];

export const ScrapbookInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, ScrapbookInputProps>(
    ({ label, example, multiline, className, onFocus, onBlur, type, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);

        const alwaysShowLabel = !multiline && ALWAYS_SHOW_LABEL_TYPES.includes(type || '');

        const hasValue =
            (props.value !== undefined && props.value !== '') ||
            (props.defaultValue !== undefined && props.defaultValue !== '');

        const showLabel = isFocused || hasValue || alwaysShowLabel;

        const InputElement = multiline ? 'textarea' : 'input';

        return (
            <div className={`flex flex-col ${className || ''}`}>
                <label
                    className={`text-[10px] font-bold text-gray-500 mb-0.5 uppercase tracking-wider transition-all duration-150 origin-bottom-left leading-tight
            ${showLabel ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}
          `}
                >
                    {label}
                </label>
                <InputElement
                    ref={ref as any}
                    type={!multiline ? type : undefined}
                    {...(props as any)}
                    placeholder={isFocused || alwaysShowLabel ? (example || '') : `${label}${example ? ` · ${example}` : ''}`}
                    onFocus={(e: any) => {
                        setIsFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e: any) => {
                        setIsFocused(false);
                        onBlur?.(e);
                    }}
                    className={`w-full bg-white text-sm py-2 px-3 outline-none rounded-none border-0
            shadow-[2px_2px_0px_rgba(0,0,0,0.25)]
            focus:shadow-[1px_1px_0px_rgba(0,0,0,0.25)] focus:translate-x-[1px] focus:translate-y-[1px]
            transition-all resize-none
            ${props.disabled || props.readOnly ? 'opacity-60 bg-gray-50 cursor-not-allowed shadow-[1px_1px_0px_rgba(0,0,0,0.12)]' : ''}
          `}
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem', ...props.style }}
                />
            </div>
        );
    }
);
ScrapbookInput.displayName = 'ScrapbookInput';
