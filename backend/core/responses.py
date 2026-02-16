"""Response generators for the common monolith app."""

from rest_framework.response import Response


def success_response(data=None, message="Success", meta=None, status=200):
    """
    Standard Success Envelope
    {
      "success": true,
      "message": "...",
      "data": {},
      "meta": {}
    }
    """
    return Response(
        {"success": True, "message": message, "data": data or {}, "meta": meta or {}},
        status=status,
    )


def error_response(message="Error", errors=None, error_code="ERROR", status=400):
    """
    Standard Error Envelope
    {
      "success": false,
      "message": "...",
      "errors": { "field": ["detail"] },
      "error_code": "..."
    }
    """
    return Response(
        {
            "success": False,
            "message": message,
            "errors": errors or {},
            "error_code": error_code,
        },
        status=status,
    )
