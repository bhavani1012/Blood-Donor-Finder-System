from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_mail import Mail

# Database access layer mapping
db = SQLAlchemy()

# Authentication session state management
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'warning'

# Cross-Site Request Forgery security shield
csrf = CSRFProtect()

# SMTP notification mailer engine
mail = Mail()
