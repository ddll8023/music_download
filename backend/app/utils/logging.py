"""日志配置"""
import logging
from logging.handlers import RotatingFileHandler

from app.core.config import settings


def configure_logging():
    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(module)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = RotatingFileHandler(
        settings.log_file,
        maxBytes=settings.log_max_size,
        backupCount=settings.log_backup_count,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger()
    logger.setLevel(settings.log_level)

    logger.handlers = []
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
