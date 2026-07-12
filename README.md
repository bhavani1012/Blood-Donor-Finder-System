# 🩸 Blood Donor Finder System

An AI-powered Blood Donor Finder System designed to connect blood donors and recipients quickly during emergencies. The application uses Flask, MySQL, Google Maps API, and Blood Group Compatibility Matching to locate nearby eligible donors while ensuring secure donor management and emergency request handling.

## 🚀 Technology Stack

**Backend Server:** Python Flask

**Database:** MySQL

**Frontend Layout:** HTML5, CSS3, JavaScript (ES6), Bootstrap 5

**APIs:** Google Maps API, Google Geolocation API, Google Places API

**Development Tools:** VS Code, GitHub, XAMPP

---

## 🌟 Key Features

### Donor Module

* Donor Registration and Secure Login.
* Manage donor profile including blood group, address, location, last donation date, and availability status.
* Update availability for emergency blood donation requests.
* View donation history and profile information.

### Recipient Module

* Recipient Registration and Login.
* Search nearby blood donors using blood group and current location.
* Blood compatibility matching for accurate donor selection.
* Send emergency blood requests to eligible donors.
* View donor details based on admin privacy settings.

### Admin Module

* Secure Admin Dashboard.
* Manage donor and recipient accounts.
* Verify emergency blood requests.
* Approve or reject donor registrations when required.
* Monitor donor availability and blood inventory statistics.

### AI & Location Features

* AI-powered location-based donor search.
* Google Maps integration for nearby donor identification.
* Blood Group Compatibility Matching.
* Emergency request verification and management.
* Fast donor filtering based on distance and blood group.

### Security Features

* Secure authentication and authorization.
* Protected donor information.
* Admin-controlled access to sensitive donor details.
* Input validation and secure database operations.

---

## 🛠️ Local Setup Guide

### Step 1: Install Required Packages

Open a terminal inside the project folder and run:

```bash
pip install -r requirements.txt
```

### Step 2: Configure Database

* Import **database.sql** into MySQL.
* Update database configuration in **config.py** if required.

### Step 3: Start the Application

```bash
python app.py
```

### Step 4: Open the Application

Open your browser and visit:

```text
http://127.0.0.1:5000/
```

---

## 📋 Project Modules

* Home Page
* Donor Registration
* Donor Login
* Recipient Registration
* Recipient Login
* Admin Dashboard
* Blood Search
* Emergency Request Management
* Donor Profile Management
* Google Maps Location Search

---

## 📈 Expected Output

* Quick donor search based on blood group and location.
* Accurate blood compatibility matching.
* Secure donor and recipient management.
* Real-time emergency request handling.
* Easy administration through a centralized dashboard.

---

## 🔮 Future Enhancements

* SMS and Email Notifications.
* Live GPS Tracking.
* Hospital Integration.
* Mobile Application Support.
* AI-based Donor Recommendation System.

---

## 👩‍💻 Developer

**Adhuri Durga Bhavani**

GitHub: https://github.com/bhavani1012
