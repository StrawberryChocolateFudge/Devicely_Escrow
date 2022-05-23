//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@ricardianfabric/simpleterms/contracts/SimpleTerms.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
struct Detail {
    address payable buyer;
    address payable seller;
    uint256 pay;
    State state;
    bool initialized;
    bool withdrawn;
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

    address payable private feeDAO;
    address payable private agent;
    bool private deprecated = false;
    uint256 private constant DAOFEE = 100; // 1 percent vee goes to the FEEDAO
    uint256 private constant FEE = 200; // if fee is 200, it's a 2 percent fee on all together
    uint256 private constant FEEBASE = 10000; // Fee base is used for calculating the fee

    uint256 public totalProcessed;
    uint256 public currentBalance;

    mapping(uint256 => Detail) private details;
    uint256 private detailIndex;

    mapping(address => uint256[]) private myDetails;

    event EscrowCreated(uint256 detailIndex);
    event PaymentDeposited(uint256 to, uint256 amount);
    event DeliveryConfirmed(uint256 detail);
    event RefundConfirmed(uint256 detail);
    event Withdraw(
        uint256 detail,
        uint256 amount,
        uint256 agentFee,
        uint256 daoFee
    );
    event Refund(
        uint256 detail,
        uint256 amount,
        uint256 agentFee,
        uint256 daoFee
    );

    constructor() {
        agent = payable(msg.sender);
        //THE FEEDAO ADDRESS IS POINTING TO HARMONY TESTNET
        feeDAO = payable(0xdBB2543b6Ef7e8480b51bE37f87fDd099b14cf86);
    }

    function createEscrow(address buyer, address seller)
        external
        checkAcceptance
    {
        require(buyer != seller, "Invalid addresses");
        require(buyer != address(0), "Invalid address");
        require(seller != address(0), "Invalid adress");
        require(deprecated == false, "Contract deprecated!");
        Detail memory detail = Detail({
            buyer: payable(buyer),
            seller: payable(seller),
            pay: 0,
            state: State.awaiting_payment,
            initialized: true,
            withdrawn: false
        });

        detailIndex++;
        details[detailIndex] = detail;
        myDetails[buyer].push(detailIndex);
        myDetails[seller].push(detailIndex);
        emit EscrowCreated(detailIndex);
    }

    function calculateFee(uint256 amount)
        public
        pure
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 agentFee = (amount.mul(FEE)).div(FEEBASE);
        uint256 daoFee = (amount.mul(DAOFEE)).div(FEEBASE);
        uint256 result = amount.sub(agentFee);
        result = result.sub(daoFee);
        return (result, agentFee, daoFee);
    }

    function getDetails(uint256 at) external view returns (Detail memory) {
        return details[at];
    }

    function depositPay(uint256 to) external payable checkAcceptance {
        require(details[to].initialized, "The Escrow doesn't exist");
        require(
            details[to].state == State.awaiting_payment,
            "Invalid Escrow State"
        );
        details[to].pay = msg.value;
        totalProcessed += msg.value;
        currentBalance += msg.value;
        details[to].state = State.awaiting_delivery;
        emit PaymentDeposited(to, msg.value);
    }

    function confirmDelivery(uint256 detail) external checkAcceptance {
        require(details[detail].initialized, "The escrow doesn't exist");
        require(
            details[detail].state == State.awaiting_delivery,
            "Invalid Escrow State"
        );
        require(
            details[detail].buyer == msg.sender || msg.sender == agent,
            "Invalid address"
        );

        details[detail].state = State.delivered;
        emit DeliveryConfirmed(detail);
    }

    function confirmRefund(uint256 to) external checkAcceptance {
        require(details[to].initialized, "The escrow doesn't exist");
        require(
            details[to].state == State.awaiting_delivery,
            "Invalid Escrow State"
        );
        require(
            details[to].seller == msg.sender || msg.sender == agent,
            "Invalid address"
        );
        details[to].state = State.refunded;
        emit RefundConfirmed(to);
    }

    function withdrawPay(uint256 detail) external nonReentrant checkAcceptance {
        require(details[detail].initialized, "The escrow doesn't exist");
        require(
            details[detail].state == State.delivered,
            "Invalid Escrow State"
        );
        require(
            details[detail].seller == msg.sender,
            "Only seller can withdraw"
        );
        require(!details[detail].withdrawn, "Already withdrawn");
        currentBalance -= details[detail].pay;
        (uint256 pay, uint256 agentFee, uint256 daoFee) = calculateFee(
            details[detail].pay
        );
        details[detail].withdrawn = true;
        details[detail].seller.sendValue(pay);
        agent.sendValue(agentFee);
        feeDAO.sendValue(daoFee);
        emit Withdraw(detail, pay, agentFee, daoFee);
    }

    function refund(uint256 detail) external nonReentrant checkAcceptance {
        require(details[detail].initialized, "The Escrow doesn't exist");
        require(
            details[detail].state == State.refunded,
            "Invalid Escrow State"
        );
        require(details[detail].buyer == msg.sender, "Only buyer can withdraw");
        require(!details[detail].withdrawn, "Already withdrawn");
        currentBalance -= details[detail].pay;
        (uint256 pay, uint256 agentFee, uint256 daoFee) = calculateFee(
            details[detail].pay
        );
        details[detail].withdrawn = true;
        details[detail].buyer.sendValue(pay);
        agent.sendValue(agentFee);
        feeDAO.sendValue(daoFee);
        emit Refund(detail, pay, agentFee, daoFee);
    }

    function getLastDetailIndex() external view returns (uint256) {
        return detailIndex;
    }

    function getDetailByIndex(uint256 index)
        external
        view
        returns (Detail memory)
    {
        return details[index];
    }

    function getMyDetails(address my) external view returns (uint256[] memory) {
        return myDetails[my];
    }

    function getDetailsPaginated(
        uint256 first,
        uint256 second,
        uint256 third,
        uint256 fourth,
        uint256 fifth
    )
        external
        view
        returns (
            Detail memory,
            Detail memory,
            Detail memory,
            Detail memory,
            Detail memory
        )
    {
        return (
            details[first],
            details[second],
            details[third],
            details[fourth],
            details[fifth]
        );
    }

    function getArbiter() external view returns (address) {
        return agent;
    }

    function deprecateEscrow() external {
        require(msg.sender == agent, "Only the agent can call this.");
        deprecated = true;
    }

    function isDeprecated() external view returns (bool) {
        return deprecated;
    }
}
