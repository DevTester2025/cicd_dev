const Influx = require("influx");

export class influxDbService {
  constructor() {}
  connetInfluxDB() {
    const influx = new Influx.InfluxDB({
      host: "15.206.79.171",
      port: 8086,
      protocol: "http",
      // username: 'root',
      // password: 'pa$$w0rd',
      database: "cloudmatiq",
    });
    return influx;
  }

  executeQuery(query) {
    console.log(query);
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        let influx = this.connetInfluxDB();
        influx.query(query).then((results) => {
          resolve(results);
        });
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  writeData(data, date, value) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        let influx = this.connetInfluxDB();
        influx
          .writePoints([
            {
              measurement: "utilization",
              tags: data,
              fields: { value: value },
              timestamp: date,
            },
          ])
          .then((data) => {
            resolve(data);
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }
  formInfluxWhere(data) {
    function formQuery(query, key, value) {
      if (value) {
        if (Array.isArray(value)) {
          let concatValue = "";
          value.forEach((element, i) => {
            if (i == 0) {
              concatValue += `${key} = '${element}'`;
            } else {
              concatValue += ` OR ${key} = '${element}'`;
            }
          });
          return query + ` AND (${concatValue})`;
        } else {
          query += ` AND ${key} = '${value}'`;
          return query;
        }
      } else {
        return query;
      }
    }
    let condition = "";
    condition = formQuery(condition, "instancerefid", data.instancerefid);
    condition = formQuery(condition, "utilkey", data.utilkey);
    condition = formQuery(condition, "utiltype", data.utiltype);
    condition = formQuery(condition, "tenantid", data.tenantid);
    return condition;
  }
}

export default new influxDbService();
