from normalize_runtime_html import normalize
from runtime_bundle import allowed
from audit_credentials import SIGNATURE

def test_toolbar_is_present_before_first_paint_and_normalization_is_idempotent():
    page = '<html lang="en"><body class="page-home"><header class="site-header">Brand</header><main><div class="tools-bar" data-tools="home"><div><span id="home-view-label">View</span></div></div><aside class="story-nav">Stories</aside></main></body></html>'
    result = normalize(page)
    assert result.index('data-page-toolbar') < result.index('<main>')
    assert '<nav class="story-nav">Stories</nav>' in result
    assert normalize(result) == result

def test_alternates_keep_generator_owned_destination_without_touching_switch_links():
    page = '<head><link rel="alternate" hreflang="de" href="old"><link rel="alternate" hreflang="de" href="new"></head><a hreflang="de" href="switch">DE</a>'
    result = normalize(page)
    assert 'href="old"' not in result
    assert 'href="new"' in result and 'href="switch"' in result

def test_temporary_catalog_and_secret_are_never_runtime():
    assert not allowed('az/assets/stories-data.js.tmp', 'online')
    assert not allowed('birinci.cloud_deployment_public_key', 'online')
    assert allowed('en/assets/story-previews/mature-person.webp', 'online')
    # Build the signature from pieces so this fixture is not itself a key file.
    assert SIGNATURE.search(b'-----BEGIN ' + b'OPENSSH PRIVATE KEY-----')
