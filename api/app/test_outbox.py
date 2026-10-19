"""Multiple messages created in the same second must remain independent."""
from app import security

def test_outbox_messages_do_not_overwrite(monkeypatch, tmp_path):
    monkeypatch.setattr(security, 'API_DIR', tmp_path)
    first = security.write_outbox('verify', 'first@example.com', 'Verify', 'first-token')
    second = security.write_outbox('verify', 'second@example.com', 'Verify', 'second-token')
    assert first != second
    assert 'first-token' in first.read_text(encoding='utf-8')
    assert 'second-token' in second.read_text(encoding='utf-8')
