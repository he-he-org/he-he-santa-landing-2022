declare const STRIPE_PUBLISHABLE_KEY: string
declare const DEFAULT_LANG: string
declare const LANGS: string
declare const Stripe: (key: string) => {
  redirectToCheckout: (params: {
    lineItems: [{ price: string, quantity: number }],
    mode: string,
    successUrl: string,
    cancelUrl: string,
  }) => Promise<{
    error?: {
      message: string
    }
  }>
}

let parsedPathname = window.location.pathname.split('/');
let LANG = DEFAULT_LANG;
if (LANGS.indexOf(parsedPathname[1]) !== -1) {
  LANG = parsedPathname[1];
}

function $(selector) {
  const result = [];
  document.querySelectorAll(selector).forEach((element) => {
    result.push(element);
  });
  return result
}


// find inputs
const checkoutButton = document.getElementById('donateButton') as HTMLButtonElement;
const donateAmountInput = document.getElementById('donateAmount') as HTMLInputElement;
const subscribeCheckbox = document.getElementById('donateSubscribeCheckbox') as HTMLInputElement;
const errorMessage = document.getElementById('errorMessage') as HTMLButtonElement;


let productInfo = null;
const hiddenControls = $("#donate-screen .donate .controls")[0] as HTMLElement;

const allAmountsButtons = $('#amounts button');
const onClickAmount = (e) => {
  const productKey = e.currentTarget.getAttribute('data-product-key')
  const custom = e.currentTarget.getAttribute('data-custom') === "true"
  const forUs = e.currentTarget.getAttribute('data-for-us')
  const amount = custom ? null : parseInt(e.currentTarget.getAttribute('data-value'))
  productInfo = {
    amount: amount * 100,
    productKey,
    custom,
  }
  for (const el of allAmountsButtons) {
    el.classList.toggle('isActive', el === e.currentTarget);
  }
  for (const detailsEl of $('#details .amount-details')) {
    if (detailsEl.getAttribute('data-product-key') === productKey) {
      detailsEl.classList.add('isVisible')
    } else {
      detailsEl.classList.remove('isVisible')
    }
  }
  for (const imgEl of $('#bg-list > img')) {
    if (imgEl.getAttribute('data-product-key') === productKey) {
      imgEl.classList.add('isVisible')
    } else {
      imgEl.classList.remove('isVisible')
    }
  }
  hiddenControls.classList.add('isVisible')
  if (custom) {
    donateAmountInput.classList.toggle("isShown", true)
    donateAmountInput.focus();
    donateAmountInput.value = ``
    checkoutButton.disabled = true;
  } else {
    donateAmountInput.classList.toggle("isShown", false)
    donateAmountInput.value = `$${amount}`
    checkoutButton.disabled = false;
  }
};
for (const element of allAmountsButtons) {
  element.addEventListener('click', onClickAmount)
}

const donateAmountRe = /^\$?(\d+(?:[,.]\d*)?)$/;
donateAmountInput.addEventListener('focus', () => {
  if (donateAmountInput.value.startsWith('$')) {
    donateAmountInput.value = donateAmountInput.value.substring(1);
  }
})
donateAmountInput.addEventListener('blur', () => {
  if (!donateAmountInput.value.startsWith('$')) {
    donateAmountInput.value = '$' + donateAmountInput.value;
  }
  if (donateAmountInput.value === '$') {
    donateAmountInput.value = '';
  }
})
donateAmountInput.addEventListener('input', () => {
  const donateAmountMatch = donateAmountInput.value.match(donateAmountRe);
  if (donateAmountMatch == null) {
    checkoutButton.disabled = true;
  } else {
    productInfo.amount = Math.round(parseFloat(donateAmountMatch[1].replace(',', '.')) * 100)
    checkoutButton.disabled = false;
  }
})

// initialize Stripe using your publishable key
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// on click, send the user to Stripe Checkout to process the donation
checkoutButton.addEventListener('click', async () => {
  checkoutButton.disabled = true;
  try {
    if (productInfo == null) {
      throw new Error(`Product is not selected`);
    }
    const URL = '/.netlify/functions/payment'; // todo: move to env
    const serverResponse = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lang: LANG,
        mode: subscribeCheckbox.checked ? "subscription" : "payment",
        amount: `${productInfo.amount}`,
        productKey: productInfo.productKey,
      })
    })
    if (!serverResponse.ok) {
      const message = await serverResponse.text();
      throw new Error(message);
    }
    const responseJson = await serverResponse.json();
    if (responseJson.location == null) {
      throw new Error(`Bad response, expected to have "location" property for redirect`)
    }
    window.location.href = responseJson.location;
  } catch (e) {
    // todo: provide translation
    errorMessage.textContent = 'There seems to be an error. Please reload the page or come back later.'
    throw e;
  } finally {
    checkoutButton.disabled = false;
  }
});

// Add scroll marker
// The debounce function receives our function as a parameter
const debounce = (fn) => {
  let frame;
  return (...params) => {
    if (frame) {
      cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(() => {
      fn(...params);
    });
  }
};

// Add "scrolled" class to body when scrolled
let wasScrolled = window.scrollY !== 0;
document.body.classList.toggle('scrolled', wasScrolled)
const storeScroll = () => {
  let isScrolled = window.scrollY !== 0;
  if (isScrolled !== wasScrolled) {
    document.body.classList.toggle('scrolled', isScrolled)
    wasScrolled = isScrolled;
  }
}
document.addEventListener('scroll', debounce(storeScroll), {passive: true});
