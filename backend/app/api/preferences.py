from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_authenticated
from app.static_data.supported_cards import SUPPORTED_CARDS
from app.static_data.preferences_options import (
    CABIN_PREFERENCES,
    DATE_FLEXIBILITY_OPTIONS,
    DESTINATION_INTERESTS,
)
from app.static_data.travel_cities import TRAVEL_CITIES
from app.db.models.user import User
from app.db.models.user_profile import UserProfile
from app.db.session import get_db
from app.schemas.preferences import (
    CardOption,
    CityOption,
    OptionItem,
    PreferencesOptionsResponse,
    PreferencesResponse,
    PreferencesUpdate,
    airports_for_city,
    is_profile_complete,
)

router = APIRouter(prefix="/preferences", tags=["preferences"])


def _to_response(profile: UserProfile) -> PreferencesResponse:
    return PreferencesResponse(
        id=profile.id,
        user_id=profile.user_id,
        home_city=profile.home_city,
        home_airports=profile.home_airports,
        cards=profile.cards,
        destination_interests=profile.destination_interests,
        cabin_preference=profile.cabin_preference,
        date_flexibility=profile.date_flexibility,
        is_complete=is_profile_complete(profile.home_city, profile.cards),
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )

# called for when user fills in their travel preferences for the first time
@router.get("/options", response_model=PreferencesOptionsResponse)
def get_preference_options(
    _: None = Depends(require_authenticated),
) -> PreferencesOptionsResponse:
    return PreferencesOptionsResponse(
        cities=[
            CityOption(id=city.id, name=city.name, airports=list(city.airports))
            for city in TRAVEL_CITIES
        ],
        cards=[
            CardOption(id=card.id, name=card.name, issuer=card.issuer) for card in SUPPORTED_CARDS
        ],
        destination_interests=[
            OptionItem(id=item_id, label=label) for item_id, label in DESTINATION_INTERESTS
        ],
        cabin_preferences=[
            OptionItem(id=item_id, label=label) for item_id, label in CABIN_PREFERENCES
        ],
        date_flexibility_options=[
            OptionItem(id=item_id, label=label) for item_id, label in DATE_FLEXIBILITY_OPTIONS
        ],
    )

# called to retrieve user's travel preferences
@router.get("/me", response_model=PreferencesResponse)
def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PreferencesResponse:
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return _to_response(profile)

# called to create or update user's travel preferences
@router.put("/me", response_model=PreferencesResponse)
def upsert_my_preferences(
    body: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PreferencesResponse:
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    home_airports = airports_for_city(body.home_city)

    if profile is None:
        profile = UserProfile(
            user_id=current_user.id,
            home_city=body.home_city,
            home_airports=home_airports,
            cards=body.cards,
            destination_interests=body.destination_interests,
            cabin_preference=body.cabin_preference,
            date_flexibility=body.date_flexibility,
        )
        db.add(profile)
    else:
        profile.home_city = body.home_city
        profile.home_airports = home_airports
        profile.cards = body.cards
        profile.destination_interests = body.destination_interests
        profile.cabin_preference = body.cabin_preference
        profile.date_flexibility = body.date_flexibility

    db.commit()
    db.refresh(profile)
    return _to_response(profile)
