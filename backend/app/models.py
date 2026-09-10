from typing import List, Optional
from pydantic import BaseModel, Field

class FileMetadata(BaseModel):
    id: str
    name: str
    size: int
    content_type: str = "application/octet-stream"

class RoomResponse(BaseModel):
    code: str
    status: str = "waiting"  # "waiting" | "connected" | "completed" | "expired"
    expires_at: int
    created_at: int
    total_size: int
    files: List[FileMetadata] = Field(default_factory=list)

class RoomStatusResponse(BaseModel):
    code: str
    status: str
    receiver_connected: bool
    expires_at: int
