import os
import secrets
from dataclasses import dataclass
from typing import Any

import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


_bearer_scheme = HTTPBearer(auto_error=False)
_local_demo_token = secrets.token_urlsafe(32)


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str | None
    user_metadata: dict[str, Any]
    phone: str | None
    access_token: str | None
    is_demo: bool = False


def require_supabase_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.casefold() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")

    if secrets.compare_digest(credentials.credentials, _local_demo_token):
        return AuthenticatedUser(
            id=None,
            user_metadata={},
            phone=None,
            access_token=None,
            is_demo=True,
        )

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=503,
            detail="Supabase authentication is not configured on the backend",
        )

    try:
        response = requests.get(
            f"{supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {credentials.credentials}",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify Supabase access token",
        ) from exc

    if response.status_code in (400, 401, 403):
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    if not response.ok:
        raise HTTPException(
            status_code=503,
            detail="Supabase token verification is unavailable",
        )

    try:
        user = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail="Supabase returned an invalid user response",
        ) from exc

    if not isinstance(user, dict) or not isinstance(user.get("id"), str):
        raise HTTPException(
            status_code=503,
            detail="Supabase returned an invalid user response",
        )

    user_metadata = user.get("user_metadata")
    if not isinstance(user_metadata, dict):
        user_metadata = {}
    phone = user_metadata.get("phone")
    return AuthenticatedUser(
        id=user["id"],
        user_metadata=user_metadata,
        phone=phone if isinstance(phone, str) else None,
        access_token=credentials.credentials,
    )
