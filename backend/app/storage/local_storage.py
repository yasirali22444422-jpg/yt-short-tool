import os
import shutil
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status

from app.config import settings


class StorageManager:
    @staticmethod
    def validate_file(file: UploadFile) -> None:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file has no filename.",
            )

        ext = Path(file.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed}",
            )

    @staticmethod
    async def save_uploaded_video(file: UploadFile) -> tuple[Path, int, str]:
        """
        Saves uploaded file to UPLOAD_TEMP_DIR with a unique filename.
        Returns (destination_path, file_size_in_bytes, unique_filename).
        Enforces MAX_FILE_SIZE_MB.
        """
        StorageManager.validate_file(file)

        ext = Path(file.filename).suffix.lower()
        unique_name = f"upload_{uuid.uuid4().hex[:12]}{ext}"
        destination = settings.UPLOAD_TEMP_DIR / unique_name

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        total_bytes = 0

        try:
            with open(destination, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        # Clean up partial file
                        buffer.close()
                        destination.unlink(missing_ok=True)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB.",
                        )
                    buffer.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            destination.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save video: {str(e)}",
            )

        return destination, total_bytes, unique_name

    @staticmethod
    def get_project_dir(project_id: str) -> Path:
        proj_dir = settings.PROJECTS_DIR / project_id
        proj_dir.mkdir(parents=True, exist_ok=True)
        return proj_dir

    @staticmethod
    def delete_project_dir(project_id: str) -> None:
        proj_dir = settings.PROJECTS_DIR / project_id
        if proj_dir.exists():
            shutil.rmtree(proj_dir, ignore_errors=True)

    @staticmethod
    def delete_file(file_path: str | Path) -> None:
        p = Path(file_path)
        if p.exists():
            p.unlink(missing_ok=True)


storage_manager = StorageManager()
