import os
from datetime import date, datetime
from app import create_app
from app.extensions import db
from app.models import User, Donor, Recipient, Admin, DonorLocation, BloodRequest, RequestDocument, Notification

def init_db():
    # Instantiate Flask app using development configuration
    app = create_app('development')
    
    with app.app_context():
        print("Creating database tables if they do not exist...")
        db.create_all()
        
        # Check if database is already seeded
        admin_exists = User.query.filter_by(role='admin').first()
        if admin_exists:
            print("Database already contains data. Seeding skipped to preserve existing registered donor/recipient accounts.")
            return
            
        print("Seeding database records...")
        
        # 1. Admin
        admin_user = User(
            full_name="System Administrator", 
            email="admin@blooddonor.com", 
            phone="9999999999", 
            role="admin"
        )
        admin_user.set_password("Admin123")
        db.session.add(admin_user)
        
        # 2. Donor 1 (A+)
        donor_user1 = User(
            full_name="Amit Kumar Sharma", 
            email="donor1@blooddonor.com", 
            phone="9876543210", 
            role="donor"
        )
        donor_user1.set_password("Donor123")
        db.session.add(donor_user1)
        
        # 3. Donor 2 (O-)
        donor_user2 = User(
            full_name="Priya Visakhapatnam", 
            email="donor2@blooddonor.com", 
            phone="8765432109", 
            role="donor"
        )
        donor_user2.set_password("Donor123")
        db.session.add(donor_user2)
        
        # 4. Recipient
        recip_user = User(
            full_name="Ramesh Babu Recipient", 
            email="recipient@blooddonor.com", 
            phone="7654321098", 
            role="recipient"
        )
        recip_user.set_password("Recipient123")
        db.session.add(recip_user)
        
        # Commit users first to generate IDs
        db.session.commit()
        
        # 5. Profiles
        admin = Admin(user_id=admin_user.id)
        
        donor1 = Donor(
            user_id=donor_user1.id, 
            blood_group="A+", 
            dob=date(1995, 8, 15), 
            gender="Male",
            address="D.No 45-2-12, Dwaraka Nagar", 
            city="Visakhapatnam", 
            pincode="530016",
            is_available=True,
            last_donation_date=date(2026, 3, 1)
        )
        
        donor2 = Donor(
            user_id=donor_user2.id, 
            blood_group="O-", 
            dob=date(1998, 11, 22), 
            gender="Female",
            address="Fl.No 404, MVP Colony", 
            city="Visakhapatnam", 
            pincode="530017",
            is_available=True,
            last_donation_date=date(2026, 4, 10)
        )
        
        recipient = Recipient(
            user_id=recip_user.id, 
            address="Plot 88, Kirlampudi Layout", 
            city="Visakhapatnam"
        )
        
        db.session.add_all([admin, donor1, donor2, recipient])
        db.session.commit()
        
        # 6. Donor Locations
        loc1 = DonorLocation(donor_id=donor1.user_id, latitude=17.7214, longitude=83.3082)
        loc2 = DonorLocation(donor_id=donor2.user_id, latitude=17.7410, longitude=83.3320)
        db.session.add_all([loc1, loc2])
        
        # 7. Blood Requests
        req1 = BloodRequest(
            id=1,
            recipient_id=recipient.user_id,
            patient_name="Srinivasa Rao",
            blood_group="A+",
            hospital_name="Seven Hills Hospital",
            attender_name="Ramesh Babu",
            attender_phone="7654321098",
            city="Visakhapatnam",
            units_required=3,
            emergency_level="Critical",
            status="Approved"
        )
        db.session.add(req1)
        db.session.commit()
        
        # 8. Request Document
        doc1 = RequestDocument(request_id=req1.id, document_path="sample_proof.pdf")
        db.session.add(doc1)
        
        # 9. Notifications
        notif1 = Notification(
            user_id=recipient.user_id, 
            message="Your emergency blood request for patient Srinivasa Rao has been approved by the administrator.", 
            type="status_update"
        )
        notif2 = Notification(
            user_id=donor1.user_id, 
            message="Urgent: A critical request for A+ blood has been approved near your location.", 
            type="alert"
        )
        db.session.add_all([notif1, notif2])
        
        db.session.commit()
        print("Database initialized and seeded successfully!")

if __name__ == '__main__':
    init_db()
