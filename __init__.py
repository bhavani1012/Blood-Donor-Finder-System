import os
from flask import Flask
from flask import render_template
from config import config_map
from app.extensions import db, login_manager, csrf, mail

def create_app(config_name=None):
    """
    Application Factory for Blood Donor Finder System.
    Configures and initializes Flask extensions, Blueprints, and folders.
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map['default']))

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    mail.init_app(app)

    # Ensure Upload folders exist
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'profiles'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'proofs'), exist_ok=True)

    # Register Blueprints
    from app.blueprints.auth.routes import auth_bp
    from app.blueprints.donor.routes import donor_bp
    from app.blueprints.recipient.routes import recipient_bp
    from app.blueprints.admin.routes import admin_bp
    from app.blueprints.main.routes import main_bp
    from app.blueprints.api.routes import api_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(donor_bp, url_prefix='/donor')
    app.register_blueprint(recipient_bp, url_prefix='/recipient')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(main_bp, url_prefix='/')
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # User loader configuration
    from app.models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Error Handlers
    @app.errorhandler(403)
    def forbidden(error):
        return render_template('errors/403.html'), 403

    @app.errorhandler(404)
    def not_found(error):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        return render_template('errors/500.html'), 500

    # Inject variables globally into templates (e.g. Google Maps API Key)
    @app.context_processor
    def inject_globals():
        return {
            'google_maps_api_key': app.config.get('GOOGLE_MAPS_API_KEY', '')
        }

    return app
