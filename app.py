import os
from app import create_app

# Instantiate the Flask app using environment configurations
app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Runs on localhost port 5000 by default
    app.run(host='0.0.0.0', port=5000)
