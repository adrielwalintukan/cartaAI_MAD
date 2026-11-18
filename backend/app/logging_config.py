import logging.config


def setup_logging(level: str = "INFO") -> None:
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {"std": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"}},
            "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "std"}},
            "root": {"level": level.upper(), "handlers": ["console"]},
            # httpx mencatat URL penuh; tanpa token kita, tetapi tetap diredam.
            "loggers": {"httpx": {"level": "WARNING"}, "httpcore": {"level": "WARNING"}},
        }
    )
