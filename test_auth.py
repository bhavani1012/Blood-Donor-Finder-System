import pytest
from flask import url_for
from app.models.user import User

def test_login_validation(client):
    """Verifies login page response and invalid inputs."""
    response = client.get('/auth/login')
    assert response.status_code == 200
    assert b"Welcome Back" in response.data

    # Test invalid login credentials
    response = client.post('/auth/login', data={
        'email': 'nonexistent@test.com',
        'password': 'WrongPassword123'
    }, follow_redirects=True)
    assert b"Invalid email or password" in response.data


def test_unauthenticated_dashboard_redirects(client):
    """Verifies that unauthenticated visitors are redirected to the login page."""
    response = client.get('/donor/dashboard')
    assert response.status_code == 302
    assert 'auth/login' in response.headers['Location']

    response = client.get('/recipient/dashboard')
    assert response.status_code == 302
    assert 'auth/login' in response.headers['Location']

    response = client.get('/admin/dashboard')
    assert response.status_code == 302
    assert 'auth/login' in response.headers['Location']


def test_donor_access_controls(client, app):
    """Verifies that a Donor profile cannot access Admin or Recipient views."""
    # Authenticate as Donor 1
    with client:
        # Perform login manually
        client.post('/auth/login', data={
            'email': 'donor1@test.com',
            'password': 'DonorPass123'
        })
        
        # Access allowed Donor view
        res = client.get('/donor/dashboard')
        assert res.status_code == 200
        
        # Access forbidden Recipient search (403 Forbidden via role_required)
        res = client.get('/recipient/search')
        assert res.status_code == 403
        
        # Access forbidden Admin Panel (403 Forbidden)
        res = client.get('/admin/dashboard')
        assert res.status_code == 403


def test_recipient_access_controls(client, app):
    """Verifies that a Recipient profile cannot access Admin or Donor views."""
    with client:
        client.post('/auth/login', data={
            'email': 'recipient@test.com',
            'password': 'RecipPass123'
        })
        
        # Access allowed Recipient view
        res = client.get('/recipient/dashboard')
        assert res.status_code == 200
        
        # Access forbidden Donor dashboard
        res = client.get('/donor/dashboard')
        assert res.status_code == 403
        
        # Access forbidden Admin Panel
        res = client.get('/admin/dashboard')
        assert res.status_code == 403
