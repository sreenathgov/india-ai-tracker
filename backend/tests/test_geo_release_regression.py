"""Release regressions: metadata exclusions and physical state boundaries."""
import pytest
from ai.geo_attributor import GeoAttributor


@pytest.mark.parametrize('city,state', [
    ('Noida', 'UP'), ('Greater Noida', 'UP'), ('Ghaziabad', 'UP'),
    ('Gurugram', 'HR'), ('Gurgaon', 'HR'), ('Faridabad', 'HR'),
    ('Chandigarh', 'CH'), ('New Delhi', 'DL'),
])
def test_ncr_and_union_territory_boundaries(city, state):
    states, _ = GeoAttributor().attribute(f'AI research centre opens in {city}')
    assert states == [state]


@pytest.mark.parametrize('title,content,expected', [
    ('Chennai: National AI policy', 'The Union government announced its policy.', ['IN']),
    ('National AI policy', 'Chennai: The Union government announced its policy.', ['IN']),
    ('Chennai: New AI centre in Chennai', '', ['TN']),
    ('AI centre opens in Pune', 'The company is headquartered in Bangalore.', ['MH']),
    ('AI centre opens in Bangalore', 'The Bangalore-based company expanded locally.', ['KA']),
    ('AI innovation across NCR', '', ['IN']),
    ('', None, ['IN']),
])
def test_metadata_does_not_override_real_locations(title, content, expected):
    states, _ = GeoAttributor().attribute(title, content)
    assert states == expected
