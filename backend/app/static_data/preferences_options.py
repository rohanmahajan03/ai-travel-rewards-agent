DESTINATION_INTERESTS: tuple[tuple[str, str], ...] = (
    ("europe", "Europe"),
    ("asia", "Asia"),
    ("caribbean", "Caribbean"),
    ("domestic_us", "Domestic US"),
    ("south_america", "South America"),
    ("africa", "Africa"),
    ("middle_east", "Middle East"),
    ("oceania", "Oceania"),
)

DESTINATION_INTEREST_IDS = frozenset(item[0] for item in DESTINATION_INTERESTS)

CABIN_PREFERENCES: tuple[tuple[str, str], ...] = (
    ("economy", "Economy"),
    ("premium_economy", "Premium Economy"),
    ("business", "Business"),
    ("first", "First"),
)

CABIN_PREFERENCE_IDS = frozenset(item[0] for item in CABIN_PREFERENCES)

DATE_FLEXIBILITY_OPTIONS: tuple[tuple[str, str], ...] = (
    ("fixed", "Fixed dates"),
    ("flexible_3_days", "Flexible by a few days"),
    ("flexible_week", "Flexible within a week"),
    ("flexible_month", "Flexible within a month"),
    ("very_flexible", "Very flexible"),
)

DATE_FLEXIBILITY_IDS = frozenset(item[0] for item in DATE_FLEXIBILITY_OPTIONS)
