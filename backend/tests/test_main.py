import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_websocket_demo_mode():
    with client.websocket_connect("/ws?user_id=test&session_id=123&name=Wajahat&lang=English") as websocket:
        # Check welcome message
        data = websocket.receive_json()
        assert "Welcome" in data["text"] or "Hello" in data["text"]
        
        # Check first task signal
        data = websocket.receive_json()
        assert data["type"] == "show_task"
        assert data["data"] == "apple"

def test_emergency_need_mock():
    with client.websocket_connect("/ws?user_id=test&session_id=123") as websocket:
        websocket.receive_json() # welcome
        websocket.receive_json() # first task
        
        # Send emergency need
        websocket.send_json({"type": "emergency_need", "data": "Water"})
        
        # Receive acknowledgement
        data = websocket.receive_json()
        assert "Water" in data["text"]
