/* eslint-disable no-undef */
export async function fetchONEUSDPrice() {
  let res;
  try {
    res = await fetch(
      "https://api.binance.com/api/v1/ticker/24hr?symbol=ONEUSDT",
      { method: "GET" }
    );
  } catch (err) {
    res = "Error Occured";
  }
  res = await res.json();
  return res.lastPrice;
}
