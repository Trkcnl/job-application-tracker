from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import shutil
from datetime import datetime
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from email_parser import check_and_update_applications

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    trigger = CronTrigger(day_of_week='mon-fri', hour='9-17', minute='0')
    scheduler.add_job(check_and_update_applications, trigger)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="Job Application Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.job_tracker_db
collection = db.applications

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

PyObjectId = Annotated[str, BeforeValidator(str)]

class ApplicationModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    company: str
    position: str
    status: str = "Applied"
    date_applied: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    notes: Optional[str] = ""
    job_link: Optional[str] = ""
    last_modified: str = Field(default_factory=lambda: datetime.now().isoformat())

class CreateApplicationModel(BaseModel):
    company: str
    position: str
    status: str = "Applied"
    date_applied: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    notes: Optional[str] = ""
    job_link: Optional[str] = ""

class UpdateApplicationModel(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    date_applied: Optional[str] = None
    notes: Optional[str] = None
    job_link: Optional[str] = None

@app.post("/applications", response_model=ApplicationModel)
async def create_application(application: CreateApplicationModel):
    app_data = application.model_dump()
    app_data["last_modified"] = datetime.now().isoformat()
    new_app = await collection.insert_one(app_data)
    created_app = await collection.find_one({"_id": new_app.inserted_id})
    return created_app

@app.get("/applications", response_model=List[ApplicationModel])
async def list_applications():
    applications = await collection.find().to_list(1000)
    return applications

@app.get("/applications/{id}", response_model=ApplicationModel)
async def get_application(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    application = await collection.find_one({"_id": ObjectId(id)})
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@app.put("/applications/{id}", response_model=ApplicationModel)
async def update_application(id: str, update_data: UpdateApplicationModel):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["last_modified"] = datetime.now().isoformat()
        result = await collection.update_one({"_id": ObjectId(id)}, {"$set": update_dict})
        if result.modified_count == 0 and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
    
    updated_app = await collection.find_one({"_id": ObjectId(id)})
    if updated_app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return updated_app

@app.delete("/applications/{id}")
async def delete_application(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted successfully"}
