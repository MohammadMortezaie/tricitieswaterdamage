<?php

declare(strict_types=1);

// Load variables from .env if present (cPanel can still override via real environment vars).
$envPath = __DIR__ . '/.env';
if (is_readable($envPath)) {
    $envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($envLines as $envLine) {
        $envLine = trim($envLine);
        if ($envLine === '' || substr($envLine, 0, 1) === '#') {
            continue;
        }

        $pair = explode('=', $envLine, 2);
        if (count($pair) !== 2) {
            continue;
        }

        $envKey = trim($pair[0]);
        $envValue = trim($pair[1]);

        if ($envKey === '') {
            continue;
        }

        $first = substr($envValue, 0, 1);
        $last = substr($envValue, -1);
        if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
            $envValue = substr($envValue, 1, -1);
        }

        if (getenv($envKey) === false) {
            putenv($envKey . '=' . $envValue);
            $_ENV[$envKey] = $envValue;
            $_SERVER[$envKey] = $envValue;
        }
    }
}

// Recommended: set RECAPTCHA_SECRET, CONTACT_EMAIL, and CONTACT_FROM_EMAIL in cPanel environment.
$recaptchaSecret = getenv('RECAPTCHA_SECRET') ?: '6LdfDy8sAAAAAEzr8cYgebNcewzkVGY3_RgFJZbv';
$contactEmail = getenv('CONTACT_EMAIL') ?: 'moemortezaei@gmail.com';
$fromEmail = getenv('CONTACT_FROM_EMAIL') ?: 'do-not-reply@webpulse.ca';
$redirectBase = '/contact-us';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $redirectBase);
    exit;
}

function redirect_with_error(string $base): void
{
    header('Location: ' . $base . '?error=1');
    exit;
}

if (!empty($_POST['website'] ?? '')) {
    redirect_with_error($redirectBase);
}

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$token = trim((string) ($_POST['recaptcha_token'] ?? ''));

if ($name === '' || $phone === '' || $message === '' || $token === '') {
    redirect_with_error($redirectBase);
}

$postData = http_build_query([
    'secret' => $recaptchaSecret,
    'response' => $token,
    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
]);

$verifyResponse = '';

if (function_exists('curl_init')) {
    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
    ]);
    $verifyResponse = (string) curl_exec($ch);
    curl_close($ch);
} else {
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $postData,
            'timeout' => 8,
        ]
    ];
    $context = stream_context_create($opts);
    $verifyResponse = (string) file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
}

$verifyJson = json_decode($verifyResponse, true);
$verified = is_array($verifyJson)
    && !empty($verifyJson['success'])
    && ($verifyJson['action'] ?? '') === 'contact_form_submit'
    && (float) ($verifyJson['score'] ?? 0) >= 0.5;

if (!$verified) {
    redirect_with_error($redirectBase);
}

$subject = 'Emergency Service Request - Tri Cities Water Damage';

$clean = static function (string $value): string {
    $value = str_replace(["\r", "\n"], ' ', $value);
    return trim($value);
};

$emailBody = "New emergency service request:\n\n"
    . 'Name: ' . $clean($name) . "\n"
    . 'Phone: ' . $clean($phone) . "\n"
    . "How we can help you:\n"
    . $message . "\n";

$headers = [
    'From: ' . $fromEmail,
    'Reply-To: ' . $fromEmail,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = @mail($contactEmail, $subject, $emailBody, implode("\r\n", $headers));

if (!$sent) {
    redirect_with_error($redirectBase);
}

header('Location: ' . $redirectBase . '?sent=1');
exit;
