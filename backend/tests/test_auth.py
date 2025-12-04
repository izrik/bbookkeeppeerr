import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


class TestAuth:
    def test_register_user(self):
        response = client.post(
            "/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"

    def test_register_duplicate_username(self):
        # First user
        client.post(
            "/auth/register",
            json={
                "username": "testuser2",
                "email": "test2@example.com",
                "password": "testpassword123"
            }
        )
        
        # Duplicate username
        response = client.post(
            "/auth/register",
            json={
                "username": "testuser2",
                "email": "test3@example.com",
                "password": "testpassword123"
            }
        )
        assert response.status_code == 400
        assert "Username already taken" in response.json()["detail"]

    def test_login_success(self):
        # Register user first
        client.post(
            "/auth/register",
            json={
                "username": "loginuser",
                "email": "login@example.com",
                "password": "loginpassword123"
            }
        )
        
        # Login
        response = client.post(
            "/auth/login",
            json={
                "username": "loginuser",
                "password": "loginpassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self):
        response = client.post(
            "/auth/login",
            json={
                "username": "nonexistent",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_get_current_user(self):
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "currentuser",
                "email": "current@example.com",
                "password": "currentpassword123"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            json={
                "username": "currentuser",
                "password": "currentpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "currentuser"
        assert data["email"] == "current@example.com"

    def test_get_current_user_unauthorized(self):
        response = client.get("/auth/me")
        assert response.status_code == 401