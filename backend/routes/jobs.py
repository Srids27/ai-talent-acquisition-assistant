from fastapi import APIRouter, HTTPException, Depends
from core.security import require_hr
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models.job import Job

router = APIRouter()


class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    nice_to_have: List[str] = []
    experience_years: Optional[int] = None
    location: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    nice_to_have: Optional[List[str]] = None
    experience_years: Optional[int] = None
    location: Optional[str] = None


def _job_dict(j: Job) -> dict:
    return {
        "id": str(j.id),
        "title": j.title,
        "description": j.description,
        "required_skills": j.required_skills,
        "nice_to_have": j.nice_to_have,
        "experience_years": j.experience_years,
        "location": j.location,
        "is_active": j.is_active,
        "created_at": j.created_at.isoformat(),
        "updated_at": j.updated_at.isoformat() if j.updated_at else j.created_at.isoformat(),
    }


@router.post("/")
async def create_job(body: JobCreate, user: dict = Depends(require_hr)):
    job = Job(**body.dict())
    await job.insert()
    return {"success": True, "job_id": str(job.id), "job": _job_dict(job)}


@router.get("/")
async def list_jobs(active_only: bool = True):
    if active_only:
        jobs = await Job.find({"is_active": True}).sort("-created_at").to_list()
    else:
        jobs = await Job.find_all().sort("-created_at").to_list()
    return [_job_dict(j) for j in jobs]


@router.get("/{job_id}")
async def get_job(job_id: str):
    from beanie import PydanticObjectId
    job = await Job.get(PydanticObjectId(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_dict(job)


@router.patch("/{job_id}")
async def update_job(job_id: str, body: JobUpdate, user: dict = Depends(require_hr)):
    from beanie import PydanticObjectId
    job = await Job.get(PydanticObjectId(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    update_data = body.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    job.updated_at = datetime.utcnow()
    await job.save()
    return {"success": True, "job": _job_dict(job)}


@router.delete("/{job_id}")
async def deactivate_job(job_id: str, user: dict = Depends(require_hr)):
    from beanie import PydanticObjectId
    job = await Job.get(PydanticObjectId(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Cascading deletion of all candidates tied to this job
    from models.applicant import Applicant
    from models.chat_session import ChatSession
    from models.interview_slot import InterviewSlot
    from models.notification import Notification

    applicants = await Applicant.find(Applicant.job_id == job_id).to_list()
    for applicant in applicants:
        applicant_id = str(applicant.id)
        
        # 1. Release any booked interview slots
        slots = await InterviewSlot.find(InterviewSlot.booked_by == applicant_id).to_list()
        for slot in slots:
            slot.is_booked = False
            slot.booked_by = None
            slot.booked_by_name = None
            slot.booked_at = None
            await slot.save()
            
        # 2. Delete linked AI chat sessions
        await ChatSession.find(ChatSession.applicant_id == applicant_id).delete()
        
        # 3. Delete candidate notifications
        await Notification.find(Notification.google_id == applicant.google_id).delete()
        
        # 4. Delete the applicant profile document
        await applicant.delete()

    job.is_active = False
    job.updated_at = datetime.utcnow()
    await job.save()
    
    return {
        "success": True, 
        "message": f"Job deactivated and {len(applicants)} connected candidate profiles permanently deleted with full database cascading effect."
    }
