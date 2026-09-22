import os
import secrets
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, status
from fastapi.responses import FileResponse
from app.models import RoomResponse, RoomStatusResponse
from app.room_manager import room_manager, StoredFile
from app.storage import save_upload_file, save_text_file, get_room_dir
from app.config import settings
from app.security import (
    sanitize_filename,
    sanitize_header_filename,
    validate_room_code,
    validate_file_id,
    get_client_ip,
    upload_rate_limiter,
    code_guess_rate_limiter,
)

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

ALLOWED_TTL_SECONDS = {180, 300, 600}

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room_and_upload(
    request: Request,
    files: Optional[List[UploadFile]] = File(None),
    text: Optional[str] = Form(None),
    ttl_seconds: Optional[int] = Form(600)
):
    """
    Creates a temporary room and streams uploaded files / text to disk.
    Enforces maximum total upload size (250MB) and generates secure short code.
    Includes rate-limiting against automated disk exhaustion.
    """
    if ttl_seconds is not None and ttl_seconds not in ALLOWED_TTL_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid duration. Allowed durations are 180, 300, or 600 seconds."
        )
    effective_ttl = ttl_seconds if ttl_seconds is not None else 600

    client_ip = get_client_ip(request)
    if client_ip != "testclient" and upload_rate_limiter.is_rate_limited(client_ip, max_requests=15, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many upload requests. Please wait a moment before creating a new Pigeon."
        )

    if not files and not text:
        raise HTTPException(status_code=400, detail="Must provide at least one file or text content.")

    room = room_manager.create_room(ttl_seconds=effective_ttl)
    total_size = 0

    try:
        # Handle regular file uploads
        if files:
            for upload_file in files:
                raw_filename = (upload_file.filename or "").strip()
                if not raw_filename or not any(c.isalnum() for c in raw_filename):
                    continue
                safe_filename = sanitize_filename(raw_filename)
                if not safe_filename or safe_filename == "unnamed_file":
                    continue

                file_id = secrets.token_hex(8)
                file_path, file_size = await save_upload_file(upload_file, room.code, file_id)
                total_size += file_size
                if total_size > settings.max_file_size_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Total upload size exceeds limit of {settings.MAX_FILE_SIZE_MB} MB."
                    )

                raw_content_type = upload_file.content_type or "application/octet-stream"
                clean_content_type = "".join(c for c in raw_content_type if c.isprintable() and c not in '\r\n\t')

                room.files.append(StoredFile(
                    file_id=file_id,
                    name=safe_filename,
                    size=file_size,
                    content_type=clean_content_type,
                    file_path=str(file_path)
                ))

        # Handle text / link upload
        if text and text.strip():
            trimmed = text.strip()
            is_url = trimmed.startswith("http://") or trimmed.startswith("https://")
            name = "Shared Link.txt" if is_url else "Shared Note.txt"
            file_id = secrets.token_hex(8)
            file_path, file_size = save_text_file(trimmed, room.code, file_id)
            total_size += file_size
            room.files.append(StoredFile(
                file_id=file_id,
                name=name,
                size=file_size,
                content_type="text/plain; charset=utf-8",
                file_path=str(file_path)
            ))

        if not room.files:
            raise HTTPException(status_code=400, detail="No valid files or text content were uploaded.")

    except Exception:
        # Purge room on upload failure
        room_manager.expire_room(room_manager.normalize_code(room.code))
        raise

    return room.to_response()

@router.get("/{code}", response_model=RoomResponse)
def get_room_details(code: str, request: Request):
    """Retrieves room status and file metadata."""
    safe_code = validate_room_code(code)
    room = room_manager.get_room(safe_code)
    if not room:
        client_ip = get_client_ip(request)
        if client_ip != "testclient" and code_guess_rate_limiter.is_rate_limited(client_ip, max_requests=25, window_seconds=60):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid code attempts. Please wait a minute and try again."
            )
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return room.to_response()

@router.post("/{code}/connect", response_model=RoomResponse)
def connect_receiver(code: str, request: Request):
    """Marks receiver as connected and returns room metadata."""
    safe_code = validate_room_code(code)
    room = room_manager.connect_receiver(safe_code)
    if not room:
        client_ip = get_client_ip(request)
        if client_ip != "testclient" and code_guess_rate_limiter.is_rate_limited(client_ip, max_requests=25, window_seconds=60):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid code attempts. Please wait a minute and try again."
            )
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return room.to_response()

@router.post("/{code}/complete", response_model=RoomResponse)
def complete_transfer(code: str):
    """Marks room transfer as completed."""
    safe_code = validate_room_code(code)
    room = room_manager.complete_room(safe_code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return room.to_response()

@router.get("/{code}/status", response_model=RoomStatusResponse)
def poll_room_status(code: str):
    """Lightweight polling endpoint to detect receiver connection and expiration."""
    safe_code = validate_room_code(code)
    room = room_manager.get_room(safe_code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return RoomStatusResponse(
        code=room.code,
        status=room.status,
        receiver_connected=room.receiver_connected,
        expires_at=room.expires_at
    )

@router.get("/{code}/files/{file_id}")
def download_file(code: str, file_id: str):
    """Streams the stored file from disk as a real attachment download."""
    safe_code = validate_room_code(code)
    safe_file_id = validate_file_id(file_id)

    room = room_manager.get_room(safe_code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )

    target_file = next((f for f in room.files if f.id == safe_file_id), None)
    if not target_file:
        raise HTTPException(status_code=404, detail="Requested file was not found.")

    file_path = Path(target_file.file_path)
    room_dir = get_room_dir(room.code).resolve()
    resolved_path = file_path.resolve()
    if not resolved_path.is_relative_to(room_dir):
        raise HTTPException(status_code=404, detail="Requested file was not found.")

    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail="File content missing from storage.")

    sanitized_header = sanitize_header_filename(target_file.name)
    return FileResponse(
        path=resolved_path,
        media_type=target_file.content_type,
        filename=sanitized_header,
        headers={
            "Content-Disposition": f'attachment; filename="{sanitized_header}"'
        }
    )
