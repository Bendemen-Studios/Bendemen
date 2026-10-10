<?php
/**
 * Plugin Name: Bendemen Shipping Rates
 * Description: Exposes WooCommerce's configured shipping-zone rates to the Bendemen headless checkout.
 * Version: 1.0.0
 * Requires Plugins: woocommerce
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('bendemen/v1', '/shipping-rates', [
        'methods' => 'POST',
        'callback' => 'bendemen_get_shipping_rates',
        'permission_callback' => function () {
            return current_user_can('manage_woocommerce');
        },
        'args' => [
            'items' => ['required' => true, 'type' => 'array'],
            'destination' => ['required' => true, 'type' => 'object'],
        ],
    ]);
});

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

    $contents = [];
    $contents_cost = 0.0;
    foreach ($items as $index => $item) {
        $product_id = isset($item['productId']) ? absint($item['productId']) : 0;
        $variation_id = isset($item['variationId']) ? absint($item['variationId']) : 0;
        $quantity = isset($item['quantity']) ? absint($item['quantity']) : 0;
        $product = wc_get_product($variation_id ?: $product_id);

        if (!$product || !$product->exists() || !$product->is_purchasable() || $quantity < 1 || $quantity > 99) {
            return new WP_Error('invalid_product', 'Een product is niet beschikbaar voor verzending.', ['status' => 400]);
        }

        $line_total = (float) $product->get_price() * $quantity;
        $key = (string) $index;
        $contents[$key] = [
            'key' => $key,
            'product_id' => $product_id,
            'variation_id' => $variation_id,
            'variation' => [],
            'quantity' => $quantity,
            'data' => $product,
            'line_total' => $line_total,
            'line_tax' => 0,
            'line_subtotal' => $line_total,
            'line_subtotal_tax' => 0,
            'line_tax_data' => ['total' => [], 'subtotal' => []],
        ];
        $contents_cost += $line_total;
    }

    $package = [
        'contents' => $contents,
        'contents_cost' => $contents_cost,
        'applied_coupons' => [],
        'user' => ['ID' => get_current_user_id()],
        'destination' => [
            'country' => $country,
            'state' => '',
            'postcode' => $postcode,
            'city' => $city,
            'address' => $address,
            'address_2' => '',
        ],
        'cart_subtotal' => $contents_cost,
    ];

    try {
        WC()->shipping()->reset_shipping();
        $packages = WC()->shipping()->calculate_shipping([$package]);
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
