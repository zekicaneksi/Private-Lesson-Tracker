# Private-Lesson-Tracker
An app that ables teacher, students and their guardians to track the private lessons they are taking/giving.

The "Design" folder in the repo contains the database diagram and wireframe design of the site.

## Technologies and Frameworks

App consists of 3 parts;
- Backend
  - MySql
  - Node.js

- Website
  - NextJs (React)

- Mobile (Flutter)

## Setting Up The Project

- `npm install` in both `site/` and `backend/`

- Run "database_init.sql" file in your database.

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

## Deployment

To build the project;

- `npm run build` in `site/`

To run the project;

- `npm run start` in `site/`
- `npm run start` in `backend/`
