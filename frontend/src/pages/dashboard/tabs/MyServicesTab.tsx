import { Box } from '@mui/material';
import { Briefcase, Edit2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ComicButton } from '@/components/ui/ComicButton';
import { VendorBusinessCard } from '@/components/ui/VendorBusinessCard';
import { useMyApplications } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';

import { ApplicationDetailsList } from '../../events/components/manage-vendor/ApplicationDetailsList';

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
      <h3
        className="text-xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: '"Permanent Marker", cursive' }}
      >
        {title}
      </h3>
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
  const [openServiceIds, setOpenServiceIds] = useState<Record<string, boolean>>({});

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
          <div></div>

          <ComicButton
            type="button"
            variant="solid"
            size="default"
            shape="square"
            Icon={Plus}
            iconProps={{ strokeWidth: 3 }}
            accentColor="#00CCCC"
            color="#1e3a5f"
            onClick={() => navigate('/vendors/create')}
          >
            Create Service
          </ComicButton>
        </div>

        <div className="">
          {services.map((service: any, idx: number) => {
            const serviceApps = applications.filter(
              (app: any) => app.service === service.id,
            );
            const isOpen = openServiceIds[service.id] ?? true;
            return (
              <div
                key={service.id}
                className="relative grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 "
              >
                {/* Service Card */}
                <div className="col-span-1">
                  <Box>
                    <div className="relative flex-1">
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

                    <ComicButton 
                        type="button"
                        onClick={() => navigate(`/services/${service.id}/edit`)}
                        color="#1e3a5f"
                        accentColor="rgb(255, 215, 0)"
                        label="Edit Service"
                        className="absolute -top-3 -right-3 transform rotate-5"
                        Icon={Edit2}
                      >
                      </ComicButton>
                    </div>
                  </Box>
                </div>
                <div className="col-span-2">
                  {/* Applications for this service - Shown as "Scrapbook items" */}
                  <div className="sm:ml-12 relative">
                    Applications: {serviceApps.length}
                    {serviceApps.length === 0 ? (
                      <p className="text-gray-400 font-serif italic text-sm ml-2">
                        No applications yet for this service.
                      </p>
                    ) : isOpen ? (
                      <div className="mt-4">
                        <ApplicationDetailsList applications={serviceApps} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
