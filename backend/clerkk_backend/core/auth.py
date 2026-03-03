from fastapi import HTTPException, status, Request
import jwt
from jwt import PyJWKClient
from functools import lru_cache

# Auth0 configuration - must be set via configure_auth()
AUTH0_DOMAIN = None
AUTH0_API_AUDIENCE = None


def configure_auth(domain: str, audience: str):
    """Configure Auth0 settings from loaded config"""
    global AUTH0_DOMAIN, AUTH0_API_AUDIENCE
    AUTH0_DOMAIN = domain
    AUTH0_API_AUDIENCE = audience


@lru_cache()
def get_jwks_client():
    """Get PyJWKClient for Auth0 (cached)"""
    if not AUTH0_DOMAIN:
        raise RuntimeError("Auth0 not configured. Call configure_auth() first.")
    return PyJWKClient(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")


def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT access token"""
    if not AUTH0_DOMAIN or not AUTH0_API_AUDIENCE:
        raise RuntimeError("Auth0 not configured. Call configure_auth() first.")

    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=AUTH0_API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token audience"
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token issuer"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def get_current_user(request: Request) -> dict:
    """Get current user from request state (set by AuthMiddleware)"""
    return request.state.current_user
