from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class AccountCreate(BaseModel):
    name: str
    account_type: AccountType
    description: Optional[str] = None
    account_number: Optional[str] = None


class AccountResponse(BaseModel):
    id: int
    name: str
    account_type: AccountType
    description: Optional[str]
    account_number: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LedgerEntryCreate(BaseModel):
    date: datetime
    description: str
    debit_account_id: int
    credit_account_id: int
    amount: float
    reference: Optional[str] = None


class LedgerEntryResponse(BaseModel):
    id: int
    date: datetime
    description: str
    debit_account_id: int
    credit_account_id: int
    amount: float
    reference: Optional[str]
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class LedgerEntryWithAccounts(LedgerEntryResponse):
    debit_account: AccountResponse
    credit_account: AccountResponse
    user: UserResponse