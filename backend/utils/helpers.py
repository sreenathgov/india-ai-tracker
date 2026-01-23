"""
Helper functions
"""

from datetime import datetime
import json


def format_date(date_obj):
    """Format date for display"""
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime('%d %B %Y') if date_obj else ''


def json_serial(obj):
    """JSON serializer for objects not serializable by default"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")
