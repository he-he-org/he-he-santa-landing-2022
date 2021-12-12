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


let stripeAmount: string = null
const hiddenControls = $("#donate-screen .donate .controls")[0] as HTMLElement;

const allAmountsButtons = $('#amounts button');
const onClickAmount = (e) => {
  const amount = e.currentTarget.getAttribute('data-value')
  const forUs = e.currentTarget.getAttribute('data-for-us')
  stripeAmount = amount;
  for (const el of allAmountsButtons) {
    el.classList.toggle('isActive', el === e.currentTarget);
  }
  for (const detailsEl of $('#details .amount-details')) {
    if (detailsEl.getAttribute('data-value') === amount && detailsEl.getAttribute('data-for-us') === forUs) {
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
  donateAmountInput.value = `$${amount}`
  hiddenControls.classList.add('isVisible')
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
})
donateAmountInput.addEventListener('input', () => {
  checkoutButton.disabled = !donateAmountRe.test(donateAmountInput.value);
})

// initialize Stripe using your publishable key
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// on click, send the user to Stripe Checkout to process the donation
checkoutButton.addEventListener('click', async () => {
  checkoutButton.disabled = true;
  try {
    const donateAmountMatch = donateAmountInput.value.match(donateAmountRe);
    if (donateAmountMatch == null) {
      throw new Error(`Invalid amount`)
    }
    const amount = Math.round(parseFloat(donateAmountMatch[1].replace(',', '.')) * 100)

    const URL = '/.netlify/functions/payment'; // todo: move to env
    if (stripeAmount == null) {
      throw new Error(`Please specify donation amount`)
    }
    const serverResponse = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lang: LANG,
        mode: subscribeCheckbox.checked ? "subscription" : "payment",
        amount: `${amount}`,
      })
    })
    const responseJson = await serverResponse.json();
    if (responseJson.location == null) {
      throw new Error(`Bad response, expected to have "location" property for redirect`)
    }
    window.location.href = responseJson.location;
  } catch (e) {
    // todo: provide translation
    errorMessage.textContent = 'Извините, что-то пошло не так :('
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
