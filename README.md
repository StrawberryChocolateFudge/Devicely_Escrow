# Devicely Payments

You can find out about Devicely [here](https://github.com/StrawberryChocolateFudge/Devicely).
It's a marketplace created for the Sustainable Blockchain Hackathon.

The full stack escrow application in this repository was built to help create safe payments between buyers and sellers, it was modified to work with Devicely.

It was created with Hardhat ❤️ Parcel.

This escrow can be used as a drop-in solution for an E-commerce app.

This repo was forked from a previous version (built by me) that I modified now to fit Devicely.
You can fork away and use it in your own project.

Devicely Payments Contract deployed on Ropsten Testnet

    0xE1fe19295EcE29eCE8a25969aDf5D5650a10b914

#### Fee

This escrow charges 2% fee on all payments and uses a Ricardian Contract.

# Front end

I built the UI using parcel, it's found in the /frontend folder.
It uses Pico.css. It's a lightweight app that was built to be as simple as possible.

# API docs

    contract Escrow is SimpleTerms, ReentrancyGuard

The escrow contract implements SimpleTerms, you can find out the API [here](https://www.npmjs.com/package/@ricardianfabric/simpleterms)
This is used for the Ricardian Contract.

### Constructor

    constructor() {
        agent = payable(msg.sender);
    }

When the contract is deployed, the msg.sender becomes the escrow agent.

### Roles

The escrow assumes there are 3 roles. A Buyer, a Seller and the Agent who resolves disputes.

### Structs, Enums

    struct Detail {
        address payable buyer;
        address payable seller;
        uint256 pay;
        State state;
        bool initialized;
        bool withdrawn;
    }

When an escrow is created, it has details. It records the address of the buyer, seller, how much was payed into the contract, the state and if it's initialized or withdrawn.

    mapping(uint256 => Detail) private details;
    uint256 private detailIndex;

The details are stored in a mapping, accessable by index.
Use **Detail.initialized** to check if the detail you are fetching by index exists in the mapping.

    enum State {
        awaiting_payment,
        awaiting_delivery,
        delivered,
        refunded
    }

The escrow has multiple states, let me explain them one by one:

1. awaiting_payment is the first state of the escrow. The escrow was created with it and the buyer has to deposit ETH to move on to the next state.

2. awaiting_delivery is the next. This state allows the buyer address to change the state to delivered, or the seller address to change the state to refunded. The Escrow Agent address also has the rights to switch to any of these states.

3. When the state switches to delivered, the seller can pull payments.

4. When refunded, the buyer can pull payments.

### Events

    event EscrowCreated(uint256 detailIndex);

Emitted when an Escrow is created, the detailIndex can be used to return more details

    event PaymentDeposited(uint256 to, uint256 amount);

Emitted after the Payment is deposted. to is the escrow number and amount is the ETH transferred to the contract.

    event DeliveryConfirmed(uint256 detail);

Emitted after a buyer confirms delivery.

    event RefundConfirmed(uint256 detail);

Emitted after a state change to refunded.

    event Withdraw(uint256 detail, uint256 amount, uint256 agentFee);

Emitted when the payment is withdrawn after it was delivered.

    event Refund(uint256 detail, uint256 amount, uint256 agentFee);

Emitted when the state changes to refund

## State change

    function createEscrow(address buyer, address seller)
            external
            checkAcceptance

Call this to create a new Escrow. Only wallets who accepted the Ricardian Contract can call this due to the checkAcceptance modifier.

    function depositPay(uint256 to) external payable checkAcceptance

Payment is deposited via this function.

    function confirmDelivery(uint256 detail) external checkAcceptance

The buyer address or the agent address can confirm delivery by calling this function.

    function confirmRefund(uint256 to) external checkAcceptance

This function is called when we set the state to refunded. only the seller or the agent can call this.

    function withdrawPay(uint256 detail) external nonReentrant checkAcceptance

This is called when the seller can pull the payment to his address.

    function refund(uint256 detail) external nonReentrant checkAcceptance

This function is called when the payment has been refunded.

    deprecateEscrow() external

The agent aka the deployer can deprecate his escrow any time.

The payments in process are not interrupted, hovewer no more new escrow can be created.

## Pure, Public,View Functions

    function calculateFee(uint256 amount)
            public
            pure
            returns (uint256, uint256)

Call this to calculate and display the fee on the front end.
amount is the pay. It will return a tupple. The pay that the seller gets and the fee sent to the escrow agent.

    function getDetails(uint256 at) external view returns (Detail memory)

The details are fetched via this function.

    function getLastDetailIndex() external view returns (uint256)

Returns the last escrow detail's index.

    function getDetailByIndex(uint256 index)
            external
            view
            returns (Detail memory)

Fetch the detail by the index. Highest is the value you get with getLastDetailIndex() , after that the Details.initialized is false, and escrows have only default value.

    function getMyDetails(address my) external view returns (uint256[] memory)

Returns the details of an address. used for fetching the history of addresses.

    function getDetailsPaginated(
            uint256 first,
            uint256 second,
            uint256 third,
            uint256 fourth,
            uint256 fifth
        )

Use this for pagination, if you want to return escrow history, you can retrieve 5 with 1 request!

    function getArbiter() external view returns (address);

This function returns the address of the agent. He is the arbiter who can decide how to resolve a dispute.

    function isDeprecated() external view returns (bool);

You can check if the escrow is deprecated by calling this.

# Dev

Install dependencies:

     npm install

Start the local network:

     npx hardhat node

Run tests:

    npx hardhat test

Deploy:

     npx hardhat run scripts/deploy.ts --network localhost

Front end:

    npm run dev
