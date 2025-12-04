import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.models.models import User, Account, LedgerEntry

# Test database (in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
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


class TestAccounts:
    def test_create_account(self):
        # First register and login to get token
        client.post(
            "/auth/register",
            json={
                "username": "accountuser",
                "email": "account@example.com",
                "password": "accountpassword123"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            json={
                "username": "accountuser",
                "password": "accountpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create account
        response = client.post(
            "/accounts/",
            json={
                "name": "Test Bank Account",
                "account_type": "asset",
                "description": "Test bank account",
                "account_number": "1001"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Bank Account"
        assert data["account_type"] == "asset"
        assert data["description"] == "Test bank account"
        assert data["account_number"] == "1001"

    def test_list_accounts(self):
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "listuser",
                "email": "list@example.com",
                "password": "listpassword123"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            json={
                "username": "listuser",
                "password": "listpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create an account first
        client.post(
            "/accounts/",
            json={
                "name": "Test Account",
                "account_type": "liability"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # List accounts
        response = client.get(
            "/accounts/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(account["name"] == "Test Account" for account in data)

    def test_create_account_unauthorized(self):
        response = client.post(
            "/accounts/",
            json={
                "name": "Unauthorized Account",
                "account_type": "asset"
            }
        )
        assert response.status_code == 401


class TestLedger:
    def test_create_ledger_entry(self):
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "ledgeruser",
                "email": "ledger@example.com",
                "password": "ledgerpassword123"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            json={
                "username": "ledgeruser",
                "password": "ledgerpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create accounts
        debit_account = client.post(
            "/accounts/",
            json={
                "name": "Cash Account",
                "account_type": "asset"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        credit_account = client.post(
            "/accounts/",
            json={
                "name": "Revenue Account",
                "account_type": "revenue"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Create ledger entry
        response = client.post(
            "/ledger/",
            json={
                "date": "2024-01-01T00:00:00",
                "description": "Test transaction",
                "debit_account_id": debit_account.json()["id"],
                "credit_account_id": credit_account.json()["id"],
                "amount": 100.50,
                "reference": "TEST-001"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Test transaction"
        assert data["amount"] == 100.50
        assert data["reference"] == "TEST-001"

    def test_list_ledger_entries(self):
        # Register and login
        client.post(
            "/auth/register",
            json={
                "username": "listledgeruser",
                "email": "listledger@example.com",
                "password": "listledgerpassword123"
            }
        )
        
        login_response = client.post(
            "/auth/login",
            json={
                "username": "listledgeruser",
                "password": "listledgerpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create accounts and entry
        debit_account = client.post(
            "/accounts/",
            json={
                "name": "Asset Account",
                "account_type": "asset"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        credit_account = client.post(
            "/accounts/",
            json={
                "name": "Expense Account",
                "account_type": "expense"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        client.post(
            "/ledger/",
            json={
                "date": "2024-01-01T00:00:00",
                "description": "Test entry",
                "debit_account_id": debit_account.json()["id"],
                "credit_account_id": credit_account.json()["id"],
                "amount": 50.00
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # List entries
        response = client.get(
            "/ledger/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(entry["description"] == "Test entry" for entry in data)

    def test_create_ledger_entry_unauthorized(self):
        response = client.post(
            "/ledger/",
            json={
                "date": "2024-01-01T00:00:00",
                "description": "Unauthorized entry",
                "debit_account_id": 1,
                "credit_account_id": 2,
                "amount": 100.00
            }
        )
        assert response.status_code == 401