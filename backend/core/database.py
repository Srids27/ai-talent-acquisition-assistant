import os
import motor.motor_asyncio
from beanie import init_beanie
from core.config import settings
from models.applicant import Applicant
from models.job import Job
from models.chat_session import ChatSession
from models.interview_slot import InterviewSlot
from models.notification import Notification

client: motor.motor_asyncio.AsyncIOMotorClient = None

DEFAULT_SLOTS = [
    {"day": "Mon, May 12", "time": "10:00 AM"},
    {"day": "Mon, May 12", "time": "2:00 PM"},
    {"day": "Tue, May 13", "time": "11:00 AM"},
    {"day": "Wed, May 14", "time": "3:00 PM"},
    {"day": "Thu, May 15", "time": "10:00 AM"},
]


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

        # Seed default interview slots
        for slot_data in DEFAULT_SLOTS:
            slot = InterviewSlot(**slot_data)
            await slot.insert()
        print(f"[SEED] Created {len(DEFAULT_SLOTS)} interview slots")
    else:
        # In production, only seed slots if none exist
        existing_slots = await InterviewSlot.find_all().to_list()
        if not existing_slots:
            for slot_data in DEFAULT_SLOTS:
                slot = InterviewSlot(**slot_data)
                await slot.insert()
            print(f"[SEED] Created {len(DEFAULT_SLOTS)} interview slots (first run)")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("[INFO] Disconnected from MongoDB")
