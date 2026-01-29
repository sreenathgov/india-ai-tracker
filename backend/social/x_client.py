"""
X (Twitter) API Client

Handles authentication and posting to X using OAuth 1.0a.
Uses the official X API v2 for posting tweets.

Reference: https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
"""

import os
import logging
from typing import Optional, Dict, Any
from requests_oauthlib import OAuth1Session

logger = logging.getLogger(__name__)


class XClient:
    """
    Client for interacting with the X (Twitter) API.

    Requires four credentials (from environment or passed directly):
    - X_API_KEY (Consumer Key)
    - X_API_SECRET (Consumer Secret)
    - X_ACCESS_TOKEN
    - X_ACCESS_TOKEN_SECRET
    """

    POST_ENDPOINT = "https://api.x.com/2/tweets"

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        access_token: Optional[str] = None,
        access_token_secret: Optional[str] = None
    ):
        """
        Initialize the X client with OAuth credentials.

        If credentials are not provided, they are read from environment variables.
        """
        self.api_key = api_key or os.getenv('X_API_KEY')
        self.api_secret = api_secret or os.getenv('X_API_SECRET')
        self.access_token = access_token or os.getenv('X_ACCESS_TOKEN')
        self.access_token_secret = access_token_secret or os.getenv('X_ACCESS_TOKEN_SECRET')

        self._session: Optional[OAuth1Session] = None

    def is_configured(self) -> bool:
        """Check if all required credentials are set."""
        return all([
            self.api_key,
            self.api_secret,
            self.access_token,
            self.access_token_secret
        ])

    def _get_session(self) -> OAuth1Session:
        """Get or create the OAuth session."""
        if self._session is None:
            if not self.is_configured():
                raise ValueError(
                    "X API credentials not configured. "
                    "Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET "
                    "in your environment or .env file."
                )

            self._session = OAuth1Session(
                client_key=self.api_key,
                client_secret=self.api_secret,
                resource_owner_key=self.access_token,
                resource_owner_secret=self.access_token_secret
            )

        return self._session

    def post_tweet(self, text: str, dry_run: bool = False) -> Dict[str, Any]:
        """
        Post a tweet to X.

        Args:
            text: The tweet text (max 280 characters)
            dry_run: If True, don't actually post - just log what would be posted

        Returns:
            Dict with 'success', 'tweet_id', 'text', and optionally 'error' keys
        """
        # Validate tweet length
        if len(text) > 280:
            logger.warning(f"Tweet too long ({len(text)} chars), will be truncated")
            text = text[:277] + "..."

        result = {
            'success': False,
            'text': text,
            'tweet_id': None,
            'error': None
        }

        if dry_run:
            logger.info(f"[DRY RUN] Would post tweet ({len(text)} chars):\n{text}")
            result['success'] = True
            result['tweet_id'] = 'DRY_RUN'
            return result

        try:
            session = self._get_session()

            payload = {"text": text}
            response = session.post(self.POST_ENDPOINT, json=payload)

            if response.status_code == 201:
                data = response.json()
                result['success'] = True
                result['tweet_id'] = data.get('data', {}).get('id')
                logger.info(f"Successfully posted tweet {result['tweet_id']}")
            else:
                error_msg = f"API error {response.status_code}: {response.text}"
                result['error'] = error_msg
                logger.error(error_msg)

                # Check for specific rate limit error
                if response.status_code == 429:
                    result['rate_limited'] = True
                    logger.warning("Rate limit hit - consider waiting before retrying")

        except Exception as e:
            result['error'] = str(e)
            logger.exception(f"Failed to post tweet: {e}")

        return result

    def verify_credentials(self) -> Dict[str, Any]:
        """
        Verify that the credentials are valid by fetching the authenticated user.

        Returns:
            Dict with 'valid', 'username', and optionally 'error' keys
        """
        result = {
            'valid': False,
            'username': None,
            'error': None
        }

        if not self.is_configured():
            result['error'] = "Credentials not configured"
            return result

        try:
            session = self._get_session()

            # Use the users/me endpoint to verify
            response = session.get("https://api.x.com/2/users/me")

            if response.status_code == 200:
                data = response.json()
                result['valid'] = True
                result['username'] = data.get('data', {}).get('username')
                logger.info(f"Credentials verified for @{result['username']}")
            else:
                result['error'] = f"API error {response.status_code}: {response.text}"
                logger.error(result['error'])

        except Exception as e:
            result['error'] = str(e)
            logger.exception(f"Failed to verify credentials: {e}")

        return result


def create_x_client() -> XClient:
    """Factory function to create an XClient with credentials from environment."""
    return XClient()
