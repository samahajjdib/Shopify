(function () {
  'use strict';

  /* ---------- Money ---------- */
  function formatMoney(cents, format) {
    format = format || '${{amount}}';
    var value = (cents / 100);
    function withDelimiters(num, decimals, thousands, decimal) {
      var parts = num.toFixed(decimals).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return parts.join(decimal);
    }
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, key) {
      switch (key) {
        case 'amount_no_decimals': return withDelimiters(value, 0, ',', '.');
        case 'amount_with_comma_separator': return withDelimiters(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return withDelimiters(value, 0, '.', ',');
        case 'amount_with_apostrophe_separator': return withDelimiters(value, 2, "'", '.');
        default: return withDelimiters(value, 2, ',', '.');
      }
    });
  }

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  /* ---------- Announcement rotator ---------- */
  document.querySelectorAll('[data-announcement]').forEach(function (track) {
    var items = track.querySelectorAll('.announcement__item');
    if (items.length < 2) return;
    var i = 0;
    setInterval(function () {
      items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, 4500);
  });

  /* ---------- Mobile menu ---------- */
  var header = document.querySelector('[data-header]');
  var menuToggle = document.querySelector('[data-menu-toggle]');
  if (header && menuToggle) {
    menuToggle.addEventListener('click', function () {
      var open = header.classList.toggle('is-menu-open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Close open dropdowns (nav, language) when clicking elsewhere
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.nav__dropdown[open], .header__locale[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  /* ---------- Hero slideshow ---------- */
  document.querySelectorAll('[data-slideshow]').forEach(function (show) {
    var slides = show.querySelectorAll('[data-slide]');
    var dots = show.querySelectorAll('[data-slide-dot]');
    if (slides.length < 2) return;
    var current = 0;
    var delay = parseInt(show.dataset.autoplay, 10) * 1000;
    var timer;

    function go(index) {
      slides[current].classList.remove('is-active');
      if (dots[current]) dots[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      if (dots[current]) dots[current].classList.add('is-active');
    }
    function start() {
      if (delay > 0) timer = setInterval(function () { go(current + 1); }, delay);
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        clearInterval(timer);
        go(parseInt(dot.dataset.slideDot, 10));
        start();
      });
    });

    // Theme editor: show the slide being edited
    document.addEventListener('shopify:block:select', function (e) {
      var idx = Array.prototype.indexOf.call(slides, e.target);
      if (idx > -1) { clearInterval(timer); go(idx); }
    });

    start();
  });

  /* ---------- Product form ---------- */
  function initProductForm(form) {
    var section = form.closest('[data-product-section]');
    if (!section) return;

    var product = JSON.parse(section.querySelector('[data-product-json]').textContent);
    var strings = JSON.parse(section.querySelector('[data-product-strings]').textContent);

    var variantInput = form.querySelector('[data-variant-id]');
    var planInput = form.querySelector('[data-selling-plan-input]');
    var addBtn = form.querySelector('[data-add-to-cart]');
    var addBtnText = form.querySelector('[data-add-to-cart-text]');
    var fieldsets = form.querySelectorAll('.product__option');
    var planRadios = form.querySelectorAll('[data-plan-radio]');
    var oneTimePriceEl = form.querySelector('[data-one-time-price]');
    var qtyInput = form.querySelector('input[name="quantity"]');

    var money = function (cents) { return formatMoney(cents, strings.moneyFormat); };

    function selections() {
      return Array.prototype.map.call(fieldsets, function (fs) {
        var sel = fs.querySelector('.pill.is-selected');
        return sel ? sel.dataset.optionValue : null;
      });
    }

    function findVariant() {
      if (!fieldsets.length) return product.variants[0];
      var sel = selections();
      return product.variants.find(function (v) {
        return sel.every(function (value, i) { return v.options[i] === value; });
      });
    }

    function currentVariant() {
      var id = parseInt(variantInput.value, 10);
      return product.variants.find(function (v) { return v.id === id; }) || product.variants[0];
    }

    function planPrice(variant, planId) {
      if (!planId) return variant.price;
      var alloc = (variant.selling_plan_allocations || []).find(function (a) {
        return String(a.selling_plan_id) === String(planId);
      });
      return alloc ? alloc.price : variant.price;
    }

    function render(variant) {
      if (!variant) {
        addBtn.disabled = true;
        addBtnText.textContent = strings.unavailable;
        return;
      }
      variantInput.value = variant.id;

      // Prices inside the purchase option cards
      form.querySelectorAll('[data-plan-price]').forEach(function (el) {
        var price = planPrice(variant, el.dataset.planPrice);
        var html = '';
        if (variant.price > price) html += '<s>' + money(variant.price) + '</s> ';
        el.innerHTML = html + money(price);
      });
      if (oneTimePriceEl) oneTimePriceEl.textContent = money(variant.price);

      // Button
      var total = planPrice(variant, planInput.value) * (parseInt(qtyInput.value, 10) || 1);
      addBtn.disabled = !variant.available;
      addBtnText.textContent = variant.available
        ? strings.addToCart + ' – ' + money(total)
        : strings.soldOut;

      // Main image follows the chosen variant (e.g. flavour pouch)
      if (variant.featured_media && variant.featured_media.preview_image) {
        var main = section.querySelector('[data-main-image]');
        var src = variant.featured_media.preview_image.src;
        if (main && src) main.src = src + (src.indexOf('?') > -1 ? '&' : '?') + 'width=1200';
      }

      // Keep the URL shareable
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    fieldsets.forEach(function (fs) {
      fs.addEventListener('click', function (e) {
        var pill = e.target.closest('.pill');
        if (!pill) return;
        fs.querySelectorAll('.pill').forEach(function (p) {
          p.classList.remove('is-selected');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('is-selected');
        pill.setAttribute('aria-pressed', 'true');
        render(findVariant());
      });
    });

    planRadios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        planInput.value = radio.value;
        form.querySelectorAll('.purchase-option').forEach(function (opt) {
          opt.classList.toggle('is-selected', opt.contains(radio));
        });
        render(currentVariant());
      });
    });

    // Quantity stepper
    var minus = form.querySelector('[data-qty-minus]');
    var plus = form.querySelector('[data-qty-plus]');
    if (minus) minus.addEventListener('click', function () {
      qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
      render(currentVariant());
    });
    if (plus) plus.addEventListener('click', function () {
      qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1;
      render(currentVariant());
    });
    qtyInput.addEventListener('change', function () { render(currentVariant()); });

    // Thumbnails
    section.querySelectorAll('[data-media-thumb]').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var main = section.querySelector('[data-main-image]');
        if (main) main.src = thumb.dataset.image;
        section.querySelectorAll('[data-media-thumb]').forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });

    // AJAX add to cart
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      addBtn.disabled = true;
      var item = { id: parseInt(variantInput.value, 10), quantity: parseInt(qtyInput.value, 10) || 1 };
      if (planInput.value) item.selling_plan = parseInt(planInput.value, 10);

      fetch(window.Shopify && window.Shopify.routes ? window.Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [item] })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('add failed');
          return fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart.js');
        })
        .then(function (res) { return res.json(); })
        .then(function (cart) {
          updateCartCount(cart.item_count);
          addBtnText.textContent = strings.added;
          setTimeout(function () { render(currentVariant()); }, 1800);
        })
        .catch(function () {
          window.alert(strings.error);
        })
        .finally(function () {
          addBtn.disabled = !currentVariant().available;
        });
    });
  }

  document.querySelectorAll('[data-product-form]').forEach(initProductForm);
})();
