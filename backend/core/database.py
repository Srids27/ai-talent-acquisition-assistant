import os
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


def _generate_default_slots():
    """Generate interview slots for the next 5 weekdays dynamically."""
    slots = []
    times = ["10:00 AM", "2:00 PM", "11:00 AM", "3:00 PM", "10:00 AM"]
    today = datetime.now(timezone.utc).date()
    day = today + timedelta(days=1)
    count = 0
    while count < 5:
        if day.weekday() < 5:  # Mon-Fri
            label = day.strftime("%a, %b %d")
            slots.append({"day": label, "time": times[count]})
            count += 1
        day += timedelta(days=1)
    return slots


async def connect_db():
    global client
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    await init_beanie(
        database=db,
        document_models=[Applicant, Job, ChatSession, InterviewSlot, Notification],
    )
    print(f"[OK] Connected to MongoDB: {settings.DATABASE_NAME}")

    # Only flush session data in development (prevents data loss on Render restarts)
    if os.getenv("FLUSH_ON_STARTUP", "false").lower() == "true":
        await Applicant.delete_all()
        await ChatSession.delete_all()
        await InterviewSlot.delete_all()
        await Notification.delete_all()
        print("[FLUSH] Cleared applicants, chat sessions, interview slots, and notifications (Jobs preserved)")

        # Seed default interview slots (bulk insert)
        default_slots = _generate_default_slots()
        await InterviewSlot.insert_many(
            [InterviewSlot(**s) for s in default_slots]
        )
        print(f"[SEED] Created {len(default_slots)} interview slots")
    else:
        # In production, only seed slots if none exist
        existing_slots = await InterviewSlot.find_all().to_list()
        if not existing_slots:
            default_slots = _generate_default_slots()
            await InterviewSlot.insert_many(
                [InterviewSlot(**s) for s in default_slots]
            )
            print(f"[SEED] Created {len(default_slots)} interview slots (first run)")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("[INFO] Disconnected from MongoDB")
