import React, { useState } from 'react';

interface ScrapbookSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onFocus' | 'onBlur'> {
    label: string;
    options: { value: string; label: string; icon?: string }[];
    onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
}

export const ScrapbookSelect = React.forwardRef<HTMLSelectElement, ScrapbookSelectProps>(
    ({ label, options, className, onFocus, onBlur, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);

        return (
            <div className={`flex flex-col ${className || ''}`}>
                <label
                    className={`text-[10px] font-bold text-gray-500 mb-0.5 uppercase tracking-wider transition-all duration-200 origin-bottom-left
            ${isFocused ? 'opacity-100 scale-100 h-auto' : 'opacity-0 scale-95 h-0 overflow-hidden'}
          `}
                >
                    {label}
                </label>
                <select
                    ref={ref}
                    {...props}
                    onFocus={(e) => {
                        setIsFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        onBlur?.(e);
                    }}
                    className={`w-full bg-white text-sm p-3 outline-none rounded-none border-0 shadow-[2px_2px_0px_#333] focus:shadow-[1px_1px_0px_#333] focus:translate-x-[1px] focus:translate-y-[1px] transition-all appearance-none
            ${props.disabled ? 'opacity-70 bg-gray-50 cursor-not-allowed shadow-[1px_1px_0px_#ccc]' : ''}
          `}
                    style={{
                        fontFamily: '"Caveat", cursive',
                        fontSize: '1.2rem',
                        backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPositionX: 'calc(100% - 10px)',
                        backgroundPositionY: '50%',
                        ...props.style
                    }}
                >
                    <option value="" disabled hidden>{label}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.icon ? `${opt.icon} ` : ''}{opt.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
);
ScrapbookSelect.displayName = 'ScrapbookSelect';
