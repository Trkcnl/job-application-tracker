# Job Application Tracker

A full-stack web application designed to help you organize, track, and automate your job applications. The application includes a React/TypeScript frontend, a FastAPI Python backend, and uses MongoDB for storage. It also integrates an automated email parser to scan for job application status updates via Gmail.

## 🚀 Features

- **Application Tracking**: Create, read, update, and delete job applications.
- **Automated Status Updates**: A background cron job scans incoming emails for application updates (e.g., rejections or acceptances) using keyword matching and updates the database automatically.
- **Modern UI**: Built with React, Vite, and Tailwind CSS (via components).
- **Dockerized Database**: Simple setup for the MongoDB instance.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Python 3, FastAPI, Motor (Async MongoDB), APScheduler, Google API Client (Gmail)
- **Database**: MongoDB (deployed via Docker)

## 📋 Prerequisites

Before setting up the project on a new platform, ensure you have the following installed:

1. [Node.js](https://nodejs.org/) (v18 or higher) and `npm`
2. [Python](https://www.python.org/) (v3.10 or higher)
3. [Docker](https://www.docker.com/) and Docker Compose
4. A Google Cloud Console project with the **Gmail API** enabled and OAuth 2.0 client credentials (`credentials.json`).

## ⚙️ Setup Instructions

### 1. Database Setup

The project uses Docker to run a local MongoDB instance. From the root directory, start the database:

```bash
docker-compose up -d
```
*This maps MongoDB to `localhost:27017` and persists data in a Docker volume.*

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   
   # On Windows
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configuration and Credentials:
   - Create a `.env` file in the `backend/` directory:
     ```env
     MONGO_URI="mongodb://localhost:27017" # (Optional: defaults to this)
     ```
   - Place your Google OAuth `credentials.json` file in the `backend/` directory. Upon the first execution of the email parser, it will prompt you to authenticate via your browser to generate a `token.json` file.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```

## 🏃 Running the Application

You can start the entire stack using the provided shell script from the project root:

```bash
# Ensure the script is executable
chmod +x run_dev.sh

# Start the app
./run_dev.sh
```

Alternatively, you can run them separately in two different terminal windows:

**Backend (Terminal 1):**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Project Structure

```
.
├── backend/                  # FastAPI Backend
│   ├── email_parser.py       # Gmail integration & AI parsing
│   ├── main.py               # API Endpoints & Scheduler
│   ├── requirements.txt      # Python dependencies
│   └── uploads/              # Local storage for files/resumes
├── frontend/                 # Vite + React Frontend
│   ├── src/                  # React components & pages
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite configuration
├── docker-compose.yml        # MongoDB Docker setup
├── run_dev.sh                # Utility script to run dev servers
└── README.md                 # Project documentation
```
