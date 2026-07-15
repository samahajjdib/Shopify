(function () {
  'use strict';

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
    });
  }

  function moneyFormat(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function extractQuantity(optionValue) {
    var match = optionValue.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  function initProductForm(form) {
    var section = form.closest('.product');
    if (!section) return;

    var productDataEl = section.querySelector('[data-product-json]');
    if (!productDataEl) return;
    var product = JSON.parse(productDataEl.textContent);

    var variantIdInput = form.querySelector('[data-variant-id]');
    var priceEl = section.querySelector('[data-product-price]');
    var savingsEl = section.querySelector('[data-product-savings]');
    var addBtn = form.querySelector('[data-add-to-cart]');
    var addBtnText = form.querySelector('[data-add-to-cart-text]');
    var optionFieldsets = form.querySelectorAll('.product__option');

    function currentSelections() {
      var selections = [];
      optionFieldsets.forEach(function (fieldset) {
        var selected = fieldset.querySelector('.option-pill.is-selected');
        selections.push(selected ? selected.dataset.optionValue : null);
      });
      return selections;
    }

    function findVariant(selections) {
      return product.variants.find(function (variant) {
        return selections.every(function (value, i) {
          return variant.options[i] === value;
        });
      });
    }

    function baseUnitPrice() {
      var oneUnitVariant = product.variants.reduce(function (min, variant) {
        var qty = extractQuantity(variant.options[0] || '1');
        if (qty === 1) return variant;
        return min;
      }, product.variants[0]);
      return oneUnitVariant.price / extractQuantity(oneUnitVariant.options[0] || '1');
    }

    function render(variant) {
      if (!variant) return;
      variantIdInput.value = variant.id;

      if (priceEl) {
        var html = '';
        if (variant.compare_at_price > variant.price) {
          html += '<span class="price price--compare">' + moneyFormat(variant.compare_at_price) + '</span>';
        }
        html += '<span class="price price--current">' + moneyFormat(variant.price) + '</span>';
        priceEl.innerHTML = html;
      }

      if (savingsEl) {
        var qty = extractQuantity(variant.options[0] || '1');
        if (qty > 1) {
          var unitPrice = variant.price / qty;
          var base = baseUnitPrice();
          var savingsPct = Math.round((1 - unitPrice / base) * 100);
          if (savingsPct > 0) {
            savingsEl.textContent = 'You save ' + savingsPct + '% on this bundle';
            savingsEl.hidden = false;
          } else {
            savingsEl.hidden = true;
          }
        } else {
          savingsEl.hidden = true;
        }
      }

      if (addBtn) {
        addBtn.disabled = !variant.available;
        if (addBtnText) {
          addBtnText.textContent = variant.available ? 'Add to bag' : 'Sold out';
        }
      }
    }

    optionFieldsets.forEach(function (fieldset) {
      fieldset.addEventListener('click', function (e) {
        var pill = e.target.closest('.option-pill');
        if (!pill) return;
        fieldset.querySelectorAll('.option-pill').forEach(function (p) {
          p.classList.remove('is-selected');
        });
        pill.classList.add('is-selected');
        render(findVariant(currentSelections()));
      });
    });

    // Thumbnail gallery
    section.querySelectorAll('[data-media-thumb]').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var mainImage = section.querySelector('.product__main-image');
        if (mainImage) mainImage.src = thumb.dataset.image;
      });
    });

    // Add to cart via AJAX so the header cart count updates instantly
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (addBtn) addBtn.disabled = true;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: variantIdInput.value,
          quantity: parseInt(form.quantity.value, 10) || 1
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Could not add to bag');
          return fetch('/cart.js');
        })
        .then(function (res) { return res.json(); })
        .then(function (cart) {
          updateCartCount(cart.item_count);
          if (addBtnText) {
            var original = addBtnText.textContent;
            addBtnText.textContent = 'Added to bag!';
            setTimeout(function () { addBtnText.textContent = original; }, 1800);
          }
        })
        .catch(function () {
          window.alert('Something went wrong adding that to your bag. Please try again.');
        })
        .finally(function () {
          if (addBtn) addBtn.disabled = false;
        });
    });
  }

  document.querySelectorAll('[data-product-form]').forEach(initProductForm);
})();
