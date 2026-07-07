import pytest

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
ME_URL = "/api/v1/auth/me"

TEST_USER = {"email": "user@example.com", "password": "password123"}


def _register(client, email=TEST_USER["email"], password=TEST_USER["password"]):
    return client.post(REGISTER_URL, json={"email": email, "password": password})


@pytest.fixture
def registered_user(client):
    response = _register(client)
    assert response.status_code == 201
    return {**TEST_USER, "token": response.json()["access_token"]}


def test_register_success(client):
    response = _register(client)

    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str)
    assert len(data["access_token"]) > 0


def test_register_duplicate_email(client, registered_user):
    response = _register(client)

    assert response.status_code == 409
    assert response.json()["detail"] == "An account with this email already exists"


def test_register_invalid_email(client):
    response = _register(client, email="not-an-email")

    assert response.status_code == 422


def test_register_short_password(client):
    response = _register(client, password="short")

    assert response.status_code == 422


def test_login_success(client, registered_user):
    response = client.post(
        LOGIN_URL,
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str)


def test_login_wrong_password(client, registered_user):
    response = client.post(
        LOGIN_URL,
        json={"email": registered_user["email"], "password": "wrongpassword"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unknown_email(client):
    response = client.post(
        LOGIN_URL,
        json={"email": "nobody@example.com", "password": "password123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_me_authenticated(client, registered_user):
    response = client.get(
        ME_URL,
        headers={"Authorization": f"Bearer {registered_user['token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == registered_user["email"]
    assert "id" in data
    assert "created_at" in data
    assert "hashed_password" not in data
    assert "password" not in data


def test_me_missing_token(client):
    response = client.get(ME_URL)

    assert response.status_code == 401


def test_me_invalid_token(client):
    response = client.get(
        ME_URL,
        headers={"Authorization": "Bearer invalid.token.here"},
    )

    assert response.status_code == 401
