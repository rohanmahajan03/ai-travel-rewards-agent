from datetime import UTC, datetime, timedelta

import pytest
from jose import jwt
from sqlalchemy import select

from app.core.config import settings
from app.db.models.user import User
from app.schemas.preferences import is_profile_complete
from app.static_data.preferences_options import (
    CABIN_PREFERENCES,
    DATE_FLEXIBILITY_OPTIONS,
    DESTINATION_INTERESTS,
)
from app.static_data.supported_cards import SUPPORTED_CARDS
from app.static_data.travel_cities import TRAVEL_CITIES

OPTIONS_URL = "/api/v1/preferences/options"
ME_URL = "/api/v1/preferences/me"

VALID_PROFILE = {
    "home_city": "new_york",
    "cards": ["venture_x", "sapphire_preferred"],
    "destination_interests": ["europe"],
    "cabin_preference": "business",
    "date_flexibility": "flexible_week",
}


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_get_options_requires_auth(client):
    response = client.get(OPTIONS_URL)
    assert response.status_code == 401


def test_get_options_returns_catalog(client, registered_user):
    response = client.get(OPTIONS_URL, headers=_auth_headers(registered_user["token"]))

    assert response.status_code == 200
    data = response.json()
    assert len(data["cities"]) == len(TRAVEL_CITIES)
    assert len(data["cards"]) == len(SUPPORTED_CARDS)
    assert len(data["destination_interests"]) == len(DESTINATION_INTERESTS)
    assert len(data["cabin_preferences"]) == len(CABIN_PREFERENCES)
    assert len(data["date_flexibility_options"]) == len(DATE_FLEXIBILITY_OPTIONS)

    city = data["cities"][0]
    assert set(city) == {"id", "name", "airports"}
    assert isinstance(city["airports"], list)

    card = data["cards"][0]
    assert set(card) == {"id", "name", "issuer"}

    option = data["cabin_preferences"][0]
    assert set(option) == {"id", "label"}


def test_get_options_invalid_token(client):
    response = client.get(
        OPTIONS_URL,
        headers={"Authorization": "Bearer invalid.token.here"},
    )

    assert response.status_code == 401


def test_get_options_expired_token(client, registered_user, db_session):
    user = db_session.scalar(select(User).where(User.email == registered_user["email"]))
    expired_payload = {
        "sub": str(user.id),
        "exp": datetime.now(UTC) - timedelta(minutes=1),
    }
    expired_token = jwt.encode(
        expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

    response = client.get(OPTIONS_URL, headers=_auth_headers(expired_token))

    assert response.status_code == 401


def test_get_preferences_requires_auth(client):
    response = client.get(ME_URL)

    assert response.status_code == 401


def test_get_preferences_not_found(client, registered_user):
    response = client.get(ME_URL, headers=_auth_headers(registered_user["token"]))

    assert response.status_code == 404


def test_create_preferences(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json=VALID_PROFILE,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["home_city"] == "new_york"
    assert data["home_airports"] == ["JFK", "LGA", "EWR"]
    assert data["cards"] == ["venture_x", "sapphire_preferred"]
    assert data["destination_interests"] == ["europe"]
    assert data["cabin_preference"] == "business"
    assert data["date_flexibility"] == "flexible_week"
    assert data["is_complete"] is True


def test_create_preferences_minimal_fields(client, registered_user):
    minimal = {"home_city": "denver", "cards": ["gold"]}
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json=minimal,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["home_city"] == "denver"
    assert data["home_airports"] == ["DEN"]
    assert data["cards"] == ["gold"]
    assert data["destination_interests"] is None
    assert data["cabin_preference"] is None
    assert data["date_flexibility"] is None
    assert data["is_complete"] is True


def test_get_preferences_returns_saved_profile(client, registered_user):
    token = registered_user["token"]
    client.put(ME_URL, headers=_auth_headers(token), json=VALID_PROFILE)

    response = client.get(ME_URL, headers=_auth_headers(token))

    assert response.status_code == 200
    assert response.json()["home_city"] == "new_york"


def test_update_preferences(client, registered_user):
    token = registered_user["token"]
    client.put(ME_URL, headers=_auth_headers(token), json=VALID_PROFILE)

    updated = {
        **VALID_PROFILE,
        "home_city": "chicago",
        "cards": ["platinum"],
        "destination_interests": None,
        "cabin_preference": None,
        "date_flexibility": None,
    }
    response = client.put(ME_URL, headers=_auth_headers(token), json=updated)

    assert response.status_code == 200
    data = response.json()
    assert data["home_city"] == "chicago"
    assert data["home_airports"] == ["ORD", "MDW"]
    assert data["cards"] == ["platinum"]
    assert data["destination_interests"] is None
    assert data["is_complete"] is True


def test_put_preferences_missing_home_city_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={"cards": ["gold"]},
    )

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"] == ["body", "home_city"] for error in errors)


def test_put_preferences_missing_cards_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={"home_city": "new_york"},
    )

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"] == ["body", "cards"] for error in errors)


def test_unsupported_city_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={**VALID_PROFILE, "home_city": "fake_city"},
    )

    assert response.status_code == 422


def test_unsupported_card_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={**VALID_PROFILE, "cards": ["fake_card"]},
    )

    assert response.status_code == 422


def test_empty_cards_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={**VALID_PROFILE, "cards": []},
    )

    assert response.status_code == 422


def test_unsupported_destination_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={**VALID_PROFILE, "destination_interests": ["mars"]},
    )

    assert response.status_code == 422


def test_unsupported_cabin_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={**VALID_PROFILE, "cabin_preference": "fake_cabin"},
    )

    assert response.status_code == 422


def test_unsupported_date_flexibility_returns_422(client, registered_user):
    response = client.put(
        ME_URL,
        headers=_auth_headers(registered_user["token"]),
        json={**VALID_PROFILE, "date_flexibility": "fake_flexibility"},
    )

    assert response.status_code == 422


def test_put_preferences_requires_auth(client):
    response = client.put(ME_URL, json=VALID_PROFILE)
    assert response.status_code == 401


@pytest.mark.parametrize(
    ("home_city", "cards", "expected"),
    [
        ("new_york", ["venture_x"], True),
        (None, ["venture_x"], False),
        ("new_york", None, False),
        ("new_york", [], False),
    ],
)
def test_is_profile_complete(home_city, cards, expected):
    assert is_profile_complete(home_city, cards) is expected
