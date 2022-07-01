/* eslint-disable no-undef */
export async function fetchETHUSDPrice() {
  let res;
  try {
    res = await fetch(
      "https://api.binance.com/api/v1/ticker/24hr?symbol=ETHUSDT",
      { method: "GET" }
    );
  } catch (err) {
    res = "Error Occured";
  }
  res = await res.json();
  return res.lastPrice;
}

export async function updateEscrowState(serverurl, escrowNr) {
  const body = JSON.stringify({ escrowNr });

  try {
    await fetch(serverurl, {
      method: "POST",
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log(err);
  }
}
