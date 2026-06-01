import os
import asyncio
from datetime import datetime, timedelta, timezone
import motor.motor_asyncio
from beanie import init_beanie
from core.config import settings
from models.applicant import Applicant
from models.job import Job
from models.chat_session import ChatSession
from models.interview_slot import InterviewSlot
from models.notification import Notification

client: motor.motor_asyncio.AsyncIOMotorClient = None
_db_ready = False


def _generate_default_slots():
    """Generate interview slots for the next 5 weekdays dynamically."""
    slots = []
    times = ["10:00 AM", "2:00 PM", "11:00 AM", "3:00 PM", "10:00 AM"]
    today = datetime.now(timezone.utc).date()
    day = today + timedelta(days=1)
    count = 0
    while count < 5:
        if day.weekday() < 5:
            label = day.strftime("%a, %b %d")
            slots.append({"day": label, "time": times[count]})
            count += 1
        day += timedelta(days=1)
    return slots


async def connect_db(max_retries=3):
    global client, _db_ready
    
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[DB] Connection attempt {attempt}/{max_retries}...")
            print(f"[DB] MONGODB_URL starts with: {settings.MONGODB_URL[:30]}...")
            
            client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
            )
            
            # Force a connection test
            await client.admin.command("ping")
            print("[DB] MongoDB ping successful")
            
            db = client[settings.DATABASE_NAME]
            await init_beanie(
                database=db,
                document_models=[Applicant, Job, ChatSession, InterviewSlot, Notification],
            )
            _db_ready = True
            print(f"[OK] Connected to MongoDB: {settings.DATABASE_NAME}")
            
            # Seed slots if needed
            if os.getenv("FLUSH_ON_STARTUP", "false").lower() == "true":
                await Applicant.delete_all()
                await ChatSession.delete_all()
                await InterviewSlot.delete_all()
                await Notification.delete_all()
                print("[FLUSH] Cleared session data (Jobs preserved)")
                default_slots = _generate_default_slots()
                await InterviewSlot.insert_many([InterviewSlot(**s) for s in default_slots])
                print(f"[SEED] Created {len(default_slots)} interview slots")
            else:
                existing_slots = await InterviewSlot.find_all().to_list()
                if not existing_slots:
                    default_slots = _generate_default_slots()
                    await InterviewSlot.insert_many([InterviewSlot(**s) for s in default_slots])
                    print(f"[SEED] Created {len(default_slots)} interview slots (first run)")
            
            return  # Success — exit retry loop
            
        except Exception as e:
            print(f"[ERROR] DB connection attempt {attempt} failed: {type(e).__name__}: {e}")
            if attempt < max_retries:
                wait = attempt * 2
                print(f"[DB] Retrying in {wait}s...")
                await asyncio.sleep(wait)
            else:
                print(f"[FATAL] All {max_retries} DB connection attempts failed!")
                raise  # Re-raise so lifespan sees it


async def disconnect_db():
    global client
    if client:
        client.close()
        print("[INFO] Disconnected from MongoDB")
