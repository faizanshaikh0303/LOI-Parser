import sys
import os

# Make backend package importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from starlette.applications import Starlette
from starlette.routing import Mount
from mangum import Mangum
from app.main import app as fastapi_app

# Mount the FastAPI app at /api so that Vercel's routing of /api/* maps correctly.
# When Vercel forwards /api/parse to this function, Starlette strips /api
# and FastAPI receives /parse, matching its defined routes.
root = Starlette(routes=[Mount("/api", app=fastapi_app)])

handler = Mangum(root, lifespan="off")
