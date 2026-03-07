"""Views for vendor endpoints."""

from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.vendors.models import VendorReview, VendorService
from core.responses import error_response, success_response

from .serializers import (
    VendorReviewSerializer,
    VendorServiceCreateSerializer,
    VendorServiceSerializer,
)


class VendorServiceListCreateView(APIView):
    """List all vendor services or create a new one."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Public GET, auth POST."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        """List active vendor services with optional filters."""
        services = VendorService.objects.filter(is_active=True).select_related(
            "vendor", "vendor__profile"
        )

        category = request.query_params.get("category")
        if category:
            services = services.filter(category__icontains=category)

        city = request.query_params.get("city")
        if city:
            services = services.filter(location_city__icontains=city)

        vendor_id = request.query_params.get("vendor_id")
        if vendor_id:
            services = services.filter(vendor_id=vendor_id)

        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total_count = services.count()
        start = (page - 1) * page_size
        services = services[start : start + page_size]

        serializer = VendorServiceSerializer(
            services, many=True, context={"request": request}
        )
        return success_response(
            data=serializer.data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )

    def post(self, request):
        """Create a new vendor service. Any user can create one."""

        serializer = VendorServiceCreateSerializer(data=request.data)
        if serializer.is_valid():
            service = serializer.save(vendor=request.user)
            result = VendorServiceSerializer(service, context={"request": request})
            return success_response(
                data=result.data, message="Service created", status=201
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class VendorServiceDetailView(APIView):
    """Retrieve, update, or delete a vendor service."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Public GET, auth for mutations."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, service_id):
        """Get a single service."""
        try:
            service = VendorService.objects.select_related(
                "vendor", "vendor__profile"
            ).get(pk=service_id)
        except VendorService.DoesNotExist:
            return error_response(message="Service not found", status=404)
        serializer = VendorServiceSerializer(service, context={"request": request})
        return success_response(data=serializer.data)

    def patch(self, request, service_id):
        """Update a service. Owner only."""
        try:
            service = VendorService.objects.get(pk=service_id)
        except VendorService.DoesNotExist:
            return error_response(message="Service not found", status=404)
        if service.vendor != request.user:
            return error_response(message="Not authorized", status=403)
        serializer = VendorServiceCreateSerializer(
            service, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            result = VendorServiceSerializer(service, context={"request": request})
            return success_response(data=result.data, message="Service updated")
        return error_response(message="Validation Error", errors=serializer.errors)

    def delete(self, request, service_id):
        """Deactivate a service. Owner only."""
        try:
            service = VendorService.objects.get(pk=service_id)
        except VendorService.DoesNotExist:
            return error_response(message="Service not found", status=404)
        if service.vendor != request.user:
            return error_response(message="Not authorized", status=403)
        service.is_active = False
        service.save()
        return success_response(message="Service deactivated")


class MyServicesView(APIView):
    """List vendor services for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get my services."""
        services = VendorService.objects.filter(vendor=request.user)
        serializer = VendorServiceSerializer(
            services, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class VendorReviewCreateView(APIView):
    """Create a review for a vendor service."""

    permission_classes = [IsAuthenticated]

    def post(self, request, service_id):
        """Post a review."""
        try:
            service = VendorService.objects.get(pk=service_id)
        except VendorService.DoesNotExist:
            return error_response(message="Service not found", status=404)

        if service.vendor == request.user:
            return error_response(
                message="Vendor cannot review their own service", status=403
            )

        if VendorReview.objects.filter(
            vendor_service=service, reviewer=request.user
        ).exists():
            return error_response(
                message="You have already reviewed this service", status=409
            )

        event_id = request.data.get("event")
        event_obj = None
        if event_id:
            from apps.events.models import Event

            try:
                event_obj = Event.objects.get(pk=event_id)
            except Event.DoesNotExist:
                return error_response(message="Event not found", status=404)

        serializer = VendorReviewSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            review = serializer.save(
                vendor_service=service, reviewer=request.user, event=event_obj
            )
            return success_response(
                data=VendorReviewSerializer(review, context={"request": request}).data,
                status=201,
            )
        return error_response(message="Validation Error", errors=serializer.errors)
