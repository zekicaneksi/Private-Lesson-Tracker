# Private-Lesson-Tracker
An app that ables teacher, students and their guardians to track the private lessons they are taking/giving.

The "Design" folder in the repo contains the database diagram and wireframe design of the site.

## Technologies and Frameworks

App consists of 3 parts;
- Backend
  - MySql
  - Node.js
  - Firebase (Firebase Cloud Messaging) (For Mobile Notifications)

- Website
  - NextJs (React)

- Mobile
  - Flutter
    - Firebase CLI
    - FlutterFire CLI

## Notes

Notifications are not supported for iOS because it requires an Xcode to configure Firebase Cloud Messaging (FCM) which i cannot afford. Details about the configuration can found in here; <br></br>
https://firebase.flutter.dev/docs/messaging/overview/

## Setting Up The Project

If encountered an error, please check the Errors section for a solution.

- Run `npm install` in both `site/` and `backend/`

- Run "database_init.sql" file in your database.

- Run `flutter pub get` in `mobile/private_lesson_tracker/`

- Run `flutterfire configure` in `mobile/private_lesson_tracker/` and create or select a Firebase project that supports Android and iOS apps.
  - Enable `Cloud Messaging API (Legacy)` for your Firebase project to allow Node.js backend to use `admin-sdk` package which sends notifications to mobile devices through FCM <br></br>(Firebase Console -> Your project -> Project Settings -> Cloud Messaging)
  - Generate a private key for a service account (Firebase Console -> Your project -> Project Settings -> Service Accounts), rename the key as `serviceAccountKey.json` and put in `backend/` directory
  - Run `flutterfire configure` again and select your project with again iOS, Android supports to update the firebase options file.

- Create enviorement variable files;
  - `.env.development` file with such variables must be created in `backend/`;
  <br></br>
  ```
  PORT=<PORT NUMBER>
  MYSQL_HOSTNAME="<HOSTNAME>" --- example "localhost"
  MYSQL_PORT=<PORT NUMBER> --- example 3306
  MYSQL_USER="<USERNAME>" --- example "root"
  MYSQL_PASSWORD="<PASSWORD>"
  MYSQL_DATABASE="private_lesson_tracker"
  SESSION_SECRET="<SECRET_FOR_SESSION>"
  FRONTEND_ADDRESS="<FRONTEND_ADDRESS>" --- example "http://localhost:3000"
  ```
  - `.env.production` file with such variables must be created in `backend/`;
  <br></br>
  ```
  PORT=<PORT NUMBER>
  MYSQL_HOSTNAME="<HOSTNAME>" --- example "localhost"
  MYSQL_PORT=<PORT NUMBER> --- example 3306
  MYSQL_USER="<USERNAME>" --- example "root"
  MYSQL_PASSWORD="<PASSWORD>"
  MYSQL_DATABASE="private_lesson_tracker"
  SESSION_SECRET="<SECRET_FOR_SESSION>"
  FRONTEND_ADDRESS="<FRONTEND_ADDRESS>" --- example "http://localhost:2000"
  ```
  - `.env.development` file with such variables must be created in `site/`;
  <br></br>
  ```
  NEXT_PUBLIC_BACKEND_ADDRESS="<BACKEND_ADRESS>" --- example "http://localhost:3001"
  ```
  - `.env.production` file with such variables must be created in `site/`;
  <br></br>
  ```
  NEXT_PUBLIC_BACKEND_ADDRESS="<BACKEND_ADRESS>" --- example "http://localhost:2001"
  ```
  - `.env.development` file with such variables must be created in `mobile/private_lesson_tracker`;
  <br></br>
  ```
  BACKEND_ADDRESS="<BACKEND_ADRESS>" --- example "http://10.0.2.2:3001"
  ```
  - `.env.production` file with such variables must be created in `mobile/private_lesson_tracker`;
  <br></br>
  ```
  BACKEND_ADDRESS="<BACKEND_ADRESS>" --- example "http://zekicaneksi.com"
  ```

- In the `site/package.json` file's `scripts` setting, the ports must be changed to your liking;
```
  "scripts": {
    "dev": "next dev --port 3000",  --- Development Port
    "build": "next build",
    "start": "next start --port 2000", --- Production Port
    "lint": "next lint"
  }
```

## Development

To run the project;

- `npm run dev` in `backend/`
- `npm run dev` in `site/`
- `flutter run` in `mobile/private_lesson_tracker` (beforehand make sure you have a device running with `flutter devices`)

## Deployment
```
Right now, this section doesn't include the deployment of the mobile app. It will be added once the mobile app is finished.
When the time comes, for deployment, these documents should be referred to;
- https://docs.flutter.dev/deployment/android
- https://docs.flutter.dev/deployment/ios
```
To build the project;

- `npm run build` in `site/`

To run the project;

- `npm run start` in `backend/`
- `npm run start` in `site/`


## Errors

### SERVICE_NOT_AVALIABLE
This error is caused because of mainly 4 reasons;
- Your emulator or device doesn't have an internet connection.
- Your emulator's or device's time is not correct.
- Google Play Services is disabled or not updated in your emulator or device.
- Firebase configuration file is not correct. Run `flutterfire configure` again to verify.
