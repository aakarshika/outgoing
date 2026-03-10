import { ArrowLeft, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useVendorServices } from '@/features/vendors/hooks';

export default function VendorPortfolioPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { data: response, isLoading } = useVendorServices({
    vendor_id: Number(vendorId || 0),
    page_size: 100,
  });

  const services = response?.data || [];
  const vendorName = services[0]?.vendor_name || 'Vendor';

  if (!Number(vendorId || 0)) {
    return (
      <div className="p-8 text-center text-muted-foreground">Vendor not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link to="/vendors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{vendorName} Portfolio</h1>
            <p className="text-sm text-muted-foreground">
              Services and past-style offerings
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Portfolio Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This vendor has no active services, or you may be using an incorrect ID.
            Remember to use a <strong>Vendor ID</strong> for portfolios, not a Service
            ID.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link to="/vendors">Browse All Vendors</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="aspect-[4/3] bg-muted">
                {service.portfolio_image ? (
                  <img
                    src={service.portfolio_image}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-4xl">
                    🎨
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                    {service.category}
                  </span>
                  {service.base_price && (
                    <span className="text-sm font-semibold">
                      From ${parseFloat(service.base_price).toFixed(0)}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold">{service.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {service.description}
                </p>
                {service.location_city && (
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {service.location_city}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
