"""Restore semantic note classes without rewriting story text or HTML layout."""
import html
import re
from story_source_policy import is_generic_story_notice

MORAL = re.compile(r"^(?:ibrət|ibret|nəticə|moral|lesson|lehre|мораль|урок|үлгү|сабак)\s*:", re.I)
ARTICLE = re.compile(r"<article\b[^>]*>.*?</article>", re.S | re.I)
PARAGRAPH = re.compile(r"(<p\b[^>]*>)(.*?)(</p>)", re.S | re.I)


def strip_moral_label(text: str) -> str:
    return re.sub(r"^\s*(?:ibrət|ibret|nəticə|moral|lesson|lehre|мораль|урок|үлгү|сабак)\s*:\s*", "", text, count=1, flags=re.I)


def restore_shared_note_styles(css: str) -> str:
    """Keep legacy generator output from reintroducing duplicate note rules."""
    css = re.sub(
        r"@media \(max-width: 760px\) \{\s*"
        r"\.story__text \.story__moral,\s*\.story \.card-text \.story__moral \{[^}]*\}\s*\}",
        "", css,
    )
    for kind in ("source", "moral"):
        css = re.sub(
            rf"\.story__text \.story__{kind},\s*\.story \.card-text \.story__{kind} \{{[^}}]*\}}",
            "", css,
        )
    css = re.sub(r"\.text-lightbox__body \.story__source \{[^}]*\}", "", css)
    if not re.search(r'@import url\("story-notes\.css', css):
        css = '@import url("story-notes.css?v=20261020src2");\n' + css
    return css


def restore_story_note_classes(markup: str) -> str:
    def article(match):
        value = match.group()
        if not re.search(r'class="[^"]*\bstory\b', value.split(">", 1)[0]):
            return value
        after_moral = False

        def paragraph(part):
            nonlocal after_moral
            opening, body, closing = part.groups()
            text = html.unescape(re.sub(r"<[^>]+>", "", body)).strip()
            if is_generic_story_notice(text):
                return ""
            kind = "story__moral" if MORAL.match(text) or "story__moral" in opening else "story__source" if after_moral else ""
            if kind == "story__moral":
                after_moral = True
                body = strip_moral_label(body)
            if kind:
                existing = re.search(r'class="([^"]*)"', opening)
                if existing:
                    classes = existing.group(1).split()
                    if kind not in classes:
                        opening = opening[:existing.start(1)] + " ".join([*classes, kind]) + opening[existing.end(1):]
                else:
                    opening = opening[:-1] + f' class="{kind}">'
            return opening + body + closing

        return PARAGRAPH.sub(paragraph, value)

    return ARTICLE.sub(article, markup)
