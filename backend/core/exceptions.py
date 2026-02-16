"""Custom exception handlers for the API."""

from rest_framework.views import exception_handler

from .responses import error_response


def custom_exception_handler(exc, context):
    """
    Custom exception handler to return unified JSON error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize DRF error response
        return error_response(
            message=str(exc),
            errors=response.data,
            status=response.status_code,
            error_code=exc.__class__.__name__.upper(),
        )

    return response
