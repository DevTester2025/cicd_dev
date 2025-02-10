import db from "../models/model";
import CommonService from "../services/common.service";
import { Queue } from "bullmq";
import { constants } from "../../common/constants";
import IORedis = require("ioredis");
import ScheduleService from "../services/orchestration/schedule";

export class ExptrService {
    async installExporter(data, install?) {
        let promise = new Promise<any>(
            async (resolve: Function, reject: Function) => {
                try {
                    let orchestrationID: any;
                    let orchmapping: any = await db.ExptrOrchestration.find({ where: { exprtorchid: data.exprtorchid }, attributes: ['instlorchid', 'exprtrname', 'rmvorchid', 'exprtorchid'] });
                    if (orchmapping) {
                        orchmapping = JSON.parse(JSON.stringify(orchmapping));
                        orchestrationID = install ? orchmapping.instlorchid : orchmapping.rmvorchid;
                        let orchdetails: any = await db.Orchestration.find({ where: { orchid: orchestrationID }, attributes: ['orchflow', 'orchname'] });
                        let instdetails: any = await db.Instances.find({ where: { instancerefid: data.instancerefid }, attributes: ['instancename', 'instancerefid'] });
                        orchdetails = JSON.parse(JSON.stringify(orchdetails));
                        instdetails = JSON.parse(JSON.stringify(instdetails));
                        if (orchdetails && instdetails) {
                            let workFlow = JSON.parse(orchdetails.orchflow);
                            let sessionData = workFlow.nodes.find((el) => { return el.name == "SessionNode" });
                            const conn = new IORedis({
                                host: process.env.APP_REDIS_HOST,
                                password: process.env.APP_REDIS_PASS,
                                port: parseInt(process.env.APP_REDIS_PORT),
                                maxRetriesPerRequest: null,
                                enableReadyCheck: false,
                                db: parseInt(process.env.APP_REDIS_ORCH_DB),
                            }).setMaxListeners(0);

                            const schedulerQueue = new Queue(constants.QUEUE.ORCH_RUN_SCHEDULER, {
                                connection: conn,
                            });
                            let groupTitle = `${install ? 'Install' : 'Remove'}-${orchmapping.exprtrname}-${instdetails.instancename}`;
                            const groups = [{
                                title: groupTitle
                            }];
                            groups[0][sessionData.data.name] = instdetails.instancerefid;
                            let orchestrationData = {
                                "title": groupTitle,
                                "_orch": orchestrationID,
                                "exptrid": data.exptrid,
                                "status": constants.STATUS_ACTIVE,
                                "_tenant": data.tenantid,
                                "createddt": new Date(),
                                "createdby": data.lastupdatedby,
                                "lastupdateddt": new Date(),
                                "lastupdatedby": data.lastupdatedby,
                                "rungroups": groups,
                                "params": "{}"
                            };
                            let hdrData = await CommonService.create({
                                "title": groupTitle,
                                "orchid": orchestrationID,
                                "totalrun": groups.length,
                                "pendingrun": groups.length,
                                "status": constants.STATUS_PENDING,
                                "tenantid": data.tenantid,
                                "createddt": new Date(),
                                "createdby": data.lastupdatedby,
                                "lastupdateddt": new Date(),
                                "lastupdatedby": data.lastupdatedby,
                            }, db.OrchestrationScheduleHdr);
                            await Promise.all(
                                groups.map((g) => {
                                    let title = g.title;
                                    delete g.title;
                                    return ScheduleService.scheduleOrchestrationRun(
                                        schedulerQueue,
                                        {
                                            ...orchestrationData,
                                            instances: JSON.stringify(g),
                                        },
                                        title,
                                        hdrData.dataValues.scdlid
                                    );
                                })
                            );
                            resolve("Done");
                        }
                    }
                } catch (e) {
                    reject(e);
                }
            }
        );
        return promise;
    }
}
export default new ExptrService();
