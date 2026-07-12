import pytest
from app.utils.geo import haversine_distance
from app.services.ai_engine import check_compatibility, calculate_ai_score, get_recommended_donors
from app.models.donor import Donor

def test_haversine_distance_accuracy():
    """Verifies that the Haversine formula calculates correct distances."""
    # Vizag Dwaraka Nagar (17.7214, 83.3082) to MVP Colony (17.7410, 83.3320)
    # Expected: ~3.34 km
    dist = haversine_distance(17.7214, 83.3082, 17.7410, 83.3320)
    assert 3.0 < dist < 4.0
    
    # Same location check
    assert haversine_distance(17.7214, 83.3082, 17.7214, 83.3082) == 0.0


def test_blood_compatibility_logic():
    """Verifies standard medical donor-recipient compatibility sets."""
    assert check_compatibility('O-', 'A+') is True   # Universal donor
    assert check_compatibility('A+', 'A-') is False  # Cannot donate positive to negative
    assert check_compatibility('AB+', 'AB+') is True
    assert check_compatibility('A-', 'AB+') is True  # AB+ can receive from all


def test_ai_scoring_engine(app):
    """
    Verifies match scoring values:
    - Exact Match = 50 pts
    - Availability = 20 pts
    - Distance (e.g. <5km) = 20 pts
    - Same City = 10 pts
    """
    with app.app_context():
        # Fetch seeded Donor 1 (A+, available, in Visakhapatnam, coords near Dwaraka Nagar)
        donor = Donor.query.first()
        
        # Scenario: Exact Match, Available, Close proximity (<5km), Same City
        score, match_type, dist = calculate_ai_score(
            donor=donor, 
            target_blood_group="A+", 
            target_city="Visakhapatnam", 
            recipient_lat=17.7214, 
            recipient_lng=83.3082
        )
        # 50 (exact match) + 20 (avail) + 10 (city) + 20 (distance 0km < 5km) = 100 points
        assert score == 100
        assert match_type == 'Exact Match'

        # Scenario: Compatible Match, Available, Far away (>30km), Same City
        score, match_type, dist = calculate_ai_score(
            donor=donor, 
            target_blood_group="AB+", 
            target_city="Visakhapatnam", 
            recipient_lat=16.0,  # far away
            recipient_lng=80.0
        )
        # 0 (compatible, not exact) + 20 (avail) + 10 (city) + 5 (distance > 30km) = 35 points
        assert score == 35
        assert match_type == 'Compatible Match'
