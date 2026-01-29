"""
Social Media Posting Module for India AI Tracker

This module handles automated posting to social media platforms.
Currently supports: X (Twitter)
"""

from .x_client import XClient
from .post_formatter import PostFormatter
from .post_selector import PostSelector

__all__ = ['XClient', 'PostFormatter', 'PostSelector']
