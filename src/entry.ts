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

let stripePriceId = null
const donateButtonEl = $('#donateButton')[0];

const allAmountsButtons = $('#amounts button');
const onClickAmount = (e) => {
  const amount = e.currentTarget.getAttribute('data-value')
  const forUs = e.currentTarget.getAttribute('data-for-us')
  const id = e.currentTarget.getAttribute('data-id')
  stripePriceId = e.currentTarget.getAttribute('data-stripe-price')
  for (const el of allAmountsButtons) {
    el.classList.toggle('isActive', el === e.currentTarget);
  }
  for (const detailsEl of $('#details .amount-details')) {
    if (detailsEl.getAttribute('data-id') === id) {
      detailsEl.classList.add('isVisible')
    } else {
      detailsEl.classList.remove('isVisible')
    }
  }
  for (const imgEl of $('#bg-list > img')) {
    if (imgEl.getAttribute('data-value') === amount && imgEl.getAttribute('data-for-us') === forUs) {
      imgEl.classList.add('isVisible')
    } else {
      imgEl.classList.remove('isVisible')
    }
  }
  donateButtonEl.classList.add('isVisible')
};
for (const element of allAmountsButtons) {
  element.addEventListener('click', onClickAmount)
}


/**
 Stripe
 */
// initialize Stripe using your publishable key
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// find the button and error message elements
const checkoutButton = document.getElementById('donateButton') as HTMLButtonElement;
const errorMessage = document.getElementById('errorMessage') as HTMLButtonElement;

// on click, send the user to Stripe Checkout to process the donation
checkoutButton.addEventListener('click', () => {
  if (stripePriceId == null) {
    console.error(`Price is not selected, unable to make a payment`)
    return;
  }
  checkoutButton.disabled = true;
  stripe
  .redirectToCheckout({
    lineItems: [{ price: stripePriceId, quantity: 1 }],
    mode: 'payment',
    successUrl: `${window.location.origin}${LANG === DEFAULT_LANG ? '' : `/${LANG}`}/success/`,
    cancelUrl: window.location.origin,
  })
  .then(function (result) {
    if (result.error) {
      errorMessage.textContent = result.error.message;
    }
    checkoutButton.disabled = false;
  })
  .catch((e) => {
    errorMessage.textContent = 'Извините, что-то пошло не так :('
    checkoutButton.disabled = false;
    throw e;
  });
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
  console.log("isScrolled", isScrolled)
  if (isScrolled !== wasScrolled) {
    document.body.classList.toggle('scrolled', isScrolled)
    wasScrolled = isScrolled;
  }
}
document.addEventListener('scroll', debounce(storeScroll), { passive: true });
