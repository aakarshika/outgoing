/** Hooks for ticket entry and validation. */

import { useState, useCallback } from 'react';
import {
    validateTicket,
    admitTicket,
    TicketValidationResult,
} from './api';

interface UseTicketValidationReturn {
    result: TicketValidationResult | null;
    isLoading: boolean;
    error: string | null;
    errorCode: string | null;
    validate: (barcode: string, eventId: number) => Promise<void>;
    reset: () => void;
}

export function useTicketValidation(): UseTicketValidationReturn {
    const [result, setResult] = useState<TicketValidationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    const validate = useCallback(async (barcode: string, eventId: number) => {
        setIsLoading(true);
        setError(null);
        setErrorCode(null);
        setResult(null);
        try {
            const response = await validateTicket(barcode, eventId);
            if (response.success) {
                setResult(response.data);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            const data = err?.response?.data;
            setError(data?.message || 'Failed to validate ticket');
            setErrorCode(data?.error_code || null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
        setErrorCode(null);
    }, []);

    return { result, isLoading, error, errorCode, validate, reset };
}

interface UseTicketAdmissionReturn {
    isLoading: boolean;
    error: string | null;
    admitted: boolean;
    admit: (ticketId: number, eventId: number) => Promise<void>;
    reset: () => void;
}

export function useTicketAdmission(): UseTicketAdmissionReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [admitted, setAdmitted] = useState(false);

    const admit = useCallback(async (ticketId: number, eventId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await admitTicket(ticketId, eventId);
            if (response.success) {
                setAdmitted(true);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            const data = err?.response?.data;
            setError(data?.message || 'Failed to admit attendee');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setAdmitted(false);
        setError(null);
    }, []);

    return { isLoading, error, admitted, admit, reset };
}
