"""
logging_config.py — Logging estructurado JSON para Train-to-Hire.

En producción emite logs en formato JSON (una línea por evento).
En desarrollo emite logs legibles en consola con colores.

Para activar JSON: LOG_FORMAT=json en .env
"""

import logging
import json
import sys
import os
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Formatea cada log como una línea JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Agregar campos extra si existen
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = record.duration_ms
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False, default=str)


class DevFormatter(logging.Formatter):
    """Formato legible con colores para desarrollo."""

    COLORS = {
        "DEBUG": "\033[36m",     # cyan
        "INFO": "\033[32m",      # green
        "WARNING": "\033[33m",   # yellow
        "ERROR": "\033[31m",     # red
        "CRITICAL": "\033[35m",  # magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now().strftime("%H:%M:%S")
        base = f"{color}{timestamp} [{record.levelname:>7s}]{self.RESET} {record.name}: {record.getMessage()}"

        extras = []
        for attr in ("user_id", "method", "path", "status_code", "duration_ms"):
            if hasattr(record, attr):
                extras.append(f"{attr}={getattr(record, attr)}")
        if extras:
            base += f"  | {', '.join(extras)}"

        if record.exc_info and record.exc_info[0] is not None:
            base += "\n" + self.formatException(record.exc_info)

        return base


def setup_logging() -> None:
    """Configura el logging para toda la aplicación."""
    log_format = os.getenv("LOG_FORMAT", "dev")  # "json" o "dev"
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    root = logging.getLogger()
    root.setLevel(getattr(logging, log_level, logging.INFO))

    # Limpiar handlers existentes
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if log_format == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(DevFormatter())

    root.addHandler(handler)

    # Reducir ruido de librerías externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("passlib").setLevel(logging.WARNING)
