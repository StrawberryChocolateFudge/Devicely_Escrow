import Web3 from "web3";
import escrow from "../../artifacts/contracts/Escrow.sol/Escrow.json";
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    ethereum: any;
    Module: any;
  }
}

// Testnet address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const web3 = getWeb3();

const contract = getContract();

export async function getMyJobs(myaddress) {
  return await contract.methods.getMyJobs(myaddress).call({ from: myaddress });
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

export async function depositPay(to, amount, from, onError, onReceipt) {
  await contract.methods
    .depositPay(to)
    .send({ from, value: Web3.utils.toWei(amount) })
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

export async function createJob(
  employer,
  worker,
  jursidictionState,
  jurisdictionCountry,
  from,
  onError,
  onReceipt
) {
  await contract.methods
    .createJob(employer, worker, jursidictionState, jurisdictionCountry)
    .send({ from })
    .on("error", onError)
    .on("receipt", onReceipt);
}

export async function getJobByIndex(index: string) {
  return await contract.methods.getJobByIndex(index).call({});
}

export function getContract() {
  const abi = JSON.parse(JSON.stringify(escrow)).abi;
  return new web3.eth.Contract(abi, contractAddress);
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
    await window.ethereum.request({
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
    });
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
