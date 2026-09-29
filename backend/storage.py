"""Emergent Object Storage helper (managed integration).

The Expo app never talks to storage directly; it goes through our FastAPI
upload/download routes. The EMERGENT_LLM_KEY lives only in backend/.env.
"""
import os
import requests

def _storage_url():
    base = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
    return base.rstrip("/") + "/objstore/api/v1/storage"


STORAGE_URL = _storage_url()
APP_NAME = "elaya"

_storage_key = None


def init_storage():
    """Call once at startup. Idempotent - returns a reusable storage key."""
    global _storage_key, STORAGE_URL
    if _storage_key:
        return _storage_key
    STORAGE_URL = _storage_url()
    key = os.environ.get("EMERGENT_LLM_KEY")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": key}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 503:
        # stale key -> reset and retry once
        _reset_and_retry_put(path, data, content_type)
    resp.raise_for_status()
    return resp.json()


def _reset_and_retry_put(path: str, data: bytes, content_type: str) -> dict:
    global _storage_key
    _storage_key = None
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
