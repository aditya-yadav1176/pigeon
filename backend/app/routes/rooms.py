import os
import secrets
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from app.models import RoomResponse, RoomStatusResponse
from app.room_manager import room_manager, StoredFile
from app.storage import save_upload_file, save_text_file
from app.config import settings

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room_and_upload(
    files: Optional[List[UploadFile]] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Creates a temporary room and streams uploaded files / text to disk.
    Enforces maximum total upload size (250MB) and generates secure short code.
    """
    if not files and not text:
        raise HTTPException(status_code=400, detail="Must provide at least one file or text content.")

    room = room_manager.create_room()
    total_size = 0

    try:
        # Handle regular file uploads
        if files:
            for upload_file in files:
                raw_filename = upload_file.filename or ""
                safe_filename = os.path.basename(raw_filename).strip()
                if not safe_filename:
                    continue
                file_id = secrets.token_hex(8)
                file_path, file_size = await save_upload_file(upload_file, room.code, file_id)
                total_size += file_size
                if total_size > settings.max_file_size_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Total upload size exceeds limit of {settings.MAX_FILE_SIZE_MB} MB."
                    )
                
                content_type = upload_file.content_type or "application/octet-stream"
                room.files.append(StoredFile(
                    file_id=file_id,
                    name=safe_filename,
                    size=file_size,
                    content_type=content_type,
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
def get_room_details(code: str):
    """Retrieves room status and file metadata."""
    room = room_manager.get_room(code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return room.to_response()

@router.post("/{code}/connect", response_model=RoomResponse)
def connect_receiver(code: str):
    """Marks receiver as connected and returns room metadata."""
    room = room_manager.connect_receiver(code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return room.to_response()

@router.post("/{code}/complete", response_model=RoomResponse)
def complete_transfer(code: str):
    """Marks room transfer as completed."""
    room = room_manager.complete_room(code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )
    return room.to_response()

@router.get("/{code}/status", response_model=RoomStatusResponse)
def poll_room_status(code: str):
    """Lightweight polling endpoint to detect receiver connection and expiration."""
    room = room_manager.get_room(code)
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
    room = room_manager.get_room(code)
    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room with code '{code}' was not found or has expired."
        )

    target_file = next((f for f in room.files if f.id == file_id), None)
    if not target_file:
        raise HTTPException(status_code=404, detail="Requested file was not found.")

    file_path = Path(target_file.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File content missing from storage.")

    # Sanitize filename for header
    sanitized_name = target_file.name.replace('"', '\"')
    return FileResponse(
        path=file_path,
        media_type=target_file.content_type,
        filename=target_file.name,
        headers={
            "Content-Disposition": f'attachment; filename="{sanitized_name}"'
        }
    )
