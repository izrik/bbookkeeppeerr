from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import LedgerEntry, User, Account
from app.schemas.schemas import (
    LedgerEntryCreate, LedgerEntryResponse, LedgerEntryWithAccounts
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.post("/", response_model=LedgerEntryResponse)
def create_ledger_entry(
    entry: LedgerEntryCreate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Validate that debit and credit accounts exist
    debit_account = db.query(Account).filter(Account.id == entry.debit_account_id).first()
    credit_account = db.query(Account).filter(Account.id == entry.credit_account_id).first()
    
    if not debit_account:
        raise HTTPException(status_code=404, detail="Debit account not found")
    if not credit_account:
        raise HTTPException(status_code=404, detail="Credit account not found")
    
    db_entry = LedgerEntry(
        date=entry.date,
        description=entry.description,
        debit_account_id=entry.debit_account_id,
        credit_account_id=entry.credit_account_id,
        amount=entry.amount,
        reference=entry.reference,
        user_id=current_user.id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/", response_model=List[LedgerEntryWithAccounts])
def list_ledger_entries(
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(LedgerEntry)
    
    if start_date is not None:
        query = query.filter(LedgerEntry.date >= start_date)
    if end_date is not None:
        query = query.filter(LedgerEntry.date <= end_date)
    
    entries = query.offset(skip).limit(limit).all()
    return entries


@router.get("/{entry_id}", response_model=LedgerEntryWithAccounts)
def get_ledger_entry(
    entry_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    return entry


@router.put("/{entry_id}", response_model=LedgerEntryResponse)
def update_ledger_entry(
    entry_id: int,
    entry_update: LedgerEntryCreate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    
    # Validate that debit and credit accounts exist
    debit_account = db.query(Account).filter(Account.id == entry_update.debit_account_id).first()
    credit_account = db.query(Account).filter(Account.id == entry_update.credit_account_id).first()
    
    if not debit_account:
        raise HTTPException(status_code=404, detail="Debit account not found")
    if not credit_account:
        raise HTTPException(status_code=404, detail="Credit account not found")
    
    entry.date = entry_update.date
    entry.description = entry_update.description
    entry.debit_account_id = entry_update.debit_account_id
    entry.credit_account_id = entry_update.credit_account_id
    entry.amount = entry_update.amount
    entry.reference = entry_update.reference
    
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_ledger_entry(
    entry_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    entry = db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    
    db.delete(entry)
    db.commit()
    return {"message": "Ledger entry deleted successfully"}