import db from "../../models/model";
import CommonService from "../common.service";
interface Instance {
  name: string;
  privateipv4?: string;
  cloudprovider: "AWS" | "Sentia" | "Equinix";
}
export class SyncVMwareIpsService {
  constructor() {}

  getIpForVM(asset: Instance) {
    try {
      let crn =
        asset.cloudprovider != "AWS"
          ? "crn:esko:virtual_machine"
          : "crn:esko:aws_virtual_machine";
      let namecrn = crn + "/fk:name";
      let ipcrn = crn + "/fk:private_ip";
      let query = `select fieldvalue from tbl_assets_dtl where resourceid = (select resourceid from tbl_assets_dtl where crn = :crn and fieldkey = :namecrn and fieldvalue = :name limit 1) and fieldkey = :ipcrn limit 1`;
      let params = {
        replacements: {
          name: asset.name,
          crn: crn,
          namecrn: namecrn,
          ipcrn: ipcrn,
        },
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      return CommonService.executeQuery(query, params, db.sequelize)
        .then((list) => {
          if (list.length > 0) {
            return[list[0].fieldvalue];
          } else {
            return("");
          }
        })
        .catch((error: Error) => {
          console.log(error);
          return("");
        });
    } catch (e) {
      console.log(e);
    }
  }
}
export default new SyncVMwareIpsService();
