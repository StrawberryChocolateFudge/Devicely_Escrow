/* eslint-disable node/no-missing-import */
/* eslint-disable no-unused-vars */
import { html, render } from "lit-html";
import Web3 from "web3";
import {
  escrowActions,
  findOrCreateActions,
  historyPageActions,
  newEscrowActions,
} from "./actions";
import { countries, states } from "./data";
import { getCurrentChainCurrency } from "./web3";

export function getById(id: string) {
  return document.getElementById(id);
}

export enum PageState {
  FindOrCreate,
  NewEscrow,
  Escrow,
  History,
}

export function createSuccess(msg: string, nr) {
  const msgslot = getById("message-slot");
  if (msgslot.classList.contains("error")) {
    msgslot.classList.remove("error");
  }
  render(escrowNr(msg, nr), msgslot);
  getById("new-job-button-container").innerHTML = "";
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

  switch (page) {
    case PageState.FindOrCreate:
      render(findOrCreate, main);
      findOrCreateActions();
      break;
    case PageState.NewEscrow:
      render(NewEscrow, main);
      newEscrowActions();
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
        : reversedIds.map((id) => HistoryElement(`Job ${id}`, id))}
    </article>
  `;
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

const getAction = (address, employer, worker, arbiter, state, withdrawn) => {
  switch (address) {
    case employer:
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
    case worker:
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

// Action button toggles based on if I'm the arbiter, the employer or the worker
export const EscrowPage = (job, address, arbiter, jobNr, fee) => html`
  <article id="escrow-body" data-nr="${jobNr}" class="maxwidth-800px center">
    ${backButton()}
    <h3 class="text-align-center">Job</h3>
    <div class="column">
      ${DisplayInTable("Employer", job.employer)}${DisplayInTable(
        "Worker",
        job.worker
      )}${DisplayInTable(
        "Pay",
        Web3.utils.fromWei(job.pay) + " " + getCurrentChainCurrency()
      )}${DisplayInTable("State", getStateText(job.state))}${DisplayInTable(
        "Withdrawn",
        withdrawn(job.withdrawn)
      )}
      ${DisplayInTable("Jurisdiction State", states[job.jurisdictionState])}
      ${DisplayInTable(
        "Jurisdiction Country",
        countries[job.jurisdictionCountry]
      )}
      ${DisplayInTable(
        "Fee",
        Web3.utils.fromWei(fee) + " " + getCurrentChainCurrency()
      )}
    </div>
    <div id="message-slot" class="text-align-center"></div>
    ${getAction(
      address,
      job.employer,
      job.worker,
      arbiter,
      job.state,
      job.withdrawn
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

export const States = () => html`<select
  class="maxwidth-500px center marginBottom20"
  id="state"
>
  <option value="null">Jurisdiction State</option>
  <option value="NOTUSA">Not in USA</option>
  <option value="AL">Alabama</option>
  <option value="AK">Alaska</option>
  <option value="AZ">Arizona</option>
  <option value="AR">Arkansas</option>
  <option value="CA">California</option>
  <option value="CO">Colorado</option>
  <option value="CT">Connecticut</option>
  <option value="DE">Delaware</option>
  <option value="DC">District Of Columbia</option>
  <option value="FL">Florida</option>
  <option value="GA">Georgia</option>
  <option value="HI">Hawaii</option>
  <option value="ID">Idaho</option>
  <option value="IL">Illinois</option>
  <option value="IN">Indiana</option>
  <option value="IA">Iowa</option>
  <option value="KS">Kansas</option>
  <option value="KY">Kentucky</option>
  <option value="LA">Louisiana</option>
  <option value="ME">Maine</option>
  <option value="MD">Maryland</option>
  <option value="MA">Massachusetts</option>
  <option value="MI">Michigan</option>
  <option value="MN">Minnesota</option>
  <option value="MS">Mississippi</option>
  <option value="MO">Missouri</option>
  <option value="MT">Montana</option>
  <option value="NE">Nebraska</option>
  <option value="NV">Nevada</option>
  <option value="NH">New Hampshire</option>
  <option value="NJ">New Jersey</option>
  <option value="NM">New Mexico</option>
  <option value="NY">New York</option>
  <option value="NC">North Carolina</option>
  <option value="ND">North Dakota</option>
  <option value="OH">Ohio</option>
  <option value="OK">Oklahoma</option>
  <option value="OR">Oregon</option>
  <option value="PA">Pennsylvania</option>
  <option value="RI">Rhode Island</option>
  <option value="SC">South Carolina</option>
  <option value="SD">South Dakota</option>
  <option value="TN">Tennessee</option>
  <option value="TX">Texas</option>
  <option value="UT">Utah</option>
  <option value="VT">Vermont</option>
  <option value="VA">Virginia</option>
  <option value="WA">Washington</option>
  <option value="WV">West Virginia</option>
  <option value="WI">Wisconsin</option>
  <option value="WY">Wyoming</option>
</select> `;

export const Countries = () => html`
  <select
    id="country"
    name="country"
    class="maxwidth-500px center marginBottom20"
  >
    <option value="null">Jurisdiction Country</option>
    <option value="AF">Afghanistan</option>
    <option value="AX">Aland Islands</option>
    <option value="AL">Albania</option>
    <option value="DZ">Algeria</option>
    <option value="AS">American Samoa</option>
    <option value="AD">Andorra</option>
    <option value="AO">Angola</option>
    <option value="AI">Anguilla</option>
    <option value="AQ">Antarctica</option>
    <option value="AG">Antigua and Barbuda</option>
    <option value="AR">Argentina</option>
    <option value="AM">Armenia</option>
    <option value="AW">Aruba</option>
    <option value="AU">Australia</option>
    <option value="AT">Austria</option>
    <option value="AZ">Azerbaijan</option>
    <option value="BS">Bahamas</option>
    <option value="BH">Bahrain</option>
    <option value="BD">Bangladesh</option>
    <option value="BB">Barbados</option>
    <option value="BY">Belarus</option>
    <option value="BE">Belgium</option>
    <option value="BZ">Belize</option>
    <option value="BJ">Benin</option>
    <option value="BM">Bermuda</option>
    <option value="BT">Bhutan</option>
    <option value="BO">Bolivia</option>
    <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
    <option value="BA">Bosnia and Herzegovina</option>
    <option value="BW">Botswana</option>
    <option value="BV">Bouvet Island</option>
    <option value="BR">Brazil</option>
    <option value="IO">British Indian Ocean Territory</option>
    <option value="BN">Brunei Darussalam</option>
    <option value="BG">Bulgaria</option>
    <option value="BF">Burkina Faso</option>
    <option value="BI">Burundi</option>
    <option value="KH">Cambodia</option>
    <option value="CM">Cameroon</option>
    <option value="CA">Canada</option>
    <option value="CV">Cape Verde</option>
    <option value="KY">Cayman Islands</option>
    <option value="CF">Central African Republic</option>
    <option value="TD">Chad</option>
    <option value="CL">Chile</option>
    <option value="CN">China</option>
    <option value="CX">Christmas Island</option>
    <option value="CC">Cocos (Keeling) Islands</option>
    <option value="CO">Colombia</option>
    <option value="KM">Comoros</option>
    <option value="CG">Congo</option>
    <option value="CD">Congo, Democratic Republic of the Congo</option>
    <option value="CK">Cook Islands</option>
    <option value="CR">Costa Rica</option>
    <option value="CI">Cote D'Ivoire</option>
    <option value="HR">Croatia</option>
    <option value="CU">Cuba</option>
    <option value="CW">Curacao</option>
    <option value="CY">Cyprus</option>
    <option value="CZ">Czech Republic</option>
    <option value="DK">Denmark</option>
    <option value="DJ">Djibouti</option>
    <option value="DM">Dominica</option>
    <option value="DO">Dominican Republic</option>
    <option value="EC">Ecuador</option>
    <option value="EG">Egypt</option>
    <option value="SV">El Salvador</option>
    <option value="GQ">Equatorial Guinea</option>
    <option value="ER">Eritrea</option>
    <option value="EE">Estonia</option>
    <option value="ET">Ethiopia</option>
    <option value="FK">Falkland Islands (Malvinas)</option>
    <option value="FO">Faroe Islands</option>
    <option value="FJ">Fiji</option>
    <option value="FI">Finland</option>
    <option value="FR">France</option>
    <option value="GF">French Guiana</option>
    <option value="PF">French Polynesia</option>
    <option value="TF">French Southern Territories</option>
    <option value="GA">Gabon</option>
    <option value="GM">Gambia</option>
    <option value="GE">Georgia</option>
    <option value="DE">Germany</option>
    <option value="GH">Ghana</option>
    <option value="GI">Gibraltar</option>
    <option value="GR">Greece</option>
    <option value="GL">Greenland</option>
    <option value="GD">Grenada</option>
    <option value="GP">Guadeloupe</option>
    <option value="GU">Guam</option>
    <option value="GT">Guatemala</option>
    <option value="GG">Guernsey</option>
    <option value="GN">Guinea</option>
    <option value="GW">Guinea-Bissau</option>
    <option value="GY">Guyana</option>
    <option value="HT">Haiti</option>
    <option value="HM">Heard Island and Mcdonald Islands</option>
    <option value="VA">Holy See (Vatican City State)</option>
    <option value="HN">Honduras</option>
    <option value="HK">Hong Kong</option>
    <option value="HU">Hungary</option>
    <option value="IS">Iceland</option>
    <option value="IN">India</option>
    <option value="ID">Indonesia</option>
    <option value="IR">Iran, Islamic Republic of</option>
    <option value="IQ">Iraq</option>
    <option value="IE">Ireland</option>
    <option value="IM">Isle of Man</option>
    <option value="IL">Israel</option>
    <option value="IT">Italy</option>
    <option value="JM">Jamaica</option>
    <option value="JP">Japan</option>
    <option value="JE">Jersey</option>
    <option value="JO">Jordan</option>
    <option value="KZ">Kazakhstan</option>
    <option value="KE">Kenya</option>
    <option value="KI">Kiribati</option>
    <option value="KP">Korea, Democratic People's Republic of</option>
    <option value="KR">Korea, Republic of</option>
    <option value="XK">Kosovo</option>
    <option value="KW">Kuwait</option>
    <option value="KG">Kyrgyzstan</option>
    <option value="LA">Lao People's Democratic Republic</option>
    <option value="LV">Latvia</option>
    <option value="LB">Lebanon</option>
    <option value="LS">Lesotho</option>
    <option value="LR">Liberia</option>
    <option value="LY">Libyan Arab Jamahiriya</option>
    <option value="LI">Liechtenstein</option>
    <option value="LT">Lithuania</option>
    <option value="LU">Luxembourg</option>
    <option value="MO">Macao</option>
    <option value="MK">Macedonia, the Former Yugoslav Republic of</option>
    <option value="MG">Madagascar</option>
    <option value="MW">Malawi</option>
    <option value="MY">Malaysia</option>
    <option value="MV">Maldives</option>
    <option value="ML">Mali</option>
    <option value="MT">Malta</option>
    <option value="MH">Marshall Islands</option>
    <option value="MQ">Martinique</option>
    <option value="MR">Mauritania</option>
    <option value="MU">Mauritius</option>
    <option value="YT">Mayotte</option>
    <option value="MX">Mexico</option>
    <option value="FM">Micronesia, Federated States of</option>
    <option value="MD">Moldova, Republic of</option>
    <option value="MC">Monaco</option>
    <option value="MN">Mongolia</option>
    <option value="ME">Montenegro</option>
    <option value="MS">Montserrat</option>
    <option value="MA">Morocco</option>
    <option value="MZ">Mozambique</option>
    <option value="MM">Myanmar</option>
    <option value="NA">Namibia</option>
    <option value="NR">Nauru</option>
    <option value="NP">Nepal</option>
    <option value="NL">Netherlands</option>
    <option value="AN">Netherlands Antilles</option>
    <option value="NC">New Caledonia</option>
    <option value="NZ">New Zealand</option>
    <option value="NI">Nicaragua</option>
    <option value="NE">Niger</option>
    <option value="NG">Nigeria</option>
    <option value="NU">Niue</option>
    <option value="NF">Norfolk Island</option>
    <option value="MP">Northern Mariana Islands</option>
    <option value="NO">Norway</option>
    <option value="OM">Oman</option>
    <option value="PK">Pakistan</option>
    <option value="PW">Palau</option>
    <option value="PS">Palestinian Territory, Occupied</option>
    <option value="PA">Panama</option>
    <option value="PG">Papua New Guinea</option>
    <option value="PY">Paraguay</option>
    <option value="PE">Peru</option>
    <option value="PH">Philippines</option>
    <option value="PN">Pitcairn</option>
    <option value="PL">Poland</option>
    <option value="PT">Portugal</option>
    <option value="PR">Puerto Rico</option>
    <option value="QA">Qatar</option>
    <option value="RE">Reunion</option>
    <option value="RO">Romania</option>
    <option value="RU">Russian Federation</option>
    <option value="RW">Rwanda</option>
    <option value="BL">Saint Barthelemy</option>
    <option value="SH">Saint Helena</option>
    <option value="KN">Saint Kitts and Nevis</option>
    <option value="LC">Saint Lucia</option>
    <option value="MF">Saint Martin</option>
    <option value="PM">Saint Pierre and Miquelon</option>
    <option value="VC">Saint Vincent and the Grenadines</option>
    <option value="WS">Samoa</option>
    <option value="SM">San Marino</option>
    <option value="ST">Sao Tome and Principe</option>
    <option value="SA">Saudi Arabia</option>
    <option value="SN">Senegal</option>
    <option value="RS">Serbia</option>
    <option value="CS">Serbia and Montenegro</option>
    <option value="SC">Seychelles</option>
    <option value="SL">Sierra Leone</option>
    <option value="SG">Singapore</option>
    <option value="SX">Sint Maarten</option>
    <option value="SK">Slovakia</option>
    <option value="SI">Slovenia</option>
    <option value="SB">Solomon Islands</option>
    <option value="SO">Somalia</option>
    <option value="ZA">South Africa</option>
    <option value="GS">South Georgia and the South Sandwich Islands</option>
    <option value="SS">South Sudan</option>
    <option value="ES">Spain</option>
    <option value="LK">Sri Lanka</option>
    <option value="SD">Sudan</option>
    <option value="SR">Suriname</option>
    <option value="SJ">Svalbard and Jan Mayen</option>
    <option value="SZ">Swaziland</option>
    <option value="SE">Sweden</option>
    <option value="CH">Switzerland</option>
    <option value="SY">Syrian Arab Republic</option>
    <option value="TW">Taiwan, Province of China</option>
    <option value="TJ">Tajikistan</option>
    <option value="TZ">Tanzania, United Republic of</option>
    <option value="TH">Thailand</option>
    <option value="TL">Timor-Leste</option>
    <option value="TG">Togo</option>
    <option value="TK">Tokelau</option>
    <option value="TO">Tonga</option>
    <option value="TT">Trinidad and Tobago</option>
    <option value="TN">Tunisia</option>
    <option value="TR">Turkey</option>
    <option value="TM">Turkmenistan</option>
    <option value="TC">Turks and Caicos Islands</option>
    <option value="TV">Tuvalu</option>
    <option value="UG">Uganda</option>
    <option value="UA">Ukraine</option>
    <option value="AE">United Arab Emirates</option>
    <option value="GB">United Kingdom</option>
    <option value="US">United States</option>
    <option value="UM">United States Minor Outlying Islands</option>
    <option value="UY">Uruguay</option>
    <option value="UZ">Uzbekistan</option>
    <option value="VU">Vanuatu</option>
    <option value="VE">Venezuela</option>
    <option value="VN">Viet Nam</option>
    <option value="VG">Virgin Islands, British</option>
    <option value="VI">Virgin Islands, U.s.</option>
    <option value="WF">Wallis and Futuna</option>
    <option value="EH">Western Sahara</option>
    <option value="YE">Yemen</option>
    <option value="ZM">Zambia</option>
    <option value="ZW">Zimbabwe</option>
  </select>
`;

export const NewEscrow = html` <article class="maxwidth-500px center">
  ${backButton()}
  <h3 class="text-align-center">Create new Escrow</h3>
  <input
    class="maxwidth-500px center "
    type="text"
    id="employer-address-input"
    placeholder="Employer ETH address"
  />
  <input
    class="maxwidth-500px center"
    type="text"
    id="worker-address-input"
    placeholder="Worker ETH address"
  />
  ${States()} ${Countries()}
  <div id="message-slot" class="text-align-center"></div>
  <div id="new-job-button-container">
    <button id="new-job-escrow" class="width-200 center">Create new</button>
  </div>
</article>`;

export const findOrCreate = html`
  <article class="maxwidth-500px center">
    <h3 class="text-align-center">Find your Escrow!</h3>
    <input
      class="width-200 center maxwidth-200"
      type="number"
      id="jobid-input"
      pattern="d*"
      title="Numbers only, please."
    />
    <div id="message-slot" class="text-align-center"></div>
    <button class="width-200 center" id="find-job">Find</button>
    <div class="text-align-center">
      <a class="cursor-pointer" id="historyPage">History</a>
    </div>
    <hr />
    <h4 class="text-align-center">Don't have an escrow?</h4>
    <button id="new-job" class="width-200 center">Create new</button>
    <div class="text-align-center">
      <a class="cursor-pointer" id="terms-button" class="text-align-center"
        >Terms</a
      >
    </div>
  </article>
`;

export const History = () => html` <article class="maxwidth-500px center">
  <h3 class="text-align-center">History</h3>
</article>`;
