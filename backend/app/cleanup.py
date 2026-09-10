import asyncio
import logging
from app.room_manager import room_manager

logger = logging.getLogger("pigeon.cleanup")

async def cleanup_loop(interval_seconds: int = 30):
    """Background task to periodically purge expired rooms from memory & disk."""
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            purged = room_manager.cleanup_expired()
            if purged > 0:
                logger.info(f"Purged {purged} expired Pigeon room(s)")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error during cleanup loop: {e}")
