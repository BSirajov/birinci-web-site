from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.config import API_DIR
from app.i18n import t
from app.schemas import LOCALES

router = APIRouter(tags=["pages"])
templates = Jinja2Templates(directory=str(API_DIR / "app" / "templates"))


def _lang(request: Request) -> str:
    lang = request.query_params.get("lang", "en")
    return lang if lang in LOCALES else "en"


def _ctx(request: Request, page: str, **extra) -> dict:
    lang = _lang(request)
    s = t(lang)
    titles = {
        "account": s["account"],
        "login": s["login"],
        "register": s["register"],
        "forgot": s["forgot"],
        "reset": s["reset"],
        "verify": s["verify"],
    }
    ctx = {"request": request, "s": s, "lang": lang, "page": page, "title": titles[page], "email": ""}
    ctx.update(extra)
    return ctx


def _page(request: Request, template: str, page: str, **extra) -> HTMLResponse:
    return templates.TemplateResponse(request, template, _ctx(request, page, **extra))


@router.get("/account", response_class=HTMLResponse)
@router.get("/account/", response_class=HTMLResponse)
def account_home(request: Request) -> HTMLResponse:
    return _page(request, "account.html", "account")


@router.get("/account/login", response_class=HTMLResponse)
def login_page(request: Request) -> HTMLResponse:
    return _page(request, "form.html", "login", email=request.query_params.get("email", ""))


@router.get("/account/register", response_class=HTMLResponse)
def register_page(request: Request) -> HTMLResponse:
    return _page(request, "form.html", "register", email=request.query_params.get("email", ""))


@router.get("/account/forgot", response_class=HTMLResponse)
def forgot_page(request: Request) -> HTMLResponse:
    return _page(request, "form.html", "forgot")


@router.get("/account/reset", response_class=HTMLResponse)
def reset_page(request: Request) -> HTMLResponse:
    return _page(request, "form.html", "reset", token=request.query_params.get("token", ""))


@router.get("/account/verify", response_class=HTMLResponse)
def verify_page(request: Request) -> HTMLResponse:
    return _page(request, "form.html", "verify", token=request.query_params.get("token", ""))
