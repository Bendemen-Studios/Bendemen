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
