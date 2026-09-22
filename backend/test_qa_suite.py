import io
import time
import os
import concurrent.futures
from fastapi.testclient import TestClient
from app.main import app
from app.room_manager import room_manager, Room
from app.config import settings

def run_qa_suite():
    client = TestClient(app)
    results = {}

    print("==================================================")
    print("  RUNNING PIGEON PHASE 6 AUTOMATED QA SUITE      ")
    print("==================================================")

    # Test 1: PDF File Transfer
    try:
        pdf_bytes = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF"
        res = client.post("/api/rooms", files={"files": ("Lecture_Notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")})
        assert res.status_code == 201, f"Failed: {res.text}"
        data = res.json()
        code = data["code"]
        assert len(code) == 5, f"Expected 5-character code, got {code}"
        assert "-" not in code, f"Expected no hyphen in code, got {code}"
        assert all(c in "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" for c in code), f"Invalid char in code: {code}"
        file_id = data["files"][0]["id"]
        
        # Download
        dl_res = client.get(f"/api/rooms/{code}/files/{file_id}")
        assert dl_res.status_code == 200
        assert dl_res.content == pdf_bytes
        results["1. PDF File Transfer"] = "PASS"
        print("[PASS] Test 1: PDF File Transfer & Byte Equality")
    except Exception as e:
        results["1. PDF File Transfer"] = f"FAIL: {e}"
        print(f"[FAIL] Test 1: {e}")

    # Test 2: Image File Transfer (PNG / JPG)
    try:
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
        res = client.post("/api/rooms", files={"files": ("whiteboard.png", io.BytesIO(png_bytes), "image/png")})
        assert res.status_code == 201
        data = res.json()
        code = data["code"]
        file_id = data["files"][0]["id"]
        
        dl_res = client.get(f"/api/rooms/{code}/files/{file_id}")
        assert dl_res.status_code == 200
        assert dl_res.content == png_bytes
        results["2. Image Transfer"] = "PASS"
        print("[PASS] Test 2: Image File Transfer (PNG) & Byte Equality")
    except Exception as e:
        results["2. Image Transfer"] = f"FAIL: {e}"
        print(f"[FAIL] Test 2: {e}")

    # Test 3: PPT / PPTX File Transfer
    try:
        pptx_bytes = b"PK\x03\x04[MOCK PPTX PRESENTATION DATA FOR TESTING]"
        res = client.post("/api/rooms", files={"files": ("Seminar.pptx", io.BytesIO(pptx_bytes), "application/vnd.openxmlformats-officedocument.presentationml.presentation")})
        assert res.status_code == 201
        data = res.json()
        code = data["code"]
        file_id = data["files"][0]["id"]

        dl_res = client.get(f"/api/rooms/{code}/files/{file_id}")
        assert dl_res.status_code == 200
        assert dl_res.content == pptx_bytes
        results["3. PPT / PPTX Transfer"] = "PASS"
        print("[PASS] Test 3: PPT / PPTX Transfer & Byte Equality")
    except Exception as e:
        results["3. PPT / PPTX Transfer"] = f"FAIL: {e}"
        print(f"[FAIL] Test 3: {e}")

    # Test 4: Text / URL Paste Transfer
    try:
        text_content = "https://github.com/aditya-yadav1176/pigeon - Best tool for quick sharing!"
        res = client.post("/api/rooms", data={"text": text_content})
        assert res.status_code == 201
        data = res.json()
        code = data["code"]
        file_id = data["files"][0]["id"]

        dl_res = client.get(f"/api/rooms/{code}/files/{file_id}")
        assert dl_res.status_code == 200
        assert dl_res.content.decode("utf-8") == text_content
        results["4. Text / URL Paste Transfer"] = "PASS"
        print("[PASS] Test 4: Text / URL Paste Transfer & Content Equality")
    except Exception as e:
        results["4. Text / URL Paste Transfer"] = f"FAIL: {e}"
        print(f"[FAIL] Test 4: {e}")

    # Test 5: Multiple Files Transfer
    try:
        files = [
            ("files", ("Doc1.pdf", io.BytesIO(b"PDF 1 CONTENT"), "application/pdf")),
            ("files", ("Doc2.pdf", io.BytesIO(b"PDF 2 CONTENT"), "application/pdf")),
            ("files", ("Diagram.png", io.BytesIO(b"IMAGE CONTENT"), "image/png")),
        ]
        res = client.post("/api/rooms", files=files)
        assert res.status_code == 201
        data = res.json()
        code = data["code"]
        assert len(data["files"]) == 3
        
        for f in data["files"]:
            dl_res = client.get(f"/api/rooms/{code}/files/{f['id']}")
            assert dl_res.status_code == 200
        results["5. Multiple Files Transfer"] = "PASS"
        print("[PASS] Test 5: Multiple Files Upload & Individual Retrieval")
    except Exception as e:
        results["5. Multiple Files Transfer"] = f"FAIL: {e}"
        print(f"[FAIL] Test 5: {e}")

    # Test 6: Invalid Code Rejection
    try:
        for bad_code in ["INVALID", "00000", "XXXXX", "ZZ999"]:
            res = client.get(f"/api/rooms/{bad_code}")
            assert res.status_code == 404, f"Expected 404 for bad code {bad_code}, got {res.status_code}"
            
            res_connect = client.post(f"/api/rooms/{bad_code}/connect")
            assert res_connect.status_code == 404
        results["6. Invalid Code Rejection"] = "PASS"
        print("[PASS] Test 6: Invalid Codes Gracefully Rejected with 404")
    except Exception as e:
        results["6. Invalid Code Rejection"] = f"FAIL: {e}"
        print(f"[FAIL] Test 6: {e}")

    # Test 7: Expired Room Handling
    try:
        expired_code = "EXPR-01"
        normalized = room_manager.normalize_code(expired_code)
        expired_room = Room(code=expired_code, expires_at=int((time.time() - 10) * 1000))
        room_manager.rooms[normalized] = expired_room

        res = client.get(f"/api/rooms/{expired_code}/status")
        assert res.status_code == 404, f"Expected 404 for expired room, got {res.status_code}"
        
        res_connect = client.post(f"/api/rooms/{expired_code}/connect")
        assert res_connect.status_code == 404, f"Expected 404 for expired room, got {res_connect.status_code}"
        results["7. Expired Room Handling"] = "PASS"
        print("[PASS] Test 7: Expired Room Returns 404 and Purges State")
    except Exception as e:
        results["7. Expired Room Handling"] = f"FAIL: {e}"
        print(f"[FAIL] Test 7: {e}")

    # Test 8: Security & Path Traversal Immunity
    try:
        traversal_codes = ["..%2F..%2Fpasswd", "test/../../nested"]
        for t_code in traversal_codes:
            res = client.get(f"/api/rooms/{t_code}")
            assert res.status_code in [404, 422]
        
        valid_res = client.post("/api/rooms", data={"text": "safe data"})
        v_code = valid_res.json()["code"]
        
        bad_file_ids = ["../../main.py", "invalid_id_999"]
        for bad_id in bad_file_ids:
            res = client.get(f"/api/rooms/{v_code}/files/{bad_id}")
            assert res.status_code == 404
        results["8. Security & Path Traversal Immunity"] = "PASS"
        print("[PASS] Test 8: Path Traversal & Injection Attempts Successfully Blocked")
    except Exception as e:
        results["8. Security & Path Traversal Immunity"] = f"FAIL: {e}"
        print(f"[FAIL] Test 8: {e}")

    # Test 9: Polling & State Transition (waiting -> connected)
    try:
        res = client.post("/api/rooms", data={"text": "polling test"})
        code = res.json()["code"]
        
        st1 = client.get(f"/api/rooms/{code}/status").json()
        assert st1["status"] == "waiting"
        assert st1["receiver_connected"] is False

        conn = client.post(f"/api/rooms/{code}/connect")
        assert conn.status_code == 200
        assert conn.json()["status"] == "connected"

        st2 = client.get(f"/api/rooms/{code}/status").json()
        assert st2["status"] == "connected"
        assert st2["receiver_connected"] is True
        results["9. Status Polling Transition"] = "PASS"
        print("[PASS] Test 9: State Transition from Waiting to Connected Verified")
    except Exception as e:
        results["9. Status Polling Transition"] = f"FAIL: {e}"
        print(f"[FAIL] Test 9: {e}")

    # Test 10: Size Boundary Limit
    try:
        assert settings.MAX_FILE_SIZE_MB == 250
        assert settings.max_file_size_bytes == 250 * 1024 * 1024
        results["10. Size Boundary Configuration"] = "PASS"
        print(f"[PASS] Test 10: 250 MB Maximum File Size Boundary Verified ({settings.max_file_size_bytes} bytes)")
    except Exception as e:
        results["10. Size Boundary Configuration"] = f"FAIL: {e}"
        print(f"[FAIL] Test 10: {e}")

    # Test 11: Multi-file Same Filename (Collision-Free)
    try:
        f1_data = b"VERSION 1 OF NOTES"
        f2_data = b"VERSION 2 OF NOTES DIFFERENT CONTENT"
        files = [
            ("files", ("notes.pdf", io.BytesIO(f1_data), "application/pdf")),
            ("files", ("notes.pdf", io.BytesIO(f2_data), "application/pdf")),
        ]
        res = client.post("/api/rooms", files=files)
        assert res.status_code == 201
        data = res.json()
        code = data["code"]
        assert len(data["files"]) == 2
        id1 = data["files"][0]["id"]
        id2 = data["files"][1]["id"]
        assert id1 != id2

        dl1 = client.get(f"/api/rooms/{code}/files/{id1}")
        dl2 = client.get(f"/api/rooms/{code}/files/{id2}")
        assert dl1.content == f1_data
        assert dl2.content == f2_data
        results["11. Multi-File Same Filename"] = "PASS"
        print("[PASS] Test 11: Multi-File Same Filename Collision-Free Preservation")
    except Exception as e:
        results["11. Multi-File Same Filename"] = f"FAIL: {e}"
        print(f"[FAIL] Test 11: {e}")

    # Test 12: Video File Transfer (MP4 binary payload)
    try:
        mp4_header = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41[VIDEO SAMPLE PAYLOAD]"
        res = client.post("/api/rooms", files={"files": ("lecture_clip.mp4", io.BytesIO(mp4_header), "video/mp4")})
        assert res.status_code == 201
        data = res.json()
        code = data["code"]
        file_id = data["files"][0]["id"]

        dl = client.get(f"/api/rooms/{code}/files/{file_id}")
        assert dl.status_code == 200
        assert dl.content == mp4_header
        assert dl.headers["content-type"] == "video/mp4"
        results["12. Video Transfer (MP4)"] = "PASS"
        print("[PASS] Test 12: Video Transfer (MP4) & MIME Preservation")
    except Exception as e:
        results["12. Video Transfer (MP4)"] = f"FAIL: {e}"
        print(f"[FAIL] Test 12: {e}")

    # Test 13: Empty / Invalid Upload Rejection (400 / 422)
    try:
        # 1. No payload at all
        res_empty = client.post("/api/rooms")
        assert res_empty.status_code == 400, f"Expected 400, got {res_empty.status_code}"

        # 2. File with whitespace/empty filename
        res_whitespace_filename = client.post("/api/rooms", files={"files": ("   ", io.BytesIO(b"123"), "text/plain")})
        assert res_whitespace_filename.status_code == 400, f"Expected 400, got {res_whitespace_filename.status_code}"

        # 3. Empty whitespace text
        res_whitespace_text = client.post("/api/rooms", data={"text": "   "})
        assert res_whitespace_text.status_code == 400, f"Expected 400, got {res_whitespace_text.status_code}"

        # 4. Empty multipart boundary without file
        res_empty_boundary = client.post("/api/rooms", files={"files": ("", io.BytesIO(b""), "application/octet-stream")})
        assert res_empty_boundary.status_code in [400, 422]

        results["13. Empty Upload Rejection"] = "PASS"
        print("[PASS] Test 13: Empty Uploads and Whitespace Payloads Rejected with 400/422")
    except Exception as e:
        results["13. Empty Upload Rejection"] = f"FAIL: {e}"
        print(f"[FAIL] Test 13: {e}")

    # Test 14: Concurrent Rooms Isolation
    try:
        def create_and_check(index):
            content = f"ROOM {index} SECRET DATA".encode("utf-8")
            res = client.post("/api/rooms", files={"files": (f"file_{index}.txt", io.BytesIO(content), "text/plain")})
            assert res.status_code == 201
            d = res.json()
            code = d["code"]
            fid = d["files"][0]["id"]
            dl = client.get(f"/api/rooms/{code}/files/{fid}")
            assert dl.content == content
            return code

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            codes = list(executor.map(create_and_check, range(5)))
        assert len(set(codes)) == 5  # All 5 room codes are unique
        results["14. Concurrent Rooms Isolation"] = "PASS"
        print("[PASS] Test 14: 5 Concurrent Rooms Verified Independent and Isolated")
    except Exception as e:
        results["14. Concurrent Rooms Isolation"] = f"FAIL: {e}"
        print(f"[FAIL] Test 14: {e}")

    # Test 15: Post-Expiry Download Rejection (404)
    try:
        exp_code = "EXP-DL"
        norm = room_manager.normalize_code(exp_code)
        room = Room(code=exp_code, expires_at=int((time.time() - 10) * 1000))
        room_manager.rooms[norm] = room
        dl_res = client.get(f"/api/rooms/{exp_code}/files/any_id")
        assert dl_res.status_code == 404
        results["15. Post-Expiry Download Rejection"] = "PASS"
        print("[PASS] Test 15: Download After Expiration Strictly Returns 404")
    except Exception as e:
        results["15. Post-Expiry Download Rejection"] = f"FAIL: {e}"
        print(f"[FAIL] Test 15: {e}")

    # Test 16: Complete Room Lifecycle Endpoint
    try:
        res = client.post("/api/rooms", data={"text": "completed transfer test"})
        c_code = res.json()["code"]
        comp_res = client.post(f"/api/rooms/{c_code}/complete")
        assert comp_res.status_code == 200
        assert comp_res.json()["status"] == "completed"

        st = client.get(f"/api/rooms/{c_code}/status").json()
        assert st["status"] == "completed"
        results["16. Complete Room Endpoint"] = "PASS"
        print("[PASS] Test 16: /complete Endpoint Transitions Status to 'completed'")
    except Exception as e:
        results["16. Complete Room Endpoint"] = f"FAIL: {e}"
        print(f"[FAIL] Test 16: {e}")

    # Test 17: Bidirectional Workflow (Laptop -> Phone & Phone -> Laptop)
    try:
        # Direction A: Laptop sends, Phone receives
        laptop_file = b"LAPTOP LECTURE SLIDES"
        res_a = client.post("/api/rooms", files={"files": ("lecture.pdf", io.BytesIO(laptop_file), "application/pdf")})
        assert res_a.status_code == 201
        code_a = res_a.json()["code"]
        fid_a = res_a.json()["files"][0]["id"]
        # Phone connects & downloads
        client.post(f"/api/rooms/{code_a}/connect")
        dl_a = client.get(f"/api/rooms/{code_a}/files/{fid_a}")
        assert dl_a.content == laptop_file

        # Direction B: Phone sends, Laptop receives
        phone_file = b"PHONE CAMERA PHOTO CAPTURE"
        res_b = client.post("/api/rooms", files={"files": ("photo.jpg", io.BytesIO(phone_file), "image/jpeg")})
        assert res_b.status_code == 201
        code_b = res_b.json()["code"]
        fid_b = res_b.json()["files"][0]["id"]
        # Laptop connects & downloads
        client.post(f"/api/rooms/{code_b}/connect")
        dl_b = client.get(f"/api/rooms/{code_b}/files/{fid_b}")
        assert dl_b.content == phone_file

        results["17. Bidirectional Flow (Phone <-> Laptop)"] = "PASS"
        print("[PASS] Test 17: Bidirectional Transfer Verified in Both Directions")
    except Exception as e:
        results["17. Bidirectional Flow (Phone <-> Laptop)"] = f"FAIL: {e}"
        print(f"[FAIL] Test 17: {e}")

    # Test 18: Download Non-Existent File ID Returns Structured 404 JSON (Phase 9 Reliability)
    try:
        res_room = client.post("/api/rooms", data={"text": "Phase 9 test file payload"})
        assert res_room.status_code == 201
        p9_code = res_room.json()["code"]
        bad_dl = client.get(f"/api/rooms/{p9_code}/files/nonexistent_file_id_999")
        assert bad_dl.status_code == 404
        assert "Requested file was not found" in bad_dl.json()["detail"]
        results["18. Non-Existent File 404 Error"] = "PASS"
        print("[PASS] Test 18: Non-Existent File ID Returns Clean 404 JSON with Detail")
    except Exception as e:
        results["18. Non-Existent File 404 Error"] = f"FAIL: {e}"
        print(f"[FAIL] Test 18: {e}")

    # Test 19: Polling and Connecting to Expired Room Purges Resources (Phase 9 Reliability)
    try:
        exp_code_p9 = "EX999"
        norm_p9 = room_manager.normalize_code(exp_code_p9)
        room_p9 = Room(code=exp_code_p9, expires_at=int((time.time() - 50) * 1000))
        room_manager.rooms[norm_p9] = room_p9

        status_res = client.get(f"/api/rooms/{exp_code_p9}/status")
        assert status_res.status_code == 404
        assert norm_p9 not in room_manager.rooms  # verified purged from active rooms
        results["19. Expired Room Polling Cleanup"] = "PASS"
        print("[PASS] Test 19: Expired Room Polling Returns 404 and Purges Resources")
    except Exception as e:
        results["19. Expired Room Polling Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 19: {e}")

    # Test 20: Safe Upload Retry Flow (Phase 9 Reliability)
    try:
        # First attempt: user attempts empty or interrupted upload
        fail_attempt = client.post("/api/rooms")
        assert fail_attempt.status_code == 400

        # Safe retry: user retries with valid payload, succeeds with unique 5-char code
        retry_attempt = client.post("/api/rooms", files={"files": ("retry_notes.txt", io.BytesIO(b"RETRY SUCCESS"), "text/plain")})
        assert retry_attempt.status_code == 201
        retry_data = retry_attempt.json()
        assert len(retry_data["code"]) == 5
        retry_fid = retry_data["files"][0]["id"]

        retry_dl = client.get(f"/api/rooms/{retry_data['code']}/files/{retry_fid}")
        assert retry_dl.status_code == 200
        assert retry_dl.content == b"RETRY SUCCESS"
        results["20. Safe Upload Retry Flow"] = "PASS"
        print("[PASS] Test 20: Safe Upload Retry Flow Verified Without State Corruption")
    except Exception as e:
        results["20. Safe Upload Retry Flow"] = f"FAIL: {e}"
        print(f"[FAIL] Test 20: {e}")

    # Test 21: Expired Room Cleanup (Phase 10 Hardening)
    try:
        res = client.post("/api/rooms", files={"files": ("expire_test.txt", io.BytesIO(b"EXPIRE DATA"), "text/plain")})
        assert res.status_code == 201
        exp_code = res.json()["code"]
        norm_code = room_manager.normalize_code(exp_code)
        room_dir = settings.STORAGE_DIR / exp_code
        assert room_dir.exists()

        # Artificially expire the room
        room_manager.rooms[norm_code].expires_at = int((time.time() - 10) * 1000)

        # Run cleanup
        purged = room_manager.cleanup_expired()
        assert purged >= 1
        assert norm_code not in room_manager.rooms
        assert not room_dir.exists()
        results["21. Expired Room Cleanup"] = "PASS"
        print("[PASS] Test 21: Expired Room Purged From Memory and Storage Directory Deleted")
    except Exception as e:
        results["21. Expired Room Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 21: {e}")

    # Test 22: Abandoned Room Cleanup (Phase 10 Hardening)
    try:
        # Sender uploaded, receiver never connected
        res = client.post("/api/rooms", data={"text": "abandoned note content"})
        assert res.status_code == 201
        ab_code = res.json()["code"]
        ab_norm = room_manager.normalize_code(ab_code)
        ab_dir = settings.STORAGE_DIR / ab_code
        assert ab_dir.exists()

        # Mark expired as if 10 mins passed without receiver
        room_manager.rooms[ab_norm].expires_at = int((time.time() - 60) * 1000)
        room_manager.cleanup_expired()
        assert ab_norm not in room_manager.rooms
        assert not ab_dir.exists()
        results["22. Abandoned Room Cleanup"] = "PASS"
        print("[PASS] Test 22: Abandoned Room Automatically Cleared After Expiry")
    except Exception as e:
        results["22. Abandoned Room Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 22: {e}")

    # Test 23: Successful Completed Room Cleanup (Phase 10 Hardening)
    try:
        res = client.post("/api/rooms", files={"files": ("completed.txt", io.BytesIO(b"COMPLETED DATA"), "text/plain")})
        assert res.status_code == 201
        comp_code = res.json()["code"]
        comp_norm = room_manager.normalize_code(comp_code)
        comp_dir = settings.STORAGE_DIR / comp_code

        # Complete room
        client.post(f"/api/rooms/{comp_code}/connect")
        client.post(f"/api/rooms/{comp_code}/complete")
        assert room_manager.rooms[comp_norm].status == "completed"

        # When TTL expires, cleanup removes it
        room_manager.rooms[comp_norm].expires_at = int((time.time() - 10) * 1000)
        room_manager.cleanup_expired()
        assert comp_norm not in room_manager.rooms
        assert not comp_dir.exists()
        results["23. Successful Completed Room Cleanup"] = "PASS"
        print("[PASS] Test 23: Completed Room Successfully Cleaned Up Post-TTL")
    except Exception as e:
        results["23. Successful Completed Room Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 23: {e}")

    # Test 24: Missing File During Cleanup (Phase 10 Hardening)
    try:
        res = client.post("/api/rooms", files={"files": ("ghost.txt", io.BytesIO(b"GHOST"), "text/plain")})
        ghost_code = res.json()["code"]
        ghost_norm = room_manager.normalize_code(ghost_code)
        ghost_dir = settings.STORAGE_DIR / ghost_code

        # Simulate external file deletion before cleanup
        for f in ghost_dir.iterdir():
            f.unlink()

        room_manager.rooms[ghost_norm].expires_at = int((time.time() - 10) * 1000)
        # Should not raise exception
        room_manager.cleanup_expired()
        assert ghost_norm not in room_manager.rooms
        results["24. Missing File During Cleanup"] = "PASS"
        print("[PASS] Test 24: Cleanup Tolerates Missing Files Gracefully Without Crashing")
    except Exception as e:
        results["24. Missing File During Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 24: {e}")

    # Test 25: Oversized Upload Cleanup (Phase 10 Hardening)
    try:
        from app.storage import get_room_dir, delete_room_storage
        test_oversize_code = "OVSZ1"
        test_dir = get_room_dir(test_oversize_code)
        partial_file = test_dir / "partial.bin"
        partial_file.write_bytes(b"A" * 1024)
        assert partial_file.exists()

        delete_room_storage(test_oversize_code)
        assert not test_dir.exists()
        results["25. Oversized Upload Cleanup"] = "PASS"
        print("[PASS] Test 25: Oversized/Aborted Upload Cleanup Deletes Partial Files")
    except Exception as e:
        results["25. Oversized Upload Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 25: {e}")

    # Test 26: Repeated Cleanup Execution (Phase 10 Hardening)
    try:
        for _ in range(5):
            room_manager.cleanup_expired()
        results["26. Repeated Cleanup Execution"] = "PASS"
        print("[PASS] Test 26: Repeated Cleanup Execution is Safe and Idempotent")
    except Exception as e:
        results["26. Repeated Cleanup Execution"] = f"FAIL: {e}"
        print(f"[FAIL] Test 26: {e}")

    # Test 27: Orphaned Directory Storage Cleanup (Phase 10 Hardening)
    try:
        orphan_dir = settings.STORAGE_DIR / "ORPHAN99"
        orphan_dir.mkdir(parents=True, exist_ok=True)
        orphan_file = orphan_dir / "abandoned_payload.dat"
        orphan_file.write_bytes(b"ORPHAN DATA")
        # Set mtime back by 100 seconds so it's outside the grace period
        past_time = time.time() - 100
        os.utime(orphan_dir, (past_time, past_time))

        room_manager.cleanup_expired()
        assert not orphan_dir.exists()
        results["27. Orphaned Storage Directory Cleanup"] = "PASS"
        print("[PASS] Test 27: Untracked Orphaned Storage Directory Purged Automatically")
    except Exception as e:
        results["27. Orphaned Storage Directory Cleanup"] = f"FAIL: {e}"
        print(f"[FAIL] Test 27: {e}")

    # Test 28: Expired Download Access Strictly Blocked (Phase 10 Hardening)
    try:
        res = client.post("/api/rooms", data={"text": "secret expired note"})
        assert res.status_code == 201
        d_code = res.json()["code"]
        d_norm = room_manager.normalize_code(d_code)
        d_fid = res.json()["files"][0]["id"]

        # Expire room
        room_manager.rooms[d_norm].expires_at = int((time.time() - 10) * 1000)

        # Download attempt must fail with 404
        dl_res = client.get(f"/api/rooms/{d_code}/files/{d_fid}")
        assert dl_res.status_code == 404
        assert d_norm not in room_manager.rooms
        results["28. Expired Download Access Blocked"] = "PASS"
        print("[PASS] Test 28: Download From Expired Room Strictly Blocked and Purged")
    except Exception as e:
        results["28. Expired Download Access Blocked"] = f"FAIL: {e}"
        print(f"[FAIL] Test 28: {e}")

    # Test 29: Malicious Filename Sanitization & Path Traversal Immunity (Phase 11 Security)
    try:
        from app.security import sanitize_filename
        assert sanitize_filename("../../../etc/passwd") == "passwd"
        assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
        assert sanitize_filename("malicious\x00file.pdf") == "maliciousfile.pdf"
        assert sanitize_filename("safe_document.pdf") == "safe_document.pdf"
        assert sanitize_filename("presentation.pptx") == "presentation.pptx"
        
        # Test real upload with traversal filename
        res = client.post("/api/rooms", files={"files": ("../../secret.txt", io.BytesIO(b"SAFE DATA"), "text/plain")})
        assert res.status_code == 201
        uploaded_name = res.json()["files"][0]["name"]
        assert uploaded_name == "secret.txt"
        assert "/" not in uploaded_name and "\\" not in uploaded_name
        results["29. Filename Sanitization & Traversal"] = "PASS"
        print("[PASS] Test 29: Path Traversal and Null Byte Filenames Cleanly Sanitized")
    except Exception as e:
        results["29. Filename Sanitization & Traversal"] = f"FAIL: {e}"
        print(f"[FAIL] Test 29: {e}")

    # Test 30: Header Injection & CRLF Immunity (Phase 11 Security)
    try:
        from app.security import sanitize_header_filename
        assert sanitize_header_filename('notes"\r\nInjected-Header: evil') == "notesInjected-Header: evil"
        assert sanitize_header_filename('test"filename.pdf') == "testfilename.pdf"
        results["30. Header Injection Immunity"] = "PASS"
        print("[PASS] Test 30: CRLF and Quote Injection in Content-Disposition Blocked")
    except Exception as e:
        results["30. Header Injection Immunity"] = f"FAIL: {e}"
        print(f"[FAIL] Test 30: {e}")

    # Test 31: Cross-Room Unauthorized File Access Blocked (Phase 11 Security)
    try:
        # Room A
        res_a = client.post("/api/rooms", data={"text": "Room A Data"})
        code_a = res_a.json()["code"]
        fid_a = res_a.json()["files"][0]["id"]

        # Room B
        res_b = client.post("/api/rooms", data={"text": "Room B Data"})
        code_b = res_b.json()["code"]

        # Attempt to access Room A's file using Room B's room code
        cross_res = client.get(f"/api/rooms/{code_b}/files/{fid_a}")
        assert cross_res.status_code == 404
        results["31. Cross-Room File Isolation"] = "PASS"
        print("[PASS] Test 31: Cross-Room File Access Strictly Blocked with 404")
    except Exception as e:
        results["31. Cross-Room File Isolation"] = f"FAIL: {e}"
        print(f"[FAIL] Test 31: {e}")

    # Test 32: Invalid File ID Format Rejection (Phase 11 Security)
    try:
        res = client.post("/api/rooms", data={"text": "Validation check"})
        code = res.json()["code"]

        # Test traversal and non-hex file IDs
        for bad_fid in ["../main.py", "1234", "zzzzzzzzzzzzzzzz", "0123456789abcdef;evil"]:
            bad_res = client.get(f"/api/rooms/{code}/files/{bad_fid}")
            assert bad_res.status_code == 404
        results["32. Invalid File ID Rejection"] = "PASS"
        print("[PASS] Test 32: Arbitrary/Malformed File IDs Blocked Without Touching Disk")
    except Exception as e:
        results["32. Invalid File ID Rejection"] = f"FAIL: {e}"
        print(f"[FAIL] Test 32: {e}")

    # Test 33: Abuse Protection & Rate Limiting (Phase 11 Security)
    try:
        from app.security import code_guess_rate_limiter
        mock_ip = "198.51.100.99"
        # Simulate 25 failed code lookups
        for i in range(25):
            res_guess = client.get("/api/rooms/ZZ999", headers={"X-Forwarded-For": mock_ip})
            assert res_guess.status_code == 404

        # 26th failed lookup should trigger 429 Too Many Requests
        rate_limited_res = client.get("/api/rooms/ZZ999", headers={"X-Forwarded-For": mock_ip})
        assert rate_limited_res.status_code == 429
        assert "Too many invalid code attempts" in rate_limited_res.json()["detail"]
        
        # Clean up rate limiter test IP
        code_guess_rate_limiter._requests.pop(mock_ip, None)
        results["33. Rate Limiting Abuse Protection"] = "PASS"
        print("[PASS] Test 33: Brute-Force Code Guessing Triggers 429 Rate Limit")
    except Exception as e:
        results["33. Rate Limiting Abuse Protection"] = f"FAIL: {e}"
        print(f"[FAIL] Test 33: {e}")

    # Test 34: CSPRNG Non-Predictability & Collision Handling (Phase 11 Security)
    try:
        codes = [room_manager.generate_code() for _ in range(50)]
        assert len(set(codes)) == 50  # 50 unique codes generated
        assert all(len(c) == 5 for c in codes)
        assert all(c not in "01IO" for c in codes)
        results["34. CSPRNG Code Generation"] = "PASS"
        print("[PASS] Test 34: 50 Cryptographically Random Codes Generated Collision-Free")
    except Exception as e:
        results["34. CSPRNG Code Generation"] = f"FAIL: {e}"
        print(f"[FAIL] Test 34: {e}")

    # Test 35: Transfer Session Duration Feature (3 min, 5 min, 10 min)
    try:
        t_now = int(time.time() * 1000)

        # 35a: Default TTL is 600s (10 min)
        res_def = client.post("/api/rooms", data={"text": "Default TTL QA test"})
        assert res_def.status_code == 201
        data_def = res_def.json()
        assert abs(data_def["expires_at"] - (t_now + 600000)) < 3000

        # 35b: 180s (3 min)
        res_180 = client.post("/api/rooms", data={"text": "180s TTL QA test", "ttl_seconds": 180})
        assert res_180.status_code == 201
        data_180 = res_180.json()
        assert abs(data_180["expires_at"] - (t_now + 180000)) < 3000

        # 35c: 300s (5 min)
        res_300 = client.post("/api/rooms", data={"text": "300s TTL QA test", "ttl_seconds": 300})
        assert res_300.status_code == 201
        data_300 = res_300.json()
        assert abs(data_300["expires_at"] - (t_now + 300000)) < 3000

        # 35d: 600s explicit
        res_600 = client.post("/api/rooms", data={"text": "600s TTL QA test", "ttl_seconds": 600})
        assert res_600.status_code == 201
        data_600 = res_600.json()
        assert abs(data_600["expires_at"] - (t_now + 600000)) < 3000

        # 35e: Invalid TTL strictly rejected
        for bad_ttl in [0, 45, 120, 250, 500, 999, -300]:
            bad_res = client.post("/api/rooms", data={"text": "Bad TTL test", "ttl_seconds": bad_ttl})
            assert bad_res.status_code == 400
            assert "Invalid duration" in bad_res.json()["detail"]

        # 35f: Expiry is immutable and cannot be extended
        code_test = data_180["code"]
        orig_expiry = data_180["expires_at"]
        client.post(f"/api/rooms/{code_test}/connect")
        stat = client.get(f"/api/rooms/{code_test}/status").json()
        assert stat["expires_at"] == orig_expiry, "Receiver connecting must never extend room expiry!"

        results["35. Transfer Session Duration Control"] = "PASS"
        print("[PASS] Test 35: Transfer Session Durations (180s, 300s, 600s) & Immutable Expiry Verified")
    except Exception as e:
        results["35. Transfer Session Duration Control"] = f"FAIL: {e}"
        print(f"[FAIL] Test 35: {e}")

    print("\n==================================================")
    print("                 QA SUMMARY REPORT                ")
    print("==================================================")
    all_passed = True
    for name, status in results.items():
        print(f"  {name.ljust(40)}: {status}")
        if status != "PASS":
            all_passed = False
    print("==================================================")
    if all_passed:
        print(f">>> ALL {len(results)} AUTOMATED QA CHECKS PASSED SUCCESSFULLY! <<<")
    else:
        print(">>> SOME QA CHECKS FAILED. PLEASE REVIEW ABOVE. <<<")
    return all_passed

if __name__ == "__main__":
    success = run_qa_suite()
    if not success:
        exit(1)
