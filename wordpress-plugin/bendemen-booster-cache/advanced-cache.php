<?php
/**
 * Bendemen Booster early page-cache drop-in.
 * Loaded by WordPress only when WP_CACHE is true.
 * Cache is active only while cache-enabled.flag exists.
 */
if (!defined('ABSPATH') || !defined('WP_CONTENT_DIR')) { return; }

$bb_cache_dir = WP_CONTENT_DIR . '/cache/bendemen-booster-page-cache';
$bb_enabled_flag = $bb_cache_dir . '/cache-enabled.flag';
if (!is_file($bb_enabled_flag)) { return; }

$bb_method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';
if ($bb_method !== 'GET') { return; }

$bb_uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '/';
$bb_path = (string) parse_url($bb_uri, PHP_URL_PATH);
$bb_query = (string) parse_url($bb_uri, PHP_URL_QUERY);
$bb_host = isset($_SERVER['HTTP_HOST']) ? strtolower((string) $_SERVER['HTTP_HOST']) : '';
$bb_host = preg_replace('/:\\d+$/', '', $bb_host);

// Never cache query-string requests: this avoids leaking campaign, nonce, search, filter or personalized output.
if ($bb_query !== '' || !in_array($bb_host, ['bendemen.com', 'www.bendemen.com'], true)) { return; }

// Never cache authenticated, partial, API, or non-HTML requests.
if (!empty($_SERVER['HTTP_AUTHORIZATION']) || !empty($_SERVER['HTTP_RANGE'])) { return; }
$bb_accept = isset($_SERVER['HTTP_ACCEPT']) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
if ($bb_accept !== '' && stripos($bb_accept, 'text/html') === false) { return; }

// Bypass all cookies, including WooCommerce sessions and unknown personalization/consent plugins.
if (!empty($_SERVER['HTTP_COOKIE'])) { return; }

$bb_excluded = [
    '#^/wp-admin(?:/|$)#i',
    '#^/wp-login\\.php$#i',
    '#^/wp-json(?:/|$)#i',
    '#^/wp-admin/admin-ajax\\.php$#i',
    '#^/wc-api(?:/|$)#i',
    '#^/cart(?:/|$)#i',
    '#^/checkout(?:/|$)#i',
    '#^/my-account(?:/|$)#i',
    '#^/order-pay(?:/|$)#i',
    '#^/order-received(?:/|$)#i',
    '#^/account(?:/|$)#i',
    '#^/search(?:/|$)#i',
];
foreach ($bb_excluded as $bb_pattern) {
    if (preg_match($bb_pattern, $bb_path)) { return; }
}
if (strpos($bb_path, '/?') !== false || preg_match('#\\.(?:css|js|mjs|json|xml|txt|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|pdf|zip|gz|mp4|webm)$#i', $bb_path)) { return; }

$bb_cache_key = hash('sha256', $bb_host . '|' . $bb_path);
$bb_cache_file = $bb_cache_dir . '/' . $bb_cache_key . '.html';
$bb_ttl = 600;

if (is_file($bb_cache_file) && (time() - (int) @filemtime($bb_cache_file)) < $bb_ttl && is_readable($bb_cache_file)) {
    if (!headers_sent()) {
        header('X-Bendemen-Cache: HIT');
        header('Cache-Control: public, max-age=0, s-maxage=600');
        header('Content-Type: text/html; charset=UTF-8');
    }
    readfile($bb_cache_file);
    exit;
}

if (!headers_sent()) { header('X-Bendemen-Cache: MISS'); }

// Capture the final HTML only. Store at shutdown after WordPress has set its response headers.
$bb_buffer = '';
$bb_base_level = ob_get_level();
ob_start(static function ($chunk) use (&$bb_buffer) {
    $bb_buffer .= $chunk;
    return $chunk;
});
register_shutdown_function(static function () use (&$bb_buffer, $bb_base_level, $bb_cache_file, $bb_cache_dir, $bb_enabled_flag, $bb_ttl) {
    // Flush nested buffers through our capture callback before deciding whether to cache.
    while (ob_get_level() > $bb_base_level) {
        if (!@ob_end_flush()) { break; }
    }
    if (!is_file($bb_enabled_flag) || !is_dir($bb_cache_dir) || !is_writable($bb_cache_dir)) { return; }
    if (http_response_code() !== 200 || strlen($bb_buffer) < 256 || strlen($bb_buffer) > 5 * 1024 * 1024) { return; }
    if (stripos($bb_buffer, '<html') === false && stripos($bb_buffer, '<!doctype html') === false) { return; }
    foreach (headers_list() as $header) {
        if (stripos($header, 'Set-Cookie:') === 0 || stripos($header, 'Cache-Control: no-store') === 0 || stripos($header, 'Cache-Control: private') === 0 || stripos($header, 'X-Robots-Tag: noindex') === 0) { return; }
        if (stripos($header, 'Content-Type:') === 0 && stripos($header, 'text/html') === false) { return; }
    }
    $tmp = $bb_cache_file . '.' . bin2hex(random_bytes(6)) . '.tmp';
    if (@file_put_contents($tmp, $bb_buffer, LOCK_EX) !== false) {
        @chmod($tmp, 0640);
        @rename($tmp, $bb_cache_file);
    }
});
