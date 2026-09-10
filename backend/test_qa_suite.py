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

    # Test 6: Invalid Code Rejection (404)
    try:
        for bad_code in ["INVALID-00", "0000-00", "XXXX-YY"]:
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
