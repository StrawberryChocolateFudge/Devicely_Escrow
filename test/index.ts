import { expect } from "chai";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

describe("Escrow", function () {
  it("Should create a new escrow and deliver it and another one gets refunded", async function () {
    // eslint-disable-next-line no-unused-vars
    const [signer1, arbiter, worker, employer] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(arbiter.address);
    await escrow.deployed();

    await escrow.setTerms("test", "test");
    await escrow.connect(arbiter).accept("test");
    await escrow.connect(worker).accept("test");
    await escrow.connect(employer).accept("test");
    await escrow.accept("test");
    await escrow.createJob(employer.address, worker.address, "WY", "US");

    expect(await escrow.getLastJobIndex()).to.equal(1);
    let job = await escrow.getJobByIndex(1);
    expect(await (await escrow.getMyJobs(worker.address)).length).to.equal(1);
    expect(await (await escrow.getMyJobs(employer.address)).length).to.equal(1);

    await escrow.createJob(employer.address, worker.address, "WY", "US");
    expect(await escrow.getLastJobIndex()).to.equal(2);
    const overrides = { value: parseEther("10") };
    await escrow.connect(employer).depositPay(1, overrides);

    job = await escrow.getJobByIndex(1);
    expect(job.pay).to.equal(parseEther("10"));
    const calculatedFee = await escrow.calculateFee(job.pay);
    expect(calculatedFee[0]).to.equal(parseEther("9.8"));
    expect(calculatedFee[1]).to.equal(parseEther("0.2"));

    // set it to delivered now and withdraw it
    await escrow.connect(employer).confirmDelivery(1);
    job = await escrow.getJobByIndex(1);
    let workerBalance = await worker.getBalance();
    expect(formatEther(workerBalance)).to.equal("9999.99992150984928275");
    await escrow.connect(worker).withdrawPay(1);
    workerBalance = await worker.getBalance();
    expect(formatEther(workerBalance)).to.equal("10009.799844333576607406");
    job = await escrow.getJobByIndex(1);
    expect(job.withdrawn).to.equal(true);

    // I pay to the other , and refund it
    await escrow.connect(employer).depositPay(2, overrides);

    job = await escrow.getJobByIndex(2);
    expect(job.pay).to.equal(parseEther("10"));

    await escrow.connect(arbiter).confirmRefund(2);
    job = await escrow.getJobByIndex(2);
    expect(job.state).to.equal(3);
    let balance = await employer.getBalance();
    expect(formatEther(balance)).to.equal("9979.999645516907506417");
    await escrow.connect(employer).refund(2);
    balance = await employer.getBalance();
    expect(formatEther(balance)).to.equal("9989.799573353614186841");
  });
});
