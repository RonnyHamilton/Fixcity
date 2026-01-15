# Face Verification Backend with InsightFace (Buffalo_L model)
# Requirements: pip install fastapi uvicorn insightface onnxruntime opencv-python-headless numpy python-multipart

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import base64
import cv2
import os
from insightface.app import FaceAnalysis

app = FastAPI(title="FixCity Face Verification API (InsightFace)")

# Enable CORS for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your Next.js app's origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "FixCity Face Server Running ✅"}

@app.get("/health")
def health():
    return {"status": "ok"}

# Initialize InsightFace
# Using buffalo_l model which includes detection and recognition
print("Initializing InsightFace model (Buffalo_L)... this may take a moment to download on first run.")
face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))
print("InsightFace model initialized successfully.")

# Path to face images
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
OFFICER_FACES_DIR = os.path.join(BASE_DIR, "data", "officer-faces")
TECH_FACES_DIR = os.path.join(BASE_DIR, "data", "technician-faces")

class VerifyRequest(BaseModel):
    badge_id: str
    image: str  # Base64 encoded image
    user_type: str = "officer"  # "officer" or "technician"

class VerifyResponse(BaseModel):
    verified: bool
    confidence: float
    message: str
    error: str = None

def base64_to_cv2(base64_string: str):
    """Convert base64 string to cv2 image"""
    # Remove data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    # Decode base64
    image_data = base64.b64decode(base64_string)
    np_arr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def find_reference_image(badge_id: str, user_type: str = "officer") -> str:
    """Find reference image for the given badge ID and user type"""
    # Select directory based on user type
    faces_dir = TECH_FACES_DIR if user_type == "technician" else OFFICER_FACES_DIR
    
    extensions = [".jpg", ".jpeg", ".png"]
    
    for ext in extensions:
        path = os.path.join(faces_dir, f"{badge_id}{ext}")
        if os.path.exists(path):
            return path
    
    return None

def compute_sim(feat1, feat2):
    """Compute cosine similarity between two feature vectors"""
    return np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2))

@app.post("/verify", response_model=VerifyResponse)
async def verify_face(request: VerifyRequest):
    try:
        # Find reference image
        reference_path = find_reference_image(request.badge_id, request.user_type)
        
        if not reference_path:
            faces_dir = TECH_FACES_DIR if request.user_type == "technician" else OFFICER_FACES_DIR
            return VerifyResponse(
                verified=False,
                confidence=0.0,
                message="Reference image not found",
                error=f"No image found for badge ID: {request.badge_id}. Upload to {faces_dir}/{request.badge_id}.jpg"
            )
        
        # Load and process reference image
        ref_img = cv2.imread(reference_path)
        if ref_img is None:
             return VerifyResponse(
                verified=False,
                confidence=0.0,
                message="Error reading reference image",
                error="Could not read the reference image file"
            )

        ref_faces = face_app.get(ref_img)
        
        if len(ref_faces) == 0:
            return VerifyResponse(
                verified=False,
                confidence=0.0,
                message="No face detected in reference image",
                error="The reference image does not contain a detectable face"
            )
        
        # Taking the largest face by default if multiple
        ref_faces = sorted(ref_faces, key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]), reverse=True)
        ref_embedding = ref_faces[0].embedding
        
        # Process uploaded image
        try:
            input_img = base64_to_cv2(request.image)
            if input_img is None:
                 raise ValueError("Failed to decode image")
        except Exception as e:
            return VerifyResponse(
                verified=False,
                confidence=0.0,
                message="Invalid image data",
                error=f"Could not process uploaded image: {str(e)}"
            )
        
        # Get face from uploaded image
        input_faces = face_app.get(input_img)
        
        if len(input_faces) == 0:
            return VerifyResponse(
                verified=False,
                confidence=0.0,
                message="No face detected in camera image",
                error="Please ensure your face is clearly visible in the camera"
            )
        
        # Compare reference face with ALL detected faces in input
        # We want to see if the officer is present anywhere in the frame
        max_sim = 0.0
        
        for face in input_faces:
            sim = compute_sim(ref_embedding, face.embedding)
            if sim > max_sim:
                max_sim = sim
        
        # Verification threshold
        # InsightFace recommended threshold for cosine similarity is ~0.5 for very high certainty
        # but 0.4 is usually sufficient for login
        THRESHOLD = 0.45 
        
        # Normalize confidence to percentage roughly
        display_confidence = max_sim
        
        if max_sim >= THRESHOLD:
            return VerifyResponse(
                verified=True,
                confidence=round(float(display_confidence), 3),
                message=f"Face verified successfully. Score: {display_confidence:.3f}"
            )
        else:
            return VerifyResponse(
                verified=False,
                confidence=round(float(display_confidence), 3),
                message=f"Face verification failed. Score: {display_confidence:.3f}",
                error=f"Match score ({display_confidence:.2f}) below threshold ({THRESHOLD})"
            )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return VerifyResponse(
            verified=False,
            confidence=0.0,
            message="Verification error",
            error=str(e)
        )

# Add /verify-face endpoint as an alias for Hugging Face compatibility
@app.post("/verify-face", response_model=VerifyResponse)
async def verify_face_alias(request: VerifyRequest):
    """Alias endpoint for /verify to support Hugging Face deployment"""
    return await verify_face(request)

if __name__ == "__main__":
    import uvicorn
    print(f"Looking for officer face images in: {OFFICER_FACES_DIR}")
    print(f"Looking for technician face images in: {TECH_FACES_DIR}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
