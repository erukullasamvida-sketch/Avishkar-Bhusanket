import os

import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


_bearer_scheme = HTTPBearer(auto_error=False)


def require_supabase_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> None:
    if credentials is None or credentials.scheme.casefold() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")

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
