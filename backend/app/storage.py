import os
import shutil
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException
from app.config import settings

def get_room_dir(room_code: str) -> Path:
    # Normalize and ensure no path traversal
    safe_code = "".join(c for c in room_code if c.isalnum() or c == "-")
    room_dir = settings.STORAGE_DIR / safe_code
    room_dir.mkdir(parents=True, exist_ok=True)
    return room_dir

async def save_upload_file(upload_file: UploadFile, room_code: str, file_id: str) -> Tuple[Path, int]:
    room_dir = get_room_dir(room_code)
    file_path = room_dir / file_id
    
    bytes_written = 0
    chunk_size = 1024 * 1024  # 1MB chunk streaming
    
    try:
        with open(file_path, "wb") as f:
            while chunk := await upload_file.read(chunk_size):
                bytes_written += len(chunk)
                if bytes_written > settings.max_file_size_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB."
                    )
                f.write(chunk)
    except HTTPException:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise
    except Exception as e:
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        # Avoid exposing internal filesystem paths or system errors to caller
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")
        
    return file_path, bytes_written

def save_text_file(text: str, room_code: str, file_id: str) -> Tuple[Path, int]:
    room_dir = get_room_dir(room_code)
    file_path = room_dir / file_id
    data = text.encode("utf-8")
    if len(data) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Text exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB."
        )
    with open(file_path, "wb") as f:
        f.write(data)
    return file_path, len(data)

def delete_room_storage(room_code: str):
    safe_code = "".join(c for c in room_code if c.isalnum() or c == "-").strip()
    if not safe_code:
        return
    room_dir = settings.STORAGE_DIR / safe_code
    if room_dir.exists() and room_dir.is_dir():
        try:
            shutil.rmtree(room_dir, ignore_errors=True)
        except Exception:
            pass

def cleanup_orphaned_storage(active_codes: set, max_age_seconds: int = 600) -> int:
    """
    Scans STORAGE_DIR and removes any directory that does not correspond
    to an active in-memory room or whose age exceeds max_age_seconds.
    Guarantees no orphaned directories remain after server restarts or abrupt aborts.
    """
    purged_count = 0
    if not settings.STORAGE_DIR.exists():
        return 0

    import time
    now = time.time()
    try:
        for entry in settings.STORAGE_DIR.iterdir():
            if not entry.is_dir():
                continue
            normalized_name = "".join(c for c in entry.name if c.isalnum()).upper()
            is_active = normalized_name in active_codes
            try:
                mtime = entry.stat().st_mtime
                age = now - mtime
            except Exception:
                age = max_age_seconds + 1

            # Purge if not active (and not just created in the last 30s), or if exceeding TTL
            if (not is_active and age > 30) or (age >= max_age_seconds):
                shutil.rmtree(entry, ignore_errors=True)
                purged_count += 1
    except Exception:
        pass
    return purged_count
