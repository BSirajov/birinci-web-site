<?php
namespace Birinci\Feedback;

header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

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
