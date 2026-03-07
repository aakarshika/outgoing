import { Box, Tooltip } from '@mui/material';
import { Users, CheckCircle } from 'lucide-react';
import { useEventNeeds } from '@/features/needs/hooks';

export function EventNeedsSummary({ eventId }: { eventId: number }) {
    const { data: needsResponse, isLoading } = useEventNeeds(eventId);
    const needs = needsResponse?.data || [];

    if (isLoading) {
        return (
            <div className="flex gap-2 animate-pulse mt-3 pt-3 border-t-2 border-dashed border-gray-300">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (needs.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-300">
            <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-2" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                Service Needs ({needs.length})
            </h4>
            <div className="flex flex-wrap gap-2">
                {needs.map((need: any) => {
                    const isFilled = need.status === 'filled';
                    const appCount = need.application_count || 0;

                    return (
                        <Tooltip
                            key={need.id}
                            title={`${need.title} - ${isFilled ? 'Vendor Hired' : `${appCount} applications`}`}
                            arrow
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.5,
                                    border: '2px solid',
                                    borderColor: isFilled ? 'transparent' : 'gray.400',
                                    bgcolor: isFilled ? 'green.100' : 'gray.50',
                                    color: isFilled ? 'green.800' : 'gray.700',
                                    fontFamily: '"Caveat", cursive',
                                    fontSize: '0.9rem',
                                    boxShadow: isFilled ? '1px 1px 0px rgba(0,0,0,0.1)' : 'none',
                                    transform: `rotate(${Math.random() > 0.5 ? 1 : -1}deg)`,
                                }}
                            >
                                <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] block">
                                    {need.category}
                                </span>
                                {isFilled ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                    <div className="flex items-center gap-0.5 ml-1 text-gray-500 bg-gray-200 px-1 rounded-sm">
                                        <Users className="h-3 w-3" />
                                        <span className="text-[0.6rem] font-bold font-sans">{appCount}</span>
                                    </div>
                                )}
                            </Box>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}
