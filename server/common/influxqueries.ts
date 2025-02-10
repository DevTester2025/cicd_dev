export class InfluxQueries {
  getUtilization(startDate, endDate, groupby, whereQuery, duration) {
    return `select mean(value),min(value),max(value) from utilization WHERE time >= '${startDate}' AND time <= '${endDate}' ${whereQuery} and value > 0 group by time(${duration}),${groupby}`;
  }

  getActiveInstanceList(whereQuery, limit?, offset?) {
    // return `select last(value) from utilization where time > now()-5m group by instancename,instancerefid`;
    return `select last(value) from utilization where time < now()-5m and time > now()-55m ${whereQuery} group by instancerefid`;
    // if (limit && offset) {
    //     return `select value,instancerefid from (select last(value) as value from utilization where time < now()-5m and time > now()-55m ${whereQuery} group by instancerefid) order by desc limit ${limit} offset ${offset}`;
    // } else {
    //     return `select value,instancerefid from (select last(value) as value from utilization where time < now()-5m and time > now()-55m ${whereQuery} group by instancerefid) order by desc`;
    // }
  }
  getInActiveInstanceList(tenantid, instancerefids) {
    // select last(value) from utilization where time < now()-5m and time > now()-55m and instancerefid <> '${instancerefids}'  group by instancerefid

    return `select last(value) from utilization where time < now()-55m and tenantid='${tenantid}' group by instancerefid`;
  }
}

export const influxQueries = new InfluxQueries();
