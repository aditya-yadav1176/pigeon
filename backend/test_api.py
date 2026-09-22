import asyncio
import io
from fastapi.testclient import TestClient
from app.main import app
from app.room_manager import room_manager

def test_full_lifecycle():
    client = TestClient(app)
    
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "app": "PIGEON"}
    print("[PASS] Health check passed")

    # 2. Upload actual file
    sample_content = b"%PDF-1.4\n1 0 obj\n<< /Title (Pigeon Test Notes) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    file_payload = ("DBMS_Notes.pdf", io.BytesIO(sample_content), "application/pdf")
    
    res = client.post("/api/rooms", files={"files": file_payload})
    assert res.status_code == 201, res.text
    room_data = res.json()
    code = room_data["code"]
    assert len(code) == 5  # 5-character format with no hyphen
    assert len(room_data["files"]) == 1
    file_id = room_data["files"][0]["id"]
    assert room_data["files"][0]["name"] == "DBMS_Notes.pdf"
    assert room_data["files"][0]["size"] == len(sample_content)
    print(f"[PASS] Room created with code: {code}, file ID: {file_id}")

    # 3. Status polling before connect
    res = client.get(f"/api/rooms/{code}/status")
    assert res.status_code == 200
    status_data = res.json()
    assert status_data["receiver_connected"] is False
    assert status_data["status"] == "waiting"
    print("[PASS] Status polling (waiting) passed")

    # 4. Receiver connects
    res = client.post(f"/api/rooms/{code}/connect")
    assert res.status_code == 200
    connect_data = res.json()
    assert connect_data["status"] == "connected"
    print("[PASS] Receiver connected successfully")

    # 5. Status polling after connect
    res = client.get(f"/api/rooms/{code}/status")
    assert res.status_code == 200
    status_data = res.json()
    assert status_data["receiver_connected"] is True
    assert status_data["status"] == "connected"
    print("[PASS] Status polling (connected) verified")

    # 6. Download file and verify byte equality
    res = client.get(f"/api/rooms/{code}/files/{file_id}")
    assert res.status_code == 200
    assert res.content == sample_content
    assert "DBMS_Notes.pdf" in res.headers.get("content-disposition", "")
    print("[PASS] File downloaded and verified identical byte-for-byte!")

    # 7. Invalid code returns 404
    res = client.get("/api/rooms/NONEXIST-99/status")
    assert res.status_code == 404
    print("[PASS] Invalid code returns 404")

    # 8. Text paste upload
    res = client.post("/api/rooms", data={"text": "https://google.com"})
    assert res.status_code == 201
    text_room = res.json()
    assert len(text_room["files"]) == 1
    assert text_room["files"][0]["name"] == "Shared Link.txt"
    text_file_id = text_room["files"][0]["id"]
    text_code = text_room["code"]
    
    # Download text file
    res = client.get(f"/api/rooms/{text_code}/files/{text_file_id}")
    assert res.status_code == 200
    assert res.content == b"https://google.com"
    print("[PASS] Text upload & download verified!")

    # 9. Multiple files upload (PDF + PPTX + Image)
    f1 = ("doc.pdf", io.BytesIO(b"PDF DATA 123"), "application/pdf")
    f2 = ("slides.pptx", io.BytesIO(b"PPTX DATA 456"), "application/vnd.ms-powerpoint")
    f3 = ("photo.png", io.BytesIO(b"PNG DATA 789"), "image/png")
    res = client.post("/api/rooms", files=[("files", f1), ("files", f2), ("files", f3)])
    assert res.status_code == 201
    multi_room = res.json()
    assert len(multi_room["files"]) == 3
    assert {f["name"] for f in multi_room["files"]} == {"doc.pdf", "slides.pptx", "photo.png"}
    print("[PASS] Multiple files upload (3 files) verified!")

    # 10. Transfer Session Duration Feature Tests
    import time
    now_ms = int(time.time() * 1000)

    # 10a. Default duration (600s)
    res = client.post("/api/rooms", data={"text": "Default duration test"})
    assert res.status_code == 201
    default_room = res.json()
    expected_default_ms = now_ms + (600 * 1000)
    assert abs(default_room["expires_at"] - expected_default_ms) < 3000, "Default TTL should be 600s"
    print("[PASS] Default room duration (600s / 10 min) verified")

    # 10b. 180s (3 minutes)
    res = client.post("/api/rooms", data={"text": "3 min test", "ttl_seconds": 180})
    assert res.status_code == 201
    room_180 = res.json()
    expected_180_ms = now_ms + (180 * 1000)
    assert abs(room_180["expires_at"] - expected_180_ms) < 3000, "TTL should be 180s"
    print("[PASS] 3-minute room duration (180s) verified")

    # 10c. 300s (5 minutes)
    res = client.post("/api/rooms", data={"text": "5 min test", "ttl_seconds": 300})
    assert res.status_code == 201
    room_300 = res.json()
    expected_300_ms = now_ms + (300 * 1000)
    assert abs(room_300["expires_at"] - expected_300_ms) < 3000, "TTL should be 300s"
    print("[PASS] 5-minute room duration (300s) verified")

    # 10d. 600s explicit (10 minutes)
    res = client.post("/api/rooms", data={"text": "10 min test", "ttl_seconds": 600})
    assert res.status_code == 201
    room_600 = res.json()
    expected_600_ms = now_ms + (600 * 1000)
    assert abs(room_600["expires_at"] - expected_600_ms) < 3000, "TTL should be 600s"
    print("[PASS] 10-minute room duration (600s) verified")

    # 10e. Invalid durations rejected with 400
    for invalid_ttl in [0, 60, 120, 240, 500, 999, -180]:
        res = client.post("/api/rooms", data={"text": "Invalid test", "ttl_seconds": invalid_ttl})
        assert res.status_code == 400, f"Expected 400 for ttl={invalid_ttl}, got {res.status_code}"
        assert "Invalid duration" in res.json()["detail"]
    print("[PASS] Invalid durations strictly rejected with 400 Bad Request")

    # 10f. Expiration is authoritative and not extended by connect or status check
    code_180 = room_180["code"]
    original_expires_at = room_180["expires_at"]
    res = client.post(f"/api/rooms/{code_180}/connect")
    assert res.status_code == 200
    status_res = client.get(f"/api/rooms/{code_180}/status")
    assert status_res.status_code == 200
    assert status_res.json()["expires_at"] == original_expires_at, "Connecting must NOT extend expiration!"
    print("[PASS] Expiry is strictly immutable and not extended by receiver actions")

    print("\n[SUCCESS] ALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_full_lifecycle()