<?php
header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo "error:method";
    exit;
}

$to = 'info@birinci.cloud';
$from = 'noreply@birinci.cloud';
$maxFile = 5 * 1024 * 1024;
$okExt = ['jpg' => 1, 'jpeg' => 1, 'png' => 1, 'webp' => 1, 'gif' => 1, 'pdf' => 1];

function field($key) {
    return isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
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

$name = field('name');
$email = field('email');
$type = field('feedback_type');
$subject = field('subject');
$message = field('message');
$url = field('related_url');
$privacy = field('privacyconfirm');
$pageUrl = field('page_url');

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
if (!preg_match('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/', $email) || preg_match('/[\\r\\n]/', $email)) {
    fail('error:email');
}
if ($type === '') {
    fail('error:type');
}
if ($subject === '') {
    fail('error:subject');
}
if ($message === '') {
    fail('error:message');
}
if ($url !== '') {
    if (strlen($url) > 500 || preg_match('/\\s/', $url)) {
        fail('error:url');
    }
    if (!preg_match('#^(https?://|/[^/])#i', $url)) {
        fail('error:url');
    }
}
if ($privacy !== 'yes') {
    fail('error:privacy');
}

$attachmentName = '';
$attachmentBody = '';
$attachmentType = 'application/octet-stream';
if (!empty($_FILES['attachment']) && (int) ($_FILES['attachment']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['attachment'];
    if ((int) $file['error'] !== UPLOAD_ERR_OK) {
        fail('error:file_invalid');
    }
    $orig = (string) ($file['name'] ?? '');
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
    $attachmentBody = file_get_contents($tmp);
    if ($attachmentBody === false) {
        fail('error:file_invalid');
    }
    $attachmentName = preg_replace('/[\\r\\n"]+/', '', $orig);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $detected = finfo_file($finfo, $tmp);
        finfo_close($finfo);
        if (is_string($detected) && $detected !== '') {
            $attachmentType = $detected;
        }
    }
}

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
