from audit_publish_tree import audit


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
