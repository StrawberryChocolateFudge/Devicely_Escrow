/* eslint-disable node/no-missing-import */
import Web3 from "web3";
import escrow from "../../artifacts/contracts/Escrow.sol/Escrow.json";
import { renderError } from "./views";
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    ethereum: any;
    Module: any;
  }
}

// Testnet address
const contractAddress = () => {
  const body = document.getElementsByTagName("body");

  const contract = body[0].dataset.contract;
  if (contract === undefined || contract.length === 0) {
    renderError("Invalid contract address");
  } else {
    return contract;
  }
};

export const getCurrentChainCurrency = () => "ONE";
const web3 = getWeb3();
const contract = getContract();

export async function getMyDetails(myaddress) {
  return await contract.methods
    .getMyDetails(myaddress)
    .call({ from: myaddress });
}

export async function getTerms(myaddress) {
  return await contract.methods.getTerms().call({ from: myaddress });
}

export async function getAcceptedTerms(address) {
  return await contract.methods.acceptedTerms(address).call({ from: address });
}

export async function getArbiter() {
  return await contract.methods.getArbiter().call();
}

export async function getFee(amount) {
  return await contract.methods.calculateFee(amount).call({});
}

export async function getDeprecated() {
  return await contract.methods.isDeprecated().call({});
}

export async function depositPay(to, amount, from, onError, onReceipt) {
  await contract.methods
    .depositPay(to)
    .send({ from, value: Web3.utils.toWei(amount) })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function deprecateEscrow(from, onError, onReceipt) {
  await contract.methods
    .deprecateEscrow()
    .send({ from })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function confirmDelivery(jobNr, from, onError, onReceipt) {
  await contract.methods
    .confirmDelivery(jobNr)
    .send({ from })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function confirmRefund(jobNr, from, onError, onReceipt) {
  await contract.methods
    .confirmRefund(jobNr)
    .send({ from })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function refund(jobNr, address, onError, onReceipt) {
  await contract.methods
    .refund(jobNr)
    .send({ from: address })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function withdrawPay(jobNr, from, onError, onReceipt) {
  await contract.methods
    .withdrawPay(jobNr)
    .send({ from })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function createEscrow(buyer, seller, from, onError, onReceipt) {
  await contract.methods
    .createEscrow(buyer, seller)
    .send({ from })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function getDetailByIndex(index: string) {
  return await contract.methods.getDetailByIndex(index).call({});
}

export function getContract() {
  const abi = JSON.parse(JSON.stringify(escrow)).abi;
  const address = contractAddress();
  return new web3.eth.Contract(abi, address);
}

export function web3Injected(): boolean {
  if (window.ethereum.send) {
    return true;
  } else {
    return false;
  }
}

export function getWeb3() {
  if (window.ethereum === undefined) {
    window.open("https://metamask.io/", "_blank");
    return;
  }
  return new Web3(window.ethereum);
}

export async function requestAccounts() {
  await window.ethereum.request({ method: "eth_requestAccounts" });
}

export async function getAddress() {
  const web3 = getWeb3();
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

export async function switchToHarmony(type) {
  const chainName =
    type === "Mainnet" ? "Harmony Mainnet Shard 0" : "Harmony Testnet Shard 0";
  const chainId = type === "Mainnet" ? 1666600000 : 1666700000;

  const hexchainId = "0x" + Number(chainId).toString(16);
  const blockExplorerUrls =
    type === "Mainnet"
      ? ["https://explorer.harmony.one/#/"]
      : ["https://explorer.pops.one/#/"];

  const rpcUrls = getHarmonyRPCURLS(type);

  const switched = await switch_to_Chain(hexchainId);
  if (!switched) {
    await window.ethereum
      .request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x" + Number(chainId).toString(16),
            chainName,
            nativeCurrency: {
              name: "ONE",
              symbol: "ONE",
              decimals: 18,
            },
            rpcUrls,
            blockExplorerUrls,
          },
        ],
      })
      .then(() => window.location.reload());
  }
}

// eslint-disable-next-line camelcase
async function switch_to_Chain(chainId) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
    return true;
  } catch (err) {
    return false;
  }
}

function getHarmonyRPCURLS(type) {
  if (type === "Mainnet") {
    return ["https://api.harmony.one"];
  } else if (type === "Testnet") {
    return ["https://api.s0.b.hmny.io"];
  }
}
