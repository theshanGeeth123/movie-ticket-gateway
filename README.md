# Movie Ticket Gateway

A full-stack Online Movie Ticket Booking and Real-Time Payment Processing Gateway built with the MERN stack. The system supports movie management, hall and showtime scheduling, live seat reservation, Stripe payment processing, ticket generation, QR verification, PDF ticket download, email ticket delivery, and role-based dashboards for Admin, Staff, and Customers.

---

## Project Overview

Movie Ticket Gateway is a professional cinema ticket booking platform that allows customers to browse movies, select showtimes, reserve seats, complete secure Stripe payments, and receive digital tickets with QR verification.

The system also provides an admin panel for managing movies, halls, showtimes, bookings, tickets, users, and reports. Staff users can verify tickets using QR/ticket details and manage cinema entry validation.

---

## Main Features

### Customer Features

- Customer registration and login
- Email OTP account verification
- Forgot password and OTP password reset
- Browse available movies
- View movie details with images and gallery
- Select date and view available movies/showtimes
- Select showtime and reserve seats
- Secure Stripe card payment
- View booking history
- View ticket history
- Download professional ticket PDF
- Email ticket with PDF attachment
- QR-based ticket verification data

### Admin Features

- Admin dashboard
- Movie management with Cloudinary image upload
- Main movie poster and multiple gallery images
- Hall/screen management
- Seat layout generation
- Showtime scheduling
- Booking management
- Ticket management
- User management
- Reports and maintenance section
- Release expired reservations
- Movie performance and revenue reporting

### Staff Features

- Staff dashboard
- View today’s showtimes
- Verify tickets
- Mark tickets as used
- View ticket and booking records

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hot Toast
- Lucide React
- Stripe React SDK
- React Datepicker
- QRCode

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cookie-based authentication
- Nodemailer
- Cloudinary
- Multer
- Stripe
- PDFKit
- QRCode
- Node Cron

---

## Folder Structure

```txt
movie-ticket-gateway/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
└── README.md
Backend Setup

Go to the backend folder:

cd backend

Install dependencies:

npm install

Create a .env file inside the backend folder:

NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/movie-ticket-gateway

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Movie Gateway <your_email@gmail.com>"

ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_CURRENCY=usd

Start the backend server:

npm run dev

Backend will run on:

http://localhost:5000
Frontend Setup

Go to the frontend folder:

cd frontend

Install dependencies:

npm install

Create a .env file inside the frontend folder:

VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

Start the frontend:

npm run dev

Frontend will run on:

http://localhost:5173
Admin Account Setup

Use the admin credentials from backend .env:

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123

If your project has an admin seed script, run:

npm run seed:admin

Then login as admin from the frontend.

Stripe Test Payment

Use Stripe test mode keys.

Successful test card:

Card Number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
Country: Sri Lanka

Failed payment test card:

Card Number: 4000 0000 0000 9995
Expiry: 12/34
CVC: 123
Gmail Email Setup

To send OTPs and ticket emails, use a Gmail App Password.

Steps:

Enable 2-Step Verification in your Google account.
Go to Google Account App Passwords.
Generate an app password for Mail.
Add that 16-character password to backend .env:
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password

Do not use your normal Gmail password.

Cloudinary Setup

Cloudinary is used for uploading movie posters and gallery images.

Add these values to backend .env:

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

Movie image upload supports:

Main movie image
Multiple gallery images
Image update
Image delete from Cloudinary
Important API Modules
/api/auth
/api/admin/users
/api/movies
/api/halls
/api/showtimes
/api/bookings
/api/payments
/api/tickets
/api/dashboard
/api/maintenance
User Roles
Admin

Admin can manage the full system including movies, halls, showtimes, bookings, tickets, users, reports, and maintenance.

Staff

Staff can view showtimes, verify tickets, and mark tickets as used.

Customer

Customers can browse movies, select showtimes, reserve seats, pay online, and access tickets.

Ticket System

After successful payment:

Booking becomes confirmed.
Seat status becomes booked.
Ticket is generated.
QR verification data is created.
Ticket PDF can be downloaded.
Ticket can be emailed to the customer.
Reservation Cleanup

Expired pending reservations can be released automatically using the backend cron job.

Manual cleanup route:

POST /api/maintenance/release-expired-reservations

Only admin users can run this route.

Security Notes
Do not push .env files to GitHub.
Keep Stripe secret key private.
Keep Cloudinary API secret private.
Keep Gmail app password private.
Use HTTPS in production.
Use Stripe webhooks in production payment flow.
Future Improvements
Stripe webhook support for production payments
Real-time seat updates with Socket.IO
QR scanner camera integration for staff
Refund management
Advanced analytics dashboard
Mobile responsive improvements
Deployment to cloud hosting
Author

Developed by Theshan Geethanjana

License

This project is for academic and learning purposes.
