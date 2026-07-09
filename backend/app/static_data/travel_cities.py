from dataclasses import dataclass

# static data for travel cities, does not need to be pydantic schema
@dataclass(frozen=True)
class TravelCity:
    id: str
    name: str
    airports: tuple[str, ...]


TRAVEL_CITIES: tuple[TravelCity, ...] = (
    TravelCity("new_york", "New York", ("JFK", "LGA", "EWR")),
    TravelCity("los_angeles", "Los Angeles", ("LAX", "BUR", "SNA")),
    TravelCity("chicago", "Chicago", ("ORD", "MDW")),
    TravelCity("dallas", "Dallas", ("DFW", "DAL")),
    TravelCity("denver", "Denver", ("DEN",)),
    TravelCity("atlanta", "Atlanta", ("ATL",)),
    TravelCity("san_francisco", "San Francisco", ("SFO", "OAK", "SJC")),
    TravelCity("seattle", "Seattle", ("SEA",)),
    TravelCity("boston", "Boston", ("BOS",)),
    TravelCity("miami", "Miami", ("MIA", "FLL")),
    TravelCity("washington_dc", "Washington, D.C.", ("DCA", "IAD", "BWI")),
    TravelCity("phoenix", "Phoenix", ("PHX",)),
    TravelCity("houston", "Houston", ("IAH", "HOU")),
    TravelCity("las_vegas", "Las Vegas", ("LAS",)),
    TravelCity("orlando", "Orlando", ("MCO",)),
    TravelCity("philadelphia", "Philadelphia", ("PHL",)),
    TravelCity("minneapolis", "Minneapolis", ("MSP",)),
    TravelCity("detroit", "Detroit", ("DTW",)),
    TravelCity("charlotte", "Charlotte", ("CLT",)),
    TravelCity("salt_lake_city", "Salt Lake City", ("SLC",)),
)

TRAVEL_CITY_IDS = frozenset(city.id for city in TRAVEL_CITIES)

TRAVEL_CITY_BY_ID = {city.id: city for city in TRAVEL_CITIES}
