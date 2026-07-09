from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.static_data.supported_cards import SUPPORTED_CARD_IDS
from app.static_data.preferences_options import (
    CABIN_PREFERENCE_IDS,
    DATE_FLEXIBILITY_IDS,
    DESTINATION_INTEREST_IDS,
)
from app.static_data.travel_cities import TRAVEL_CITY_BY_ID, TRAVEL_CITY_IDS


class CardOption(BaseModel):
    id: str
    name: str
    issuer: str


class CityOption(BaseModel):
    id: str
    name: str
    airports: list[str]

# for destination interests, cabin preferences, and date flexibility options
class OptionItem(BaseModel):
    id: str
    label: str


class PreferencesOptionsResponse(BaseModel):
    cities: list[CityOption]
    cards: list[CardOption]
    destination_interests: list[OptionItem]
    cabin_preferences: list[OptionItem]
    date_flexibility_options: list[OptionItem]


class PreferencesUpdate(BaseModel):
    home_city: str
    cards: list[str] = Field(min_length=1)
    destination_interests: list[str] | None = None
    cabin_preference: str | None = None
    date_flexibility: str | None = None

    # validators the operate before function starts processing (for functions PreferencesUpdate is passed to)
    @field_validator("home_city")
    @classmethod
    def validate_home_city(cls, value: str) -> str:
        if value not in TRAVEL_CITY_IDS:
            raise ValueError("Unsupported home city")
        return value

    @field_validator("cards")
    @classmethod
    def validate_cards(cls, value: list[str]) -> list[str]:
        unsupported = [card for card in value if card not in SUPPORTED_CARD_IDS]
        if unsupported:
            raise ValueError(f"Unsupported cards: {', '.join(unsupported)}")
        return value

    @field_validator("destination_interests")
    @classmethod
    def validate_destination_interests(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        unsupported = [item for item in value if item not in DESTINATION_INTEREST_IDS]
        if unsupported:
            raise ValueError(f"Unsupported destination interests: {', '.join(unsupported)}")
        return value

    @field_validator("cabin_preference")
    @classmethod
    def validate_cabin_preference(cls, value: str | None) -> str | None:
        if value is not None and value not in CABIN_PREFERENCE_IDS:
            raise ValueError("Unsupported cabin preference")
        return value

    @field_validator("date_flexibility")
    @classmethod
    def validate_date_flexibility(cls, value: str | None) -> str | None:
        if value is not None and value not in DATE_FLEXIBILITY_IDS:
            raise ValueError("Unsupported date flexibility option")
        return value


class PreferencesResponse(BaseModel):
    id: UUID
    user_id: UUID
    home_city: str
    home_airports: list[str]
    cards: list[str]
    destination_interests: list[str] | None
    cabin_preference: str | None
    date_flexibility: str | None
    is_complete: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


def airports_for_city(city_id: str) -> list[str]:
    return list(TRAVEL_CITY_BY_ID[city_id].airports)


def is_profile_complete(home_city: str | None, cards: list[str] | None) -> bool:
    return bool(home_city) and bool(cards) and len(cards) >= 1
