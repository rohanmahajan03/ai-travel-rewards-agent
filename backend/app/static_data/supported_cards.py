from dataclasses import dataclass

# static data for supported cards, does not need to be pydantic schema
@dataclass(frozen=True)
class SupportedCard:
    id: str
    name: str
    issuer: str


SUPPORTED_CARDS: tuple[SupportedCard, ...] = (
    SupportedCard("venture_x", "Capital One Venture X", "capital_one"),
    SupportedCard("savor", "Capital One Savor", "capital_one"),
    SupportedCard("venture", "Capital One Venture", "capital_one"),
    SupportedCard("sapphire_reserve", "Chase Sapphire Reserve", "chase"),
    SupportedCard("sapphire_preferred", "Chase Sapphire Preferred", "chase"),
    SupportedCard("freedom_unlimited", "Chase Freedom Unlimited", "chase"),
    SupportedCard("platinum", "Amex Platinum", "amex"),
    SupportedCard("blue", "Amex Blue", "amex"),
    SupportedCard("gold", "Amex Gold", "amex"),
    SupportedCard("strata_elite", "Citi Strata Elite", "citi"),
    SupportedCard("double_cash", "Citi Double Cash", "citi"),
    SupportedCard("strata_premier", "Citi Strata Premier", "citi"),
)

SUPPORTED_CARD_IDS = frozenset(card.id for card in SUPPORTED_CARDS)
