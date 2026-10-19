import feedback_mail

def test_local_feedback_does_not_overwrite_same_second(monkeypatch, tmp_path):
    monkeypatch.setattr(feedback_mail, 'OUTBOX', tmp_path)
    feedback_mail.store({'message':'first'}, {'attachment':('note.png',b'first')})
    feedback_mail.store({'message':'second'}, {'attachment':('note.png',b'second')})
    assert len(list(tmp_path.glob('*-feedback.txt')))==2
    assert sorted(p.read_bytes() for p in tmp_path.glob('*-note.png'))==[b'first',b'second']
