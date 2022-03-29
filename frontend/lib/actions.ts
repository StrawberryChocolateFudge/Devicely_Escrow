/* eslint-disable node/handle-callback-err */
/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
/* eslint-disable node/no-missing-import */
import { fetchONEUSDPrice } from "./fetch";
import {
  createSuccess,
  getById,
  getPage,
  PageState,
  renderError,
} from "./views";
import {
  confirmDelivery,
  confirmRefund,
  createJob,
  depositPay,
  getAcceptedTerms,
  getAddress,
  getArbiter,
  getFee,
  getJobByIndex,
  getMyJobs,
  getTerms,
  refund,
  requestAccounts,
  withdrawPay,
} from "./web3";

const max800 = 800;

async function clickEscrowLink(el: HTMLElement) {
  const nr = el.dataset.nr;
  const jobEscrow = await getJobByIndex(nr);
  const address = await getAddress();
  const arbiter = await getArbiter();
  let fee = await getFee(jobEscrow.pay);
  if (fee[1] !== undefined) {
    fee = fee[1];
  } else {
    fee = 0;
  }

  getPage(PageState.Escrow, { data: jobEscrow, address, arbiter, nr, fee });
}
export async function historyPageActions() {
  const back = getById("backButton");
  const bttns = document.getElementsByClassName("historyPageButtons");

  for (let i = 0; i < bttns.length; i++) {
    const bttn = bttns[i] as HTMLElement;
    bttn.onclick = async function () {
      const nr = bttn.dataset.nr;
      const jobEscrow = await getJobByIndex(nr);
      const address = await getAddress();
      const arbiter = await getArbiter();
      let fee = await getFee(jobEscrow.pay);
      if (fee[1] !== undefined) {
        fee = fee[1];
      } else {
        fee = 0;
      }

      getPage(PageState.Escrow, { data: jobEscrow, address, arbiter, nr, fee });
    };
  }

  back.onclick = function () {
    getPage(PageState.FindOrCreate, {});
  };
}

export async function escrowActions(job, address, arbiter, nr) {
  const back = getById("backButton");
  back.onclick = function () {
    getPage(PageState.FindOrCreate, {});
  };
  const onError = (err, receipt) => {
    renderError("An Error Occured");
  };
  const onReceipt = async (receipt) => {
    const jobEscrow = await getJobByIndex(nr);
    let fee = await getFee(jobEscrow.pay);
    if (fee[1] !== undefined) {
      fee = fee[1];
    } else {
      fee = 0;
    }

    getPage(PageState.Escrow, {
      data: jobEscrow,
      address,
      arbiter,
      nr,
      fee,
    });
  };
  const accepted = await getAcceptedTerms(address);

  switch (address) {
    case job.employer:
      const amountEl = getById("payment-amount") as HTMLInputElement;
      const depositBttn = getById("deposit-payment");
      const deliveredBttn = getById("mark-delivered");
      const refundButton = getById("claim-refund");
      if (depositBttn !== null) {
        depositBttn.onclick = async function () {
          if (parseFloat(amountEl.value) > 0) {
            if (accepted) {
              const price = await fetchONEUSDPrice();
              const usdValue = parseFloat(amountEl.value) * price;

              if (usdValue > max800) {
                renderError("Maximum 800USD value is allowed!");
                return;
              }

              await depositPay(nr, amountEl.value, address, onError, onReceipt);
            } else {
              renderError("You need to accept the terms first!");
            }
          } else {
            renderError("Invalid Amount");
          }
        };
      }
      if (deliveredBttn !== null) {
        deliveredBttn.onclick = async function () {
          if (accepted) {
            await confirmDelivery(nr, address, onError, onReceipt);
          } else {
            renderError("You need to accept the terms first!");
          }
        };
      }
      if (refundButton !== null) {
        refundButton.onclick = async function () {
          if (accepted) {
            await refund(nr, address, onError, onReceipt);
          } else {
            renderError("You need to accept the terms first!");
          }
        };
      }
      break;
    case job.worker:
      const setRefundBttn = getById("refund-button");
      const claimPayment = getById("claim-payment");

      if (setRefundBttn !== null) {
        setRefundBttn.onclick = async function () {
          if (accepted) {
            await confirmRefund(nr, address, onError, onReceipt);
          } else {
            renderError("You need to accept the terms first!");
          }
        };
      }

      if (claimPayment !== null) {
        claimPayment.onclick = async function () {
          if (accepted) {
            await withdrawPay(nr, address, onError, onReceipt);
          } else {
            renderError("You need to accept the terms first!");
          }
        };
      }

      break;
    case arbiter:
      const arbiterRefund = getById("arbiter-refund");
      const arbiterDelivered = getById("arbiter-delivered");

      if (arbiterRefund !== null) {
        arbiterRefund.onclick = async function () {
          if (accepted) {
            await confirmRefund(nr, address, onError, onReceipt);
          } else {
            renderError("You need to accept the terms first!");
          }
        };
      }
      if (arbiterDelivered !== null) {
        arbiterDelivered.onclick = async function () {
          if (accepted) {
            await confirmDelivery(nr, address, onError, onReceipt);
          } else {
            renderError("You need to accept the terms first!");
          }
        };
      }
      break;
    default:
      break;
  }
}

export async function newEscrowActions() {
  const employerInput = getById("employer-address-input") as HTMLInputElement;
  const workerInput = getById("worker-address-input") as HTMLInputElement;
  const country = getById("country") as HTMLSelectElement;
  const state = getById("state") as HTMLSelectElement;
  const createBttn = getById("new-job-escrow");
  const back = getById("backButton");
  back.onclick = function () {
    getPage(PageState.FindOrCreate, {});
  };
  createBttn.onclick = async function () {
    if (employerInput.value.length === 0) {
      renderError("Empty Employer Address Input");
      return;
    }
    if (workerInput.value.length === 0) {
      renderError("Empty Worker Address Input");
      return;
    }
    if (state.value === "null") {
      renderError("Invalid State Input");
      return;
    }
    if (country.value === "null") {
      renderError("Invalid country Input");
      return;
    }
    renderError("");
    // eslint-disable-next-line node/handle-callback-err
    const onError = (err, receipt) => {
      renderError("An Error Occured");
    };
    const onReceipt = (receipt) => {
      const events = receipt.events;
      const JobCreated = events.JobCreated;
      const returnValues = JobCreated.returnValues;
      createSuccess(`Got to Escrow ${returnValues[0]}`, returnValues[0]);
      clickEscrowLink(getById("go-to-escrow"));
    };

    const address = await getAddress();

    const accepted = await getAcceptedTerms(address);

    if (accepted) {
      await createJob(
        employerInput.value,
        workerInput.value,
        state.value,
        country.value,
        address,
        onError,
        onReceipt
      );
    } else {
      renderError("You need to accept the terms first!");
    }
  };
}

export async function findOrCreateActions() {
  // eslint-disable-next-line no-undef
  const jobidInput = getById("jobid-input") as HTMLInputElement;
  const findJob = getById("find-job");
  const history = getById("historyPage");
  const newJob = getById("new-job");
  const termsEl = getById("terms-button") as HTMLAnchorElement;
  const address = await getAddress();

  const termsLink = await getTerms(address);
  termsEl.href = termsLink;
  findJob.onclick = async function () {
    renderError("");

    const valid = jobidInput.checkValidity();
    if (!valid) {
      jobidInput.reportValidity();
    }
    if (jobidInput.value.length === 0) {
      return;
    }
    await requestAccounts();
    try {
      const job = await getJobByIndex(jobidInput.value);

      const address = await getAddress();
      const arbiter = await getArbiter();
      let fee = await getFee(job.pay);
      if (fee[1] !== undefined) {
        fee = fee[1];
      } else {
        fee = 0;
      }
      getPage(PageState.Escrow, {
        data: job,
        address,
        arbiter,
        nr: jobidInput.value,
        fee,
      });
    } catch (err) {
      renderError(err);
    }
  };

  history.onclick = async function () {
    const address = await getAddress();
    const myJobs = await getMyJobs(address);
    const arbiter = await getArbiter();
    getPage(PageState.History, { data: myJobs, address, arbiter });
  };

  newJob.onclick = async function () {
    getPage(PageState.NewEscrow, {});
  };
}
