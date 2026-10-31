<?php
namespace Birinci\Feedback;

header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['challenge'])) {
    header('Content-Type: application/json; charset=UTF-8');
    $settings = turnstile_settings();
    echo json_encode(['sitekey' => $settings[0]], JSON_UNESCAPED_UNICODE);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo "error:method";
    exit;
}

$to = 'info@birinci.cloud';
$from = 'noreply@birinci.cloud';
$maxFile = 5 * 1024 * 1024;
$okExt = ['jpg' => 1, 'jpeg' => 1, 'png' => 1, 'webp' => 1, 'gif' => 1, 'pdf' => 1];

// PHP parses uploads before this script; hosting must also cap post_max_size
// and upload_max_filesize. Reject oversized/empty parsed requests explicitly.
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 6 * 1024 * 1024) {
    fail('error:file_size', 413);
}
if (isset($_SERVER['HTTP_ORIGIN']) && !in_array($_SERVER['HTTP_ORIGIN'],
        ['https://birinci.cloud', 'https://www.birinci.cloud'], true)) {
    fail('error:origin', 403);
}
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
    fail('error:origin', 403);
}

function field($key) {
    $value = $_POST[$key] ?? '';
    if (!is_string($value) || !preg_match('//u', $value)) {
        fail('error:field');
    }
    return trim($value);
}

function bounded_field($key, $limit, $multiline = false) {
    $value = field($key);
    if (strlen($value) > $limit * 4 || preg_match_all('/./us', $value) > $limit) {
        fail('error:length');
    }
    $controls = $multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';
    if (preg_match($controls, $value)) {
        fail('error:unsafe');
    }
    return $value;
}

function rate_limit() {
    // One private, bounded, locked state file shared by all locale endpoints.
    // REMOTE_ADDR is server supplied; never trust arbitrary forwarded headers.
    $path = sys_get_temp_dir() . '/birinci-feedback-' . hash('sha256', dirname(__DIR__)) . '.json';
    $handle = @fopen($path, 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) {
        fail('error:unavailable', 503);
    }
    @chmod($path, 0600);
    $raw = stream_get_contents($handle, 65537);
    $events = $raw === '' ? [] : json_decode($raw, true);
    if (strlen($raw) > 65536 || !is_array($events)) {
        fclose($handle);
        fail('error:unavailable', 503);
    }
    $now = time();
    $client = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $recent = []; $clientEvents = [];
    foreach ($events as $event) {
        if (!is_array($event) || !isset($event['at'], $event['ip']) ||
                !is_int($event['at']) || !is_string($event['ip'])) {
            fclose($handle);
            fail('error:unavailable', 503);
        }
        if ($event['at'] > $now - 3600) {
            $recent[] = $event;
            if ($event['ip'] === $client && $event['at'] > $now - 900) {
                $clientEvents[] = $event['at'];
            }
        }
    }
    if (count($clientEvents) >= 5 || count($recent) >= 60) {
        $wait = count($clientEvents) >= 5 ? min($clientEvents) + 900 - $now : min(array_column($recent, 'at')) + 3600 - $now;
        fclose($handle);
        header('Retry-After: ' . max(1, $wait));
        fail('error:rate_limit', 429);
    }
    $recent[] = ['at' => $now, 'ip' => $client];
    $json = json_encode($recent);
    rewind($handle);
    if (!ftruncate($handle, 0) || fwrite($handle, $json) !== strlen($json) || !fflush($handle)) {
        fclose($handle);
        fail('error:unavailable', 503);
    }
    fclose($handle);
}

function fail($code, $http = 400) {
    http_response_code($http);
    echo $code;
    exit;
}

function looks_unsafe($text) {
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $text)) {
        return true;
    }
    if (preg_match('/<\\s*\\/?\\s*[a-z!]/i', $text)) {
        return true;
    }
    if (preg_match('/(?:javascript|vbscript|data)\\s*:/i', $text)) {
        return true;
    }
    if (preg_match('/<\\?(?:php|=)?|<%/i', $text)) {
        return true;
    }
    $folded = strtolower($text);
    return (bool) preg_match(
        '/\\bunion\\s+select\\b|\\bdrop\\s+table\\b|\\binsert\\s+into\\b|\\bdelete\\s+from\\b|\\binformation_schema\\b/',
        $folded
    );
}

// Keep the folding and token rules aligned with tools/feedback_mail.py.
function private_dir() {
    return dirname(__DIR__) . '/private';
}

function turnstile_settings() {
    // Off until a site key and secret are set. The secret is never returned.
    $site = getenv('BIRINCI_TURNSTILE_SITE_KEY');
    $secret = getenv('BIRINCI_TURNSTILE_SECRET');
    $site = is_string($site) ? trim($site) : '';
    $secret = is_string($secret) ? trim($secret) : '';
    $path = private_dir() . '/turnstile.json';
    if (is_file($path)) {
        $raw = @file_get_contents($path);
        $data = is_string($raw) ? json_decode($raw, true) : null;
        if (is_array($data)) {
            if ($site === '' && isset($data['site_key']) && is_string($data['site_key'])) {
                $site = trim($data['site_key']);
            }
            if ($secret === '' && isset($data['secret']) && is_string($data['secret'])) {
                $secret = trim($data['secret']);
            }
        }
    }
    return [$site, $secret];
}

function turnstile_post($body) {
    if (function_exists('curl_init')) {
        $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
        if ($ch === false) return '';
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
        return is_string($raw) ? $raw : '';
    }
    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $body,
        'timeout' => 5,
    ]]);
    $raw = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
    return is_string($raw) ? $raw : '';
}

function turnstile_passes($secret, $token) {
    $pass = '1x0000000000000000000000000000000AA';
    $failKey = '2x0000000000000000000000000000000AA';
    if ($token === '' || strlen($token) > 2048 || preg_match('/[\x00-\x20\x7F]/', $token)) {
        return false;
    }
    if (hash_equals($pass, $secret)) return true;
    if (hash_equals($failKey, $secret)) return false;
    $raw = turnstile_post(http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]));
    $data = json_decode($raw, true);
    return is_array($data) && !empty($data['success']);
}

function abuse_fold($text) {
    $text = mb_strtolower($text, 'UTF-8');
    $text = str_replace(['ß', 'ẞ', "\u{0307}"], ['ss', 'ss', ''], $text);
    $text = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}\x{00AD}]/u', '', $text);
    return strtr($text, ['@' => 'a', '$' => 's', '0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't']);
}

function abuse_rules() {
    static $rules = null;
    if ($rules !== null) return $rules;
    $path = private_dir() . '/abuse-terms.json';
    $raw = @file_get_contents($path);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($data) || !is_array($data['terms'] ?? null) ||
            !is_array($data['prefixes'] ?? null) || !is_array($data['masked'] ?? null)) {
        fail('error:unavailable', 503);
    }
    $rules = ['terms' => [], 'prefixes' => [], 'masked' => []];
    foreach ($rules as $key => $bucket) {
        foreach ($data[$key] as $item) {
            if (!is_string($item)) fail('error:unavailable', 503);
            $norm = preg_replace('/[^\p{L}]+/u', '', abuse_fold($item));
            if ($norm === '' || mb_strlen($norm, 'UTF-8') < 3) continue;
            $rules[$key][$norm] = 1;
        }
    }
    if (!$rules['terms'] && !$rules['prefixes'] && !$rules['masked']) {
        fail('error:unavailable', 503);
    }
    return $rules;
}

function abuse_tokens($text) {
    $text = abuse_fold($text);
    $tokens = [];
    $masked = [];
    foreach (preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) as $chunk) {
        if (preg_match('/[^\p{L}]/u', $chunk)) {
            $flat = preg_replace('/[^\p{L}]+/u', '', $chunk);
            if (mb_strlen($flat, 'UTF-8') >= 3) $masked[] = $flat;
        }
    }
    $parts = preg_split('/[^\p{L}]+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
    $run = '';
    foreach ($parts as $part) {
        if (mb_strlen($part, 'UTF-8') === 1) {
            $run .= $part;
            continue;
        }
        if (mb_strlen($run, 'UTF-8') >= 3) $tokens[] = $run;
        $run = '';
        $tokens[] = $part;
    }
    if (mb_strlen($run, 'UTF-8') >= 3) $tokens[] = $run;
    return [$tokens, $masked];
}

function abuse_hit($token, $rules, $allowMasked) {
    if (isset($rules['terms'][$token])) return true;
    if ($allowMasked && isset($rules['masked'][$token])) return true;
    $length = mb_strlen($token, 'UTF-8');
    foreach ($rules['prefixes'] as $prefix => $_) {
        $prefixLen = mb_strlen($prefix, 'UTF-8');
        if ($length >= $prefixLen && mb_substr($token, 0, $prefixLen, 'UTF-8') === $prefix) {
            return true;
        }
    }
    if (!preg_match('/(\p{L})\1/u', $token) || $length > 40) return false;
    foreach ($rules['terms'] as $term => $_) {
        if (mb_strlen($term, 'UTF-8') < 3) continue;
        $pattern = '/^';
        foreach (preg_split('//u', $term, -1, PREG_SPLIT_NO_EMPTY) as $ch) {
            $pattern .= preg_quote($ch, '/') . '+';
        }
        if (preg_match($pattern . '$/u', $token)) return true;
    }
    return false;
}

function message_is_abusive($name, $subject, $message) {
    if (preg_match_all('#https?://#i', $subject . "\n" . $message) >= 3) return true;
    $rules = abuse_rules();
    foreach ([$name, $subject, $message] as $text) {
        [$tokens, $masked] = abuse_tokens($text);
        foreach ($tokens as $token) {
            if (abuse_hit($token, $rules, false)) return true;
        }
        foreach ($masked as $token) {
            if (abuse_hit($token, $rules, true)) return true;
        }
    }
    return false;
}

function submission_too_fast() {
    $raw = field('form_started');
    if (!preg_match('/^\d{10,13}$/', $raw)) return true;
    $started = (int) $raw;
    if ($started < 100000000000) $started *= 1000;
    $now = (int) round(microtime(true) * 1000);
    if ($started > $now + 15000) return true;
    $age = $now - $started;
    return $age < 3000 || $age > 7 * 24 * 3600 * 1000;
}

if (field('website') !== '') {
    echo "success";
    exit;
}

$name = bounded_field('name', 120);
$email = bounded_field('email', 200);
$type = bounded_field('feedback_type', 20);
$subject = bounded_field('subject', 200);
$message = bounded_field('message', 5000, true);
$url = bounded_field('related_url', 500);
$privacy = bounded_field('privacyconfirm', 3);
$pageUrl = bounded_field('page_url', 2048);

if ($name === '') {
    fail('error:name');
}
if (!preg_match('/^\\p{L}[\\p{L}\\p{M} .\'’\\-]*$/u', $name)) {
    fail('error:name_invalid');
}
if (looks_unsafe($name) || looks_unsafe($subject) || looks_unsafe($message)) {
    fail('error:unsafe');
}
if ($email === '') {
    fail('error:email_required');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('error:email');
}
if (!in_array($type, ['general', 'suggestion', 'technical', 'correction', 'other'], true)) {
    fail('error:type');
}
if ($subject === '') {
    fail('error:subject');
}
if ($message === '') {
    fail('error:message');
}
foreach ([$url, $pageUrl] as $address) {
    if ($address === '') continue;
    if (preg_match('/\\s/', $address) || strpos($address, chr(92)) !== false) {
        fail('error:url');
    }
    if (!preg_match('#^/(?!/)#', $address) &&
            (!filter_var($address, FILTER_VALIDATE_URL) ||
             !in_array(strtolower(parse_url($address, PHP_URL_SCHEME) ?? ''), ['http', 'https'], true))) {
        fail('error:url');
    }
}
if ($privacy !== 'yes') {
    fail('error:privacy');
}
if (submission_too_fast()) {
    rate_limit();
    fail('error:too_fast');
}
if (message_is_abusive($name, $subject, $message)) {
    rate_limit();
    fail('error:abuse');
}
$turnstileSecret = turnstile_settings()[1];
if ($turnstileSecret !== '' && !turnstile_passes($turnstileSecret, field('cf-turnstile-response'))) {
    rate_limit();
    fail('error:challenge', 403);
}

$attachmentName = '';
$attachmentBody = '';
$attachmentType = 'application/octet-stream';
if (array_diff(array_keys($_FILES), ['attachment'])) fail('error:file_invalid');
if (isset($_FILES['attachment'])) {
    $file = $_FILES['attachment'];
    foreach (['error', 'name', 'size', 'tmp_name'] as $key) {
        if (!isset($file[$key]) || !is_scalar($file[$key])) fail('error:file_invalid');
    }
}
if (isset($_FILES['attachment']) && $file['error'] !== UPLOAD_ERR_NO_FILE) {
    if (in_array((int) $file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        fail('error:file_size');
    }
    if ((int) $file['error'] !== UPLOAD_ERR_OK) {
        fail('error:file_invalid');
    }
    $orig = (string) ($file['name'] ?? '');
    if (strlen($orig) > 255 || preg_match('/[\x00-\x1F\x7F]/', $orig)) fail('error:file_invalid');
    $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
    if (preg_match('/\\.(php\\d?|phtml|phar|svg|html?|js|exe|dll|sh|bat|cmd|htaccess)(?:\\.|$)/i', $orig)) {
        fail('error:file_type');
    }
    if (!isset($okExt[$ext])) {
        fail('error:file_type');
    }
    if ((int) $file['size'] > $maxFile) {
        fail('error:file_size');
    }
    $tmp = (string) $file['tmp_name'];
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        fail('error:file_invalid');
    }
    $size = filesize($tmp);
    if ($size === false || $size < 1 || $size > $maxFile) fail('error:file_size');
    if (!function_exists('finfo_open')) fail('error:unavailable', 503);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if (!$finfo) fail('error:unavailable', 503);
    $attachmentType = finfo_file($finfo, $tmp);
    finfo_close($finfo);
    $types = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
        'webp' => 'image/webp', 'gif' => 'image/gif', 'pdf' => 'application/pdf'];
    if ($attachmentType !== $types[$ext]) fail('error:file_type');
    if ($ext !== 'pdf' && @getimagesize($tmp) === false) fail('error:file_type');
    $attachmentBody = file_get_contents($tmp, false, null, 0, $maxFile + 1);
    if ($attachmentBody === false || strlen($attachmentBody) !== $size) {
        fail('error:file_invalid');
    }
    // Never interpolate an untrusted filename into MIME headers.
    $attachmentName = 'attachment.' . $ext;
}

rate_limit();

$mailSubject = 'Birİnci feedback: ' . preg_replace('/[\\r\\n]+/', ' ', $subject);
$lines = [
    'Name: ' . $name,
    'Email: ' . $email,
    'Type: ' . $type,
    'Subject: ' . $subject,
    'URL: ' . $url,
    'Page: ' . $pageUrl,
    '',
    $message,
];
if ($attachmentBody !== '') {
    $lines[] = '';
    $lines[] = 'The attachment was checked for type and size only. Open it only if you trust the sender.';
}
$bodyText = implode("\n", $lines);

$encodedFrom = '=?UTF-8?B?' . base64_encode('Birİnci') . '?= <' . $from . '>';
$headers = [
    'From: ' . $encodedFrom,
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
];

if ($attachmentBody !== '') {
    $boundary = 'b' . bin2hex(random_bytes(12));
    $headers[] = 'Content-Type: multipart/mixed; boundary=' . $boundary;
    $payload = '--' . $boundary . "\r\n";
    $payload .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $payload .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $payload .= $bodyText . "\r\n";
    $payload .= '--' . $boundary . "\r\n";
    $payload .= 'Content-Type: ' . $attachmentType . '; name="' . $attachmentName . "\"\r\n";
    $payload .= "Content-Transfer-Encoding: base64\r\n";
    $payload .= 'Content-Disposition: attachment; filename="' . $attachmentName . "\"\r\n\r\n";
    $payload .= chunk_split(base64_encode($attachmentBody));
    $payload .= '--' . $boundary . "--\r\n";
} else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $payload = $bodyText;
}

$ok = @mail($to, '=?UTF-8?B?' . base64_encode($mailSubject) . '?=', $payload, implode("\r\n", $headers));
if (!$ok) {
    fail('error:send', 500);
}
echo "success";
