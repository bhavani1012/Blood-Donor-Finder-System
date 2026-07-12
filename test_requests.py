import io
import pytest
from app.extensions import db
from app.models.request import BloodRequest

def test_request_lifecycle(client, app):
    """
    Verifies that a recipient can submit a request (initial status Pending),
    and an Admin can audit, approve, or reject the request.
    """
    # 1. Create a request as Recipient
    with client:
        client.post('/auth/login', data={
            'email': 'recipient@test.com',
            'password': 'RecipPass123'
        })
        
        # Post request form data including a dummy file attachment
        response = client.post('/recipient/request-blood', data={
            'patient_name': 'Patient Test',
            'blood_group': 'B+',
            'hospital_name': 'Test Hospital',
            'city': 'Visakhapatnam',
            'emergency_level': 'High',
            'attender_name': 'Attender Test',
            'attender_phone': '9876543210',
            'units_required': '2',
            'hospital_proof': (io.BytesIO(b"dummy pdf data"), 'test_proof.pdf')
        }, follow_redirects=True)
        
        assert b"Emergency request submitted successfully" in response.data

    # Verify database status is 'Pending'
    with app.app_context():
        req = BloodRequest.query.filter_by(patient_name='Patient Test').first()
        assert req is not None
        assert req.status == 'Pending'
        req_id = req.id

    # 2. Approve request as Admin
    with client:
        client.get('/auth/logout')
        # Log in as Admin
        client.post('/auth/login', data={
            'email': 'admin@test.com',
            'password': 'AdminPass123'
        })

        # Submit POST action to approve
        response = client.post(f'/admin/approve-request/{req_id}', follow_redirects=True)
        assert b"approved successfully" in response.data

    # Verify status is 'Approved' in database
    with app.app_context():
        req = BloodRequest.query.get(req_id)
        assert req.status == 'Approved'
