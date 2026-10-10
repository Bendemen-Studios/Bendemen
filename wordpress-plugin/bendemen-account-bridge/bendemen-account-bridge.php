<?php
/**
 * Plugin Name: Bendemen Account & Points Bridge
 * Description: Secure server-to-server account and WooCommerce Points & Rewards bridge for the Bendemen headless storefront.
 * Version: 1.0.0
 * Requires Plugins: woocommerce, woocommerce-points-and-rewards
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
    if (!$user || !wp_check_password($password, $user->user_pass, $user->ID) || !in_array('customer', (array) $user->roles, true)) {
        return new WP_Error('bendemen_login_failed', 'E-mailadres of wachtwoord is onjuist.', ['status' => 401]);
    }
    return rest_ensure_response(bendemen_bridge_user_payload($user));
}

function bendemen_bridge_points(WP_REST_Request $request) {
    $user_id = (int) $request['user_id'];
    if (!get_user_by('id', $user_id) || !class_exists('WC_Points_Rewards_Manager')) {
        return new WP_Error('bendemen_points_unavailable', 'Points & Rewards is niet beschikbaar.', ['status' => 503]);
    }
    return rest_ensure_response([
        'balance' => max(0, (int) WC_Points_Rewards_Manager::get_users_points($user_id)),
        'label' => (string) get_option('wc_points_rewards_points_label', 'punten'),
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
        if ('yes' !== get_option('wc_points_rewards_partial_redemption_enabled') && $points_used !== $max_points) {
            return new WP_Error('bendemen_partial_disabled', 'Gedeeltelijk punten inwisselen is uitgeschakeld in WooCommerce Points & Rewards.', ['status' => 400]);
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
