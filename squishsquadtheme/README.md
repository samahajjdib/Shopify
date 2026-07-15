# Squish Squad — Shopify theme

A custom Shopify Online Store 2.0 theme for a teen-focused squeezable-toy shop
(Needoh-style fidget toys). Light, playful color scheme (pink / orange / teal /
purple accents), homepage product grid, and a "buy more, save more" bundle
selector on the product page.

## What's included

- `layout/theme.liquid`, `layout/password.liquid` — page shells
- `sections/` — header, footer, hero banner, featured collection, rich text,
  product page, collection page, cart page, 404
- `templates/*.json` — wires sections to each page type (JSON templates, so
  everything is drag-and-drop editable in the Shopify theme editor)
- `snippets/` — reusable product card, cart icon, meta tags
- `assets/theme.css`, `assets/theme.js` — styling and the bundle/variant picker
- `config/settings_schema.json` — colors, fonts, layout, social links (all
  editable in Theme Settings, no code changes needed)

## Prerequisites

1. A Shopify store (any plan, including the free trial) — sign up at
   shopify.com if you don't have one yet.
2. [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) installed:
   ```
   npm install -g @shopify/cli@latest
   ```

## Preview it locally against your store

From this repo's root:

```
shopify theme dev --store your-store.myshopify.com
```

This opens a live preview URL and hot-reloads as you edit files. It does not
change your live theme.

## Push it to your store

```
shopify theme push --store your-store.myshopify.com
```

Push as a new unpublished theme first (`shopify theme push --unpublished`) so
you can review it in the Shopify admin before making it live.

## Setting up "buy 2, save money" bundle pricing

This theme's product page renders a pill-style quantity-tier selector (like
"1 Pack / 2 Pack / 3 Pack") driven entirely by normal Shopify product
variants — no app or extra setup required. To use it on a product:

1. In the Shopify admin, open the product and add an option named
   **Pack**, **Bundle**, or **Quantity** (the theme detects any of these
   names and styles it as bundle pills instead of plain swatches).
2. Give it values like `1 Pack`, `2 Pack`, `3 Pack` — the leading number is
   what the theme reads to calculate savings, so keep a digit at the start
   of each value.
3. Set each variant's price to reflect the discount, e.g.:
   - 1 Pack — $12.99 (= $12.99/unit)
   - 2 Pack — $22.99 (= $11.50/unit, theme shows "You save 11%")
   - 3 Pack — $29.99 (= $10.00/unit, theme shows "You save 23%")

The theme automatically computes the "You save X%" badge by comparing each
tier's per-unit price to the 1-pack price — you only ever need to set prices
on the variants themselves.

## Cart & checkout

- Add to cart is AJAX-powered (`assets/theme.js`) so the cart count updates
  instantly without a page reload.
- The cart page (`/cart`) lists line items, lets customers update quantities,
  and its **Check out** button hands off to Shopify's own hosted, secure
  checkout — that part is provided by Shopify automatically and needs no
  theme code.

## Customizing

Colors, fonts, page width, and corner roundness are all editable without
touching code: Shopify admin → **Online Store → Themes → Customize → Theme
settings**. The default palette (light background, hot-pink primary, teal
accent, purple secondary) lives in `config/settings_data.json`.
