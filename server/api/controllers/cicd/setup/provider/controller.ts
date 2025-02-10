import { Octokit } from "@octokit/rest";
import { customValidation } from "../../../../../common/validation/customValidation";
import { Request, Response } from "express";
import db from "../../../../models/model";
import fetch from "node-fetch";
import { constants } from "../../../../../common/constants";
import commonService from "../../../../services/common.service";
import { messages } from "../../../../../common/messages";
import { modules } from "../../../../../common/module";
import { basicValidation } from "../../cicdcommon/validation";
import _ = require("lodash");
import logger from "../../../../../common/logger";
import { Op } from "sequelize";
import ResouceMappingService from "../../../../services/resourcemapping.service";
export class Controller {
  async syncRepo(req: Request, res: Response): Promise<void> {
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryLong(req.body.tenantId, "tenantId", 1, 11);
      customValidation.isMandatoryString(
        req.body.createdBy,
        "createdBy",
        1,
        50
      );

      const result = await db.Provider.findOne({
        where: {
          id: req.params.id,
          tenantid: req.body.tenantId,
          status: constants.STATUS_ACTIVE,
        },
      });

      if (!result) {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[5],
        });
        return;
      }

      await db.ProviderRepositories.update(
        { status: constants.CICD_STATUS_INACTIVE },
        {
          where: {
            providerid: req.params.id,
            status: constants.STATUS_ACTIVE,
            repository: req.body.repoName || { [db.Sequelize.Op.ne]: null },
          },
        }
      );
  
      const provider = JSON.parse(JSON.stringify(result));
      const octokit = new Octokit({
        auth: provider.accesstoken,
        request: {
          fetch,
        },
      });

      const organizationName = provider.organizationname;
      const username = provider.username;
      let repositories = organizationName
        ? await octokit.repos.listForOrg({ org: organizationName })
        : await octokit.repos.listForUser({ username });

      let repoList: any = req.body.repoName
        ? repositories.data.find(
            (transaction: { name: string }) =>
              transaction.name === req.body.repoName
          )
        : repositories;

      let data = req.body.repoName
      ? repoList && [repoList]
      : repoList && repoList.data;
      if (data == undefined || data == null) {
        res.json({
          status: false,
          code: 204,
          message: messages.INVALID_REPOSITORY,
        });
        return;
      }

      new Controller().serectAndVariables(
        organizationName,
        data,
        octokit,
        username,
        req.params.id,
        req.body.createdBy,
        req.body.tenantId
      );

      new Controller().providerRunners(
        req.params.id,
        req.body.createdBy,
        req.body.tenantId,
        data,res,
        octokit,
        req.body.lastUpdatedBy);

      const branchList = (data || []).map((repo: any) => {
        return octokit.repos
          .listBranches({
            owner: organizationName || username,
            repo: repo.name,
          })
          .then((response) => {
            const mappedData = response.data.map((branch) => ({
              providerid: req.params.id,
              repository: repo.name,
              branch: branch.name,
              noofforks: repo.forks_count,
              status: constants.STATUS_ACTIVE,
              createdby: req.body.createdBy,
              createddt: Date.now(),
              lastupdatedby: req.body.createdBy,
              lastupdateddt: Date.now(),
            }));
            return Promise.all(mappedData);
          });
      });

      const branchDetails = [].concat(...(await Promise.all(branchList)));

       await commonService.bulkCreate(branchDetails, db.ProviderRepositories);

      let formattedResult;
      const condition = {
        providerid: req.params.id,
        status: constants.STATUS_ACTIVE,
      };

      if (req.body.repoName) {
        condition["repository"] = req.body.repoName;
      }

      const queryResult = await db.ProviderRepositories.findAll({
        where: condition,
        attributes: [
          "repository",
          [
            db.sequelize.fn("GROUP_CONCAT", db.sequelize.col("branch")),
            "branches",
          ],
        ],
        group: ["repository"],
        raw: true,
      });

      formattedResult = JSON.parse(JSON.stringify(queryResult)).map((row) => ({
        reponame: row.repository,
        branch: row.branches
          .split(",")
          .map((branch) => ({ branch: branch.trim() })),
      }));

      res.json({
        status: true,
        code: 200,
        data: formattedResult,
      });
      const responseData = res.json();
      const syncrepositoryValue =
        responseData.status && responseData.statusCode === 200 ? 1 : 0;
      await db.Provider.update(
        { syncrepository: syncrepositoryValue },
        { where: { id: req.params.id } }
      );
    } catch (e) {
      res.json({
        status: false,
        code: 204,
        message: e.message,
      });
    }
  }

  async  serectAndVariables(organizationName: any, data: any, octokit: any, userName: string, providerId: any, createdBy: string,tenantId:number) {
    try {
        let secretsVariables: any[] = [];
        const lookUpData : any[] =  await db.LookUp.findAll({
          where: {
            lookupkey:constants.CICD_ENVIRONMENT,
            tenantid:tenantId,
            status: constants.STATUS_ACTIVE,
          },
        });

      const customVariableData : any[] =  await db.customVariable.findAll({
          where: {
            providerid: providerId,
            tenantid:tenantId,
            status: constants.STATUS_ACTIVE,

          },
        });

        await Promise.all(data.map(async (repo: any) => {
            if (organizationName) {
             await this.buildSecretsAndVariablesObj(organizationName,octokit,tenantId,repo,providerId,{createdBy,secretsVariables,customVariableData})
            } else {
                const repoInfo = await octokit.repos.get({
                    owner: userName,
                    repo: repo.name,
                });
                const repository_id = repoInfo.data.id;

                const response = await octokit.request(
                    "GET /repos/{owner}/{repo}/environments",
                    {
                        owner: userName,
                        repo: repo.name,
                    }
                );

                await Promise.all(response.data.environments.map(async (environment: any) => {
                    const environmentKey = await octokit.actions.listEnvironmentSecrets(
                        {
                            owner: userName,
                            repository_id: repository_id,
                            environment_name: environment.name,
                        }
                    );

                    await environmentKey.data.secrets.forEach(async (secrets: any) => {
                        let obj = {
                            tenantid: tenantId,
                            variabletype: constants.VARIABLE_PROVIDER,
                            providerid: providerId,
                            reponame:repo.name,
                            environment: environment.name,
                            keyname: secrets.name,
                            keytype: constants.KEY_TYPE_SECRETS,
                            status: constants.STATUS_ACTIVE,
                            createdby: createdBy,
                            createddt: Date.now(),
                            lastupdatedby: createdBy,
                            lastupdateddt: Date.now(),
                        };
                        secretsVariables = await this.duplicateRemove(secretsVariables,obj,customVariableData);
                    });
                  

                    const environmentVariables = await octokit.actions.listEnvironmentVariables({
                        owner: userName,
                        repository_id: repository_id,
                        environment_name: environment.name,
                    });

                   await environmentVariables.data.variables.forEach(async (variable: any) => {
                        let obj = {
                            tenantid:tenantId,
                            variabletype: constants.VARIABLE_PROVIDER,
                            providerid: providerId,
                            reponame:repo.name,
                            environment: environment.name,
                            keyname: variable.name,
                            keytype: constants.KEY_TYPE_VARIABLES,
                            status: constants.STATUS_ACTIVE,
                            createdby: createdBy,
                            createddt: Date.now(),
                            lastupdatedby: createdBy,
                            lastupdateddt: Date.now(),
                        };
                        secretsVariables = await this.duplicateRemove(secretsVariables,obj,customVariableData);
                    });
                }));

                const repoSecret = await octokit.actions.listRepoSecrets({
                    owner: userName,
                    repo: repo.name,
                });

                repoSecret.data.secrets.forEach(async (secrets: any) => {
                    let obj = {
                        tenantid: tenantId,
                        variabletype: constants.VARIABLE_PROVIDER,
                        providerid: providerId,
                        reponame:repo.name,                           
                        keyname: secrets.name,
                        keytype: constants.KEY_TYPE_SECRETS,
                        status: constants.STATUS_ACTIVE,
                        createdby: createdBy,
                        createddt: Date.now(),
                        lastupdatedby: createdBy,
                        lastupdateddt: Date.now(),
                    };
                    secretsVariables = await this.duplicateRemove(secretsVariables,obj,customVariableData);
                  });

                const repoVariable = await octokit.actions.listRepoVariables({
                    owner: userName,
                    repo: repo.name,
                });

                repoVariable.data.variables.forEach(async (variable: any) => {
                    let obj = {
                        tenantid: tenantId,
                        variabletype: constants.VARIABLE_PROVIDER,
                        providerid: providerId,
                        reponame:repo.name,
                        keyname: variable.name,
                        keytype: constants.KEY_TYPE_VARIABLES,
                        status: constants.STATUS_ACTIVE,
                        createdby: createdBy,
                        createddt: Date.now(),
                        lastupdatedby: createdBy,
                        lastupdateddt: Date.now(),
                    };
                    secretsVariables = await this.duplicateRemove(secretsVariables,obj,customVariableData);
                  });
            }
        }));

       let secretsVariablesData = [];
      await this.variable(secretsVariables,customVariableData,secretsVariablesData,lookUpData);
    } catch (e) {
      logger.error(e.message);
    }
}

  async duplicateRemove(secretsVariables,obj,customVariableData) {
    const variables = await secretsVariables.find(data=>{
      return data.reponame==obj.reponame && data.keyname==obj.keyname && data.providerid == obj.providerid
    });
    if(!variables){
      const customData = customVariableData.find(customVariable=>{
        return customVariable.reponame==obj.reponame && customVariable.keyname==obj.keyname && customVariable.providerid == obj.providerid
      });
      if(!customData){
        secretsVariables.push(obj);
      }
    }
    return secretsVariables;
  }

async buildSecretsAndVariablesObj(organizationName,octokit,tenantId,repo,providerId,variableParams){
  try {
    const organizationSecrets = await octokit.actions.listOrgSecrets({
        org: organizationName,
    });
    const organizationVariables = await octokit.actions.listOrgVariables({
        org: organizationName,
    });

    organizationSecrets.data.secrets.forEach(async (secrets: any) => {
        let obj = {
            tenantid:tenantId,
            variabletype: constants.VARIABLE_PROVIDER,
            reponame:repo.name,
            providerid: providerId,
            keyname: secrets.name,
            keytype: constants.KEY_TYPE_SECRETS,
            status: constants.STATUS_ACTIVE,
            createdby: variableParams.createdBy,
            createddt: Date.now(),
            lastupdatedby: variableParams.createdBy,
            lastupdateddt: Date.now(),
          };
          variableParams.secretsVariables = await this.duplicateRemove(variableParams.secretsVariables,obj,variableParams.customVariableData);
          return variableParams.secretsVariables
    });

    organizationVariables.data.variables.forEach(async (variable: any) => {
        let obj = {
            tenantid:tenantId,
            variabletype: constants.VARIABLE_PROVIDER,
            providerid: providerId,
            reponame:repo.name,
            keyname: variable.name,
            keytype: constants.KEY_TYPE_SECRETS,
            status: constants.STATUS_ACTIVE,
            createdby: variableParams.createdBy,
            createddt: Date.now(),
            lastupdatedby: variableParams.createdBy,
            lastupdateddt: Date.now(),
        };
        variableParams.secretsVariables = await this.duplicateRemove(variableParams.secretsVariables,obj,variableParams.customVariableData);
        return variableParams.secretsVariables
    });
} catch (e) {
  logger.error(e.message);
}
}

async variable(secretsVariables, customVariableData, secretsVariablesData, lookUpData){
  try {
    await Promise.all(secretsVariables.map(async (element) => {
      let releaseHeader;
      let envData: any = {};
      if (!element.environment) {
        releaseHeader = await customVariableData.find((secrets) => {
          return (
            secrets.providerid == element.providerid &&
            secrets.reponame == element.reponame &&
            secrets.keyname == element.keyname &&
            secrets.environment == null || undefined

          );
        });
        if (!releaseHeader) {
          secretsVariablesData.push(element);
        }
      } else {
        envData = await lookUpData.find(data => data.keyname == element.environment);
        await this.buildSecretsVariableData(envData, releaseHeader, customVariableData, element, secretsVariablesData)
      }
    }));
  
    await commonService.bulkCreate(secretsVariablesData, db.customVariable);
  } catch (e) {
    logger.error(e.message);
  }
}

async buildSecretsVariableData(envData, releaseHeader, customVariableData, element, secretsVariablesData){
  if (envData) {
    releaseHeader = await customVariableData.find((secrets) => {
      return (
        secrets.providerid == element.providerid &&
        secrets.reponame == element.reponame &&
        secrets.keyname == element.keyname &&
        secrets.environment == element.environment 
      );
    });
    if (!releaseHeader) {
      secretsVariablesData.push(element);
    }
  }
  return secretsVariablesData
}


async  providerRunners(providerId: any, createdBy: string, tenantId: number, data: any, res: Response, octokit: any, lastUpdatedBy: string): Promise<void> {
  try {
    const providerResult = await db.Provider.findOne({
      where: {
        id: providerId,
        tenantid: tenantId,
        status: constants.STATUS_ACTIVE,
      },
    });

    if (!providerResult) {
      res.status(204).json({
        status: false,
        message: messages.RELEAECONFIG_ERR_MSG[5],
      });
      return;
    }

    let providersRunners: any[] = [];
    let fetchedRunners: any[] = [];
    let existingRunners: any[] = [];
    const provider = JSON.parse(JSON.stringify(providerResult));

    // Get all repositories for the owner
    const repositoriesResponse = await octokit.request('GET /users/{owner}/repos', {
      owner: provider.username,
    });

    const repositories = repositoriesResponse.data;

    await Promise.all(repositories.map(async (repo: any) => {
      const gitHubResponse = await octokit.request('GET /repos/{owner}/{repo}/actions/runners', {
        owner: provider.username,
        repo: repo.name,
      });

      existingRunners = await db.ProviderRunners.findAll({
        where: {
          tenantid: tenantId,
          status: constants.STATUS_ACTIVE,
        },
      });

      gitHubResponse.data.runners.forEach((runner) => {
        fetchedRunners.push(runner.name);

        const runnerExists = existingRunners.find(existingRunner =>
          existingRunner.name == runner.name &&
          existingRunner.repo == repo.name
        );

        if (!runnerExists) {
          const newRunner = {
            providerid: providerId,
            tenantid: tenantId,
            repo: repo.name,
            name: runner.name,
            os: runner.os,
            type: runner.labels.some(label => label.name === 'self-hosted') ? "Self-Hosted" : "GitHub-Hosted",
            status: constants.STATUS_ACTIVE,
            createdby: createdBy,
            createddt: Date.now(),
            lastupdateddt: Date.now()
          };
          providersRunners.push(newRunner)     
          } 
      });
    }));

    if (providersRunners.length > 0) {
      await db.ProviderRunners.bulkCreate(providersRunners);
    }

    // Inactivate runners
    const runnersToInactivate = existingRunners.filter(existingRunner =>
      !fetchedRunners.includes(existingRunner.name) ||
      (!repositories.some(repo => repo.name == existingRunner.repo) && existingRunner.type == "Self-Hosted")
    );

    if (runnersToInactivate.length > 0) {
      await db.ProviderRunners.update(
         { status: constants.CICD_STATUS_INACTIVE,
          lastupdatedby: createdBy
          },
         {
          where: {
            providerid: providerId,
            id: runnersToInactivate.map(runner => runner.id),
            status: constants.STATUS_ACTIVE,
          },
        }
      );
    }
  } catch (e) {
    logger.error(e.message);
  }
}


 

async runnerList(req: Request, res: Response): Promise<void> {
  let response = { reference: modules.PROVIDER_RUNNER };
  try {
    customValidation.isMandatoryLong(req.query.tenantid, "tenantid", 1, 11);
    let parameters: any = {
      where: { tenantid: req.query.tenantid, status: constants.STATUS_ACTIVE },
      order: [["lastupdateddt", "DESC"]],
    };

    const list = await commonService.getAllList(parameters, db.ProviderRunners);
    customValidation.generateSuccessResponse(
      list,
      response,
      constants.RESPONSE_TYPE_LIST,
      res,
      req
    );
  } catch (error) {
    customValidation.generateAppError(error, response, res, req);
  }
}
  //List
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_PROVIDER };
    try {
      customValidation.isMandatoryLong(req.query.tenantid, "tenantid", 1, 11);
      let parameters: any = {
        where: { tenantid: req.query.tenantid },
        order: [["lastupdateddt", "DESC"]],
      };
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }
      if (req.query.status) {
        parameters.where["status"] = req.query.status;
      }
      if (req.query.username) {
        parameters.where["username"] = req.query.username;
      }
      if (req.query.name) {
        parameters.where["name"] = req.query.name;
      }
      if (
        typeof req.query.searchText === "string" &&
        req.query.searchText.trim() !== ""
      ) {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchText}%` } },
            { username: { [Op.like]: `%${searchText}%` } },
            { url: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
     
      commonService
        .getAllList(parameters, db.Provider)
        .then((list) => {
          // Group
          const groupedByType = list.reduce((acc, currentItem) => {
            const type = currentItem.type;
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push(currentItem);
            return acc;
          }, {});

          customValidation.generateSuccessResponse(
            groupedByType,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
 
  //create
  async create(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_PROVIDER };
    try {
      if(req.body.crn && req.body.crn != null && req.body.attributes == null){
        res.json({
          status: false,
          code: 204,
          message: messages.CICD_INCOMING_ATTRIBUTE,
        });
        return;
      }      
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryString(req.body.type, "type", 5, 45);
      customValidation.isMandatoryString(req.body.name, "name", 3, 50);
      customValidation.isMandatoryString(req.body.username, "username", 3, 45);
      customValidation.isOptionalString(req.body.organizationname,"organizationname",3,50);
      customValidation.isMandatoryString(req.body.url, "URL", 10, 500);
      customValidation.isMandatoryString(req.body.accesstoken,"accesstoken",10,200);
      customValidation.isMandatoryString(req.body.createdby,"createdby",3,50);
      basicValidation.isMandatoryURL(req.body.url, "URL", 10, 500);
      const providerTypes = [
        constants.PROVIDER_GITLAB,
        constants.PROVIDER_GITHUB,
        constants.PROVIDER_BITBUCKET,
      ];
      if (!providerTypes.includes(req.body.type)) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[0],
        });
        return;
      }
      const existingProviderName = await db.Provider.findOne({
        where: {
            tenantid: req.body.tenantid,
            name: req.body.name.trim(),
            status: constants.STATUS_ACTIVE.trim(),
            type: req.body.type
        },
    });
      if (existingProviderName) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[1],
        });
        return;
      }
      req.body.status = constants.STATUS_ACTIVE;
      req.body.createddt = Date.now();
      req.body.lastupdateddt = Date.now();
      commonService
        .create(req.body, db.Provider)
        .then(async(data) => {
          try {
            await commonService.create(
                {
                    resourcetypeid: data.id,
                    resourcetype: constants.RESOURCETYPE[8],
                    _tenantid: req.body.tenantid,
                    new: constants.HISTORYCOMMENTS[16],
                    affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                    status: constants.STATUS_ACTIVE,
                    createdby: req.body.createdby,
                    createddt: new Date(),
                    updatedby: null,
                    updateddt: null,
                },
                db.History
            );
        } catch (error) {
            console.log(`Failed to create history`, error);
        }
          try {
            ResouceMappingService.create(req.body, data);
         } catch(error) {
           console.log("Error in maping", error)
         };
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //get by id
  byId(req: Request, res: Response): void {
    let response = { reference: modules.SETUP_PROVIDER };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      db.Provider.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.ResourceMapping,
            as: 'providerCMDB',
            required: false, 
            where: { referenceid: req.params.id, status: constants.STATUS_ACTIVE, referencetype: constants.CICD_REFERENCE[0] },
          },
        ],
      })
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  
  

  //update
  async update(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_PROVIDER };
    try {
      if(req.body.crn && req.body.crn != null && req.body.attributes == null){
        res.json({
          status: false,
          code: 204,
          message: messages.CICD_INCOMING_ATTRIBUTE,
        });
        return;
      }
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryString(req.body.type, "type", 5, 45);
      customValidation.isMandatoryString(req.body.name, "name", 3, 50);
      customValidation.isMandatoryString(req.body.username, "username", 3, 45);
      customValidation.isOptionalString(
        req.body.organizationname,
        "organizationname",
        3,
        50
      );
      customValidation.isMandatoryString(req.body.url, "URL", 10, 500);
      customValidation.isMandatoryString(
        req.body.accesstoken,
        "accesstoken",
        10,
        200
      );
      customValidation.isMandatoryString(
        req.body.lastupdatedby,
        "lastupdatedby",
        3,
        50
      );
      basicValidation.isMandatoryURL(req.body.url, "URL", 10, 500);
      const providerTypes = [
        constants.PROVIDER_GITLAB,
        constants.PROVIDER_GITHUB,
        constants.PROVIDER_BITBUCKET,
      ];
      if (!providerTypes.includes(req.body.type)) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[0],
        });
        return;
      }
      const checkProvider = await db.Provider.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingProvider = JSON.parse(JSON.stringify(checkProvider));
      if (!existingProvider) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_PROVIDER[4],
        });
        return;
      }
      await new Controller().validateUpdate(req, res);
      try {
        const changes = {
          old: {},
          new: {},
        };

        Object.keys(existingProvider).forEach((key) => {
          const oldValue = existingProvider[key];
          const newValue = req.body[key];

          if (
            key !== "syncrepository" &&
            key !== "lastupdateddt" &&
            oldValue !== newValue &&
            oldValue !== undefined &&
            newValue !== undefined
          ) {
            changes.old[key] = oldValue;
            changes.new[key] = newValue;
          }
        });
        const formatObject = (obj: Record<string, any>): string =>
          JSON.stringify(obj).replace(/[{}"]/g, "").replace(/,/g, ", ");

        await commonService.create(
          {
            resourcetypeid: req.params.id,
            resourcetype: constants.RESOURCETYPE[8],
            _tenantid: req.body.tenantid,
            old: formatObject(changes.old),
            new: formatObject(changes.new),
            affectedattribute: constants.AFFECTEDATTRIBUTES[0],
            status: constants.STATUS_ACTIVE,
            createdby: req.body.lastupdatedby,
            createddt: new Date(),
            updatedby: null,
            updateddt: null,
          },
          db.History
        );
      } catch (error) {
        console.log(`Failed to update history`, error);
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async validateUpdate(req, res) {
    let response = { reference: modules.SETUP_PROVIDER };
    try {
      const existingProviderName = await db.Provider.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
            tenantid: req.body.tenantid,
            name: req.body.name.trim(),
            status: constants.STATUS_ACTIVE.trim(),
            type: req.body.type
        },
    });
    if (existingProviderName) {
        res.json({
            status: false,
            code: 204,
            message: messages.SETUP_PROVIDER[1],
          });
        return;
    }
      
      req.body.lastupdateddt = Date.now();
      let condition = { id: req.params.id };
      commonService
        .update(condition, req.body, db.Provider)
        .then((data) => {
          try {
            ResouceMappingService.update(req.body,req.params.id);
         } catch(error) {
           console.log("Error in maping", error)
         };
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
            res,
            req
          );
        })
        .catch((error) => {
          customValidation.generateAppError(error, response, res, req);
        });
      if (req.body.syncrepository) {
        req.body.syncrepository = 1;
        req.body.lastsyncdate = Date.now();
      } else {
        req.body.syncrepository = 0;
        req.body.lastsyncdate = null;
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //delete
  async delete(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryString(
        req.query.lastUpdatedBy,
        "lastUpdatedBy",
        3,
        50
      );
      const checkProvider = await db.Provider.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingProvider = JSON.parse(JSON.stringify(checkProvider));
      if (!existingProvider) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_PROVIDER[4],
        });
        return;
      }
      if (existingProvider.status == constants.CICD_STATUS_INACTIVE) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[3],
        });
        return;
      }
      if (existingProvider.status == constants.STATUS_ACTIVE) {
        await db.Provider.update(
          {
            status: constants.CICD_STATUS_INACTIVE,
            lastupdatedby: req.query.lastUpdatedBy,
            lastupdateddt: Date.now(),
          },
          {
            where: { id: req.params.id },
          }
        );
        await db.ResourceMapping.update(
          {
            status: constants.DELETE_STATUS,
            lastupdatedby: req.query.lastUpdatedBy,
            lastupdateddt: Date.now(),
          },
          {
            where: { referenceid: req.params.id,
            referencetype: constants.CICD_REFERENCE[0]
             },
          }
        )
        res.json({
          status: true,
          code: 200,
          message: messages.DELETE_SUCCESS,
        });
        return;
      }
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
}
export default new Controller();