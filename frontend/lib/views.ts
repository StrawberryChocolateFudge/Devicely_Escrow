/* eslint-disable node/no-missing-import */
/* eslint-disable no-unused-vars */
import { html, nothing, render } from "lit-html";
import Web3 from "web3";
import {
  connectWalletAction,
  escrowActions,
  findOrCreateActions,
  historyPageActions,
  newEscrowActions,
} from "./actions";
import { getCurrentChainCurrency } from "./web3";

export function getById(id: string) {
  return document.getElementById(id);
}

export enum PageState {
  FindOrCreate,
  NewEscrow,
  Escrow,
  History,
  connectWallet,
}

export function createSuccess(msg: string, nr) {
  const msgslot = getById("message-slot");
  if (msgslot.classList.contains("error")) {
    msgslot.classList.remove("error");
  }
  render(escrowNr(msg, nr), msgslot);
  getById("new-escrow-button-container").innerHTML = "";
}

function escrowNr(msg, nr) {
  return html`<button
    id="go-to-escrow"
    data-nr="${nr}"
    class="maxwidth-500px center marginBottom20"
  >
    ${msg}
  </button>`;
}

export function renderError(err: string) {
  const errSlot = getById("message-slot");
  if (!errSlot.classList.contains("error")) {
    errSlot.classList.add("error");
  }
  errSlot.innerHTML = err;
}

export async function getPage(page: PageState, args: any) {
  const main = getById("main");
  const body = document.getElementsByTagName("body");
  const title = body[0].dataset.title;

  switch (page) {
    case PageState.FindOrCreate:
      render(findOrCreate(title), main);
      findOrCreateActions();
      break;
    case PageState.NewEscrow:
      render(NewEscrow(args.data.arbiterCalls, args.data.deprecated), main);
      newEscrowActions(args.data.arbiterCalls);
      break;
    case PageState.Escrow:
      render(
        EscrowPage(args.data, args.address, args.arbiter, args.nr, args.fee),
        main
      );
      escrowActions(args.data, args.address, args.arbiter, args.nr);
      break;
    case PageState.History:
      render(historyPage(args.data), main);
      historyPageActions();
      break;
    case PageState.connectWallet:
      render(ConnectWallet(title), main);
      connectWalletAction();
      break;
    default:
      break;
  }
}

function historyPage(ids) {
  const reversedIds = [];
  if (ids !== undefined) {
    for (let i = ids.length - 1; i >= 0; i--) {
      reversedIds.push(ids[i]);
    }
  }

  return html`
    <article class="maxwidth-500px center">
      ${backButton()}
      <hr />
      ${ids === undefined
        ? html`<h4 class="text-align-center">No History</h4>`
        : reversedIds.map((id) => HistoryElement(`Escrow ${id}`, id))}
    </article>
  `;
}
export function hideButton(el, show) {
  if (show === "show") {
    el.style.display = "block";
  } else if (show === "hide") {
    el.style.display = "none";
  }
}

function withdrawn(w) {
  return w === true ? "YES" : "NO";
}

function getStateText(state) {
  switch (state) {
    case "0":
      return "Awaiting Payment";
    case "1":
      return "Awaiting Delivery";
    case "2":
      return "Delivered";
    case "3":
      return "Refunded";
    default:
      break;
  }
}

const getAction = (address, buyer, seller, arbiter, state, withdrawn) => {
  switch (address) {
    case buyer:
      if (state === "0") {
        return html`
          <input type="text" id="payment-amount" placeholder="Amount" />
          <button class="width-200 center" id="deposit-payment">
            Deposit Payment
          </button>
        `;
      } else if (state === "1") {
        return html`
          <button id="mark-delivered" class="width-200 center">
            Delivered
          </button>
        `;
      } else if (state === "3" && !withdrawn) {
        return html`
          <button id="claim-refund" class="width-200 center">
            Claim Refund
          </button>
        `;
      }
      break;
    case seller:
      if (state === "1") {
        return html`
          <button id="refund-button" class="width-200 center">Refund</button>
        `;
      } else if (state === "2" && !withdrawn) {
        return html`
          <button id="claim-payment" class="width-200 center">
            Claim Payment
          </button>
        `;
      }
      return;
    case arbiter:
      if (state === "1") {
        return html`<div class="row">
          <button id="arbiter-refund" class="width-200 center">Refund</button>
          <button id="arbiter-delivered" class="width-200 center">
            Delivered
          </button>
        </div>`;
      }
      break;
    default:
      break;
  }
};

const backButton = () => html`
  <div id="backButton" class="cursor-pointer">
    <svg
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
      xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
      width="30"
      height="30"
      viewBox="0 0 38.000011 68"
      version="1.1"
      id="svg8"
      inkscape:export-filename="/home/user/nextArrow.png"
      inkscape:export-xdpi="96"
      inkscape:export-ydpi="96"
      inkscape:version="0.92.5 (2060ec1f9f, 2020-04-08)"
      sodipodi:docname="prev.svg"
    >
      <g
        inkscape:label="Layer 1"
        inkscape:groupmode="layer"
        id="layer1"
        transform="translate(0,-229)"
      >
        <path
          style="fill:#000000;stroke-width:0.13298428"
          d="m 33.109404,296.87949 c -0.52166,-0.17791 -2.62463,-2.22796 -16.39343,-15.98087 C 6.0199938,270.21499 0.8364838,264.94807 0.6592538,264.58352 0.26144376,263.76526 0.19664376,262.95759 0.45598376,262.05016 l 0.22431004,-0.78485 15.7823502,-15.795 c 11.58948,-11.59876 15.93943,-15.87133 16.37357,-16.08232 2.89992,-1.40929 5.95743,1.69165 4.51855,4.58272 -0.19362,0.38902 -4.71481,5.00268 -14.52988,14.82702 L 8.5760838,263.06 22.883814,277.38935 c 9.32191,9.33601 14.38463,14.49932 14.52843,14.8171 0.81653,1.80443 -0.0452,3.94824 -1.86003,4.62724 -0.84568,0.31641 -1.60744,0.33069 -2.44281,0.0458 z"
          id="path888"
          inkscape:connector-curvature="0"
        />
      </g>
    </svg>
  </div>
`;

// Action button toggles based on if I'm the arbiter, the buyer or the seller
export const EscrowPage = (escrow, address, arbiter, escrowNr, fee) => html`
  <article id="escrow-body" data-nr="${escrowNr}" class="maxwidth-800px center">
    ${backButton()}
    <h3 class="text-align-center">Escrow ${escrowNr}</h3>
    <div class="column">
      ${DisplayInTable("Buyer", escrow.buyer)}${DisplayInTable(
        "Seller",
        escrow.seller
      )}${DisplayInTable(
        "Pay",
        Web3.utils.fromWei(escrow.pay) + " " + getCurrentChainCurrency()
      )}${DisplayInTable("State", getStateText(escrow.state))}${DisplayInTable(
        "Withdrawn",
        withdrawn(escrow.withdrawn)
      )}
      ${DisplayInTable(
        "Fee",
        Web3.utils.fromWei(fee) + " " + getCurrentChainCurrency()
      )}
    </div>
    <div id="message-slot" class="text-align-center"></div>
    ${getAction(
      address,
      escrow.buyer,
      escrow.seller,
      arbiter,
      escrow.state,
      escrow.withdrawn
    )}
  </article>
`;

const HistoryElement = (title, data) => html` <table>
  <tbody>
    <tr>
      <td
        class="cursor-pointer hover-light historyPageButtons"
        data-nr="${data}"
      >
        ${title}
      </td>
    </tr>
  </tbody>
</table>`;

const DisplayInTable = (title, data) => html` <table>
  <thead>
    <th>${title}</th>
  </thead>
  <tbody>
    <tr>
      <td>${data}</td>
    </tr>
  </tbody>
</table>`;

export const NewEscrow = (arbiterCalls, deprecated) => html` <article
  class="maxwidth-500px center"
>
  ${backButton()}
  <h3 class="text-align-center">Create new Escrow</h3>
  <input
    class="maxwidth-500px center "
    type="text"
    id="buyer-address-input"
    placeholder="Buyer ETH address"
  />
  <input
    class="maxwidth-500px center"
    type="text"
    id="seller-address-input"
    placeholder="Seller ETH address"
  />

  <div id="message-slot" class="text-align-center"></div>
  <div id="new-escrow-button-container">
    <button id="new-escrow" class="width-200 center" ?disabled=${deprecated}>
      Create new
    </button>
  </div>
  ${arbiterCalls
    ? html`<hr />
        <button
          class="width-200 center"
          id="deprecate-escrow"
          ?disabled=${deprecated}
        >
          Disable escrow
        </button>`
    : nothing}
</article>`;

export const findOrCreate = (title: string) => html`
  <article class="maxwidth-500px center">
    <h4 class="text-align-center">Find your Escrow!</h4>
    <input
      class="width-200 center maxwidth-200"
      type="number"
      id="escrownr-input"
      pattern="d*"
      title="Numbers only, please."
    />
    <div id="message-slot" class="text-align-center"></div>
    <button class="width-200 center" id="find-escrow">Find</button>
    <div class="text-align-center">
      <a class="cursor-pointer" id="historyPage">History</a>
    </div>
    <hr />
    <h4 class="text-align-center">Don't have an Escrow?</h4>
    <button id="new-escrow" class="width-200 center">Create new</button>
    <div class="text-align-center">
      <a
        class="cursor-pointer"
        id="terms-button"
        class="text-align-center"
        rel="noopener"
        target="_blank"
        >Terms</a
      >
    </div>
  </article>
`;

export const History = () => html` <article class="maxwidth-500px center">
  <h3 class="text-align-center">History</h3>
</article>`;

export const ConnectWallet = (title: string) =>
  html`<article class="maxwidth-500px center">
    <h1 class="text-align-center">${title}</h1>
    <h4 class="text-align-center">Escrow Service</h4>
    <div id="message-slot" class="text-align-center"></div>
    <button id="connect-wallet" class="maxwidth-200 center">
      Connect Your Wallet
    </button>
  </article>`;
