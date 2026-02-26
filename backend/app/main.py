import logging
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import httpx
from .models import LOIFields, LOIFieldsWithConfidence
from .services import LOIExtractionService
from .config import get_settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CRE LOI Parser API",
    description="Extract commercial real estate LOI terms from call transcripts",
    version="1.0.0"
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    """Request body for transcript parsing"""
    transcript: str


class ParseResponse(BaseModel):
    """Response from parsing endpoint"""
    success: bool
    data: LOIFields
    message: str = "LOI fields extracted successfully"
    field_confidences: Dict[str, float] = {}
    low_confidence_fields: List[str] = []


class GenerateDocRequest(BaseModel):
    """Request body for document generation"""
    loi_data: LOIFields


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "CRE LOI Parser API",
        "version": "1.0.0"
    }


async def _ping_document_service():
    """Fire-and-forget ping to wake the document service (Render free tier).
    Uses a long timeout so Render has time to boot a cold instance (~30-60 s)."""
    try:
        async with httpx.AsyncClient() as client:
            await client.get(f"{settings.document_service_url}/health", timeout=70.0)
    except Exception:
        pass


@app.get("/health")
async def health_check(background_tasks: BackgroundTasks):
    """Health check with service status. Also wakes the document service."""
    background_tasks.add_task(_ping_document_service)
    return {
        "status": "healthy",
        "groq_configured": bool(settings.groq_api_key),
        "document_service": settings.document_service_url
    }


@app.post("/parse", response_model=ParseResponse)
async def parse_transcript(request: ParseRequest):
    """
    Parse a call transcript and extract LOI fields using Groq LLM

    Args:
        request: ParseRequest with transcript text

    Returns:
        ParseResponse with extracted LOI fields
    """
    if not request.transcript or len(request.transcript.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Transcript too short. Please provide a meaningful conversation."
        )

    try:
        extractor = LOIExtractionService()
        result = extractor.extract_loi_fields_with_confidence(request.transcript)

        return ParseResponse(
            success=True,
            data=result.data,
            field_confidences=result.field_confidences,
            low_confidence_fields=result.low_confidence_fields,
            message="LOI fields extracted successfully"
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@app.post("/parse/mock")
def parse_mock():
    """
    Generate a mock LOI for testing without requiring a transcript

    Returns:
        ParseResponse with mock LOI data
    """
    try:
        mock_loi = LOIExtractionService.create_mock_loi()

        return ParseResponse(
            success=True,
            data=mock_loi,
            field_confidences={},
            low_confidence_fields=[],
            message="Mock LOI generated for testing (no confidence scoring for mock data)"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mock generation failed: {str(e)}")


@app.post("/generate-document")
async def generate_document(request: GenerateDocRequest):
    """
    Generate a Word document from LOI fields

    Args:
        request: GenerateDocRequest with validated LOI data

    Returns:
        Response with download URL or file
    """
    try:
        # Forward request to Node.js document service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.document_service_url}/generate",
                json=request.loi_data.model_dump(mode='json'),
                timeout=60.0
            )

            if response.status_code != 200:
                logger.error(
                    "Document service returned %d: %s",
                    response.status_code,
                    response.text[:500],
                )
                raise HTTPException(
                    status_code=502,
                    detail=f"Document service error ({response.status_code}): {response.text[:200]}"
                )

            return response.json()

    except HTTPException:
        raise
    except httpx.TimeoutException as e:
        logger.error("Document service timed out: %s", str(e))
        raise HTTPException(
            status_code=504,
            detail="Document service timed out. It may be starting up — please retry in 30 seconds."
        )
    except httpx.RequestError as e:
        logger.error("Document service connection error: %s", str(e))
        raise HTTPException(
            status_code=503,
            detail=f"Document service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.exception("Unexpected error in generate_document")
        raise HTTPException(
            status_code=500,
            detail=f"Document generation failed: {str(e)}"
        )


@app.get("/schema")
def get_schema():
    """
    Get the LOI fields schema for reference

    Returns:
        JSON schema for LOIFields
    """
    return LOIFields.model_json_schema()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
