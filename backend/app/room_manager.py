import time
import secrets
from typing import Dict, List, Optional
from app.models import FileMetadata, RoomResponse
from app.config import settings
from app.storage import delete_room_storage

# Unambiguous alphabet avoiding O/0, I/1, S/5
CODE_ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789"

class StoredFile:
    def __init__(self, file_id: str, name: str, size: int, content_type: str, file_path: str):
        self.id = file_id
        self.name = name
        self.size = size
        self.content_type = content_type
        self.file_path = file_path

    def to_metadata(self) -> FileMetadata:
        return FileMetadata(
            id=self.id,
            name=self.name,
            size=self.size,
            content_type=self.content_type
        )

class Room:
    def __init__(self, code: str, expires_at: int):
        self.code = code
        self.status = "waiting"  # "waiting" | "connected" | "completed" | "expired"
        self.receiver_connected = False
        self.created_at = int(time.time() * 1000)
        self.expires_at = expires_at
        self.files: List[StoredFile] = []

    @property
    def total_size(self) -> int:
        return sum(f.size for f in self.files)

    def is_expired(self) -> bool:
        return time.time() * 1000 >= self.expires_at

    def to_response(self) -> RoomResponse:
        return RoomResponse(
            code=self.code,
            status=self.status,
            expires_at=self.expires_at,
            created_at=self.created_at,
            total_size=self.total_size,
            files=[f.to_metadata() for f in self.files]
        )

class RoomManager:
    def __init__(self):
        # Maps normalized uppercase code (e.g. "K7M4PQ") to Room
        self.rooms: Dict[str, Room] = {}

    @staticmethod
    def normalize_code(code: str) -> str:
        return "".join(c for c in code if c.isalnum()).upper()

    def generate_code(self) -> str:
        for _ in range(100):
            part1 = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
            part2 = "".join(secrets.choice(CODE_ALPHABET) for _ in range(2))
            code = f"{part1}-{part2}"
            normalized = self.normalize_code(code)
            if normalized not in self.rooms:
                return code
        # Fallback if busy
        return f"{secrets.token_hex(2).upper()}-{secrets.token_hex(1).upper()}"

    def create_room(self) -> Room:
        code = self.generate_code()
        normalized = self.normalize_code(code)
        expires_at = int((time.time() + settings.ROOM_TTL_SECONDS) * 1000)
        room = Room(code=code, expires_at=expires_at)
        self.rooms[normalized] = room
        return room

    def get_room(self, code: str) -> Optional[Room]:
        normalized = self.normalize_code(code)
        room = self.rooms.get(normalized)
        if not room:
            return None
        if room.is_expired():
            self.expire_room(normalized)
            return None
        return room

    def connect_receiver(self, code: str) -> Optional[Room]:
        room = self.get_room(code)
        if not room:
            return None
        room.receiver_connected = True
        room.status = "connected"
        return room

    def complete_room(self, code: str) -> Optional[Room]:
        room = self.get_room(code)
        if not room:
            return None
        room.status = "completed"
        return room

    def expire_room(self, normalized_code: str):
        room = self.rooms.pop(normalized_code, None)
        if room:
            room.status = "expired"
            delete_room_storage(room.code)

    def cleanup_expired(self) -> int:
        now = time.time() * 1000
        expired_keys = [k for k, r in self.rooms.items() if now >= r.expires_at]
        for k in expired_keys:
            self.expire_room(k)
        return len(expired_keys)

room_manager = RoomManager()
