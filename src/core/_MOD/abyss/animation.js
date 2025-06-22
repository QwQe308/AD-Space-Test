let abyssAnimationInterval;
let swapDelay = 1000

function waitForInterval() {
  return new Promise((resolve) => {
    setTimeout(()=>{
      Quote.advanceQueue();
      resolve()
    }, swapDelay)
  });
}

export async function abyssAnimation() {
  for (let i in Quotes) {
    Quotes[i].all.forEach((element) => {
      element.present();
    });
  }
  while(ui.view.quotes.current){
    if(swapDelay > 250) swapDelay /= 1.06
    swapDelay /= 1.04
    await waitForInterval();
  }
  console.log("test completed");
  swapDelay = 1000
}
