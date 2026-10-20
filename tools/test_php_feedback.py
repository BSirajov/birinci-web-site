"""Real PHP HTTP integration tests; namespaced mail is intercepted, never sent."""
import base64
import concurrent.futures
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import time

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[1]
PHP = os.environ.get('PHP_BIN') or shutil.which('php')
pytestmark = pytest.mark.skipif(not PHP, reason='PHP runtime required (set PHP_BIN)')
FIELDS = dict(name='Əli Müller', email='qa@example.org', feedback_type='general',
              subject='Test', message='A useful suggestion.', privacyconfirm='yes',
              related_url='/en/index.html', page_url='https://birinci.cloud/en/feedback.html')
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWVQAAAAASUVORK5CYII=')


@pytest.fixture
def endpoint(tmp_path):
    site = tmp_path / 'site'; site.mkdir()
    state = tmp_path / 'private'; state.mkdir()
    for lang in ['en', 'az']:
        (site / lang).mkdir()
        shutil.copyfile(ROOT / 'tools/mail_feedback.php', site / lang / 'mail-feedback.php')
    stub = tmp_path / 'mail-stub.php'
    stub.write_text('''<?php
namespace Birinci\\Feedback;
function mail($to, $subject, $body, $headers) {
    file_put_contents(sys_get_temp_dir().'/mail.jsonl', json_encode([$to,$subject,$body,$headers])."\\n", FILE_APPEND|LOCK_EX);
    return !file_exists(sys_get_temp_dir().'/fail-mail');
}
''', encoding='utf-8')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
    args = [PHP, '-n', '-d', 'extension=fileinfo', '-d', f'sys_temp_dir={state}',
            '-d', f'auto_prepend_file={stub}', '-d', 'upload_max_filesize=5M',
            '-d', 'post_max_size=6M', '-d', 'display_errors=0',
            '-S', f'127.0.0.1:{port}', '-t', str(site)]
    # Windows portable PHP extensions live beside php.exe in ext/.
    if os.name == 'nt': args[2:2] = ['-d', f'extension_dir={Path(PHP).parent / "ext"}']
    log = (tmp_path / 'php.log').open('w')
    process = subprocess.Popen(args, stdout=log, stderr=log)
    client = httpx.Client(base_url=f'http://127.0.0.1:{port}', timeout=10, trust_env=False)
    try:
        for _ in range(100):
            if process.poll() is not None: pytest.fail('PHP failed: '+(tmp_path/'php.log').read_text())
            try:
                client.get('/en/mail-feedback.php'); break
            except httpx.ConnectError: time.sleep(.05)
        else: pytest.fail('PHP did not start')
        yield client, state
    finally:
        client.close(); process.terminate(); process.wait(timeout=10); log.close()


def send(endpoint, changes=None, **kwargs):
    client, _ = endpoint
    return client.post('/en/mail-feedback.php', data=FIELDS | (changes or {}), **kwargs)


def mail(endpoint):
    p = endpoint[1] / 'mail.jsonl'
    return [json.loads(x) for x in p.read_text().splitlines()] if p.exists() else []


def test_method_and_valid_unicode_mail(endpoint):
    response = endpoint[0].get('/en/mail-feedback.php')
    assert response.status_code == 405 and response.headers['allow'] == 'POST'
    response = send(endpoint, {'message': 'Кыргызча\nРусский\nAzərbaycan\nDeutsch'})
    assert response.status_code == 200 and response.text == 'success'
    assert len(mail(endpoint)) == 1
    assert 'Кыргызча' in mail(endpoint)[0][2]


@pytest.mark.parametrize('field,limit', [('name',120),('email',200),('subject',200),
    ('message',5000),('related_url',500),('page_url',2048)])
def test_server_length_limits(endpoint, field, limit):
    response = send(endpoint, {field:'x'*(limit+1)})
    assert response.status_code == 400 and response.text == 'error:length'
    assert not mail(endpoint)


@pytest.mark.parametrize('changes', [
    {'email':'a@example.org\r\nBcc: victim@example.org'},
    {'subject':'hello\r\nInjected: yes'}, {'page_url':'https://example.org\nSpoof'},
    {'feedback_type':'invented'}, {'related_url':'javascript:alert(1)'},
    {'related_url':'//evil.example'}, {'related_url':'/\\evil.example'},
    {'privacyconfirm':'no'}, {'message':'bad\x00text'},
])
def test_invalid_fields_never_send(endpoint, changes):
    response = send(endpoint, changes)
    assert response.status_code == 400
    assert not mail(endpoint)


def test_array_field_and_invalid_utf8(endpoint):
    for body in ['name[]=Bob', 'name=%FF']:
        response=endpoint[0].post('/en/mail-feedback.php',content=body,
            headers={'Content-Type':'application/x-www-form-urlencoded'})
        assert response.status_code == 400 and response.text == 'error:field'
    assert not mail(endpoint)


def test_cross_site_and_honeypot(endpoint):
    assert send(endpoint, headers={'Origin':'https://evil.example'}).status_code == 403
    assert send(endpoint, headers={'Sec-Fetch-Site':'cross-site'}).status_code == 403
    assert send(endpoint, {'website':'spam'}).text == 'success'
    assert not mail(endpoint)
    assert send(endpoint, headers={'Origin':'https://birinci.cloud'}).status_code == 200


@pytest.mark.parametrize('name,data,mime', [
    ('fake.png',b'<?php echo 1; ?>','image/png'),
    ('fake.pdf',b'<html>bad</html>','application/pdf'),
    ('wrong.jpg',PNG,'image/jpeg'), ('code.php.png',PNG,'image/png'),
    ('empty.png',b'','image/png'), ('vector.svg',b'<svg/>','image/svg+xml'),
])
def test_attachment_spoofing(endpoint,name,data,mime):
    assert send(endpoint,files={'attachment':(name,data,mime)}).status_code == 400
    assert not mail(endpoint)


def test_valid_attachment_ignores_client_mime_and_sanitizes_name(endpoint):
    response=send(endpoint,files={'attachment':('odd";name.png',PNG,'application/octet-stream')})
    assert response.status_code == 200
    body=mail(endpoint)[0][2]
    assert 'Content-Type: image/png; name="attachment.png"' in body
    assert 'odd' not in body


def test_unicode_limit_boundary_and_pdf(endpoint):
    pdf = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
    response = send(endpoint, {'message':'ə'*5000},
                    files={'attachment':('note.pdf',pdf,'application/pdf')})
    assert response.status_code == 200
    assert 'Content-Type: application/pdf' in mail(endpoint)[0][2]
    assert send(endpoint, {'message':'ə'*5001}).text == 'error:length'


def test_upload_arrays_and_size_limits(endpoint):
    assert send(endpoint,files={'attachment[]':('ok.png',PNG,'image/png')}).status_code == 400
    assert send(endpoint,files={'unexpected':('ok.png',PNG,'image/png')}).status_code == 400
    assert send(endpoint,files={'attachment':('large.png',PNG+b'x'*(5*1024*1024),'image/png')}).status_code == 400
    response=endpoint[0].post('/en/mail-feedback.php',content=b'x'*(6*1024*1024+1),
        headers={'Content-Type':'application/x-www-form-urlencoded'})
    assert response.status_code == 413
    assert not mail(endpoint)


def test_rate_limit_shared_between_languages_and_forwarded_headers_ignored(endpoint):
    for i in range(5):
        response=endpoint[0].post('/'+('en' if i%2 else 'az')+'/mail-feedback.php',
            data=FIELDS,headers={'X-Forwarded-For':f'192.0.2.{i}'})
        assert response.status_code == 200
    response=send(endpoint,headers={'X-Forwarded-For':'203.0.113.1'})
    assert response.status_code == 429 and int(response.headers['retry-after']) > 0
    assert len(mail(endpoint)) == 5


def test_rate_expiry_and_global_cap(endpoint):
    send(endpoint)
    state=next(endpoint[1].glob('birinci-feedback-*.json'))
    now=int(time.time())
    state.write_text(json.dumps([{'at':now,'ip':str(i)} for i in range(60)]))
    assert send(endpoint).status_code == 429
    state.write_text(json.dumps([{'at':now-3601,'ip':str(i)} for i in range(60)]))
    assert send(endpoint).status_code == 200


def test_parallel_processes_cannot_bypass_rate_limit(endpoint):
    state = endpoint[1]
    parent = state.parent
    wrapper = parent / 'parallel.php'
    wrapper.write_text('<?php $_SERVER["REQUEST_METHOD"]="POST"; '
        '$_SERVER["REMOTE_ADDR"]="192.0.2.1"; $_POST=json_decode('
        + repr(json.dumps(FIELDS, ensure_ascii=True))
        + ',true); require ' + repr(str(parent/'site/en/mail-feedback.php').replace(chr(92), '/')) + ';',
        encoding='utf-8')
    args = [PHP, '-n', '-d', f'sys_temp_dir={state}', '-d',
            f'auto_prepend_file={parent / "mail-stub.php"}', '-f', str(wrapper)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(lambda _: subprocess.run(args, capture_output=True, text=True,
                                                       check=True).stdout, range(12)))
    assert results.count('success') == 5
    assert results.count('error:rate_limit') == 7
    assert len(mail(endpoint)) == 5


def test_corrupt_rate_state_fails_closed_and_mail_failure_not_success(endpoint):
    send(endpoint)
    state=next(endpoint[1].glob('birinci-feedback-*.json'))
    state.write_text('broken')
    assert send(endpoint).status_code == 503
    assert len(mail(endpoint)) == 1
    state.write_text('[]')
    (endpoint[1]/'fail-mail').touch()
    response=send(endpoint)
    assert response.status_code == 500 and response.text == 'error:send'


def test_published_php_copies_match_source():
    source=(ROOT/'tools/mail_feedback.php').read_text(encoding='utf-8')
    for lang in ['az','en','ru','ky']:
        assert (ROOT/lang/'mail-feedback.php').read_text(encoding='utf-8') == source
