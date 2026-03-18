"""Core utility functions for the backend."""

def resolve_media_url(file_field, request=None):
    """
    Safely resolve a media URL.
    
    Handles:
    1. Absolute URLs (http/https)
    2. Frontend assets (assets/ or /assets/)
    3. Normal Django media files (relative to MEDIA_ROOT)
    """
    if not file_field:
        return None
        
    # Priority 1: Check the raw 'name' field from the database.
    # If it's already absolute or a frontend asset, return it.
    name = getattr(file_field, 'name', None) or str(file_field)
    
    if name:
        if name.startswith(('http://', 'https://')):
            return name
        if name.startswith('assets/') or name.startswith('/assets/'):
            if not name.startswith('/'):
                return '/' + name
            return name
    
    # Priority 2: Use the .url property if available.
    # Django's .url typically prepends MEDIA_URL.
    try:
        url = file_field.url
    except (AttributeError, ValueError):
        url = name
    
    if not url:
        return None
        
    # Check again for absolute URLs in case .url resolved it
    if url.startswith(('http://', 'https://')):
        return url
        
    # Handle Django-style relative paths
    if request:
        return request.build_absolute_uri(url)
        
    return url
