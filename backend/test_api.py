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
    assert len(code) == 7  # XXXX-XX format
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

    print("\n[SUCCESS] ALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_full_lifecycle()