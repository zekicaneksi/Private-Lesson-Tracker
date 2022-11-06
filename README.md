# Private-Lesson-Tracker
An app that ables teacher, students and their guardians to track the private lessons they are taking/giving.

The "Design" folder in the repo contains the database diagram and wireframe design of the site.

## Technologies and Frameworks

App consists of 3 parts;
- Backend API
-- MySql
-- Node.js

- Website
-- NextJs (React)

- Mobile (Flutter)

## Setting Up The Project

- npm install in both frontend/ and backend/

- Database
-- Run "database_init.sql" file in your database.

- Setup enviorement variables;

-- Backend
--- .env.development file with such variables must be created in backend/;
PORT=<PORT NUMBER>

--- .env.production file with such variables must be created in backend/;
PORT=<PORT NUMBER>

-- Frontend
--- In the frontend/package.json file's scripts setting, the ports must be changed to your liking;
  "scripts": {
    "dev": "next dev --port 3000",  --- Development Port
    "build": "next build",
    "start": "next start --port 2000", --- Production Port
    "lint": "next lint"
  }

## Development

To run the project;

- npm run dev in 'backend/'
- npm run start in 'backend/'

## Deployment

To build the project;

- npm run build in site/

To run the project;

- npm run start in site/
- npm run start in backend/