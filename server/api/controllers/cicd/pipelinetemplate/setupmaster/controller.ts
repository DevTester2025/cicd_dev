import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import { modules } from "../../../../../common/module";
import db from "../../../../models/model";
import CommonService from "../../../../services/common.service";
import { Op } from "sequelize";

export class Controller {

  async all(req: Request, res: Response): Promise<void> {
    const response = { reference: modules.SETUP_MASTER };

    try {
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isOptionalString(req.body.referencetype, "referencetype", 1, 50);

      const setupmasterList = [];
      let groupdata: any = {};

      if (req.body.referencetype === constants.REFERENCE_TYPE[0]) {
        customValidation.isMandatoryLong(req.body.referenceid, "referenceid", 1, 11);
        customValidation.isMandatoryString(req.body.referencetype, "referencetype", 1, 50);
        customValidation.isMandatoryString(req.body.providerjobname, "providerjobname", 1, 50);
        customValidation.isMandatoryString(req.body.repository, "repository", 1, 50);

        const providerQueryOptions: any = {
          where: {
            tenantid: req.body.tenantid,
            id: req.body.referenceid,
            type: req.body.providerjobname,
            status: constants.STATUS_ACTIVE,
          },
          include: [
            {
              model: db.ProviderRepositories,
              as: "providerRepositories",
              attributes: [
                "repository",
                [
                  db.sequelize.fn("GROUP_CONCAT", db.sequelize.col("branch")),
                  "branches",
                ],
              ],
              where: {
                repository: req.body.repository,
                status: constants.STATUS_ACTIVE,
              },
            },
          ],
          group: ["providerRepositories.repository", "name"],
        };
        setupmasterList.push(db.Provider.findAll(providerQueryOptions));
      } else {
        setupmasterList.push(
          db.Provider.findAll({
            where: { tenantid: req.body.tenantid, status: constants.STATUS_ACTIVE },
            include: [
              {
                model: db.ProviderRepositories,
                as: 'providerRepositories',
                attributes: [
                  'repository',
                  [
                    db.sequelize.fn('GROUP_CONCAT', db.sequelize.col('branch')),
                    'branches',
                  ],
                ],
                where: { status: constants.STATUS_ACTIVE }
              }
            ],
            group: ['providerRepositories.repository', 'name']
          })
        );

        setupmasterList.push(db.ContainerRegistry.findAll({ where: { tenantid: req.body.tenantid, status: constants.STATUS_ACTIVE } }));
        setupmasterList.push(
          db.TestingTool.findAll({ where: { tenantid: req.body.tenantid, status: constants.STATUS_ACTIVE } }).then(testingTools => {
              const mappedTestingTools = JSON.parse(JSON.stringify(testingTools)).map(tool => ({
                id: tool.id,
                tenantid: tool.tenantid,
                type: tool.type,
                name: tool.name,
                organization: tool.organization,
                url: tool.url,
                accesstokenisvariable: tool.accesstokenisvariable,
                accesstokenvariable: tool.accesstokenvariable,
                urlisvariable: tool.urlisvariable,
                urlvariable: tool.urlvariable,
                description: tool.description,
                status: tool.status,
                createdby: tool.createdby,
                createddt: tool.createddt,
                lastupdatedby: tool.lastupdatedby,
                lastupdateddt: tool.lastupdateddt,
                accesstoken: tool.accesstoken
              }));
              return [...mappedTestingTools,...[{
                id: 101,
                tenantid: 7,
                type: "JUNIT",
                name: "DEMO-JUNIT",
                javaversion: "17",
                workingdirectory: "Spring-Boot-main",
                bulidtype: "MAVEN",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",
              },{
                id: 102,
                tenantid: 7,
                type: "JUNIT",
                name: "JUNIT",
                javaversion: "17",
                workingdirectory: "Spring-Boot-main",
                bulidtype: "MAVEN",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",
              },{
                id: 103,
                tenantid: 7,
                type: "SELENIUM",
                name: "DEMO-SELENIUM",
                javaversion: "17",
                workingdirectory: "Spring-Boot-main",
                webdriver:"CHROME",
                bulidtype: "MAVEN",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",
              },{
                id: 104,
                tenantid: 7,
                type: "SELENIUM",
                name: "SELENIUM_SIT",
                javaversion: "17",
                workingdirectory: "Spring-Boot-main",
                webdriver:"CHROME",
                bulidtype: "MAVEN",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",
              },{
                id: 105,
                tenantid: 7,
                type: "SELENIUM",
                name: "SELENIUM_UAT",
                javaversion: "17",
                workingdirectory: "Spring-Boot-main",
                webdriver:"CHROME",
                bulidtype: "MAVEN",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",
              },{
                id: 106,
                tenantid: 7,
                type: "SELENIUM",
                name: "SELENIUM_SMOKE",
                javaversion: "17",
                workingdirectory: "Spring-Boot-main",
                webdriver:"CHROME",
                bulidtype: "MAVEN",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",
              },{
                id: 107,
                tenantid: 7,
                type: "JMETER",
                name: "DEMO-JMETER",
                ipaddress: "158.220.107.63",
                username: "root",
                password: "ClearC0de20S4",
                jmeterpath: " /root/projects/jmeter/apache-jmeter-5.4.1/bin",
                jmxfilepath:"/root/projects/jmeter/cicd_test.jmx",
                jtlfilepath:"/root/projects/jmeter/results.jtl",
                description: "Demo",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",               
              },{
                id: 108,
                tenantid: 7,
                type: "JMETER",
                name: "JMETER",
                ipaddress: "158.220.107.63",
                username: "root",
                password: "ClearC0de20S4",
                jmeterpath: " /root/projects/jmeter/apache-jmeter-5.4.1/bin",
                jmxfilepath:"/root/projects/jmeter/cicd_test.jmx",
                jtlfilepath:"/root/projects/jmeter/results.jtl",
                description: "Demo",
                status: "Active",
                createdby: "Suresh Kumar",
                createddt: "2024-06-20T12:06:55.000Z",
                lastupdatedby: "Suresh Kumar",
                lastupdateddt: "2024-06-20T12:06:55.000Z",               
              }]];
            })
        );
        setupmasterList.push(db.Environments.findAll({ where: { tenantid: req.body.tenantid, status: constants.STATUS_ACTIVE } }));
        setupmasterList.push(db.SetupBuild.findAll({ where: { tenantid: req.body.tenantid, status: constants.STATUS_ACTIVE } }));

        const orch :any[] = await db.Orchestration.findAll({
          where: { tenantid: req.body.tenantid, status: constants.STATUS_ACTIVE, module: constants.MODULE_CICD },
          limit: 5,
          order: [['lastupdateddt', 'DESC']]
        });

        const mappedOrchestrations = orch.map(obj => {
          const { orchid, tenantid, orchname, status } = obj;

          return {
            id:orchid,
            type: "ORCHESTRATION",
            tenantid,
            name:orchname,
            status
          };
        });
        setupmasterList.push(mappedOrchestrations);

        const workflow :any[] = await db.TNWorkFlow.findAll({
          where: { 
            tenantid: req.body.tenantid, 
            module: constants.MODULE_CICD, 
            status: constants.STATUS_ACTIVE 
          },
          include: [{ 
            model: db.TNWorkFlowApprover, 
            as: 'tnapprovers',
            where: { 
              wrkflowid: { [Op.not]: null },
              status: constants.STATUS_ACTIVE,
              reqid: { [Op.is]: null }
            },
            include: [{
              model: db.User,
              as: 'approvers',
              where: { status: constants.STATUS_ACTIVE }
            }]
          }],
          order: [['lastupdateddt', 'DESC']]
        });
        
        const mappedApprovalWorkflow = workflow.map(obj => {
          const { wrkflowid, tenantid, wrkflowname, tnapprovers } = obj;        
          const approverLevels = tnapprovers.reduce((user, approver) => {
            const { aprvrseqid, approvers } = approver;
            if (approvers) {
              user[`approverlevel ${aprvrseqid}`] = approvers.fullname;
            }
            return user;
          }, {});        
          return {
            id: wrkflowid,
            type: "APPROVAL_WORKFLOW",
            name: wrkflowname,
            tenantid,
            ...approverLevels
          };
        });        
        setupmasterList.push(mappedApprovalWorkflow);  
        const otherNodes = [{
          id: 101,
          tenantid: 7,
          type: "OTHERS",
          name: "RETRY",
          status: "Active",
          createdby: "Barathan",
          createddt: "2024-06-20T12:06:55.000Z",
          lastupdatedby: "Barathan",
          lastupdateddt: "2024-06-20T12:06:55.000Z",
        },
        {
            id: 102,
            tenantid: 7,
            type: "OTHERS",
            name: "ROLLBACK",
            status: "Active",
            createdby: "Barathan",
            createddt: "2024-06-20T12:06:55.000Z",
            lastupdatedby: "Barathan",
            lastupdateddt: "2024-06-20T12:06:55.000Z",
          },
          {
              id: 103,
              tenantid: 7,
              type: "OTHERS",
              name: "DECISION MAKING",
              status: "Active",
              createdby: "Barathan",
              createddt: "2024-06-20T12:06:55.000Z",
              lastupdatedby: "Barathan",
              lastupdateddt: "2024-06-20T12:06:55.000Z",
            }
            ];
    
        setupmasterList.push(otherNodes);  
        
       
      }

      const [providerPromise, crPromise, testPromise, environmentPromise, buildPromise, orchestration, approvalworkflow, othernodes] =
        await Promise.all(setupmasterList);

      if (providerPromise) {
        const providersWithBranches = providerPromise.map((provider) => {
          const providerData = JSON.parse(JSON.stringify(provider));
          const repositoriesWithBranches =
            providerData.providerRepositories.map((repo) => ({
              repository: repo.repository,
              branches: [...new Set(repo.branches.split(","))].map(
                (branch) => ({ branch: branch })
              ),
            }));
          return {
            ...providerData,
            providerRepositories: repositoriesWithBranches,
          };
        });
        groupdata.PROVIDERS = providersWithBranches;
      }

      if (crPromise) groupdata.CONTAINERREGISTRY = crPromise;
      if (testPromise) groupdata.TESTINGTOOL = testPromise;
      if (environmentPromise) groupdata.ENVIRONMENTS = environmentPromise;
      if (buildPromise) groupdata.BUILD = buildPromise;
      if (orchestration) groupdata.ORCHESTRATION = orchestration;
      if (approvalworkflow) groupdata.APPROVAL_WORKFLOW = approvalworkflow;
      if (othernodes) groupdata.OTHERS = othernodes;

      await new Controller().generateResponse(req, res, response, groupdata);
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
   async generateResponse(req: Request, res: Response, response: any, groupdata: any): Promise<void> {
    try {
      const list = await CommonService.getAllMasterList(groupdata);

      if (req.body.referencetype === constants.REFERENCE_TYPE[0] && req.body.repository) {
        const repoGroupdata = groupdata.PROVIDERS.map((provider) => ({
          providerRepositories: provider.providerRepositories,
        }));
        customValidation.generateSuccessResponse(
          { PROVIDERS: repoGroupdata },
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      } else {
        customValidation.generateSuccessResponse(
          list,
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      }
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
}
export default new Controller();