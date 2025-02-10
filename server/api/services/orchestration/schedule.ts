import db from "../../models/model";
import CommonService from "../../services/common.service";
import { constants } from "../../../common/constants";
import { Queue } from "bullmq";
import { differenceInMilliseconds } from "date-fns";
import LokiService from "../../services/logging/loki.service";

export class ScheduleService {
    scheduleOrchestrationRun = async (
        queue: Queue,
        body: any,
        title: any,
        scdlid: number
    ) => {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await CommonService.create(
                    {
                        ...body,
                        totalrun: 0,
                        scdlid,
                        expectedrun: body.recurring ? body.repetition : 1,
                        title
                    },
                    db.OrchestrationSchedule
                );

                const queueId = "SCHED-QUEUE-" + data["id"];

                if (body.recurring == true) {
                    console.log("Schedule recurring job >>>>>", body.cron);
                    await db.eventlog.create({
                        tenantid: body.tenantid,
                        module: "Orchestration",
                        referencetype: "RECURRING",
                        cloudprovider: constants.CLOUD_AWS,
                        eventtype: "SCHEDULE",
                        //"severity": "Normal",
                        severity: "Medium",
                        eventdate: new Date(),
                        notes: JSON.stringify({
                            cron: body.cron,
                            type: "RECURRING",
                            data,
                        }),
                        createddt: new Date(),
                        createdby: "System",
                        status: constants.STATUS_ACTIVE,
                    });
                    await queue.add(queueId, data, {
                        repeat: {
                            cron: body.cron,
                            limit: body.repetition,
                        },
                        jobId: queueId,
                        removeOnComplete: true,
                    });
                    LokiService.createLog(
                        {
                            message: "Recurring event pushed.",
                            reference: "ORCH-RUN",
                            tag: "ORCH-" + data["id"],
                        },
                        "INFO"
                    );
                } else if (body.scheduled == true) {
                    const delay = differenceInMilliseconds(
                        new Date(body.runtimestamp),
                        new Date()
                    );
                    await db.eventlog.create({
                        tenantid: body.tenantid,
                        module: "Orchestration",
                        referencetype: "ONE-TIME",
                        cloudprovider: constants.CLOUD_AWS,
                        eventtype: "SCHEDULE",
                        //"severity": "Normal",
                        severity: "Medium",
                        eventdate: new Date(),
                        notes: JSON.stringify({
                            cron: body.cron,
                            type: "ONE-TIME",
                            data,
                        }),
                        createddt: new Date(),
                        createdby: "System",
                        status: constants.STATUS_ACTIVE,
                    });
                    await queue.add(queueId, data, {
                        delay,
                        removeOnComplete: true,
                        jobId: queueId,
                    });
                    LokiService.createLog(
                        {
                            message: "Scheduled event pushed.",
                            reference: "ORCH-RUN",
                            tag: "ORCH-" + data["id"],
                        },
                        "INFO"
                    );
                } else {
                    await db.eventlog.create({
                        tenantid: body.tenantid,
                        module: "Orchestration",
                        referencetype: "IMMEDIATE",
                        cloudprovider: constants.CLOUD_AWS,
                        eventtype: "SCHEDULE",
                        //"severity": "Normal",
                        severity: "Medium",
                        eventdate: new Date(),
                        notes: JSON.stringify({
                            cron: body.cron,
                            type: "IMMEDIATE",
                            data,
                        }),
                        createddt: new Date(),
                        createdby: "System",
                        status: constants.STATUS_ACTIVE,
                    });
                    await queue.add(queueId, data, {
                        removeOnComplete: true,
                        jobId: queueId,
                    });
                    LokiService.createLog(
                        {
                            message: "One time scheduled event pushed.",
                            reference: "ORCH-RUN",
                            tag: "ORCH-" + data["id"],
                        },
                        "INFO"
                    );
                }

                resolve(true);
            } catch (error) {
                console.log("⚠⚠⚠⚠ Error creating schedule");
                console.log(error);
                reject(error);
            }
        });
    };
}

export default new ScheduleService();