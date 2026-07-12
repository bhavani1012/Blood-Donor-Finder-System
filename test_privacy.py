import json
import pytest
from app.models.user import User

def test_donor_privacy_protection_in_search_results(client, app):
    """
    Verifies that recipient searches redact sensitive donor data 
    (email, phone, exact address) while keeping only public fields.
    """
    with client:
        # Log in as Recipient
        client.post('/auth/login', data={
            'email': 'recipient@test.com',
            'password': 'RecipPass123'
        })

        # Query search API (matches donor1 who has A+)
        response = client.get('/api/v1/donors/search?blood_group=A+&city=Visakhapatnam&lat=17.6868&lng=83.2185')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'donors' in data
        assert len(data['donors']) > 0
        
        donor_result = data['donors'][0]
        
        # Verify allowed public details are present
        assert donor_result['name'] == 'Donor One'
        assert donor_result['blood_group'] == 'A+'
        assert donor_result['city'] == 'Visakhapatnam'
        assert 'distance_km' in donor_result
        assert 'score' in donor_result

        # STICK TO PRIVACY: Verify sensitive details are EXCLUDED
        assert 'email' not in donor_result
        assert 'phone' not in donor_result
        assert 'address' not in donor_result
        
        # Check that coordinates are not exposed in text arrays
        # (lat/lng can be sent for markers, but personal strings must not exist)
        for key in donor_result.keys():
            assert key not in ['email', 'phone_number', 'full_address']
