<?php
/**
 * Plugin Name: Bendemen Booster Connector
 * Description: Minimal authenticated read-only health bridge for Bendemen Booster.
 * Version: 0.1.0
 * Author: Bendemen Studios
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 */
if (!defined("ABSPATH")) { exit; }
final class Bendemen_Booster_Connector {
    private const REST_NAMESPACE = "bendemen-booster/v1";
    public function __construct() { add_action("rest_api_init", [$this, "register_routes"]); }
    public function register_routes(): void {
        register_rest_route(self::REST_NAMESPACE, "/status", [
            "methods" => WP_REST_Server::READABLE,
            "callback" => [$this, "status"],
            "permission_callback" => [$this, "authorize"],
        ]);
    }
    public function authorize(WP_REST_Request $request): bool {
        if (!defined("BENDEMEN_BOOSTER_BRIDGE_SECRET") || !is_string(BENDEMEN_BOOSTER_BRIDGE_SECRET)) { return false; }
        $provided = (string) $request->get_header("x-bendemen-booster-secret");
        return $provided !== "" && hash_equals(BENDEMEN_BOOSTER_BRIDGE_SECRET, $provided);
    }
    public function status(WP_REST_Request $request): WP_REST_Response {
        $active = class_exists("WooCommerce");
        return new WP_REST_Response([
            "status" => "ok",
            "wordpress" => get_bloginfo("version"),
            "woocommerceActive" => $active,
            "woocommerceVersion" => $active && defined("WC_VERSION") ? WC_VERSION : null,
            "checkedAt" => gmdate("c"),
        ], 200, ["Cache-Control" => "no-store"]);
    }
}
new Bendemen_Booster_Connector();
