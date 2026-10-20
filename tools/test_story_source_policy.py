from pathlib import Path
from story_source_policy import is_story_collection

def test_compiled_collections_are_not_stories():
    for name in ["Kyrgyz_Wisdom_Stories_Collection.docx", "All_Stories_Combined.docx", "Moral-Stories-Collection.docx"]:
        assert is_story_collection(Path(name))
    for name in ["collecting-kindness.docx", "collection.docx", "telling-lies.docx"]:
        assert not is_story_collection(Path(name))
