"""
Unit tests for backend.admin.request_guard — the localhost-only admin tool's
defense against DNS rebinding and cross-site CSRF.

The admin tool (port 5002) has no login and can `git push` to production, so a
malicious web page the developer visits must not be able to drive it. Two
distinct browser attacks are covered:

- DNS rebinding: attacker page rebinds its own hostname to 127.0.0.1 and calls
  same-origin; the browser still sends `Host: evil.com`. -> blocked by host
  allowlist.
- Classic CSRF: attacker page POSTs directly to http://localhost:5002/...; the
  browser sends a *matching* `Host: localhost:5002` but `Origin: https://evil.com`
  and `Sec-Fetch-Site: cross-site`. -> blocked by the origin / sec-fetch checks
  on state-changing methods.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from admin.request_guard import check_request


@pytest.mark.unit
class TestHostAllowlist:
    def test_allows_localhost_with_port(self):
        ok, _ = check_request("GET", "localhost:5002", None, None)
        assert ok

    def test_allows_loopback_ip_with_port(self):
        ok, _ = check_request("GET", "127.0.0.1:5002", None, None)
        assert ok

    def test_allows_ipv6_loopback(self):
        ok, _ = check_request("GET", "[::1]:5002", None, None)
        assert ok

    def test_allows_host_on_different_port(self):
        # Robust to port changes: hostname is what matters.
        ok, _ = check_request("GET", "127.0.0.1:8000", None, None)
        assert ok

    def test_blocks_rebinding_foreign_host(self):
        # DNS rebinding: same-origin fetch but Host is the attacker's domain.
        ok, reason = check_request("GET", "evil.com", None, "same-origin")
        assert not ok
        assert "host" in reason.lower()

    def test_blocks_public_ip_host(self):
        ok, _ = check_request("GET", "203.0.113.5:5002", None, None)
        assert not ok


@pytest.mark.unit
class TestCsrfOnStateChange:
    def test_blocks_cross_site_post(self):
        # Classic CSRF: matching Host, but cross-site Sec-Fetch-Site.
        ok, reason = check_request(
            "POST", "localhost:5002", "https://evil.com", "cross-site"
        )
        assert not ok
        assert "cross" in reason.lower()

    def test_blocks_cross_origin_post_by_origin_header(self):
        # Even without Sec-Fetch-Site, a foreign Origin is rejected.
        ok, _ = check_request("POST", "localhost:5002", "https://evil.com", None)
        assert not ok

    def test_allows_same_origin_post(self):
        ok, _ = check_request(
            "POST", "localhost:5002", "http://localhost:5002", "same-origin"
        )
        assert ok

    def test_allows_post_with_no_browser_headers(self):
        # Local CLI tools (curl) send no Origin / Sec-Fetch-Site -> allowed.
        ok, _ = check_request("POST", "127.0.0.1:5002", None, None)
        assert ok

    def test_allows_sec_fetch_none(self):
        # Sec-Fetch-Site: none = user typed the URL / bookmark.
        ok, _ = check_request("POST", "localhost:5002", None, "none")
        assert ok

    def test_get_with_cross_site_is_allowed(self):
        # Non-state-changing reads are not CSRF-sensitive; only Host matters.
        ok, _ = check_request("GET", "localhost:5002", "https://evil.com", "cross-site")
        assert ok

    def test_delete_cross_site_blocked(self):
        ok, _ = check_request("DELETE", "localhost:5002", None, "cross-site")
        assert not ok

    def test_origin_with_matching_host_different_port_blocked(self):
        # Origin host must match an allowed hostname; a foreign origin on any
        # port is cross-origin.
        ok, _ = check_request("POST", "localhost:5002", "http://evil.com:5002", "same-site")
        assert not ok
