import asyncio
import logging
from app.room_manager import room_manager
from app.security import upload_rate_limiter, code_guess_rate_limiter

logger = logging.getLogger("pigeon.cleanup")

async def cleanup_loop(interval_seconds: int = 30):
    """Background task to periodically purge expired rooms from memory & disk."""
    # Run initial cleanup immediately on server start to clean up any leftover files
    try:
        initial_purged = room_manager.cleanup_expired()
        upload_rate_limiter.prune()
        code_guess_rate_limiter.prune()
        if initial_purged > 0:
            logger.info(f"Startup cleanup purged {initial_purged} expired Pigeon room(s)")
    except Exception as e:
        logger.error(f"Error during initial cleanup: {e}")

    while True:
        try:
            await asyncio.sleep(interval_seconds)
            purged = room_manager.cleanup_expired()
            upload_rate_limiter.prune()
            code_guess_rate_limiter.prune()
            if purged > 0:
                logger.info(f"Purged {purged} expired Pigeon room(s)")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error during cleanup loop: {e}")
