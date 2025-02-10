import { AppError } from "../../common/appError";
import { CITRIXApiURL } from "../../common/constants";
import commonService from "../services/common.service";

export class CitrixService {
  // Create Load Balancer Virtual Server
  createLBVServer(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.LBVSERVER;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          lbvserver: inputparam,
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Create LoadBalancer Server
  createLBServer(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let requesturl = CITRIXApiURL.CREATE.LBSERVER;
      let requestheader = { "Content-Type": "application/json" } as any;
      let requestparams = {} as any;
      requestparams = {
        params: { warning: "YES" },
        server: inputparam,
      };
      commonService
        .CitrixCall(
          "POST",
          requesturl,
          requestheader,
          requestparams,
          ipaddress,
          credentials
        )
        .then((data: any) => {
          console.log("Citrix", data);
          resolve(data);
        })
        .catch((error: Error) => {
          throw error;
        });
    });
    return promise;
  }

  // Create Load Balancer - Service Group
  createLBServiceGroup(
    inputparam: any,
    ipaddress: any,
    credentials,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.SERVICE_GROUP;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          servicegroup: inputparam,
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Service Group - Member Binding
  createSGMemberBinding(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let requesturl = CITRIXApiURL.CREATE.SG_MEMBER_BINDING;
      let requestheader = { "Content-Type": "application/json" } as any;
      let requestparams = {} as any;
      requestparams = {
        params: { warning: "YES" },
        servicegroup_servicegroupmember_binding: inputparam,
      };
      commonService
        .CitrixCall(
          "POST",
          requesturl,
          requestheader,
          requestparams,
          ipaddress,
          credentials
        )
        .then((data: any) => {
          console.log("Citrix", data);
          resolve(data);
        })
        .catch((error: Error) => {
          throw error;
        });
    });
    return promise;
  }

  // Load Balancer Virtual Server - Member Binding
  createLBVSGBinding(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.LBVSERVER_MEMBER_BINDING;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          lbvserver_servicegroup_binding: inputparam,
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Service group - Monitor Binding
  createSGMonitorbinding(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.LB_SG_MONITORS_BINDING;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          servicegroup_lbmonitor_binding: inputparam,
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Create VMAC
  createVMAC(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.VMAC;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          vrid: inputparam,
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Create IPs
  createIPs(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    console.log("IP exceute");
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.IP;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          nsip: inputparam,
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Load balancer virtual server - Method binding

  createLBVServerMethodbinding(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.CREATE.LBVSERVER;
        let requestheader = { "Content-Type": "application/json" } as any;
        let requestparams = {} as any;
        requestparams = {
          params: { warning: "YES" },
          lbvserver: inputparam,
        };
        commonService
          .CitrixCall(
            "PUT",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Netscaler Enable features
  enableFeatures(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.FEATURES.CONFIG;
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/vnd.com.citrix.netscaler.nsfeature+json",
        } as any;
        let requestparams = {} as any;
        requestparams = {
          nsfeature: {
            feature: ["LB", "CS"],
          },
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Netscaler Enable Modes
  enableModes(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (primaryinstance) {
        let requesturl = CITRIXApiURL.MODES.CONFIG;
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/vnd.com.citrix.netscaler.nsmode+json",
        } as any;
        let requestparams = {} as any;
        requestparams = {
          nsmode: {
            mode: ["L2", "FR"],
          },
        };
        commonService
          .CitrixCall(
            "POST",
            requesturl,
            requestheader,
            requestparams,
            ipaddress,
            credentials
          )
          .then((data: any) => {
            console.log("Citrix", data);
            resolve(data);
          })
          .catch((error: Error) => {
            throw error;
          });
      } else {
        resolve({ code: "200", message: "Skip process", status: true });
      }
    });
    return promise;
  }

  // Netscaler Save config
  saveConfig(
    inputparam: any,
    ipaddress: any,
    credentials: any,
    primaryinstance: any,
    serverattached: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let requesturl = CITRIXApiURL.SAVE.CONFIG;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/vnd.com.citrix.netscaler.nsconfig+json",
      } as any;
      let requestparams = {} as any;
      requestparams = {
        params: { warning: "YES" },
        nsconfig: {},
      };
      commonService
        .CitrixCall(
          "POST",
          requesturl,
          requestheader,
          requestparams,
          ipaddress,
          credentials
        )
        .then((data: any) => {
          console.log("Citrix", data);
          resolve(data);
        })
        .catch((error: Error) => {
          throw error;
        });
    });
    return promise;
  }
}
export default new CitrixService();
