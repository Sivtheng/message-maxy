# Message Maxy ver.1.0.0.alpha

Message Maxy is a real-time chat application built with Gatsby and Firebase. It allows users to sign up, log in, and exchange messages with other users in real-time.

## Features

- User authentication (sign up, log in, log out, delete account)
- Real-time messaging
- Message deletion

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or later)
- npm or yarn
- A Firebase account and project

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/message-maxy.git
   cd message-maxy
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Firebase configuration:

   ```bash
   GATSBY_FIREBASE_API_KEY=your_api_key
   GATSBY_FIREBASE_AUTH_DOMAIN=your_auth_domain
   GATSBY_FIREBASE_PROJECT_ID=your_project_id
   GATSBY_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   GATSBY_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   GATSBY_FIREBASE_APP_ID=your_app_id
   GATSBY_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

## Running the Application

To run the application in development mode:

```bash
npm run develop
```

To build the application for production:

```bash
npm run build
```

## Deployment

This project is set up to deploy to Firebase Hosting. To deploy:

1. Install the Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize your project:

   ```bash
   firebase init
   ```

4. Build your Gatsby site:

   ```bash
   npm run build
   ```

5. Deploy to Firebase:

   ```bash
   firebase deploy
   ```
