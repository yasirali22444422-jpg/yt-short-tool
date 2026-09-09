from cryptography.fernet import Fernet
from app.config import settings


def get_cipher() -> Fernet:
    key = settings.get_or_create_encryption_secret()
    return Fernet(key)


def encrypt_secret(plain_text: str) -> str:
    """Encrypts sensitive strings (e.g. API keys) server-side."""
    if not plain_text:
        return ""
    cipher = get_cipher()
    encrypted = cipher.encrypt(plain_text.encode("utf-8"))
    return encrypted.decode("utf-8")


def decrypt_secret(cipher_text: str) -> str:
    """Decrypts encrypted secret strings for backend API calls."""
    if not cipher_text:
        return ""
    cipher = get_cipher()
    decrypted = cipher.decrypt(cipher_text.encode("utf-8"))
    return decrypted.decode("utf-8")


def mask_secret(secret: str) -> str:
    """Masks secret keys for UI display, e.g. sk-••••••••••••1234."""
    if not secret:
        return ""
    if len(secret) <= 8:
        return "••••••••"
    prefix = secret[:3]
    suffix = secret[-4:]
    return f"{prefix}••••••••••••{suffix}"
