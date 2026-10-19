from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import REPO_ROOT, assert_runtime_safe, get_settings
from app.database import init_db
from app.routers import auth, pages, preferences
from app.static_site import static_languages, static_root

settings = assert_runtime_safe(get_settings())
SITE_ROOT = static_root(REPO_ROOT, settings.is_production)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    assert_runtime_safe()
    init_db()
    yield


app = FastAPI(title="Birİnci API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(auth.avatars_router)
app.include_router(preferences.router)
app.include_router(pages.router)
init_db()

@app.get("/")
def root():
    index = SITE_ROOT / "index.html"
    if index.is_file():
        return FileResponse(index, media_type="text/html; charset=utf-8")
    return RedirectResponse("/az/index.html")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "debug": settings.debug}


assets = SITE_ROOT / "assets"
flags = SITE_ROOT / "flags"
if assets.is_dir():
    app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")
if flags.is_dir():
    app.mount("/flags", StaticFiles(directory=str(flags)), name="flags")

for lang in static_languages(SITE_ROOT):
    folder = SITE_ROOT / lang
    if folder.is_dir():
        app.mount(f"/{lang}", StaticFiles(directory=str(folder), html=True), name=f"site-{lang}")
