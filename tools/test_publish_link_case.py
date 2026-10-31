from audit_publish_tree import audit
from test_german_wisdom import Audit


def test_german_audit_exempts_only_separately_hosted_entry_point(tmp_path):
    page = tmp_path / 'index.html'
    page.write_text('<h1 id="present">Test</h1>', encoding='utf-8')
    checker = Audit(tmp_path)
    checker.reference(page, 'a/href', 'https://birinci.cloud/offline/')
    checker.reference(page, 'a/href', 'https://birinci.cloud/index.html#present')
    assert checker.errors == []
    for url in ('https://birinci.cloud/offline/missing.html',
                '/offline/', 'https://birinci.cloud/missing.html',
                'https://birinci.cloud/index.html#missing'):
        previous = len(checker.errors)
        checker.reference(page, 'a/href', url)
        assert len(checker.errors) == previous + 1, url


def test_only_known_offline_entry_point_is_external(tmp_path):
    (tmp_path / 'index.html').write_text('<html lang="en"><head><title>Test</title>'
        '<meta name="robots" content="noindex"></head><body><main><h1>Test</h1>'
        '<a href="https://birinci.cloud/offline/">Offline</a>'
        '<a href="https://birinci.cloud/offline/missing.html">Missing</a>'
        '</main></body></html>', encoding='utf-8')
    missing = [e['detail'] for e in audit(tmp_path)['errors'] if e['kind'] == 'missing-target']
    assert missing == ['https://birinci.cloud/offline/missing.html']


def test_image_filename_case_is_checked_on_every_platform(tmp_path):
    (tmp_path / 'Sitemap.webp').write_bytes(b'image')
    (tmp_path / 'index.html').write_text('<html lang="en"><head><title>Test</title>'
        '<meta name="robots" content="noindex"></head><body><main><h1>Test</h1>'
        '<img src="sitemap.webp" alt="Map"></main></body></html>', encoding='utf-8')
    assert any(e['kind'] == 'missing-target' and e['detail'] == 'sitemap.webp'
               for e in audit(tmp_path)['errors'])
