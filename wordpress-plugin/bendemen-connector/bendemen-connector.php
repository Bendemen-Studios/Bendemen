<?php
/**
 * Plugin Name: Bendemen Connector
 * Description: Central WooCommerce connector for Bendemen accounts, Points & Rewards, shipping rates, refunds and PDF invoices.
 * Version: 1.1.0
 * Requires Plugins: woocommerce
 * Requires PHP: 7.4
 */
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    register_rest_route('bendemen/v1', '/account/register', [
        'methods' => 'POST', 'callback' => 'bendemen_bridge_register',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/account/login', [
        'methods' => 'POST', 'callback' => 'bendemen_bridge_login',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/points/(?P<user_id>\d+)', [
        'methods' => 'GET', 'callback' => 'bendemen_bridge_points',
        'permission_callback' => 'bendemen_bridge_authorized',
        'args' => ['user_id' => ['validate_callback' => function ($v) { return is_numeric($v) && (int) $v > 0; }]],
    ]);
    register_rest_route('bendemen/v1', '/points/quote', [
        'methods' => 'POST', 'callback' => 'bendemen_bridge_quote_points',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/points/redeem', [
        'methods' => 'POST', 'callback' => 'bendemen_bridge_redeem_points',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/refunds/access-token', [
        'methods' => 'POST', 'callback' => 'bendemen_bridge_create_refund_access',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/account/orders/(?P<user_id>\\d+)', [
        'methods' => 'GET', 'callback' => 'bendemen_bridge_account_orders',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/account/orders/invoice-token', [
        'methods' => 'POST', 'callback' => 'bendemen_bridge_create_invoice_access',
        'permission_callback' => 'bendemen_bridge_authorized',
    ]);
    register_rest_route('bendemen/v1', '/shipping-rates', [
        'methods' => 'POST',
        'callback' => 'bendemen_get_shipping_rates',
        'permission_callback' => function () { return current_user_can('manage_woocommerce'); },
        'args' => [
            'items' => ['required' => true, 'type' => 'array'],
            'destination' => ['required' => true, 'type' => 'object'],
        ],
    ]);
});

function bendemen_bridge_authorized($request) {
    if (!defined('BENDEMEN_BRIDGE_SECRET') || !is_string(BENDEMEN_BRIDGE_SECRET) || strlen(BENDEMEN_BRIDGE_SECRET) < 32) {
        return new WP_Error('bendemen_bridge_not_configured', 'Account bridge is not configured.', ['status' => 503]);
    }
    $provided = (string) $request->get_header('x-bendemen-bridge-secret');
    if ($provided === '' || !hash_equals(BENDEMEN_BRIDGE_SECRET, $provided)) {
        return new WP_Error('bendemen_bridge_forbidden', 'Forbidden.', ['status' => 403]);
    }
    return true;
}

function bendemen_bridge_user_payload($user) {
    return [
        'id' => (int) $user->ID,
        'email' => (string) $user->user_email,
        'firstName' => (string) get_user_meta($user->ID, 'first_name', true),
        'lastName' => (string) get_user_meta($user->ID, 'last_name', true),
    ];
}

function bendemen_bridge_register(WP_REST_Request $request) {
    if (!function_exists('wc_create_new_customer') || !class_exists('WC_Points_Rewards_Manager')) {
        return new WP_Error('bendemen_dependencies_missing', 'WooCommerce and WooCommerce Points & Rewards must be active.', ['status' => 503]);
    }
    $email = sanitize_email((string) $request->get_param('email'));
    $password = (string) $request->get_param('password');
    $first = sanitize_text_field((string) $request->get_param('firstName'));
    $last = sanitize_text_field((string) $request->get_param('lastName'));
    if (!is_email($email) || strlen($password) < 12 || strlen($password) > 256 || $first === '' || $last === '') {
        return new WP_Error('bendemen_invalid_registration', 'Controleer je gegevens. Gebruik een wachtwoord van minimaal 12 tekens.', ['status' => 400]);
    }
    if (email_exists($email)) {
        return new WP_Error('bendemen_email_exists', 'Er bestaat al een account met dit e-mailadres. Log in of gebruik wachtwoordherstel.', ['status' => 409]);
    }
    $customer_id = wc_create_new_customer($email, $email, $password, [
        'first_name' => $first, 'last_name' => $last,
    ]);
    if (is_wp_error($customer_id)) {
        return new WP_Error('bendemen_registration_failed', 'Account aanmaken is niet gelukt.', ['status' => 400]);
    }
    return rest_ensure_response(bendemen_bridge_user_payload(get_user_by('id', $customer_id)));
}

function bendemen_bridge_login(WP_REST_Request $request) {
    $email = sanitize_email((string) $request->get_param('email'));
    $password = (string) $request->get_param('password');
    $user = is_email($email) ? get_user_by('email', $email) : false;
    $authenticated = $user ? wp_authenticate($user->user_login, $password) : false;
    if (!$user || is_wp_error($authenticated) || !$authenticated || (int) $authenticated->ID !== (int) $user->ID || !in_array('customer', (array) $user->roles, true)) {
        return new WP_Error('bendemen_login_failed', 'E-mailadres of wachtwoord is onjuist.', ['status' => 401]);
    }
    return rest_ensure_response(bendemen_bridge_user_payload($user));
}

function bendemen_bridge_points(WP_REST_Request $request) {
    $user_id = (int) $request['user_id'];
    if (!get_user_by('id', $user_id) || !class_exists('WC_Points_Rewards_Manager')) {
        return new WP_Error('bendemen_points_unavailable', 'Points & Rewards is niet beschikbaar.', ['status' => 503]);
    }
    $balance = max(0, (int) WC_Points_Rewards_Manager::get_users_points($user_id));
    return rest_ensure_response([
        'balance' => $balance,
        'label' => (isset($GLOBALS['wc_points_rewards']) && is_object($GLOBALS['wc_points_rewards']) && method_exists($GLOBALS['wc_points_rewards'], 'get_points_label'))
            ? (string) $GLOBALS['wc_points_rewards']->get_points_label($balance)
            : (string) get_option('wc_points_rewards_points_label', 'punten'),
    ]);
}


/**
 * Run the official Points & Rewards cart calculation for a headless checkout.
 * This deliberately uses the plugin's cart engine so product/category limits,
 * minimums, tax mode, and global discount caps remain authoritative.
 */
function bendemen_bridge_quote_points(WP_REST_Request $request) {
    if (!class_exists('WC_Points_Rewards_Manager') || !class_exists('WC_Points_Rewards_Cart_Checkout') || !function_exists('wc_get_product')) {
        return new WP_Error('bendemen_points_unavailable', 'WooCommerce Points & Rewards is niet beschikbaar.', ['status' => 503]);
    }
    $user_id = absint($request->get_param('user_id'));
    $user = get_user_by('id', $user_id);
    $items = $request->get_param('items');
    $destination = $request->get_param('destination');
    $requested_points = absint($request->get_param('points'));
    if (!$user || !in_array('customer', (array) $user->roles, true) || !is_array($items) || count($items) < 1 || count($items) > 30 || !is_array($destination)) {
        return new WP_Error('bendemen_invalid_quote', 'Ongeldige puntenberekening.', ['status' => 400]);
    }
    if (!function_exists('wc_load_cart')) {
        return new WP_Error('bendemen_cart_unavailable', 'WooCommerce winkelwagen is niet beschikbaar.', ['status' => 503]);
    }
    $previous_user = get_current_user_id();
    wp_set_current_user($user_id);
    if (function_exists('wc_load_cart') && (!WC()->cart || !WC()->customer || !WC()->session)) {
        wc_load_cart();
    }
    if (!WC()->cart || !WC()->customer || !WC()->session) {
        wp_set_current_user($previous_user);
        return new WP_Error('bendemen_cart_unavailable', 'WooCommerce winkelwagen kon niet worden gestart.', ['status' => 503]);
    }
    $cart = WC()->cart;
    $session = WC()->session;
    $country = strtoupper(sanitize_text_field((string) ($destination['country'] ?? 'NL')));
    $postcode = sanitize_text_field((string) ($destination['postcode'] ?? ''));
    $city = sanitize_text_field((string) ($destination['city'] ?? ''));
    $address = sanitize_text_field((string) ($destination['address_1'] ?? ''));
    $cart->empty_cart(true);
    WC()->customer->set_billing_country($country);
    WC()->customer->set_shipping_country($country);
    WC()->customer->set_shipping_postcode($postcode);
    WC()->customer->set_shipping_city($city);
    WC()->customer->set_shipping_address($address);
    $discount_session_key = 'wc_points_rewards_discount_amount';
    $old_requested = $session->get($discount_session_key);
    try {
        foreach ($items as $item) {
            $product_id = absint($item['productId'] ?? 0);
            $quantity = absint($item['quantity'] ?? 0);
            $variation_id = absint($item['variationId'] ?? 0);
            if (!$product_id || $quantity < 1 || $quantity > 99) {
                return new WP_Error('bendemen_invalid_cart_item', 'Een winkelwagenregel is ongeldig.', ['status' => 400]);
            }
            $product = wc_get_product($variation_id ?: $product_id);
            if (!$product || !$product->is_purchasable() || !$product->is_in_stock()) {
                return new WP_Error('bendemen_product_unavailable', 'Een product is niet meer beschikbaar.', ['status' => 409]);
            }
            $variation = $variation_id ? $product->get_variation_attributes() : [];
            if (!$cart->add_to_cart($product_id, $quantity, $variation_id, $variation)) {
                return new WP_Error('bendemen_cart_item_failed', 'Een product kon niet aan de winkelwagen worden toegevoegd.', ['status' => 409]);
            }
        }
        $cart->calculate_totals();
        $balance = max(0, (int) WC_Points_Rewards_Manager::get_users_points($user_id));
        $max_discount = (float) WC_Points_Rewards_Cart_Checkout::get_discount_for_redeeming_points(false, null, false);
        $max_points = min($balance, (int) WC_Points_Rewards_Manager::calculate_points_for_discount($max_discount));
        if ($requested_points <= 0) {
            return rest_ensure_response(['balance' => $balance, 'maxPoints' => $max_points, 'points' => 0, 'discount' => 0]);
        }
        if ($requested_points > $max_points) {
            return new WP_Error('bendemen_points_too_high', 'Je kunt voor deze bestelling maximaal ' . $max_points . ' punten inwisselen.', ['status' => 400]);
        }
        $session->set($discount_session_key, $requested_points);
        $discount = (float) WC_Points_Rewards_Cart_Checkout::get_discount_for_redeeming_points(true, null, false);
        $points_used = (int) WC_Points_Rewards_Manager::calculate_points_for_discount($discount);
        if ($discount <= 0 || $points_used < 1) {
            return new WP_Error('bendemen_points_no_discount', 'Er kan voor deze bestelling geen puntenkorting worden toegepast.', ['status' => 400]);
        }
        if ('yes' !== get_option('wc_points_rewards_partial_redemption_enabled') && $requested_points < $max_points) {
            return new WP_Error('bendemen_partial_disabled', 'Gedeeltelijk punten inwisselen is uitgeschakeld in WooCommerce Points & Rewards. Kies maximaal ' . $max_points . ' punten.', ['status' => 400]);
        }
        return rest_ensure_response([
            'balance' => $balance, 'maxPoints' => $max_points,
            'points' => min($points_used, $balance), 'discount' => number_format($discount, 2, '.', ''),
        ]);
    } catch (Throwable $error) {
        return new WP_Error('bendemen_quote_failed', 'Puntenkorting kon niet worden berekend.', ['status' => 500]);
    } finally {
        if ($old_requested === null || $old_requested === '') $session->__unset($discount_session_key);
        else $session->set($discount_session_key, $old_requested);
        $cart->empty_cart(true);
        wp_set_current_user($previous_user);
    }
}

/** Deduct points once at order creation; the official plugin restores them on failed/cancelled/refunded orders. */
function bendemen_bridge_redeem_points(WP_REST_Request $request) {
    if (!class_exists('WC_Points_Rewards_Manager') || !function_exists('wc_get_order')) {
        return new WP_Error('bendemen_points_unavailable', 'WooCommerce Points & Rewards is niet beschikbaar.', ['status' => 503]);
    }
    $user_id = absint($request->get_param('user_id'));
    $order_id = absint($request->get_param('order_id'));
    $points = absint($request->get_param('points'));
    $discount = (float) $request->get_param('discount');
    $user = get_user_by('id', $user_id);
    $order = wc_get_order($order_id);
    if (!$user || !$order || $points < 1 || $discount <= 0 || (int) $order->get_customer_id() !== $user_id) {
        return new WP_Error('bendemen_invalid_redemption', 'Punteninwisseling kon niet worden gevalideerd.', ['status' => 400]);
    }
    $already = (int) $order->get_meta('_wc_points_redeemed', true);
    if ($already > 0) {
        return rest_ensure_response(['ok' => $already === $points, 'points' => $already]);
    }
    if (!in_array($order->get_status(), ['pending', 'on-hold'], true)) {
        return new WP_Error('bendemen_order_state', 'Punten kunnen alleen aan een open bestelling worden gekoppeld.', ['status' => 409]);
    }
    $lock_key = 'bendemen_points_lock_' . $user_id;
    if (!add_option($lock_key, (string) time(), '', false)) {
        return new WP_Error('bendemen_points_busy', 'Je puntensaldo wordt al bijgewerkt. Probeer het opnieuw.', ['status' => 409]);
    }
    try {
        $balance = (int) WC_Points_Rewards_Manager::get_users_points($user_id);
        if ($balance < $points) {
            return new WP_Error('bendemen_points_balance_changed', 'Je puntensaldo is gewijzigd. Haal je saldo opnieuw op.', ['status' => 409]);
        }
        $success = WC_Points_Rewards_Manager::decrease_points($user_id, $points, 'order-redeem', ['discount_amount' => number_format($discount, 2, '.', ''), 'source' => 'bendemen-headless'], $order_id);
        if (!$success) return new WP_Error('bendemen_points_debit_failed', 'Punten konden niet worden afgeschreven.', ['status' => 500]);
        $order->update_meta_data('_wc_points_redeemed', $points);
        $order->update_meta_data('_wc_points_logged_redemption', ['points' => $points, 'amount' => number_format($discount, 2, '.', ''), 'discount_code' => 'bendemen-headless-points']);
        $order->update_meta_data('_bendemen_points_discount', number_format($discount, 2, '.', ''));
        $order->add_order_note(sprintf('%1$d punten ingewisseld voor %2$s korting via de Bendemen-webshop.', $points, wc_price($discount)));
        $order->save();
        return rest_ensure_response(['ok' => true, 'points' => $points]);
    } finally {
        delete_option($lock_key);
    }
}

/** Make earned points respect the custom points-discount fee used by the headless checkout. */
add_filter('wc_points_rewards_points_earned_for_purchase', function ($earned, $order) {
    if (!is_object($order) || !method_exists($order, 'get_meta')) return $earned;
    $discount = (float) $order->get_meta('_bendemen_points_discount', true);
    if ($discount <= 0 || !class_exists('WC_Points_Rewards_Manager')) return $earned;
    $deduction = min((int) $earned, (int) WC_Points_Rewards_Manager::round_the_points(WC_Points_Rewards_Manager::calculate_points($discount)));
    return max(0, (int) $earned - $deduction);
}, 20, 2);


/**
 * Create a short-lived, one-time handoff from the headless account to the
 * native WooCommerce My Account area. YITH remains responsible for its own
 * refund-request forms, eligibility checks, approvals and refund processing.
 */
function bendemen_bridge_create_refund_access(WP_REST_Request $request) {
    $user_id = absint($request->get_param('user_id'));
    $user = get_user_by('id', $user_id);
    if (!$user || !in_array('customer', (array) $user->roles, true)) {
        return new WP_Error('bendemen_refund_customer_required', 'Log in met een klantaccount om een terugbetaling aan te vragen.', ['status' => 403]);
    }
    if (!class_exists('WooCommerce')) {
        return new WP_Error('bendemen_refund_woocommerce_missing', 'WooCommerce is niet actief.', ['status' => 503]);
    }
    $yith_active = defined('YITH_WCARS_VERSION') || class_exists('YITH_WCARS') || class_exists('YITH_WCARS_Frontend');
    $active_plugins = (array) get_option('active_plugins', []);
    foreach ($active_plugins as $active_plugin) {
        if (strpos((string) $active_plugin, 'yith-advanced-refund-system-for-woocommerce') !== false) {
            $yith_active = true;
            break;
        }
    }
    $network_plugins = (array) get_site_option('active_sitewide_plugins', []);
    foreach (array_keys($network_plugins) as $active_plugin) {
        if (strpos((string) $active_plugin, 'yith-advanced-refund-system-for-woocommerce') !== false) {
            $yith_active = true;
            break;
        }
    }
    if (!$yith_active) {
        return new WP_Error('bendemen_yith_refunds_missing', 'Activeer eerst YITH Advanced Refund System for WooCommerce.', ['status' => 503]);
    }
    $token = bin2hex(random_bytes(32));
    $key = 'bendemen_refund_access_' . hash('sha256', $token);
    set_transient($key, $user_id, 90);
    $url = add_query_arg('bendemen_refund_access', $token, home_url('/'));
    return rest_ensure_response(['url' => esc_url_raw($url)]);
}

/** Consume the single-use token and establish a native WordPress customer session. */
add_action('template_redirect', function () {
    if (!isset($_GET['bendemen_refund_access'])) return;
    $token = sanitize_text_field(wp_unslash($_GET['bendemen_refund_access']));
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        wp_safe_redirect(wc_get_page_permalink('myaccount'));
        exit;
    }
    $key = 'bendemen_refund_access_' . hash('sha256', $token);
    $user_id = absint(get_transient($key));
    delete_transient($key);
    $user = $user_id ? get_user_by('id', $user_id) : false;
    if (!$user || !in_array('customer', (array) $user->roles, true)) {
        nocache_headers();
        wp_safe_redirect(wc_get_page_permalink('myaccount'));
        exit;
    }
    wp_set_current_user($user_id);
    wp_set_auth_cookie($user_id, true, is_ssl());
    do_action('wp_login', $user->user_login, $user);
    nocache_headers();
    $target = function_exists('wc_get_account_endpoint_url') ? wc_get_account_endpoint_url('orders') : wc_get_page_permalink('myaccount');
    wp_safe_redirect($target);
    exit;
}, 1);


/** Return the customer's own orders, using WooCommerce's filtered display number. */
function bendemen_bridge_account_orders(WP_REST_Request $request) {
    $user_id = absint($request['user_id']);
    $user = get_user_by('id', $user_id);
    if (!$user || !in_array('customer', (array) $user->roles, true)) {
        return new WP_Error('bendemen_orders_customer_required', 'Log in met een klantaccount om bestellingen te bekijken.', ['status' => 403]);
    }
    if (!function_exists('wc_get_orders')) {
        return new WP_Error('bendemen_orders_unavailable', 'WooCommerce is niet beschikbaar.', ['status' => 503]);
    }
    $orders = wc_get_orders([
        'customer_id' => $user_id,
        'limit' => 25,
        'orderby' => 'date',
        'order' => 'DESC',
        'return' => 'objects',
    ]);
    $result = [];
    foreach ($orders as $order) {
        if (!$order instanceof WC_Order) continue;
        $created = $order->get_date_created();
        $status = $order->get_status();
        $result[] = [
            'id' => (int) $order->get_id(),
            'number' => (string) $order->get_order_number(),
            'date' => $created ? $created->date(DATE_ATOM) : '',
            'status' => (string) wc_get_order_status_name($status),
            'statusKey' => (string) $status,
            'total' => (string) $order->get_total(),
            'currency' => (string) $order->get_currency(),
            'invoiceAvailable' => in_array($status, ['processing', 'completed', 'refunded'], true),
        ];
    }
    return rest_ensure_response(['orders' => $result]);
}

/** Create a one-time token for a PDF invoice belonging to this customer. */
function bendemen_bridge_create_invoice_access(WP_REST_Request $request) {
    $user_id = absint($request->get_param('user_id'));
    $order_id = absint($request->get_param('order_id'));
    $user = get_user_by('id', $user_id);
    $order = function_exists('wc_get_order') ? wc_get_order($order_id) : false;
    if (!$user || !in_array('customer', (array) $user->roles, true) || !$order || (int) $order->get_customer_id() !== $user_id) {
        return new WP_Error('bendemen_invoice_order_forbidden', 'Deze bestelling hoort niet bij dit account.', ['status' => 403]);
    }
    if (!in_array($order->get_status(), ['processing', 'completed', 'refunded'], true)) {
        return new WP_Error('bendemen_invoice_order_unpaid', 'De factuur is beschikbaar zodra de bestelling is betaald en verwerkt.', ['status' => 409]);
    }
    if (!bendemen_bridge_pdf_invoices_active()) {
        return new WP_Error('bendemen_invoice_plugin_missing', 'Activeer PDF Invoices & Packing Slips for WooCommerce.', ['status' => 503]);
    }
    $token = bin2hex(random_bytes(32));
    $key = 'bendemen_invoice_access_' . hash('sha256', $token);
    set_transient($key, ['user_id' => $user_id, 'order_id' => $order_id], 90);
    $url = add_query_arg('bendemen_invoice_access', $token, home_url('/'));
    return rest_ensure_response(['url' => esc_url_raw($url)]);
}

/** Detect the WP Overnight PDF Invoices & Packing Slips plugin, including network activation. */
function bendemen_bridge_pdf_invoices_active() {
    if (function_exists('WPO_WCPDF') || function_exists('wpo_wcpdf_get_document') || class_exists('WPO\\WC\\PDF_Invoices\\Main')) return true;
    $plugins = (array) get_option('active_plugins', []);
    $network_plugins = array_keys((array) get_site_option('active_sitewide_plugins', []));
    foreach (array_merge($plugins, $network_plugins) as $plugin) {
        if (strpos((string) $plugin, 'woocommerce-pdf-invoices-packing-slips') !== false) return true;
    }
    return false;
}

/** Consume a one-time invoice token, authenticate the owner, and let the PDF plugin generate the PDF. */
add_action('template_redirect', function () {
    if (!isset($_GET['bendemen_invoice_access'])) return;
    $token = sanitize_text_field(wp_unslash($_GET['bendemen_invoice_access']));
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        nocache_headers();
        wp_safe_redirect(wc_get_page_permalink('myaccount'));
        exit;
    }
    $key = 'bendemen_invoice_access_' . hash('sha256', $token);
    $payload = get_transient($key);
    delete_transient($key);
    $user_id = is_array($payload) ? absint($payload['user_id'] ?? 0) : 0;
    $order_id = is_array($payload) ? absint($payload['order_id'] ?? 0) : 0;
    $user = $user_id ? get_user_by('id', $user_id) : false;
    $order = $order_id && function_exists('wc_get_order') ? wc_get_order($order_id) : false;
    if (!$user || !in_array('customer', (array) $user->roles, true) || !$order ||
        (int) $order->get_customer_id() !== $user_id ||
        !in_array($order->get_status(), ['processing', 'completed', 'refunded'], true) ||
        !bendemen_bridge_pdf_invoices_active()) {
        nocache_headers();
        wp_safe_redirect(wc_get_page_permalink('myaccount'));
        exit;
    }
    wp_set_current_user($user_id);
    wp_set_auth_cookie($user_id, true, is_ssl());
    do_action('wp_login', $user->user_login, $user);
    nocache_headers();
    $pdf_url = '';
    if (function_exists('WPO_WCPDF')) {
        $endpoint = WPO_WCPDF()->get_instance('endpoint');
        if (is_object($endpoint) && method_exists($endpoint, 'get_document_link')) {
            $pdf_url = $endpoint->get_document_link($order, 'invoice', ['my-account' => 'true']);
        }
    }
    if (!$pdf_url) {
        wp_safe_redirect(add_query_arg('invoices', 'unavailable', wc_get_account_endpoint_url('orders')));
        exit;
    }
    wp_safe_redirect($pdf_url);
    exit;
}, 1);


/** Shipping endpoint merged from Bendemen Shipping Rates into Bendemen Connector. */
function bendemen_get_shipping_rates(WP_REST_Request $request) {
    if (!function_exists('WC') || !WC()->shipping()) {
        return new WP_Error('shipping_unavailable', 'WooCommerce shipping is unavailable.', ['status' => 503]);
    }

    $items = $request->get_param('items');
    $destination = $request->get_param('destination');

    if (!is_array($items) || count($items) < 1 || count($items) > 30 || !is_array($destination)) {
        return new WP_Error('invalid_package', 'Invalid shipping package.', ['status' => 400]);
    }

    $country = isset($destination['country']) ? strtoupper(sanitize_text_field($destination['country'])) : 'NL';
    $postcode = isset($destination['postcode']) ? wc_clean($destination['postcode']) : '';
    $city = isset($destination['city']) ? wc_clean($destination['city']) : '';
    $address = isset($destination['address_1']) ? wc_clean($destination['address_1']) : '';

    if ($country !== 'NL' || !$postcode || !$city || !$address) {
        return new WP_Error('invalid_destination', 'Vul een geldig Nederlands bezorgadres in.', ['status' => 400]);
    }

    try {
        // Use a real WooCommerce cart so extensions such as Octolize can evaluate
        // cart contents, product categories, shipping classes, weight and totals.
        if (!WC()->cart && function_exists('wc_load_cart')) {
            wc_load_cart();
        }
        if (!WC()->cart || !WC()->customer) {
            return new WP_Error('shipping_unavailable', 'WooCommerce cart is unavailable.', ['status' => 503]);
        }

        WC()->cart->empty_cart(true);
        WC()->customer->set_shipping_country($country);
        WC()->customer->set_shipping_state('');
        WC()->customer->set_shipping_postcode($postcode);
        WC()->customer->set_shipping_city($city);
        WC()->customer->set_shipping_address($address);
        WC()->customer->set_shipping_address_2('');

        foreach ($items as $item) {
            $product_id = isset($item['productId']) ? absint($item['productId']) : 0;
            $variation_id = isset($item['variationId']) ? absint($item['variationId']) : 0;
            $quantity = isset($item['quantity']) ? absint($item['quantity']) : 0;
            $product = wc_get_product($variation_id ?: $product_id);

            if (!$product || !$product->exists() || !$product->is_purchasable() || $quantity < 1 || $quantity > 99) {
                WC()->cart->empty_cart(true);
                return new WP_Error('invalid_product', 'Een product is niet beschikbaar voor verzending.', ['status' => 400]);
            }

            $cart_key = WC()->cart->add_to_cart(
                $product_id,
                $quantity,
                $variation_id,
                isset($item['variation']) && is_array($item['variation']) ? $item['variation'] : []
            );

            if (!$cart_key) {
                WC()->cart->empty_cart(true);
                return new WP_Error('invalid_product', 'Een product kon niet aan de verzendberekening worden toegevoegd.', ['status' => 400]);
            }
        }

        WC()->cart->calculate_totals();
        WC()->shipping()->reset_shipping();
        $packages = WC()->shipping()->calculate_shipping(WC()->cart->get_shipping_packages());
        $rates = isset($packages[0]['rates']) && is_array($packages[0]['rates']) ? $packages[0]['rates'] : [];

        $result = [];

        foreach ($rates as $rate) {
            if (!is_a($rate, 'WC_Shipping_Rate')) {
                continue;
            }
            $cost = (float) $rate->get_cost();
            $raw_taxes = $rate->get_taxes();
            $taxes = [];
            $tax_total = 0.0;
            foreach ($raw_taxes as $tax_id => $tax_amount) {
                $amount = (float) $tax_amount;
                $taxes[] = ['id' => (int) $tax_id, 'total' => wc_format_decimal($amount)];
                $tax_total += $amount;
            }

            $result[] = [
                'id' => (string) $rate->get_id(),
                'method_id' => (string) $rate->get_method_id(),
                'instance_id' => (int) $rate->get_instance_id(),
                'label' => wp_strip_all_tags($rate->get_label()),
                'cost' => wc_format_decimal($cost),
                'taxes' => $taxes,
                'total' => wc_format_decimal($cost + $tax_total),
            ];
        }

        return rest_ensure_response(['rates' => $result]);
    } catch (Throwable $error) {
        error_log('Bendemen shipping quote failed: ' . $error->getMessage());
        return new WP_Error('shipping_calculation_failed', 'Verzendtarieven konden niet worden berekend.', ['status' => 503]);
    }
}
