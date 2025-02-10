import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import db from "../../../../models/model";
import { constants } from "../../../../../common/constants";
import logger from "../../../../../common/logger";
import { messages } from "../../../../../common/messages";

export class Service {
  async getTemplateDetails(
    releaseId: any,
    req: any,
    res: any,
    action: string
  ): Promise<any> {
    try {
      const templatedetails = await db.ReleaseConfigDetail.findAll({
        where: {
          releaseconfighdrid: releaseId,
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
        },
        order: [["position", "ASC"]],

        include: [
          {
            model: db.ReleaseSetupConfig,
            as: "releasesetupdetailconfig",
            where: { status: constants.STATUS_ACTIVE },
          },
        ],
      });
      console.log(templatedetails);
      const tempDetails = JSON.parse(JSON.stringify(templatedetails));

      const responsedetails = await db.ReleaseConfig.findOne({
        where: {
          id: releaseId,
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
        },
      });
      const pipelinetempDetails = JSON.parse(JSON.stringify(responsedetails));
      let branch = pipelinetempDetails.providerbranch;

      if (templatedetails) {
        let position = "";
        let gitHubcontent = "";
        let dockerHubcontent: any = "";
        let sonarqubecontent: any = "";
        let vmcontent = "";
        let workflowContent;
        let gitLabcontent = "";
        let orchestration = "";
        let approval = "";
        let buildScript = "";
        let defaultScripit="";

        let customVariable = await db.customVariable.findAll({
          where: {
            tenantid: req.body.tenantid,
            status: constants.STATUS_ACTIVE,
          },
        });
        let buildYml = [];

        try {
          const commitMessage = "Add CI/CD workflow";
          const setupdetails: any[] = tempDetails;
          if (setupdetails.length > 0) {
            const firstElement = setupdetails[0];
            const setUpDetailsResponse =
              firstElement.releasesetupdetailconfig.setupdetails;
            const owner = JSON.parse(setUpDetailsResponse);
            let setupdetailobj = {
              userName: owner.username,
              accessToken: owner.accesstoken,
              giturl: owner.url,
            };

            for (const template of tempDetails) {
              switch (template.providerjobname.toUpperCase()) {
                case constants.PROVIDER_GITHUB:
                  gitHubcontent = await new Service().providerGitHubContent(
                    template,
                    pipelinetempDetails
                  );
                  buildYml.push(gitHubcontent);
                  break;
                case constants.CONTAINER_REGISTRY_DOCKERHUB:
                  dockerHubcontent =
                    await new Service().containerRegistryDockerHubContent(
                      template,
                      position,
                      branch,
                      customVariable,
                      pipelinetempDetails,
                      req
                    );
                  buildYml.push("\n" + dockerHubcontent);
                  break;
                case constants.TESTING_TOOL_SONARQUBE:
                  sonarqubecontent = await new Service().testSonarContent(
                    template,
                    position,
                    customVariable,
                    pipelinetempDetails,
                    req
                  );
                  buildYml.push("\n" + sonarqubecontent);
                  break;
                case constants.ENVIRONMENTS_VIRTUAL_MACHINE:
                  vmcontent = await new Service().deployVMContent(
                    template,
                    position,
                    tempDetails,
                    branch,
                    customVariable,
                    pipelinetempDetails,
                    req
                  );
                  buildYml.push("\n" + vmcontent);
                  break;
                case constants.ORCHESTRATION:
                  orchestration = await new Service().orchestration(
                    template,
                    position,
                    pipelinetempDetails,
                    setupdetailobj
                  );
                  buildYml.push("\n" + orchestration);
                  break;
                case constants.APPROVAL_WORKFLOW:
                  approval = await new Service().approval(
                    template,
                    position,
                    pipelinetempDetails,
                    setupdetailobj
                  );
                  buildYml.push("\n" + approval);
                  break;
                case constants.BUILD_BUILD_SCRIPT:
                  buildScript = await new Service().buildScript(
                    template,
                    position,
                    pipelinetempDetails
                  );
                  buildYml.push("\n" + buildScript);
                  break;
                default:
                  
                 const runsOn= await this.getRunsOnValue(pipelinetempDetails);
                const jobNeeds = await this.defaultPosition(position)

                  defaultScripit= 
        `#------------------${template.providerjobname.toUpperCase()}
          ${template.providerjobname.toUpperCase()}:
           needs: [${jobNeeds}]
           runs-on: ${runsOn}
           steps:
            - name: Empty Step
              run: echo "This is an ${template.providerjobname.toUpperCase()} job"` 
              buildYml.push("\n" + defaultScripit);         
              }
              position = template;
            }

            const filename =
              ".github/workflows/" + pipelinetempDetails.filename + ".yml";
            const workflowname = `        name: ${pipelinetempDetails.filename}`;

            let onTrigger = "";
            onTrigger = await this.getEvent(req, onTrigger, action);

            const ymlHeaderContent = workflowname + "\n" + onTrigger;
            console.log(ymlHeaderContent);
            const buildContent = buildYml.join("");
            workflowContent = ymlHeaderContent + "\n" + buildContent;

            console.log("YAML file generated successfully.", workflowContent);
            let paramVariables = {
              workflowContent,
              commitMessage,
              req,
              res,
            };
            await new Service().scriptContent(
              tempDetails,
              setupdetailobj.userName,
              pipelinetempDetails.providerrepo,
              pipelinetempDetails.providerbranch,
              setupdetailobj.accessToken
            );
            await new Service().createOrUpdateFile(
              setupdetailobj.userName,
              pipelinetempDetails.providerrepo,
              filename,
              pipelinetempDetails.providerbranch,
              setupdetailobj.accessToken,
              paramVariables
            );
            console.log("CI/CD YAML file created successfully. Commit SHA:");
          }
        } catch (e) {
          logger.error(e);
        }
      }
    } catch (e) {
      logger.error(e);
    }
  }
async defaultPosition(jobNeed){
  let provider = jobNeed.position === 1 ? "build" : jobNeed.providerjobname;
  return provider;
}
  async getEvent(req, onTrigger, action) {
    try {
      if (
        (action && action == constants.RELEASE_DELETE) ||
        req.body.schedule == constants.SCHEDULED_MANUAL
      ) {
        onTrigger = `
        on:
          workflow_dispatch:
`;
      } else if (req.body.schedule === constants.SCHEDULED_ONCOMMIT) {
        onTrigger = `
        on:
          workflow_dispatch:
          push:
           paths-ignore:
             - '.github/workflows/**'
             - '**/Dockerfile'
             - '**/sonar-project.properties'
  `;
      } else if (req.body.schedule === constants.SCHEDULED_SCHEDULE) {
        onTrigger = `
        on:
          workflow_dispatch:
          schedule:
            - cron: '${req.body.scheduleon}'
  `;
      }
      return onTrigger;
    } catch (e) {
      logger.error(e);
    }
  }

  async providerGitHubContent(template, pipelinetempDetails) {
    try {
      const runsOn = await this.getRunsOnValue(pipelinetempDetails);

      const providername = template.providerjobname;
      let gitHubContent = `
        jobs:
          build:
           name: ${providername}
           runs-on: ${runsOn}
           steps:
                - name: Check out the repo
                  uses: actions/checkout@v3  
            `;
      return gitHubContent;
    } catch (e) {
      logger.error(e.message);
    }
  }

  providerGitLabContent(template) {
    try {
      if (template) {
        let gitLabContent;
        if (template != null) {
          gitLabContent = "";
          console.log("TODO: GitLab content implementation");
        } else {
          console.log("invalid provider name");
        }
        return gitLabContent;
      }
    } catch (e) {
      console.log(e, "TODO: GitLab content implementation");
    }
  }

  async containerRegistryDockerHubContent(
    template,
    cons,
    branch,
    customVariable,
    pipelinetempDetails,
    req
  ) {
    try {
      const setupDetails = template.releasesetupdetailconfig.setupdetails;
      const setUpDetailsResponse = JSON.parse(setupDetails);
      let userVariable;
      let tokenVariable;
      let userKeyType;
      let tokenKeyType;
      if (setUpDetailsResponse.usernameisvariable) {
        userVariable = await customVariable.find(
          (variable) =>
            variable.keyname == setUpDetailsResponse.usernamevariable &&
            variable.status == constants.STATUS_ACTIVE
        );
        if (userVariable) {
          userKeyType = userVariable.keytype;
        }
      }

      if (setUpDetailsResponse.accesstokenisvariable) {
        tokenVariable = await customVariable.find(
          (variable) =>
            variable.keyname == setUpDetailsResponse.accesstokenvariable &&
            variable.status == constants.STATUS_ACTIVE
        );
        if (tokenVariable) {
          tokenKeyType = tokenVariable.keytype;
        }
      }
      return await new Service().containerRegistry(
        template,
        cons,
        branch,
        pipelinetempDetails,
        {
          userVariable,
          tokenVariable,
          req,
          userKeyType,
          tokenKeyType,
        }
      );
    } catch (e) {
      logger.error(e.message);
    }
  }
  async containerRegistry(
    template,
    cons,
    branch,
    pipelinetempDetails,
    variables
  ) {
    try {
      const runsOn = await this.getRunsOnValue(pipelinetempDetails);
      const crname = template.providerjobname;
      const setupDetails = template.releasesetupdetailconfig.setupdetails;
      const setUpDetailsResponse = JSON.parse(setupDetails);
      let provider;
      if (cons.position == 1) {
        provider = "build";
      } else {
        provider = cons.providerjobname;
      }
      let dockerHubContent = `
        #---------------- DOCKER
          ${crname}:
           needs: [${provider}]
           runs-on: ${runsOn}`;

      if (variables.req.body.environment) {
        dockerHubContent += `
           environment:
              name: ${variables.req.body.environment}`;
      }

      dockerHubContent += `
           steps:
             - name: Checkout code
               uses: actions/checkout@v2
             - name: Set up Docker Buildx
               uses: docker/setup-buildx-action@v3
             - name: Login to Docker Hub
               uses: docker/login-action@v2
               with:`;

      if (variables.userKeyType && variables.userKeyType == "SECRETS") {
        dockerHubContent += `
                 username: \${{ secrets.${variables.userVariable.keyname} }}`;
      } else if (
        variables.userKeyType &&
        variables.userKeyType == "VARIABLES"
      ) {
        dockerHubContent += `
                 username: \${{ vars.${variables.userVariable.keyname} }}`;
      } else {
        dockerHubContent += `
                 username: ${setUpDetailsResponse.username}`;
      }
      if (variables.tokenKeyType == "SECRETS") {
        dockerHubContent += `
                 password: \${{ secrets.${variables.tokenVariable.keyname} }}`;
      } else if (variables.tokenKeyType == "VARIABLES") {
        dockerHubContent += `
                 password: \${{ vars.${variables.tokenVariable.keyname} }}`;
      } else {
        dockerHubContent += `
                 password: ${setUpDetailsResponse.accesstoken}`;
      }
      dockerHubContent += `
             - name: Build and push
               uses: docker/build-push-action@v5
               with:
                  push: true`;
      if (variables.userKeyType == "SECRETS") {
        dockerHubContent += `
                  tags: \${{ secrets.${variables.userVariable.keyname} }}/${setUpDetailsResponse.imagename}:${branch}`;
      } else if (variables.userKeyType == "VARIABLES") {
        dockerHubContent += `
                  tags: \${{ vars.${variables.userVariable.keyname} }}/${setUpDetailsResponse.imagename}:${branch}`;
      } else {
        dockerHubContent += `
                  tags: ${setUpDetailsResponse.username}/${setUpDetailsResponse.imagename}:${branch}
            `;
      }
      return dockerHubContent;
    } catch (e) {
      logger.error(e);
    }
  }

  async testSonarContent(
    template,
    cons,
    customVariable,
    pipelinetempDetails,
    req
  ) {
    try {
      const setupDetails = template.releasesetupdetailconfig.setupdetails;
      const setUpDetailsResponse = JSON.parse(setupDetails);

      let tokenVariable, tokenKeyType, urlVariable, urlKeyType;

      if (setUpDetailsResponse.accesstokenisvariable) {
        tokenVariable = await customVariable.find(
          (variable) =>
            variable.keyname == setUpDetailsResponse.accesstokenvariable &&
            variable.status == constants.STATUS_ACTIVE
        );
        if (tokenVariable) {
          tokenKeyType = tokenVariable.keytype;
        }
      }

      if (setUpDetailsResponse.urlisvariable) {
        urlVariable = await customVariable.find(
          (variable) =>
            variable.keyname == setUpDetailsResponse.urlvariable &&
            variable.status == constants.STATUS_ACTIVE
        );
        if (urlVariable) {
          urlKeyType = urlVariable.keytype;
        }
      }

      return await new Service().SonarContent(
        template,
        cons,
        pipelinetempDetails,
        {
          tokenVariable,
          req,
          tokenKeyType,
          urlVariable,
          urlKeyType,
        }
      );
    } catch (e) {
      logger.error(e);
    }
  }
  async SonarContent(template, cons, pipelinetempDetails, variables) {
    try {
      const runsOn = await this.getRunsOnValue(pipelinetempDetails);
      const sonarQubename = await template.providerjobname;
      const setupDetails = await template.releasesetupdetailconfig.setupdetails;
      const setUpDetailsResponse = JSON.parse(setupDetails);
      let provider = cons.position === 1 ? "build" : cons.providerjobname;

      let sonarQubeContent = `
    #---------------- SONARQUBE
          ${sonarQubename}:
            needs: [${provider}]
            runs-on: ${runsOn}`;

      if (variables.req.body.environment) {
        sonarQubeContent += `
            environment:
              name: ${variables.req.body.environment}`;
      }

      sonarQubeContent += `
            steps:
              - uses: actions/checkout@master
              - name: SonarQube Scan
                uses: sonarsource/sonarqube-scan-action@master
            env:`;

      if (variables.tokenKeyType == "SECRETS") {
        sonarQubeContent += `
                SONAR_TOKEN: \${{ secrets.${variables.tokenVariable.keyname} }}`;
      } else if (variables.tokenKeyType == "VARIABLES") {
        sonarQubeContent += `
                SONAR_TOKEN: \${{ vars.${variables.tokenVariable.keyname} }}`;
      } else {
        sonarQubeContent += `
                SONAR_TOKEN: ${setUpDetailsResponse.accesstoken}`;
      }

      if (variables.urlKeyType == "SECRETS") {
        sonarQubeContent += `
                SONAR_HOST_URL: \${{ secrets.${variables.urlVariable.keyname} }}`;
      } else if (variables.urlKeyType == "VARIABLES") {
        sonarQubeContent += `
                SONAR_HOST_URL: \${{ vars.${variables.urlVariable.keyname} }}`;
      } else {
        sonarQubeContent += `
                SONAR_HOST_URL: ${setUpDetailsResponse.url}`;
      }

      return sonarQubeContent;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async deployVMContent(
    template,
    cons,
    tempDetails,
    branch,
    customVariable,
    pipelinetempDetails,
    req
  ) {
    try {
      const runsOn = await this.getRunsOnValue(pipelinetempDetails);
      const envName = template.providerjobname;
      const setupDetails = template.releasesetupdetailconfig.setupdetails;
      const setUpDetailsResponse = JSON.parse(setupDetails);

      let dockerVariable, dockerKeyType;

      const findActiveVariable = async (variableName, setUpDetailsResponse) => {
        const variable = await customVariable.find(
          (variable) =>
            variable.keyname == setUpDetailsResponse[variableName] &&
            variable.status == constants.STATUS_ACTIVE
        );
        return variable ? variable.keytype : null;
      };

      const setPasswordVariable = await findActiveVariable(
        "passwordvariable",
        setUpDetailsResponse
      );
      const setUsernameVariable = await findActiveVariable(
        "usernamevariable",
        setUpDetailsResponse
      );
      const setAddressVariable = await findActiveVariable(
        "ipaddressvariable",
        setUpDetailsResponse
      );

      let dockerdetails = "";
      let setupdetailobj;

      ({ setupdetailobj, dockerVariable, dockerKeyType } =
        await this.dockerImageBuild(
          tempDetails,
          setupdetailobj,
          dockerVariable,
          dockerKeyType,
          customVariable,
          req
        ));

      const paramVariables = {
        dockerdetails,
        passwordKeyType: setPasswordVariable,
        passwordVariable: setUpDetailsResponse.passwordvariable,
        setUpDetailsResponse,
        userKeyType: setUsernameVariable,
        userVariable: setUpDetailsResponse.usernamevariable,
        addressVariable: setUpDetailsResponse.ipaddressvariable,
        dockerKeyType,
        dockerVariable,
        setupdetailobj,
        branch,
        addressKeyType: setAddressVariable,
      };

      dockerdetails = await this.dockerdetails(paramVariables);

      const provider = cons.position == 1 ? "build" : cons.providerjobname;

      let vmContent = `
      #---------------- VIRTUAL_MACHINE
          ${envName}:
            runs-on: ${runsOn}`;
      if (req.body.environment) {
        vmContent += `
            environment:
              name: ${req.body.environment}`;
      }
      vmContent += `
            needs: [${provider}]
            steps:
               - name: Checkout code
                 uses: actions/checkout@v3
               - name: Deploy to Linux Server
                 run: |
                     ${dockerdetails}`;

      return vmContent;
    } catch (e) {
      logger.error(e.message);
    }
  }
  async orchestration(template, jobNeed, pipelinetempDetails, setupdetailobj) {
    try {
      const runsOn = await this.getRunsOnValue(pipelinetempDetails);
      const orchName = await template.providerjobname;
      let provider = jobNeed.position === 1 ? "build" : jobNeed.providerjobname;
      let orchestrationContent = ` 
    #---------------- ORCHESTRATION
          ${orchName}:
            needs: [${provider}]
            runs-on: ${runsOn}
            permissions:
               issues: write
            steps:
               - uses: trstringer/manual-approval@v1
                 with:
                   secret: \${{ secrets.GITHUB_TOKEN }}
                   approvers: ${setupdetailobj.userName}
                   issue-title: "Orchestration"
                   issue-body: "run_id: \${{ github.run_id }}"`;
      return orchestrationContent;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async approval(template, jobNeed, pipelinetempDetails, setupdetailobj) {
    try {
      const runsOn = await this.getRunsOnValue(pipelinetempDetails);
      const approvalName = await template.providerjobname;
      let provider = jobNeed.position === 1 ? "build" : jobNeed.providerjobname;
      let approvalContent = ` 
    #---------------- APPROVAL_WORKFLOW
          ${approvalName}:
            needs: [${provider}]
            runs-on: ${runsOn}
            permissions:
               issues: write
            steps:
               - uses: trstringer/manual-approval@v1
                 with:
                   secret: \${{ secrets.GITHUB_TOKEN }}
                   approvers: ${setupdetailobj.userName}
                   issue-title: "Manual Approval"
                   issue-body: "run_id: \${{ github.run_id }}"`;
      return approvalContent;
    } catch (e) {
      logger.error(e.message);
    }
  }
  //buildScript
  async buildScript(releaseObject, jobName, runner): Promise<string> {
    try {
      const runsOn = await this.getRunsOnValue(runner);
      const provider =
        jobName.position == 1 ? "build" : jobName.providerjobname;
      const buildName = await releaseObject.providerjobname;

      const setupDetails = releaseObject.releasesetupdetailconfig.setupdetails;
      const setUpDetailsResponse = JSON.parse(setupDetails);
      const setPasswordVariable = setUpDetailsResponse.password;
      const setIpaddress = setUpDetailsResponse.ipaddress;
      const setUsernameVariable = setUpDetailsResponse.username;
      const setScriptContent = setUpDetailsResponse.buildscript;

      let buildScript = `
    #---------------- BUILD_SCRIPT
          ${buildName}:
            needs: [${provider}]
            runs-on: ${runsOn}
            steps:
               - name: Run script on the VM
                 run: |
                   sshpass -p "${setPasswordVariable}" ssh -o StrictHostKeyChecking=no ${setUsernameVariable}@${setIpaddress} <<EOF
                     ${" ".repeat(9)}${setScriptContent.replace(
        /\n/g,
        "\n" + " ".repeat(30)
      )} 
                   EOF`;
      return buildScript;
    } catch (e) {
      logger.error(e.message);
      console.log(e);
    }
  }

  async dockerdetails(paramVariables) {
    try {
      paramVariables.dockerdetails = `sshpass -p `;
      if (paramVariables.passwordKeyType == "SECRETS") {
        paramVariables.dockerdetails += `\${{ secrets.${paramVariables.passwordVariable} }} `;
      } else if (paramVariables.passwordKeyType == "VARIABLES") {
        paramVariables.dockerdetails += ` \${{ vars.${paramVariables.passwordVariable} }} `;
      } else {
        paramVariables.dockerdetails += `${paramVariables.setUpDetailsResponse.password} `;
      }
      paramVariables.dockerdetails += `ssh -o StrictHostKeyChecking=no `;
      if (paramVariables.userKeyType == "SECRETS") {
        paramVariables.dockerdetails += `\${{ secrets.${paramVariables.userVariable} }}@`;
      } else if (paramVariables.userKeyType == "VARIABLES") {
        paramVariables.dockerdetails += ` \${{ vars.${paramVariables.userVariable} }}@`;
      } else {
        paramVariables.dockerdetails += `${paramVariables.setUpDetailsResponse.username}@`;
      }
      if (paramVariables.addressKeyType == "SECRETS") {
        paramVariables.dockerdetails += `\${{ secrets.${paramVariables.addressVariable} }} `;
      } else if (paramVariables.addressKeyType == "VARIABLES") {
        paramVariables.dockerdetails += `\${{ vars.${paramVariables.addressVariable} }} `;
      } else {
        paramVariables.dockerdetails += `${paramVariables.setUpDetailsResponse.ipaddress} `;
      }

      if (paramVariables.dockerKeyType == "SECRETS") {
        paramVariables.dockerdetails += `"sudo docker pull \${{ secrets.${paramVariables.dockerVariable.keyname} }}/${paramVariables.setupdetailobj.imageName}:${paramVariables.branch} && sudo docker run --rm -p ${paramVariables.setUpDetailsResponse.port}:${paramVariables.setUpDetailsResponse.port} -d \${{ secrets.${paramVariables.dockerVariable.keyname} }}/${paramVariables.setupdetailobj.imageName}:${paramVariables.branch}"`;
      } else if (paramVariables.dockerKeyType == "VARIABLES") {
        paramVariables.dockerdetails += `"sudo docker pull \${{ vars.${paramVariables.dockerVariable.keyname} }}/${paramVariables.setupdetailobj.imageName}:${paramVariables.branch} && sudo docker run --rm -p ${paramVariables.setUpDetailsResponse.port}:${paramVariables.setUpDetailsResponse.port} -d \${{ vars.${paramVariables.dockerVariable.keyname} }}/${paramVariables.setupdetailobj.imageName}:${paramVariables.branch}"`;
      } else {
        paramVariables.dockerdetails += `"sudo docker pull ${paramVariables.setupdetailobj.userName}/${paramVariables.setupdetailobj.imageName}:${paramVariables.branch} && sudo docker run --rm -p ${paramVariables.setUpDetailsResponse.port}:${paramVariables.setUpDetailsResponse.port} -d ${paramVariables.setupdetailobj.userName}/${paramVariables.setupdetailobj.imageName}:${paramVariables.branch}"`;
      }
      return paramVariables.dockerdetails;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async dockerImageBuild(
    tempDetails,
    setupdetailobj,
    dockerVariable,
    dockerKeyType,
    customVariable,
    req
  ) {
    try {
      for (const temp of tempDetails) {
        if (temp.providerjobname === "DOCKERHUB") {
          const setUpDetailsResponse =
            temp.releasesetupdetailconfig.setupdetails;
          const owner = JSON.parse(setUpDetailsResponse);
          setupdetailobj = {
            userName: owner.username,
            accessToken: owner.accesstoken,
            imageName: owner.imagename,
          };
          ({ dockerVariable, dockerKeyType } = await this.dockerVariablekey(
            owner,
            dockerVariable,
            customVariable,
            dockerKeyType
          ));
          return { setupdetailobj, dockerVariable, dockerKeyType };
        }
      }
    } catch (e) {
      logger.error(e.message);
    }
  }

  async dockerVariablekey(
    owner,
    dockerVariable,
    customVariable,
    dockerKeyType
  ) {
    try {
      if (owner.usernameisvariable) {
        dockerVariable = await customVariable.find(
          (variable) =>
            variable.keyname === owner.usernamevariable &&
            variable.status === constants.STATUS_ACTIVE
        );
        if (dockerVariable) {
          dockerKeyType = dockerVariable.keytype;
        }
      }
      return { dockerVariable, dockerKeyType };
    } catch (e) {
      logger.error(e.message);
    }
  }

  async createOrUpdateFile(owner: string,repo: string,path: string,branch: string,token: string,paramVariables): Promise<any> {
    try {
      const octokit = new Octokit({
        auth: token,
        request: {
          fetch,
        },
      });

      try {
        // Get the current file details
        const { data } = await octokit.repos.getContent({
          owner: owner,
          repo: repo,
          path: path,
          ref: branch,
        });
        const currentFileSha = (data as any).sha;

        // Resolve the content promise
        const resolvedContent = await paramVariables.workflowContent;
        // Create or update the file
        const response = await octokit.repos.createOrUpdateFileContents({
          owner: owner,
          repo: repo,
          path: path,
          message: "cicd yml file updated",
          content: Buffer.from(resolvedContent).toString("base64"),
          sha: currentFileSha,
          branch: branch,
        });
        return response.data;
      } catch (error) {
        if (error.status === 404) {
          const resolvedContent = await paramVariables.workflowContent;
          const response = await octokit.repos.createOrUpdateFileContents({
            owner: owner,
            repo: repo,
            path: path,
            message: paramVariables.commitMessage,
            content: Buffer.from(resolvedContent).toString("base64"),
            branch: branch,
          });
          return response.data;
        }
        throw error;
      }
    } catch (error) {
      paramVariables.res.json({
        status: false,
        code: 204,
        message: "Bad Credential",
      });
      return;
    }
  }
  async scriptContent(tempDetails, owner, repo, branch, token) {
    const octokit = new Octokit({
      auth: token,
      request: {
        fetch,
      },
    });

    for (const detail of tempDetails) {
      const updateScript = detail.releasesetupdetailconfig.scriptcontent;

      if (
        updateScript != null &&
        updateScript != undefined &&
        updateScript.trim() !== "" &&
        !/^"\s*"\s*$/.test(updateScript) &&
        !/'\s*'\s*/.test(updateScript)
      ) {
        let path, mesIndex;

        switch (detail.providerjobname) {
          case constants.CONTAINER_REGISTRY_DOCKERHUB:
            path = constants.SERVICE_SCRIPTCONTENT[0];
            mesIndex = 0;
            break;
          case constants.TESTING_TOOL_SONARQUBE:
            path = constants.SERVICE_SCRIPTCONTENT[1];
            mesIndex = 2;
            break;
          default:
            console.error(
              `Unsupported provider job name: ${detail.providerjobname}`
            );
            continue;
        }

        const contentBase64 = Buffer.from(updateScript).toString("base64");

        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
          });

          const sha = (data as any).sha;

          await new Service().updateFile(
            octokit,
            owner,
            repo,
            path,
            contentBase64,
            { sha, branch, message: messages.SERVICE_SCRIPTCONTENT[mesIndex] }
          );
        } catch (error) {
          if (error.status === 404) {
            await new Service().createFile(
              octokit,
              owner,
              repo,
              path,
              contentBase64,
              branch,
              messages.SERVICE_SCRIPTCONTENT[mesIndex + 1]
            );
          } else {
            console.error("Failed to create or update file:", error);
          }
        }
      }
    }
  }

  async updateFile(octokit, owner, repo, path, content, variables) {
     await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: variables.message,
      content,
      sha: variables.sha,
      branch: variables.branch,
    });
  }

  async createFile(octokit, owner, repo, path, content, branch, message) {
     await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content,
      branch,
    });
  }

  async getRunsOnValue(template) {
    try {
      const runnerDetail = await db.ProviderRunners.findOne({
        where: { status: constants.STATUS_ACTIVE, id: template.runnerid },
      });
      const pipelineTemplate = JSON.parse(JSON.stringify(runnerDetail));
      const runnerType = pipelineTemplate.type.toLowerCase();
      const runnerOs = pipelineTemplate.os.toLowerCase();
      const runnerName = pipelineTemplate.name.toLowerCase();
      let runsOn = "";
      if (runnerType === "self-hosted") {
        runsOn = `[${runnerType}, ${runnerOs}]`;
      } else {
        runsOn = runnerName;
      }

      return runsOn;
    } catch (e) {
      logger.error(e);
    }
  }
}
export default new Service();
