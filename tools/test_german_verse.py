"""The German audit must retain explicitly approved verse boundaries."""
from build_german_wisdom import normalize_de_paragraphs


def test_only_approved_verse_preserves_line_breaks():
    paragraphs = ["Prose\ncontinues.", "First line\nSecond line", "Moral: Be kind."]
    assert normalize_de_paragraphs(paragraphs, [1]) == [
        "Prose continues.", "First line\nSecond line", "Moral: Be kind."
    ]
    assert normalize_de_paragraphs(paragraphs)[1] == "First line Second line"


def test_whole_story_preservation_keeps_verse_and_normalizes_moral():
    assert normalize_de_paragraphs(["One\nTwo", "Die Lehre: Be\nkind."], True) == [
        "One\nTwo", "Die Lehre: Be kind."
    ]
