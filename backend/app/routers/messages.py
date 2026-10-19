from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import can_message_user
from app.core.security import get_current_user
from app.models.booking import Booking
from app.models.caregiver import Caregiver
from app.models.elder import Elder
from app.models.message import Message
from app.models.user import User
from app.schemas.message import (
    ContactSummary,
    ConversationSummary,
    MarkReadRequest,
    MessageCreateRequest,
    MessageResponse,
    PaginatedMessagesResponse,
)

router = APIRouter(prefix="/api", tags=["Messages"])


def _display_name(user: User) -> str:
    name = f"{user.first_name} {user.last_name}".strip()
    return name or user.username


class ConnectionManager:
    """In-memory WebSocket registry, keyed by user id. Single-process only —
    fine for local/dev use, would need a pub/sub backend (e.g. Redis) behind
    multiple uvicorn workers in a real deployment."""

    def __init__(self) -> None:
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        conns = self.active.get(user_id)
        if not conns:
            return
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self.active.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        for websocket in list(self.active.get(user_id, [])):
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect(user_id, websocket)


manager = ConnectionManager()


@router.get("/messages/contacts", response_model=list[ContactSummary])
def list_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in {"admin", "nurse"}:
        users = db.query(User).filter(User.id != current_user.id, User.is_active.is_(True)).all()
    elif current_user.role == "family":
        elder_ids = [e.id for e in db.query(Elder).filter(Elder.user_id == current_user.id).all()]
        caregiver_ids = (
            {b.caregiver_id for b in db.query(Booking).filter(Booking.elder_id.in_(elder_ids)).all()}
            if elder_ids
            else set()
        )
        caregiver_user_ids = [
            c.user_id for c in db.query(Caregiver).filter(Caregiver.id.in_(caregiver_ids)).all()
        ] if caregiver_ids else []
        support_ids = [u.id for u in db.query(User).filter(User.role.in_(["admin", "nurse"])).all()]
        users = db.query(User).filter(User.id.in_(caregiver_user_ids + support_ids)).all()
    elif current_user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == current_user.id).first()
        family_user_ids: list[int] = []
        if caregiver:
            elder_ids = {b.elder_id for b in db.query(Booking).filter(Booking.caregiver_id == caregiver.id).all()}
            family_user_ids = [
                e.user_id for e in db.query(Elder).filter(Elder.id.in_(elder_ids)).all()
            ] if elder_ids else []
        support_ids = [u.id for u in db.query(User).filter(User.role.in_(["admin", "nurse"])).all()]
        users = db.query(User).filter(User.id.in_(family_user_ids + support_ids)).all()
    else:
        users = db.query(User).filter(User.role.in_(["admin", "nurse"])).all()

    return [{"user_id": u.id, "name": _display_name(u), "role": u.role} for u in users]


@router.get("/messages/conversations", response_model=list[ConversationSummary])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sent_to = {row[0] for row in db.query(Message.recipient_id).filter(Message.sender_id == current_user.id).all()}
    received_from = {row[0] for row in db.query(Message.sender_id).filter(Message.recipient_id == current_user.id).all()}
    partner_ids = sent_to | received_from

    conversations = []
    for partner_id in partner_ids:
        partner = db.query(User).filter(User.id == partner_id).first()
        if not partner:
            continue

        thread_filter = or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == partner_id),
            and_(Message.sender_id == partner_id, Message.recipient_id == current_user.id),
        )
        last_message = db.query(Message).filter(thread_filter).order_by(Message.created_at.desc()).first()
        unread_count = (
            db.query(Message)
            .filter(Message.sender_id == partner_id, Message.recipient_id == current_user.id, Message.is_read.is_(False))
            .count()
        )

        conversations.append(
            {
                "user_id": partner.id,
                "name": _display_name(partner),
                "role": partner.role,
                "last_message": last_message.content if last_message else None,
                "last_message_at": last_message.created_at if last_message else None,
                "unread_count": unread_count,
            }
        )

    conversations.sort(key=lambda c: c["last_message_at"] or datetime.min, reverse=True)
    return conversations


@router.get("/messages", response_model=PaginatedMessagesResponse)
def list_messages(
    with_user_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_message_user(current_user, with_user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this conversation")

    thread_filter = or_(
        and_(Message.sender_id == current_user.id, Message.recipient_id == with_user_id),
        and_(Message.sender_id == with_user_id, Message.recipient_id == current_user.id),
    )
    query = db.query(Message).filter(thread_filter)
    total = query.count()
    items = query.order_by(Message.created_at.asc()).offset((page - 1) * size).limit(size).all()
    return {"items": items, "total": total, "page": page, "size": size}


@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    payload: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_message_user(current_user, payload.recipient_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to message this user")

    message = Message(sender_id=current_user.id, recipient_id=payload.recipient_id, content=payload.content)
    db.add(message)
    db.commit()
    db.refresh(message)

    response = MessageResponse.model_validate(message)
    payload_dict = {"type": "message", "message": response.model_dump(mode="json")}
    await manager.send_to_user(payload.recipient_id, payload_dict)
    await manager.send_to_user(current_user.id, payload_dict)

    return message


@router.post("/messages/read")
def mark_messages_read(
    payload: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Message).filter(
        Message.sender_id == payload.with_user_id,
        Message.recipient_id == current_user.id,
        Message.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return {"success": True}


@router.websocket("/ws/messages")
async def websocket_messages(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        await websocket.close(code=4401)
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        await websocket.close(code=4401)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Browser client doesn't send anything meaningful — this just
            # blocks until the socket closes so we notice disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
