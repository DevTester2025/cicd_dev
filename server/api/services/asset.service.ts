import * as _ from "lodash";

export class AssetService {
  constructor() {}
  getMonthlyPrice(
    pricings,
    pricingmodel,
    priceperunit,
    currency,
    withoutcurrecy?
  ) {
    let totalcosts: any = 0;
    let monthlyValue: any = _.find(pricings, {
      keyname: "Monthly",
    });
    let matchingValue: any = _.find(pricings, { keyname: pricingmodel });
    if (matchingValue != undefined) {
      let priceperhour = (
        Number(priceperunit) / Number(matchingValue.keyvalue)
      ).toFixed(2);
      totalcosts = (
        Number(priceperhour) * Number(monthlyValue.keyvalue)
      ).toFixed(2);
    }
    if (withoutcurrecy) {
      return parseFloat(totalcosts).toFixed(2);
    } else {
      totalcosts = currency + " " + parseFloat(totalcosts).toFixed(2);
      return totalcosts;
    }
  }
}
export default new AssetService();
