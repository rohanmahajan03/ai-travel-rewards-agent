import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _user_id_from_token(token: str) -> uuid.UUID:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("missing subject")
        return uuid.UUID(user_id)
    except (ValueError, TypeError) as exc:
        raise _credentials_exception() from exc


def require_authenticated(token: str = Depends(oauth2_scheme)) -> None:
    _user_id_from_token(token)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, _user_id_from_token(token))
    if user is None:
        raise _credentials_exception()
    return user
