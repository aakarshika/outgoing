import { Box } from '@mui/material';
import { Briefcase, Edit2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EditApplicationModal } from '@/components/events/EditApplicationModal';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { useMyApplications } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

// Internal shared components from DashboardPage
function LoadingSkeleton({ count }: { count: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="h-20 border-2 border-dashed border-gray-300 bg-white/50 animate-pulse"
                />
            ))}
        </div>
    );
}

function EmptyState({ icon, title, subtitle, actionLabel, actionTo }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-gray-300 bg-white/30 text-center">
            <div className="mb-4 opacity-50">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: '"Permanent Marker", cursive' }}>{title}</h3>
            <p className="text-gray-500 mb-6 font-serif italic">{subtitle}</p>
            {actionLabel && (
                <Link
                    to={actionTo}
                    className="px-6 py-2 bg-yellow-300 border-2 border-gray-800 text-gray-900 font-bold hover:bg-yellow-400 transition-colors shadow-[3px_3px_0px_#333]"
                    style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}

export function MyServicesTab() {
    const navigate = useNavigate();
    const { data: servicesResponse, isLoading: servicesLoading } = useMyServices();
    const { data: applicationsResponse } = useMyApplications();
    const services = servicesResponse?.data || [];
    const applications = applicationsResponse?.data || [];

    const [editingApplication, setEditingApplication] = useState<any | null>(null);

    if (servicesLoading) return <LoadingSkeleton count={2} />;

    if (services.length === 0) {
        return (
            <EmptyState
                icon={<Briefcase className="h-12 w-12 text-gray-400" />}
                title="Welcome, Vendor!"
                subtitle="List your first service to start seeing tailored opportunities."
                actionLabel="Add Service"
                actionTo="/vendors/create"
            />
        );
    }

    return (
        <>
            <div className="space-y-12">
                <div className="flex justify-between items-start">
                    <h2
                        className="text-xl text-gray-900"
                        style={{
                            fontFamily: '"Permanent Marker", cursive',
                            transform: 'rotate(-1deg)',
                        }}
                    >
                        My Vendor Portfolio
                    </h2>
                    <Link
                        to="/vendors/create"
                        className="inline-flex items-center gap-1.5 border-2 border-gray-800 bg-green-400 px-4 py-2 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-green-500"
                        style={{ fontFamily: '"Permanent Marker"', fontSize: '0.85rem' }}
                    >
                        <Plus className="h-4 w-4" /> Add New Service
                    </Link>
                </div>

                <div className="space-y-12">
                    {services.map((service: any, idx: number) => {
                        const serviceApps = applications.filter(
                            (app: any) => app.service === service.id,
                        );
                        return (
                            <div key={service.id} className="relative">
                                <Box
                                    sx={{
                                        mb: 2,
                                        transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)`,
                                    }}
                                >
                                    <VendorBusinessCard
                                        vendor={{
                                            title: service.title,
                                            vendor_name: service.vendor_name,
                                            category: service.category,
                                            portfolio_image: service.portfolio_image,
                                            avg_rating: service.avg_rating,
                                            event_count: serviceApps.filter(
                                                (a: any) => a.status === 'accepted',
                                            ).length,
                                            created_at: service.created_at,
                                        }}
                                        rotation={idx % 2 === 0 ? -0.5 : 0.5}
                                        onClick={() => navigate(`/services/${service.id}`)}
                                    />

                                    {/* Edit Service Button */}
                                    <Link
                                        to={`/services/${service.id}/edit`}
                                        className="absolute -top-3 -right-3 bg-yellow-300 border-2 border-gray-800 p-2 shadow-[3px_3px_0px_#333] transition-transform hover:scale-110"
                                        style={{ transform: 'rotate(5deg)' }}
                                        title="Edit Service"
                                    >
                                        <Edit2 className="h-5 w-5 text-gray-800" />
                                    </Link>
                                </Box>

                                {/* Applications for this service - Shown as "Scrapbook items" */}
                                <div className="ml-4 sm:ml-12 relative">
                                    {/* Connector line */}
                                    <div className="absolute -left-6 top-0 bottom-0 w-1 border-l-2 border-dashed border-gray-400 hidden sm:block" />

                                    <div className="relative inline-block mb-3">
                                        <h3
                                            className="text-md font-bold text-gray-700 uppercase tracking-widest relative z-0 bg-white px-3 border-2 border-gray-800 transform rotate-1"
                                            style={{ fontFamily: '"Permanent Marker", cursive' }}
                                        >
                                            My Applications ({serviceApps.length})
                                        </h3>
                                    </div>

                                    {serviceApps.length === 0 ? (
                                        <p className="text-gray-400 font-serif italic text-sm ml-2">
                                            No applications yet for this service.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {serviceApps.map((app: any, appIdx: number) => {
                                                const statusStyle =
                                                    app.status === 'accepted'
                                                        ? { color: '#16a34a', bg: '#f0fdf4' }
                                                        : app.status === 'rejected'
                                                            ? { color: '#dc2626', bg: '#fef2f2' }
                                                            : { color: '#ca8a04', bg: '#fefce8' };

                                                return (
                                                    <div
                                                        key={app.id}
                                                        className="relative p-5 border-2 border-gray-800 bg-white shadow-[4px_4px_0px_#333] transition-all hover:bg-gray-50"
                                                        style={{
                                                            transform: `rotate(${appIdx % 2 === 0 ? 0.3 : -0.3}deg)`,
                                                            backgroundImage:
                                                                'linear-gradient(to right, rgba(0,0,0,0.01) 1px, transparent 1px)',
                                                            backgroundSize: '15px 15px',
                                                        }}
                                                    >
                                                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Link
                                                                        to={`/events/${app.event_id}`}
                                                                        className="text-lg font-bold text-gray-900 hover:text-blue-600 underline decoration-2 decoration-blue-200"
                                                                        style={{
                                                                            fontFamily: '"Caveat", cursive',
                                                                            fontSize: '1.4rem',
                                                                        }}
                                                                    >
                                                                        {app.event_title}
                                                                    </Link>
                                                                    <span className="text-[0.6rem] font-bold text-gray-400 border border-gray-300 px-1 uppercase tracking-tighter">
                                                                        {app.need_title}
                                                                    </span>
                                                                </div>
                                                                {app.message ? (
                                                                    <p
                                                                        className="text-gray-600 text-sm line-clamp-2 italic font-serif"
                                                                        style={{ lineHeight: 1.4 }}
                                                                    >
                                                                        "{app.message}"
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-gray-400 text-xs italic font-serif">
                                                                        (No message attached)
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                                                                <div
                                                                    className="px-3 py-1 border-2 font-black uppercase text-[0.7rem] tracking-widest"
                                                                    style={{
                                                                        fontFamily: '"Permanent Marker", cursive',
                                                                        color: statusStyle.color,
                                                                        borderColor: statusStyle.color,
                                                                        backgroundColor: statusStyle.bg,
                                                                        transform: 'rotate(-2deg)',
                                                                    }}
                                                                >
                                                                    {app.status}
                                                                </div>

                                                                {app.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => setEditingApplication(app)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-gray-800 bg-blue-300 hover:bg-blue-400 text-gray-900 shadow-[2px_2px_0px_#333] transition-all active:translate-x-[1px] active:translate-y-[1px]"
                                                                        style={{
                                                                            fontFamily: '"Permanent Marker"',
                                                                            fontSize: '0.75rem',
                                                                        }}
                                                                    >
                                                                        <Edit2 className="h-3.5 w-3.5" /> Edit
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <EditApplicationModal
                open={!!editingApplication}
                onClose={() => setEditingApplication(null)}
                application={editingApplication}
            />
        </>
    );
}
