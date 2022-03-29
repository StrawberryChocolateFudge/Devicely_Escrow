//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@ricardianfabric/simpleterms/contracts/SimpleTerms.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
struct Job {
    address payable employer;
    address payable worker;
    uint256 pay;
    State state;
    bool initialized;
    bool withdrawn;
    string jurisdictionState;
    string jurisdictionCountry;
}

enum State {
    awaiting_payment,
    awaiting_delivery,
    delivered,
    refunded
}

contract Escrow is SimpleTerms, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address payable;

    address payable private arbiter;
    address private owner;
    uint256 private constant FEE = 200; // if fee is 200, it's a 2 percent fee
    uint256 private constant FEEBASE = 10000;

    uint256 public totalProcessed;
    uint256 public currentBalance;

    mapping(uint256 => Job) private jobs;
    uint256 private jobIndex;

    mapping(address => uint256[]) private myJobs;

    event JobCreated(uint256 jobIndex);
    event PaymentDeposited(uint256 to, uint256 amount);
    event DeliveryConfirmed(uint256 job);
    event RefundConfirmed(uint256 job);
    event Withdraw(uint256 job, uint256 amount, uint256 fee);
    event Refund(uint256 job, uint256 amount, uint256 fee);

    constructor(address _arbiter) {
        arbiter = payable(_arbiter);
        owner = msg.sender;
    }

    function createJob(
        address employer,
        address worker,
        string calldata jurisdictionState,
        string calldata jurisdictionCountry
    ) external checkAcceptance {
        require(employer != worker, "Invalid addresses");
        require(employer != address(0), "Invalid address");
        require(worker != address(0), "Invalid adress");
        Job memory job = Job({
            employer: payable(employer),
            worker: payable(worker),
            pay: 0,
            state: State.awaiting_payment,
            initialized: true,
            withdrawn: false,
            jurisdictionState: jurisdictionState,
            jurisdictionCountry: jurisdictionCountry
        });

        jobIndex++;
        jobs[jobIndex] = job;
        myJobs[employer].push(jobIndex);
        myJobs[worker].push(jobIndex);
        emit JobCreated(jobIndex);
    }

    function calculateFee(uint256 amount)
        public
        pure
        returns (uint256, uint256)
    {
        uint256 fee_ = (amount.mul(FEE)).div(FEEBASE);
        return (amount.sub(fee_), fee_);
    }

    function getJob(uint256 at) external view returns (Job memory) {
        return jobs[at];
    }

    function depositPay(uint256 to) external payable checkAcceptance {
        require(jobs[to].initialized, "The Job doesn't exist");
        require(jobs[to].state == State.awaiting_payment, "Invalid Job State");
        jobs[to].pay = msg.value;
        totalProcessed += msg.value;
        currentBalance += msg.value;
        jobs[to].state = State.awaiting_delivery;
        emit PaymentDeposited(to, msg.value);
    }

    function confirmDelivery(uint256 job) external checkAcceptance {
        require(jobs[job].initialized, "The job doesn't exist");
        require(
            jobs[job].state == State.awaiting_delivery,
            "Invalid Job State"
        );
        require(
            jobs[job].employer == msg.sender || msg.sender == arbiter,
            "Invalid address"
        );

        jobs[job].state = State.delivered;
        emit DeliveryConfirmed(job);
    }

    function confirmRefund(uint256 to) external checkAcceptance {
        require(jobs[to].initialized, "The job doesn't exist");
        require(jobs[to].state == State.awaiting_delivery, "Invalid Job State");
        require(
            jobs[to].worker == msg.sender || msg.sender == arbiter,
            "Invalid address"
        );
        jobs[to].state = State.refunded;
        emit RefundConfirmed(to);
    }

    function withdrawPay(uint256 job) external nonReentrant checkAcceptance {
        require(jobs[job].initialized, "The job doesn't exist");
        require(jobs[job].state == State.delivered, "Invalid Job State");
        require(jobs[job].worker == msg.sender, "Only worker can withdraw");
        require(jobs[job].withdrawn == false, "Already withdrawn");
        currentBalance -= jobs[job].pay;
        (uint256 pay, uint256 _fee_) = calculateFee(jobs[job].pay);
        jobs[job].withdrawn = true;
        jobs[job].worker.sendValue(pay);
        arbiter.sendValue(_fee_);
        emit Withdraw(job, pay, _fee_);
    }

    function refund(uint256 job) external nonReentrant checkAcceptance {
        require(jobs[job].initialized, "The job doesn't exist");
        require(jobs[job].state == State.refunded, "Invalid Job State");
        require(jobs[job].employer == msg.sender, "Only employer can withdraw");
        require(jobs[job].withdrawn == false, "Already withdrawn");
        currentBalance -= jobs[job].pay;
        (uint256 pay, uint256 _fee_) = calculateFee(jobs[job].pay);
        jobs[job].withdrawn = true;
        jobs[job].employer.sendValue(pay);
        arbiter.sendValue(_fee_);
        emit Refund(job, pay, _fee_);
    }

    function getLastJobIndex() external view returns (uint256) {
        return jobIndex;
    }

    function getJobByIndex(uint256 index) external view returns (Job memory) {
        return jobs[index];
    }

    function getMyJobs(address my) external view returns (uint256[] memory) {
        return myJobs[my];
    }

    function getJobsPaginated(
        uint256 first,
        uint256 second,
        uint256 third,
        uint256 fourth,
        uint256 fifth
    )
        external
        view
        returns (
            Job memory,
            Job memory,
            Job memory,
            Job memory,
            Job memory
        )
    {
        return (
            jobs[first],
            jobs[second],
            jobs[third],
            jobs[fourth],
            jobs[fifth]
        );
    }

    function getArbiter() external view returns (address) {
        return arbiter;
    }
}
