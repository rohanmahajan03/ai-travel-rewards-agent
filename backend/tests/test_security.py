from datetime import UTC, datetime, timedelta

import pytest
from jose import jwt

from app.core import security
from app.core.config import settings


def test_hash_password_is_not_plaintext():
    hashed = security.hash_password("password123")

    assert hashed != "password123"
    assert isinstance(hashed, str)


def test_hash_password_is_salted_unique():
    first = security.hash_password("password123")
    second = security.hash_password("password123")

    assert first != second


def test_verify_password_correct():
    hashed = security.hash_password("password123")

    assert security.verify_password("password123", hashed) is True


def test_verify_password_incorrect():
    hashed = security.hash_password("password123")

    assert security.verify_password("wrongpassword", hashed) is False


def test_create_access_token_roundtrip():
    token = security.create_access_token("user-id-123")
    payload = security.decode_access_token(token)

    assert payload["sub"] == "user-id-123"
    assert "exp" in payload


def test_create_access_token_sets_expiry():
    before = datetime.now(UTC)
    token = security.create_access_token("user-id-123")
    payload = security.decode_access_token(token)

    expected_min = before + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES - 1)
    exp = datetime.fromtimestamp(payload["exp"], tz=UTC)

    assert exp > expected_min


def test_decode_access_token_invalid_raises():
    with pytest.raises(ValueError):
        security.decode_access_token("not.a.valid.token")


def test_decode_access_token_expired_raises():
    expired = {
        "sub": "user-id-123",
        "exp": datetime.now(UTC) - timedelta(minutes=1),
    }
    token = jwt.encode(expired, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    with pytest.raises(ValueError):
        security.decode_access_token(token)


def test_decode_access_token_wrong_secret_raises():
    payload = {
        "sub": "user-id-123",
        "exp": datetime.now(UTC) + timedelta(minutes=5),
    }
    token = jwt.encode(payload, "a-different-secret", algorithm=settings.ALGORITHM)

    with pytest.raises(ValueError):
        security.decode_access_token(token)
