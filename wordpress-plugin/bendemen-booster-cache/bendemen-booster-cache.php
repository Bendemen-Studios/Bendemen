<?php
/**
 * Plugin Name: Bendemen Booster Cache
 * Description: Conservative full-page HTML cache for public WordPress pages, with WooCommerce-safe bypasses.
 * Version: 0.1.0
 * Author: Bendemen Studios
 * Requires PHP: 8.0
 * Requires Plugins: woocommerce
 */
if (!defined('ABSPATH')) { exit; }

final class Bendemen_Booster_Cache {
    private const OPTION_ENABLED = 'bendemen_booster_cache_enabled';
    private const CACHE_DIR_NAME = 'bendemen-booster-page-cache';
    private const DROPIN_NAME = 'advanced-cache.php';
    private const MAX_AGE = 600;

    public function __construct() {
        add_action('admin_menu', [$this, 'menu']);
        add_action('admin_post_bendemen_booster_cache_enable', [$this, 'enable']);
        add_action('admin_post_bendemen_booster_cache_disable', [$this, 'disable']);
        add_action('admin_post_bendemen_booster_cache_purge', [$this, 'purge_action']);
        add_action('save_post', [$this, 'purge_on_content_change'], 10, 1);
        add_action('deleted_post', [$this, 'purge_all']);
        add_action('edited_terms', [$this, 'purge_all']);
        add_action('created_term', [$this, 'purge_all']);
        add_action('delete_term', [$this, 'purge_all']);
        add_action('woocommerce_product_set_stock', [$this, 'purge_all']);
        add_action('woocommerce_variation_set_stock', [$this, 'purge_all']);
        add_action('woocommerce_update_product', [$this, 'purge_all']);
        add_action('customize_save_after', [$this, 'purge_all']);
        add_action('switch_theme', [$this, 'purge_all']);
    }

    public function menu(): void {
        add_submenu_page('options-general.php', 'Bendemen Booster Cache', 'Bendemen Booster Cache', 'manage_options', 'bendemen-booster-cache', [$this, 'page']);
    }

    private function cache_dir(): string {
        return WP_CONTENT_DIR . '/cache/' . self::CACHE_DIR_NAME;
    }

    private function dropin_path(): string {
        return WP_CONTENT_DIR . '/' . self::DROPIN_NAME;
    }

    private function dropin_source(): string {
        return __DIR__ . '/advanced-cache.php';
    }

    public function page(): void {
        if (!current_user_can('manage_options')) { return; }
        $enabled = get_option(self::OPTION_ENABLED, '0') === '1';
        $dropin = file_exists($this->dropin_path());
        $wp_cache = defined('WP_CACHE') && WP_CACHE;
        $other = $this->other_cache_plugins();
        echo '<div class="wrap"><h1>Bendemen Booster Cache</h1>';
        echo '<p>Eigen full-page HTML-cache voor openbare pagina’s. Cache wordt alleen ingeschakeld als er geen bekende andere page-cacheplugin actief is. Smush blijft afbeeldingen beheren.</p>';
        echo '<ul>';
        printf('<li>Status: <strong>%s</strong></li>', esc_html($enabled ? 'Ingeschakeld' : 'Uitgeschakeld'));
        printf('<li>WordPress WP_CACHE: <strong>%s</strong></li>', esc_html($wp_cache ? 'aan' : 'uit'));
        printf('<li>Cache drop-in: <strong>%s</strong></li>', esc_html($dropin ? 'aanwezig' : 'niet geïnstalleerd'));
        printf('<li>Bekende andere cacheplugins: <strong>%s</strong></li>', esc_html($other ? implode(', ', $other) : 'geen gedetecteerd'));
        echo '</ul>';
        echo '<p><strong>Veiligheid:</strong> requests met cookies of queryparameters worden niet gecachet. Winkelmand, checkout, account, order endpoints, wp-admin, REST en AJAX zijn uitgesloten.</p>';
        if (!$wp_cache) {
            echo '<div class="notice notice-warning inline"><p>Voeg eerst <code>define(\'WP_CACHE\', true);</code> toe aan wp-config.php boven de regel “That’s all, stop editing!”. Controleer eerst of deze instelling al bestaat; zet geen dubbele definitie.</p></div>';
        }
        if ($other) {
            echo '<div class="notice notice-error inline"><p>Een bekende page-cacheplugin is actief. Schakel deze eerst bewust uit en leeg de cache voordat je Bendemen Booster Cache activeert. Er is niets automatisch gewijzigd.</p></div>';
        }
        if (!$dropin && file_exists($this->dropin_path())) {
            echo '<p>Er bestaat al een advanced-cache.php. Deze plugin overschrijft die nooit.</p>';
        }
        echo '<hr>';
        if (!$enabled) {
            echo '<p>Activeren installeert de drop-in alleen als het bestand nog niet bestaat. De cache blijft uit totdat WP_CACHE aanstaat en de status opnieuw is gecontroleerd.</p>';
            echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
            wp_nonce_field('bendemen_booster_cache_enable');
            echo '<input type="hidden" name="action" value="bendemen_booster_cache_enable">';
            submit_button('Installeer en activeer eigen cache');
            echo '</form>';
        } else {
            echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block;margin-right:8px">';
            wp_nonce_field('bendemen_booster_cache_purge');
            echo '<input type="hidden" name="action" value="bendemen_booster_cache_purge">';
            submit_button('Cache legen', 'secondary');
            echo '</form>';
            echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block">';
            wp_nonce_field('bendemen_booster_cache_disable');
            echo '<input type="hidden" name="action" value="bendemen_booster_cache_disable">';
            submit_button('Cache uitschakelen', 'delete');
            echo '</form>';
        }
        echo '<p>Cacheduur: 10 minuten. Bij content-, product-, voorraad-, categorie- en themawijzigingen wordt de cache geleegd. Deze eerste versie gebruikt een volledige purge voor voorspelbare WooCommerce-veiligheid.</p>';
        echo '</div>';
    }

    private function other_cache_plugins(): array {
        $known = [
            'wp-super-cache/wp-cache.php' => 'WP Super Cache',
            'w3-total-cache/w3-total-cache.php' => 'W3 Total Cache',
            'wp-rocket/wp-rocket.php' => 'WP Rocket',
            'litespeed-cache/litespeed-cache.php' => 'LiteSpeed Cache',
            'cache-enabler/cache-enabler.php' => 'Cache Enabler',
            'wp-fastest-cache/wpFastestCache.php' => 'WP Fastest Cache',
            '10web-booster/tenweb-booster.php' => '10Web Booster',
            'tenweb-booster/tenweb-booster.php' => '10Web Booster',
            'tenweb-speed-optimizer/tenweb-speed-optimizer.php' => '10Web Speed Optimizer',
        ];
        $active = (array) get_option('active_plugins', []);
        $found = [];
        foreach ($known as $path => $label) {
            if (in_array($path, $active, true)) { $found[] = $label; }
        }
        if (is_multisite()) {
            $network = (array) get_site_option('active_sitewide_plugins', []);
            foreach ($known as $path => $label) {
                if (isset($network[$path]) && !in_array($label, $found, true)) { $found[] = $label; }
            }
        }
        return $found;
    }

    public function enable(): void {
        if (!current_user_can('manage_options')) { wp_die('Forbidden', 403); }
        check_admin_referer('bendemen_booster_cache_enable');
        if ($this->other_cache_plugins()) {
            wp_die('Er is een bekende page-cacheplugin actief. Schakel die eerst bewust uit om dubbele caching te voorkomen.', 'Cache niet geactiveerd', ['response' => 409]);
        }
        if (!defined('WP_CACHE') || !WP_CACHE) {
            wp_die('WP_CACHE is niet ingeschakeld. Voeg define(\'WP_CACHE\', true); handmatig toe aan wp-config.php en probeer opnieuw.', 'Vereiste configuratie ontbreekt', ['response' => 409]);
        }
        if (file_exists($this->dropin_path())) {
            wp_die('advanced-cache.php bestaat al. Ter bescherming is het bestand niet overschreven.', 'Bestaande cache drop-in', ['response' => 409]);
        }
        if (!is_readable($this->dropin_source()) || !is_dir(WP_CONTENT_DIR) || !is_writable(WP_CONTENT_DIR)) {
            wp_die('De drop-in kan niet veilig worden geïnstalleerd. Controleer de pluginbestanden en schrijfrechten.', 'Installatie mislukt', ['response' => 500]);
        }
        $source = file_get_contents($this->dropin_source());
        if (!is_string($source) || file_put_contents($this->dropin_path(), $source, LOCK_EX) === false) {
            wp_die('Installeren van advanced-cache.php is mislukt.', 'Installatie mislukt', ['response' => 500]);
        }
        if (!wp_mkdir_p($this->cache_dir()) || !is_writable($this->cache_dir())) {
            @unlink($this->dropin_path());
            wp_die('De cachemap kan niet beschrijfbaar worden gemaakt. Drop-in teruggedraaid.', 'Installatie mislukt', ['response' => 500]);
        }
        if (file_put_contents($this->cache_dir() . '/cache-enabled.flag', "enabled\\n", LOCK_EX) === false) {
            @unlink($this->dropin_path());
            wp_die('De cache-activeringsmarkering kan niet worden geschreven. Drop-in teruggedraaid.', 'Installatie mislukt', ['response' => 500]);
        }
        update_option(self::OPTION_ENABLED, '1', false);
        $this->purge_all();
        wp_safe_redirect(admin_url('options-general.php?page=bendemen-booster-cache&enabled=1'));
        exit;
    }

    public function disable(): void {
        if (!current_user_can('manage_options')) { wp_die('Forbidden', 403); }
        check_admin_referer('bendemen_booster_cache_disable');
        update_option(self::OPTION_ENABLED, '0', false);
        $flag = $this->cache_dir() . '/cache-enabled.flag';
        if (is_file($flag) && !is_link($flag)) { @unlink($flag); }
        $this->purge_all();
        // Never remove advanced-cache.php automatically; it may have been modified or become shared.
        wp_safe_redirect(admin_url('options-general.php?page=bendemen-booster-cache&disabled=1'));
        exit;
    }

    public function purge_action(): void {
        if (!current_user_can('manage_options')) { wp_die('Forbidden', 403); }
        check_admin_referer('bendemen_booster_cache_purge');
        $this->purge_all();
        wp_safe_redirect(admin_url('options-general.php?page=bendemen-booster-cache&purged=1'));
        exit;
    }

    public function purge_on_content_change($post_id): void {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) { return; }
        $this->purge_all();
    }

    public function purge_all($unused = null): void {
        $dir = $this->cache_dir();
        if (!is_dir($dir) || !is_readable($dir)) { return; }
        $files = glob($dir . '/*.html');
        if (!is_array($files)) { return; }
        foreach ($files as $file) {
            if (is_file($file) && !is_link($file)) { @unlink($file); }
        }
    }
}

new Bendemen_Booster_Cache();
