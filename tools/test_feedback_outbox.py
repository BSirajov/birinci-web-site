import time

import feedback_mail

def _fields(**changes):
    base = dict(name='Əli Müller', email='qa@example.org', feedback_type='general',
                subject='Test', message='A useful suggestion.', privacyconfirm='yes',
                related_url='/en/index.html', page_url='https://birinci.cloud/en/feedback.html',
                form_started=str(int((time.time() - 30) * 1000)))
    base.update(changes)
    return base

def test_local_feedback_does_not_overwrite_same_second(monkeypatch, tmp_path):
    monkeypatch.setattr(feedback_mail, 'OUTBOX', tmp_path)
    feedback_mail.store({'message':'first'}, {'attachment':('note.png',b'first')})
    feedback_mail.store({'message':'second'}, {'attachment':('note.png',b'second')})
    assert len(list(tmp_path.glob('*-feedback.txt')))==2
    assert sorted(p.read_bytes() for p in tmp_path.glob('*-note.png'))==[b'first',b'second']
    notes = [p.read_text(encoding='utf-8') for p in tmp_path.glob('*-feedback.txt')]
    assert all('Open it only if you trust the sender' in note for note in notes)


def test_local_feedback_rejects_abuse_haste_and_link_lists():
    assert feedback_mail.validate(_fields(), {}) is None
    for message in ('fuck this page', 'f u c k', 'f*ck', 'fuuuuck', 'сука', 'scheiße', 'göt', 'this is stupid'):
        assert feedback_mail.validate(_fields(message=message), {}) == 'error:abuse'
    ordinary = (
        'I got an error on the class assignment. The peacock and cocktail pictures are fine. '
        'Shiitake, fickle, Marsch. cnt is wrong.'
    )
    assert feedback_mail.validate(_fields(name='Dick', message=ordinary), {}) is None
    assert feedback_mail.validate(_fields(message='See https://a.example and https://b.example'), {}) is None
    assert feedback_mail.validate(_fields(
        message='See https://a.example https://b.example and https://c.example'), {}) == 'error:abuse'
    assert feedback_mail.validate(_fields(form_started=''), {}) == 'error:too_fast'
    assert feedback_mail.validate(_fields(form_started=str(int(time.time() * 1000))), {}) == 'error:too_fast'
