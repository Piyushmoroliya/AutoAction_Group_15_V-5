# AutoAction Backend

Complete backend system for the AutoAction Intelligent Screenshot-to-Action System.

## Overview

AutoAction is a college project that takes screenshots or images as input, extracts useful information, identifies the type of information, stores the extracted data, and performs appropriate actions such as creating reminders, managing assignments, recording payments, and organizing academic materials.

This backend provides:
- RESTful APIs for all operations
- JWT-based authentication and authorization
- PostgreSQL database with SQLAlchemy ORM
- Image upload and capture management
- CRUD operations for assignments, expenses, events, exams, and academic materials
- Reminder and action tracking system
- Chat history storage
- Analytics and insights
- Clean integration interfaces for CNN, NLP/OCR, and frontend modules

## Technology Stack

- **Backend Framework**: FastAPI 0.109.0
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0.25
- **Migrations**: Alembic 1.13.1
- **Data Validation**: Pydantic 2.5.3
- **Authentication**: JWT with bcrypt password hashing
- **Server**: Uvicorn 0.27.0
- **Testing**: Pytest 7.4.4

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.10 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)

## Installation

### 1. Clone the Repository

```bash
cd Backend_AutoAction
```

### 2. Create a Virtual Environment

```bash
python3 -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up PostgreSQL

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE autoaction_db;

# Create a user (optional, or use your existing user)
CREATE USER autoaction_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE autoaction_db TO autoaction_user;

# Exit
\q
```

### 5. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://autoaction_user:your_password@localhost:5432/autoaction_db
TEST_DATABASE_URL=sqlite:///./test.db

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
APP_NAME=AutoAction Backend
APP_VERSION=1.0.0
DEBUG=True

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
```

**Important**: Change the `SECRET_KEY` to a secure random string in production!

### 6. Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Generate a migration
alembic revision --autogenerate -m "Initial migration"

# Apply the migration
alembic upgrade head
```

If you have issues with Alembic, the application will auto-create tables in debug mode (not recommended for production).

### 7. Create Upload Directory

```bash
mkdir -p uploads
```

## Running the Application

### Development Mode

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the main.py file:

```bash
python app/main.py
```

The server will start at `http://localhost:8000`

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Running Tests

The project includes automated tests for critical functionality.

### Run All Tests

```bash
pytest
```

### Run Tests with Verbose Output

```bash
pytest -v
```

### Run Specific Test File

```bash
pytest tests/test_auth.py
```

### Run Tests with Coverage

```bash
pytest --cov=app --cov-report=html
```

The tests use SQLite in-memory database for isolation and speed.

## API Endpoints

All endpoints use the `/api/v1` prefix.

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile

### Captures

- `POST /api/v1/captures/upload` - Upload an image
- `GET /api/v1/captures` - List user's captures
- `GET /api/v1/captures/{id}` - Get specific capture
- `PUT /api/v1/captures/{id}/process` - Update processing results
- `DELETE /api/v1/captures/{id}` - Delete capture

### Assignments

- `POST /api/v1/assignments` - Create assignment
- `GET /api/v1/assignments` - List assignments
- `GET /api/v1/assignments/{id}` - Get assignment
- `PUT /api/v1/assignments/{id}` - Update assignment
- `DELETE /api/v1/assignments/{id}` - Delete assignment

### Expenses (Transactions)

- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses` - List expenses
- `GET /api/v1/expenses/{id}` - Get expense
- `PUT /api/v1/expenses/{id}` - Update expense
- `DELETE /api/v1/expenses/{id}` - Delete expense

### Events

- `POST /api/v1/events` - Create event
- `GET /api/v1/events` - List events
- `GET /api/v1/events/{id}` - Get event
- `PUT /api/v1/events/{id}` - Update event
- `DELETE /api/v1/events/{id}` - Delete event

### Exams

- `POST /api/v1/exams` - Create exam
- `GET /api/v1/exams` - List exams
- `GET /api/v1/exams/{id}` - Get exam
- `PUT /api/v1/exams/{id}` - Update exam
- `DELETE /api/v1/exams/{id}` - Delete exam

### Academic Materials

- `POST /api/v1/academic-materials` - Create academic material
- `GET /api/v1/academic-materials` - List academic materials
- `GET /api/v1/academic-materials/{id}` - Get academic material
- `PUT /api/v1/academic-materials/{id}` - Update academic material
- `DELETE /api/v1/academic-materials/{id}` - Delete academic material

### Reminders

- `POST /api/v1/reminders` - Create reminder
- `GET /api/v1/reminders` - List reminders (filter by status)
- `GET /api/v1/reminders/{id}` - Get reminder
- `PUT /api/v1/reminders/{id}` - Update reminder
- `DELETE /api/v1/reminders/{id}` - Delete reminder

### Actions

- `POST /api/v1/actions` - Create action
- `GET /api/v1/actions` - List actions (filter by status)
- `GET /api/v1/actions/{id}` - Get action
- `PUT /api/v1/actions/{id}` - Update action
- `POST /api/v1/actions/{id}/complete` - Mark action as completed
- `POST /api/v1/actions/{id}/fail` - Mark action as failed

### Chat

- `POST /api/v1/chat` - Create chat message
- `GET /api/v1/chat` - List chat messages
- `DELETE /api/v1/chat` - Clear chat history

### Insights

- `GET /api/v1/insights/upcoming-assignments` - Get upcoming assignments
- `GET /api/v1/insights/upcoming-exams` - Get upcoming exams
- `GET /api/v1/insights/upcoming-events` - Get upcoming events
- `GET /api/v1/insights/transaction-summary` - Get transaction summary
- `GET /api/v1/insights/assignment-deadline-summary` - Get assignment summary
- `GET /api/v1/insights/subject-breakdown` - Get subject breakdown
- `POST /api/v1/insights` - Create custom insight
- `GET /api/v1/insights/custom` - List custom insights

## Example API Usage

### 1. Register a User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=password123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Upload an Image

```bash
curl -X POST "http://localhost:8000/api/v1/captures/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### 4. Create an Assignment

```bash
curl -X POST "http://localhost:8000/api/v1/assignments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Math Homework",
    "subject": "Math",
    "deadline": "2024-10-25T23:59:59",
    "status": "pending"
  }'
```

### 5. Get Assignments

```bash
curl -X GET "http://localhost:8000/api/v1/assignments" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Folder Structure

```
Backend_AutoAction/
├── app/
│   ├── api/              # FastAPI route handlers
│   │   ├── auth.py       # Authentication endpoints
│   │   ├── users.py      # User profile endpoints
│   │   ├── capture.py    # Capture upload and management
│   │   ├── assignments.py
│   │   ├── expenses.py
│   │   ├── events.py
│   │   ├── exams.py
│   │   ├── academic.py
│   │   ├── reminders.py
│   │   ├── actions.py
│   │   ├── chatbot.py
│   │   └── analytics.py
│   ├── models/           # SQLAlchemy database models
│   │   ├── user.py
│   │   ├── capture.py
│   │   ├── assignment.py
│   │   ├── expense.py
│   │   ├── event.py
│   │   ├── exam.py
│   │   ├── academic.py
│   │   ├── reminder.py
│   │   ├── action.py
│   │   ├── chat.py
│   │   └── insight.py
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic services
│   │   ├── cnn_service.py      # Mock CNN service (replace with actual)
│   │   ├── ocr_service.py      # Mock OCR service (replace with actual)
│   │   ├── intent_service.py  # Mock intent service (replace with actual)
│   │   ├── reminder_service.py
│   │   ├── action_service.py
│   │   └── analytics_service.py
│   ├── utils/            # Utilities
│   │   ├── security.py   # Password hashing and JWT
│   │   ├── dependencies.py  # Auth dependencies
│   │   └── logger.py
│   ├── database/         # Database configuration
│   │   └── database.py
│   ├── config.py         # Application configuration
│   └── main.py           # FastAPI application entry point
├── alembic/              # Database migrations
├── tests/                # Automated tests
├── docs/                 # Documentation
│   └── TEAM_INTEGRATION.md
├── uploads/              # Uploaded image storage
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
├── .env                  # Your environment variables (not in git)
├── alembic.ini           # Alembic configuration
├── pytest.ini            # Pytest configuration
└── README.md             # This file
```

## Team Integration

For detailed integration instructions for CNN, NLP/OCR, dataset, and frontend modules, see:

**[docs/TEAM_INTEGRATION.md](docs/TEAM_INTEGRATION.md)**

This document includes:
- CNN classification integration interface
- OCR text extraction integration interface
- Intent detection integration interface
- Frontend API endpoints and examples
- Environment configuration
- Complete integration workflows

## Database Schema

The database includes the following main entities:

- **users**: User accounts and authentication
- **captures**: Uploaded images and processing status
- **assignments**: Assignment records with deadlines
- **expenses**: Transaction/payment records
- **events**: Event schedules
- **exams**: Examination schedules
- **academic_materials**: Academic notes and materials
- **reminders**: Reminder records linked to other entities
- **actions**: Action tracking for background operations
- **chat_messages**: Chat history
- **insights**: Custom insights and summaries

All user-specific records are isolated by user_id to ensure data privacy.

## Troubleshooting

### Database Connection Issues

If you get a database connection error:

1. Verify PostgreSQL is running:
   ```bash
   # On macOS
   brew services list
   brew services start postgresql

   # On Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. Check your DATABASE_URL in `.env`

3. Verify the database exists:
   ```bash
   psql -U postgres -l
   ```

### Import Errors

If you get import errors:

1. Ensure you're in the virtual environment
2. Reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Port Already in Use

If port 8000 is already in use:

```bash
# Find and kill the process (macOS/Linux)
lsof -ti:8000 | xargs kill -9

# Or use a different port
python -m uvicorn app.main:app --port 8001
```

### Migration Issues

If Alembic migrations fail:

1. Check Alembic configuration in `alembic.ini`
2. Ensure DATABASE_URL is correct in `.env`
3. You can drop and recreate tables in development (WARNING: deletes data):
   ```bash
   alembic downgrade base
   alembic upgrade head
   ```

## Security Notes

- Never commit `.env` file to version control
- Use strong, random SECRET_KEY in production
- Enable HTTPS in production
- Implement rate limiting for sensitive endpoints
- Regularly update dependencies
- Use environment-specific configurations

## Next Steps

1. **Set up PostgreSQL** and configure the database
2. **Install dependencies** and run migrations
3. **Start the server** and test with Swagger UI
4. **Review TEAM_INTEGRATION.md** for module integration
5. **Connect your CNN model** to the CNN service
6. **Connect your OCR/NLP module** to the OCR and intent services
7. **Connect your frontend** to the API endpoints

## Support

For questions or issues:
- Check the API documentation at `/docs`
- Review the team integration guide in `docs/TEAM_INTEGRATION.md`
- Contact the backend developer

## License

This is a college project. All rights reserved to the AutoAction team.
