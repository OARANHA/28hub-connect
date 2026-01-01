# 28Hub Connect - Development Setup Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Code Style and Linting](#code-style-and-linting)
- [Git Workflow](#git-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites

### Required Software

Before setting up the development environment, ensure you have the following installed:

#### Core Requirements

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

#### Development Tools (Recommended)

- **VS Code**: With recommended extensions
- **Postman**: For API testing
- **DBeaver** or **pgAdmin**: For database management
- **RedisInsight**: For Redis management

#### Verify Installation

```bash
# Check Python
python --version  # Should be 3.10+

# Check Node.js
node --version  # Should be 18.x+

# Check npm
npm --version  # Should be 9.x+

# Check Git
git --version

# Check Docker
docker --version

# Check Docker Compose
docker compose version
```

## Environment Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/OARANHA/28hub-connect.git
cd 28hub-connect
```

### 2. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### 3. Start Development Services

For local development, you can use Docker for infrastructure services:

```bash
# Start PostgreSQL and Redis
docker compose -f docker-compose.enterprise.yml up -d postgres redis

# Verify services are running
docker compose -f docker-compose.enterprise.yml ps
```

## Backend Development

### Setup Backend Environment

#### 1. Create Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### 2. Install Dependencies

```bash
# Install requirements
pip install -r requirements.txt

# Install development dependencies
pip install pytest pytest-cov black isort mypy flake8
```

#### 3. Configure Database

```bash
# Set DATABASE_URL in .env
# For local development with Docker PostgreSQL:
DATABASE_URL=postgresql://postgres:28hub2025@localhost:5432/28hub
```

#### 4. Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

#### 5. Start Development Server

```bash
# Run with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the Makefile (if available)
make dev
```

The API will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Backend Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── models.py              # SQLAlchemy models
├── database.py            # Database configuration
├── requirements.txt       # Python dependencies
├── alembic.ini           # Alembic configuration
├── alembic/              # Database migrations
│   ├── env.py           # Migration environment
│   └── versions/        # Migration scripts
└── integrations/        # External integrations
    ├── __init__.py
    └── evoai.py        # EvoAI integration
```

### Backend Development Workflow

#### Adding a New Endpoint

1. **Define the route in `main.py`**:

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["my-feature"])

class MyRequest(BaseModel):
    name: str
    value: int

@router.post("/my-endpoint")
async def my_endpoint(request: MyRequest):
    # Your logic here
    return {"message": "Success", "data": request}
```

2. **Add to the main app**:

```python
from .routes import my_feature_router

app.include_router(my_feature_router)
```

3. **Test the endpoint**:

```bash
curl -X POST http://localhost:8000/api/v1/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": 123}'
```

#### Adding a New Database Model

1. **Define the model in `models.py`**:

```python
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from database import Base

class MyModel(Base):
    __tablename__ = "my_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    value = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

2. **Create migration**:

```bash
alembic revision --autogenerate -m "Add MyModel"
```

3. **Apply migration**:

```bash
alembic upgrade head
```

## Frontend Development

### Setup Frontend Environment

#### 1. Install Dependencies

```bash
cd frontend

# Install npm packages
npm install
```

#### 2. Configure Environment Variables

Create `.env.local` in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_EVOAI_URL=http://localhost:8001
```

#### 3. Start Development Server

```bash
# Run development server with hot reload
npm run dev

# The frontend will be available at: http://localhost:3000
```

### Frontend Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── admin/            # Admin pages
│   ├── dashboard/        # Dashboard pages
│   ├── clients/          # Tenant management
│   ├── notifications/    # Notifications
│   ├── reports/          # Reports
│   ├── settings/         # Settings
│   └── whatsapp/         # WhatsApp management
├── components/            # Reusable components
│   ├── Sidebar.tsx       # Sidebar navigation
│   └── ...              # Other components
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                   # Utilities
│   └── api.ts            # API client
├── public/                # Static assets
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── next.config.js        # Next.js configuration
```

### Frontend Development Workflow

#### Adding a New Page

1. **Create the page file**:

```bash
# Create a new page in app/
touch app/new-page/page.tsx
```

2. **Add page content**:

```tsx
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Page</h1>
      <p>This is a new page.</p>
    </div>
  );
}
```

3. **Access the page**:

Navigate to: http://localhost:3000/new-page

#### Adding a New Component

1. **Create the component**:

```bash
# Create a new component in components/
touch components/MyComponent.tsx
```

2. **Add component code**:

```tsx
// components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}
```

3. **Use the component**:

```tsx
import { MyComponent } from '@/components/MyComponent';

export default function Page() {
  return (
    <MyComponent title="My Title">
      <p>Content here</p>
    </MyComponent>
  );
}
```

#### API Integration

Use the API client from `lib/api.ts`:

```tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  if (!data) return <div>Loading...</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

## Database Setup

### Local PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker run -d \
  --name 28hub-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=28hub2025 \
  -e POSTGRES_DB=28hub \
  -p 5432:5432 \
  postgres:15-alpine

# Verify connection
docker exec -it 28hub-postgres psql -U postgres -d 28hub -c "SELECT 1"
```

### Local Redis with Docker

```bash
# Start Redis container
docker run -d \
  --name 28hub-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify connection
docker exec -it 28hub-redis redis-cli ping
# Expected output: PONG
```

### Database Management Tools

#### Using DBeaver

1. Download and install DBeaver
2. Create new connection:
   - Database: PostgreSQL
   - Host: localhost
   - Port: 5432
   - Database: 28hub
   - Username: postgres
   - Password: 28hub2025

#### Using pgAdmin

1. Install pgAdmin
2. Add new server:
   - Host: localhost
   - Port: 5432
   - Database: 28hub
   - Username: postgres
   - Password: 28hub2025

### Running SQL Queries

```bash
# Connect to PostgreSQL
docker exec -it 28hub-postgres psql -U postgres -d 28hub

# List tables
\dt

# Describe table
\d tenants

# Run query
SELECT * FROM tenants LIMIT 10;

# Exit
\q
```

## Testing

### Backend Testing

#### Run All Tests

```bash
cd backend
pytest
```

#### Run Specific Test File

```bash
pytest tests/test_tenants.py
```

#### Run with Coverage

```bash
pytest --cov=. --cov-report=html
```

#### Run with Verbose Output

```bash
pytest -v
```

#### Run Only Failed Tests

```bash
pytest --lf
```

### Writing Backend Tests

```python
# tests/test_tenants.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_tenant():
    response = client.post(
        "/api/v1/28hub/register",
        json={
            "name": "Test Tenant",
            "wa_number": "5511999999999",
            "email": "test@example.com"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Tenant"

def test_get_dashboard():
    response = client.get(
        "/api/v1/28hub/{tenant_id}/dashboard",
        headers={"X-API-Key": "test-api-key"}
    )
    assert response.status_code == 200
```

### Frontend Testing

#### Run All Tests

```bash
cd frontend
npm test
```

#### Run Tests in Watch Mode

```bash
npm test -- --watch
```

#### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Writing Frontend Tests

```tsx
// components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders the title', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <MyComponent title="Test Title">
        <p>Child content</p>
      </MyComponent>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
```

### Integration Testing

```bash
# Run all integration tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# View test results
docker compose -f docker-compose.test.yml logs
```

## Code Style and Linting

### Backend Code Style

#### Python Code Formatting with Black

```bash
# Format all Python files
black .

# Check formatting without modifying
black --check .

# Format specific file
black main.py
```

#### Import Sorting with isort

```bash
# Sort imports
isort .

# Check without modifying
isort --check-only .
```

#### Type Checking with mypy

```bash
# Run type checker
mypy .

# Check specific file
mypy main.py
```

#### Linting with flake8

```bash
# Run linter
flake8 .

# Check specific file
flake8 main.py
```

### Frontend Code Style

#### ESLint

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

#### Prettier

```bash
# Format code
npm run format

# Check formatting
npm run format -- --check
```

#### TypeScript Type Checking

```bash
# Run type checker
npm run type-check
```

### Pre-commit Hooks

Install pre-commit hooks for automatic code formatting:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Git Workflow

### Branch Naming Convention

```
feature/     New features
bugfix/      Bug fixes
hotfix/      Critical fixes
docs/        Documentation
refactor/    Code refactoring
test/        Testing
```

### Commit Message Convention

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**

```
feat(api): add tenant registration endpoint

Implement new endpoint for tenant registration with validation.

Closes #123
```

```
fix(frontend): resolve dashboard loading issue

The dashboard was not loading due to incorrect API call.
Updated the API client to use the correct endpoint.
```

### Development Workflow

1. **Create a feature branch**:

```bash
git checkout -b feature/my-new-feature
```

2. **Make changes and commit**:

```bash
git add .
git commit -m "feat: add my new feature"
```

3. **Push to remote**:

```bash
git push origin feature/my-new-feature
```

4. **Create Pull Request**:

   - Go to GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Request review

5. **Address feedback**:

   - Make requested changes
   - Commit and push

6. **Merge**:

   - After approval, merge the PR
   - Delete the feature branch

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Problem**: Backend server fails to start.

**Solutions**:

1. Check if port 8000 is available:
```bash
# Linux/macOS
lsof -i :8000

# Windows
netstat -ano | findstr :8000
```

2. Check database connection:
```bash
docker exec 28hub-postgres psql -U postgres -d 28hub -c "SELECT 1"
```

3. Check environment variables:
```bash
# Verify DATABASE_URL is set correctly
echo $DATABASE_URL
```

#### Frontend Won't Start

**Problem**: Frontend server fails to start.

**Solutions**:

1. Clear node_modules and reinstall:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

2. Check if port 3000 is available:
```bash
# Linux/macOS
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

3. Check environment variables:
```bash
# Verify .env.local exists
cat .env.local
```

#### Database Migration Fails

**Problem**: Alembic migration fails.

**Solutions**:

1. Check current migration state:
```bash
alembic current
```

2. Check migration history:
```bash
alembic history
```

3. Reset database (CAUTION: deletes all data):
```bash
alembic downgrade base
alembic upgrade head
```

#### Docker Container Issues

**Problem**: Docker containers won't start or crash.

**Solutions**:

1. Check container logs:
```bash
docker compose -f docker-compose.enterprise.yml logs
```

2. Check container status:
```bash
docker compose -f docker-compose.enterprise.yml ps
```

3. Restart containers:
```bash
docker compose -f docker-compose.enterprise.yml restart
```

4. Rebuild containers:
```bash
docker compose -f docker-compose.enterprise.yml up -d --build
```

#### Import Errors

**Problem**: Python import errors when running backend.

**Solutions**:

1. Verify virtual environment is activated:
```bash
# Linux/macOS
which python

# Windows
where python
```

2. Reinstall dependencies:
```bash
pip install -r requirements.txt
```

3. Check PYTHONPATH:
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Getting Help

If you encounter issues not covered here:

1. Check existing [GitHub Issues](https://github.com/OARANHA/28hub-connect/issues)
2. Search the [Troubleshooting Guide](PROBLEMAS-SOLUCOES.md)
3. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, versions)
   - Error messages and logs

## Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Write tests**
5. **Update documentation**
6. **Submit a pull request**

### Code Review Process

1. All pull requests require at least one approval
2. Changes must pass all automated tests
3. Code must follow project style guidelines
4. Documentation must be updated for new features

### Feature Requests

To request a new feature:

1. Check existing issues first
2. Create a new issue with the "enhancement" label
3. Provide a clear description of the feature
4. Explain the use case and benefits
5. Consider contributing the feature yourself

### Bug Reports

To report a bug:

1. Search existing issues
2. Create a new issue with the "bug" label
3. Provide:
   - Clear description of the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

## Additional Resources

- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Docker Architecture](DOCKER.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
