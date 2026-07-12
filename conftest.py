import pytest
from datetime import date
from app import create_app
from app.extensions import db
from app.models import User, Donor, Recipient, Admin, DonorLocation, BloodRequest

@pytest.fixture
def app():
    """Initializes a Flask test app instance using the TestingConfig profile."""
    app = create_app('testing')
    
    with app.app_context():
        # Build schemas on in-memory SQLite
        db.create_all()
        
        # Seed core fixtures
        seed_test_data()
        
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Returns a Flask test client instance."""
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

def seed_test_data():
    """Seeds test records into the in-memory SQLite tables."""
    # 1. Admin
    admin_user = User(full_name="Test Admin", email="admin@test.com", phone="1111111111", role="admin")
    admin_user.set_password("AdminPass123")
    db.session.add(admin_user)
    
    # 2. Donor A+ (Available)
    donor_user1 = User(full_name="Donor One", email="donor1@test.com", phone="9876543210", role="donor")
    donor_user1.set_password("DonorPass123")
    db.session.add(donor_user1)
    
    # 3. Donor O- (Available)
    donor_user2 = User(full_name="Donor Two", email="donor2@test.com", phone="8765432109", role="donor")
    donor_user2.set_password("DonorPass123")
    db.session.add(donor_user2)
    
    # 4. Recipient
    recip_user = User(full_name="Recipient User", email="recipient@test.com", phone="7654321098", role="recipient")
    recip_user.set_password("RecipPass123")
    db.session.add(recip_user)
    
    db.session.commit()
    
    # Associate profile details
    admin = Admin(user_id=admin_user.id)
    
    donor1 = Donor(
        user_id=donor_user1.id, 
        blood_group="A+", 
        dob=date(1990, 1, 1), 
        gender="Male",
        address="123 Street A", 
        city="Visakhapatnam", 
        pincode="530016",
        is_available=True
    )
    
    donor2 = Donor(
        user_id=donor_user2.id, 
        blood_group="O-", 
        dob=date(1992, 5, 5), 
        gender="Female",
        address="456 Street B", 
        city="Visakhapatnam", 
        pincode="530017",
        is_available=True
    )
    
    recipient = Recipient(
        user_id=recip_user.id, 
        address="789 Street C", 
        city="Visakhapatnam"
    )
    
    db.session.add_all([admin, donor1, donor2, recipient])
    db.session.commit()
    
    # Set coordinates for distance checks (Vizag locations)
    # donor1: Dwaraka Nagar (17.7214, 83.3082)
    # donor2: MVP Colony (17.7410, 83.3320)
    loc1 = DonorLocation(donor_id=donor1.user_id, latitude=17.7214, longitude=83.3082)
    loc2 = DonorLocation(donor_id=donor2.user_id, latitude=17.7410, longitude=83.3320)
    db.session.add_all([loc1, loc2])
    db.session.commit()
