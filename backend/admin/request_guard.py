"""
Request guard for the localhost-only admin tool.

The admin tool has no login and can commit/push to the production repository, so
it must not be drivable by a malicious web page the developer happens to visit.
Two browser-based attacks are blocked here:

1. DNS rebinding — the attacker's page rebinds its own hostname to 127.0.0.1 and
   makes same-origin requests. The browser still sends the attacker's domain in
   the Host header, so a hostname allowlist rejects it.

2. Classic CSRF — the attacker's page POSTs directly to http://localhost:5002.
   The Host header matches (so the rebinding check passes), but the request is
   cross-site, which we detect via the Origin and Sec-Fetch-Site headers and
   reject for state-changing methods.

The core logic is a pure function (check_request) so it can be unit-tested
without a live Flask request.
"""

from typing import Optional, Tuple
from urllib.parse import urlparse

# Loopback hostnames the admin tool may legitimately be reached at. We match on
# hostname only (ignoring port) so changing the dev port does not break the guard.
ALLOWED_HOSTNAMES = frozenset({"127.0.0.1", "localhost", "::1"})

# Methods that mutate state (and can therefore be abused via CSRF).
STATE_CHANGING_METHODS = frozenset({"POST", "PUT", "DELETE", "PATCH"})

# Sec-Fetch-Site values that are NOT cross-site (and so are safe).
SAFE_FETCH_SITES = frozenset({"same-origin", "same-site", "none"})


def _hostname(host: Optional[str]) -> str:
    """Extract the bare hostname from a Host header value (strips the port).

    Handles IPv6 literals like "[::1]:5002".
    """
    if not host:
        return ""
    host = host.strip()
    if host.startswith("["):  # IPv6 literal, e.g. [::1]:5002
        end = host.find("]")
        return host[1:end] if end != -1 else host[1:]
    # IPv4 / hostname: strip a trailing :port if present.
    return host.rsplit(":", 1)[0] if ":" in host else host


def check_request(
    method: str,
    host: Optional[str],
    origin: Optional[str],
    sec_fetch_site: Optional[str],
    allowed_hostnames: frozenset = ALLOWED_HOSTNAMES,
) -> Tuple[bool, str]:
    """Decide whether an admin request should be allowed.

    Pure function (no Flask dependency) for testability.

    Args:
        method: HTTP method (e.g. "GET", "POST").
        host: The Host header value (e.g. "localhost:5002").
        origin: The Origin header value, or None.
        sec_fetch_site: The Sec-Fetch-Site header value, or None.
        allowed_hostnames: Hostnames permitted in the Host header.

    Returns:
        (allowed, reason). reason is a short machine-friendly string.
    """
    # 1. DNS-rebinding defense: Host must resolve to a loopback hostname.
    if _hostname(host) not in allowed_hostnames:
        return False, "invalid host"

    # 2. CSRF defense: only constrain state-changing methods. Reads cannot be
    #    abused to mutate state, and constraining them would break normal use.
    if method.upper() in STATE_CHANGING_METHODS:
        if sec_fetch_site is not None and sec_fetch_site.lower() not in SAFE_FETCH_SITES:
            return False, "cross-site request blocked"
        if origin:
            origin_host = urlparse(origin).hostname or ""
            if origin_host not in allowed_hostnames:
                return False, "cross-origin request blocked"

    return True, "ok"
