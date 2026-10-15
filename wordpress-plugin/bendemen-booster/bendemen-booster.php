<?php
/**
 * Plugin Name: Bendemen Booster Connector
 * Description: Authenticated health bridge and conservative frontend performance controls for Bendemen Booster.
 * Version: 0.2.0
 * Author: Bendemen Studios
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 */
if (!defined('ABSPATH')) { exit; }

final class Bendemen_Booster_Connector {
    private const REST_NAMESPACE = 'bendemen-booster/v1';
    private const OPTION_EMOJI = 'bendemen_booster_disable_emojis';
    private const OPTION_DASHICONS = 'bendemen_booster_disable_guest_dashicons';
    private const OPTION_EMBEDS = 'bendemen_booster_disable_embeds';

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('wp_enqueue_scripts', [$this, 'apply_frontend_optimisations'], 100);
        add_action('init', [$this, 'remove_emoji_support'], 20);
    }

    public function register_routes(): void {
        register_rest_route(self::REST_NAMESPACE, '/status', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'status'],
            'permission_callback' => [$this, 'authorize'],
        ]);
    }

    public function authorize(WP_REST_Request $request): bool {
        if (!defined('BENDEMEN_BOOSTER_BRIDGE_SECRET') || !is_string(BENDEMEN_BOOSTER_BRIDGE_SECRET)) {
            return false;
        }
        $provided = (string) $request->get_header('x-bendemen-booster-secret');
        return $provided !== '' && hash_equals(BENDEMEN_BOOSTER_BRIDGE_SECRET, $provided);
    }

    public function status(WP_REST_Request $request): WP_REST_Response {
        $active = class_exists('WooCommerce');
        return new WP_REST_Response([
            'status' => 'ok',
            'wordpress' => get_bloginfo('version'),
            'woocommerceActive' => $active,
            'woocommerceVersion' => $active && defined('WC_VERSION') ? WC_VERSION : null,
            'optimisations' => [
                'disableEmojis' => $this->enabled(self::OPTION_EMOJI, true),
                'disableGuestDashicons' => $this->enabled(self::OPTION_DASHICONS, true),
                'disableEmbeds' => $this->enabled(self::OPTION_EMBEDS, false),
            ],
            'caching' => [
                'persistentObjectCache' => wp_using_ext_object_cache(),
                'objectCacheDropInPresent' => file_exists(WP_CONTENT_DIR . '/object-cache.php'),
                'wpCacheConstantEnabled' => defined('WP_CACHE') && WP_CACHE,
                'pageCachePluginDetected' => $this->detect_page_cache_plugin(),
                'pageCachePlugins' => $this->get_page_cache_plugins(),
                'note' => 'Full-page cache must be configured in a supported cache plugin or hosting layer. Exclude cart, checkout, account, logged-in and personalised responses.',
            ],
            'checkedAt' => gmdate('c'),
        ], 200, ['Cache-Control' => 'no-store']);
    }

    private function get_page_cache_plugins(): array {
        $known = [
            'wp-super-cache/wp-cache.php' => 'WP Super Cache',
            'w3-total-cache/w3-total-cache.php' => 'W3 Total Cache',
            'wp-rocket/wp-rocket.php' => 'WP Rocket',
            'litespeed-cache/litespeed-cache.php' => 'LiteSpeed Cache',
            'cache-enabler/cache-enabler.php' => 'Cache Enabler',
            'wp-fastest-cache/wpFastestCache.php' => 'WP Fastest Cache',
            'bendemen-booster-cache/bendemen-booster-cache.php' => 'Bendemen Booster Cache',
            '10web-booster/tenweb-booster.php' => '10Web Booster',
            'tenweb-booster/tenweb-booster.php' => '10Web Booster',
            'tenweb-speed-optimizer/tenweb-speed-optimizer.php' => '10Web Speed Optimizer',
        ];
        $active = (array) get_option('active_plugins', []);
        $found = [];
        foreach ($known as $plugin => $label) {
            if (in_array($plugin, $active, true)) { $found[] = $label; }
        }
        if (is_multisite()) {
            $network = (array) get_site_option('active_sitewide_plugins', []);
            foreach ($known as $plugin => $label) {
                if (isset($network[$plugin]) && !in_array($label, $found, true)) { $found[] = $label; }
            }
        }
        return $found;
    }

    private function detect_page_cache_plugin(): bool {
        return count($this->get_page_cache_plugins()) > 0;
    }

    public function add_settings_page(): void {
        add_options_page(
            'Bendemen Booster',
            'Bendemen Booster',
            'manage_options',
            'bendemen-booster',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings(): void {
        register_setting('bendemen_booster_settings', self::OPTION_EMOJI, [
            'type' => 'string',
            'sanitize_callback' => [$this, 'sanitize_checkbox'],
            'default' => '1',
        ]);
        register_setting('bendemen_booster_settings', self::OPTION_DASHICONS, [
            'type' => 'string',
            'sanitize_callback' => [$this, 'sanitize_checkbox'],
            'default' => '1',
        ]);
        register_setting('bendemen_booster_settings', self::OPTION_EMBEDS, [
            'type' => 'string',
            'sanitize_callback' => [$this, 'sanitize_checkbox'],
            'default' => '0',
        ]);

        add_settings_section(
            'bendemen_booster_frontend',
            'Frontend-optimalisaties',
            function (): void {
                echo '<p>Conservatieve optimalisaties voor bezoekers die niet zijn ingelogd. Wijzigingen zijn direct omkeerbaar.</p>';
            },
            'bendemen-booster'
        );

        add_settings_field(self::OPTION_EMOJI, 'WordPress-emoji uitschakelen', [$this, 'render_checkbox'], 'bendemen-booster', 'bendemen_booster_frontend', [
            'option' => self::OPTION_EMOJI,
            'label' => 'Verwijder emoji-detectiescripts en -styles van de frontend.',
        ]);
        add_settings_field(self::OPTION_DASHICONS, 'Dashicons voor gasten uitschakelen', [$this, 'render_checkbox'], 'bendemen-booster', 'bendemen_booster_frontend', [
            'option' => self::OPTION_DASHICONS,
            'label' => 'Laad Dashicons niet voor bezoekers die niet zijn ingelogd.',
        ]);
        add_settings_field(self::OPTION_EMBEDS, 'WordPress embeds uitschakelen', [$this, 'render_checkbox'], 'bendemen-booster', 'bendemen_booster_frontend', [
            'option' => self::OPTION_EMBEDS,
            'label' => 'Schakel de WordPress oEmbed discovery en wp-embed script uit. Zet dit alleen aan als je geen WordPress-embeds nodig hebt.',
        ]);
    }

    public function sanitize_checkbox($value): string {
        return $value === '1' || $value === 1 || $value === true ? '1' : '0';
    }

    public function render_checkbox(array $args): void {
        $option = (string) $args['option'];
        $checked = $this->enabled($option, $option !== self::OPTION_EMBEDS);
        // Hidden input first: a checked checkbox must be the final submitted value ("1").
        printf('<input type="hidden" name="%1$s" value="0" />', esc_attr($option));
        printf(
            '<label><input type="checkbox" name="%1$s" value="1" %2$s /> %3$s</label>',
            esc_attr($option),
            checked($checked, true, false),
            esc_html((string) $args['label'])
        );
    }

    public function render_settings_page(): void {
        if (!current_user_can('manage_options')) { return; }
        echo '<div class="wrap"><h1>Bendemen Booster</h1>';
        echo '<p>Deze instellingen passen alleen frontend-assets aan en wijzigen geen producten, bestellingen, betalingen, winkelmandjes of klantgegevens.</p>';
        echo '<form method="post" action="options.php">';
        settings_fields('bendemen_booster_settings');
        do_settings_sections('bendemen-booster');
        submit_button('Instellingen opslaan');
        echo '</form></div>';
    }

    private function enabled(string $option, bool $default): bool {
        return (string) get_option($option, $default ? '1' : '0') === '1';
    }

    public function remove_emoji_support(): void {
        if (is_admin() || is_user_logged_in() || !$this->enabled(self::OPTION_EMOJI, true)) {
            return;
        }
        remove_action('wp_head', 'print_emoji_detection_script', 7);
        remove_action('wp_print_styles', 'print_emoji_styles');
        remove_filter('the_content_feed', 'wp_staticize_emoji');
        remove_filter('comment_text_rss', 'wp_staticize_emoji');
        remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
        add_filter('emoji_svg_url', '__return_empty_string');
    }

    public function apply_frontend_optimisations(): void {
        if (is_admin() || is_user_logged_in()) {
            return;
        }

        if ($this->enabled(self::OPTION_DASHICONS, true)) {
            wp_dequeue_style('dashicons');
        }

        if ($this->enabled(self::OPTION_EMBEDS, false)) {
            remove_action('wp_head', 'wp_oembed_add_discovery_links');
            remove_action('wp_head', 'wp_oembed_add_host_js');
            wp_deregister_script('wp-embed');
        }
    }
}

new Bendemen_Booster_Connector();
