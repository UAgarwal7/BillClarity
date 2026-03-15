import asyncio
import httpx
import json
import base64
import time

BASE_URL = "http://45.76.18.207/api"
TEST_PDF_PATH = "../Sample_ER_Bill.pdf"

async def run_tests():
    print(f"--- Starting End-to-End BillClarity Workflow Test on Vultr ---")
    print(f"Target: {BASE_URL}")

    async with httpx.AsyncClient(timeout=300.0) as client:
        # 1. Upload Bill
        print("\n1. Testing File Upload...")
        with open(TEST_PDF_PATH, "rb") as f:
            files = {"files": ("Sample_ER_Bill.pdf", f, "application/pdf")}
            resp = await client.post(f"{BASE_URL}/bills/upload", files=files)
            
        assert resp.status_code == 201, f"Upload failed: {resp.text}"
        upload_data = resp.json()
        bill_id = upload_data.get("bill_id")
        print(f"✓ Upload successful! bill_id: {bill_id}")

        # 2. Wait for Processing (Poll)
        print("\n2. Polling for 'completed' parse status...")
        status = "processing"
        for _ in range(12):  # 12 * 5s = 60s max wait
            resp = await client.get(f"{BASE_URL}/bills/{bill_id}")
            if resp.status_code == 200:
                bill_data = resp.json()
                status = bill_data.get("parsing_status", "unknown")
                print(f"  Status: {status}")
                if status == "completed":
                    break
                elif status == "failed":
                    print("✗ Pipeline processing failed!")
                    return
            await asyncio.sleep(5)
            
        assert status == "completed", "Processing timed out or failed!"
        print("✓ Bill parsed & processed successfully!")

        # 3. Fetch Line Items
        print("\n3. Testing Line Items Retrieval...")
        resp = await client.get(f"{BASE_URL}/bills/{bill_id}/line-items")
        assert resp.status_code == 200, f"Line items failed: {resp.text}"
        items = resp.json()
        print(f"✓ Retrieved {len(items)} line items.")

        # 4. Fetch Analysis (Errors, Benchmarks, Insights)
        print("\n4. Testing Analysis Endpoints...")
        resp = await client.get(f"{BASE_URL}/bills/{bill_id}/errors")
        assert resp.status_code in [200, 404], f"Errors failed with {resp.status_code}"
        print(f"✓ Errors checked.")
        
        resp = await client.get(f"{BASE_URL}/bills/{bill_id}/benchmarks")
        assert resp.status_code == 200, f"Benchmarks failed with {resp.status_code}"
        print(f"✓ Benchmarks retrieved.")

        # 5. Appeal Packet
        print("\n5. Testing Appeal Generation...")
        payload = {
            "sections": ["bill_explanation", "flagged_issues", "appeal_letter", "negotiation_script"]
        }
        # Correct path: /api/appeal-packets/bills/{bill_id}/appeal-packet/generate
        resp = await client.post(f"{BASE_URL}/appeal-packets/bills/{bill_id}/appeal-packet/generate", json=payload)
        assert resp.status_code == 201, f"Appeal gen failed: {resp.status_code} {resp.text}"
        packet_id = resp.json().get("packet_id")
        print(f"✓ Appeal packet generated: {packet_id}")

        # 6. Call Assistant & TTS
        print("\n6. Testing Call Assistant (Start Session)...")
        resp = await client.post(f"{BASE_URL}/calls/start", json={"bill_id": bill_id})
        assert resp.status_code == 201, f"Call start failed: {resp.text}"
        call_data = resp.json()
        call_id = call_data.get("call_id")
        strategy = call_data.get("strategy")
        audio_b64 = call_data.get("opening_audio_base64")
        
        print(f"✓ Call started: {call_id}")
        print(f"  Strategy length: {len(strategy)} chars")
        if audio_b64:
            audio_mb = len(audio_b64) / 1024 / 1024
            print(f"  ✓ ElevenLabs Base64 TTS Audio received! ({audio_mb:.2f} MB)")
        else:
            print("  ✗ Warning: No ElevenLabs audio generated!")

        print("\n7. Testing Call Assistant (End Session)...")
        resp = await client.post(f"{BASE_URL}/calls/{call_id}/end")
        assert resp.status_code == 200, "Call end failed"
        print(f"✓ Call ended. Outcome: {resp.json().get('outcome')}")

        print("\n--- ALL VULTR INTEGRATION TESTS PASSED! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
