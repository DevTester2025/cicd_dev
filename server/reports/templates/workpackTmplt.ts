export default `<!DOCTYPE html> <html> <head> <title></title> <style>@font-face{font-family:'Roboto',sans-serif;src:url(https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAx05IsDqlA.ttf) format('truetype')}*,html,body{font-family:'Roboto',sans-serif;font-weight:400}table{font-family:'Roboto',sans-serif}body{font-size:13px}table,td{border:1px solid #cfcfcf;padding:10px 15px;border-collapse:collapse;page-break-inside:avoid;font-size:12px;max-width:auto}th{font-size:13px}.taskStepsTable{width:auto border-collapse:collapse;table-layout:fixed;margin-bottom:0;page-break-inside:avoid}.taskStepsTable td,.taskStepsTable th{word-wrap:break-word}.remarksTable{width:100%;border-collapse:collapse;table-layout:fixed}.remarksTable img,.taskStepsTable img{max-width:95%;width:auto;height:auto}ul,ol{margin:2px;padding-left:5px}.section{margin:25px 0}.section h4{margin:10px 0;text-align:left;font-size:15px;font-weight:bold}.section h4.capitalize{text-transform:capitalize;font-size:16px}.table{width:100%;border-collapse:collapse!important;font-size:8px}.table th{border:solid 1px #cfcfcf;background:#deedf1;padding:8px}.table td{border:solid 1px #cfcfcf;padding:8px}.table th{text-transform:capitalize}.taskStepsTable th{border:solid 1px #cfcfcf;background:#deedf1;text-transform:capitalize}.commentstable{border:solid 1px #cfcfcf;width:95%!important;border-collapse:collapse!important}.commentstable td{font-size:15px;border:solid 1px #cfcfcf}.border-bottom{width:100%;border-bottom:solid 2px #000;padding-bottom:20px}.fieldname-text{width: 25%;font-weight: bold;text-align: left}ul{padding-left: 20px;margin-top: 5px;margin-bottom: 5px;}li{margin-left: 10px;text-align: left}</style> </head> <body> <div class=section> <table class=table> <tbody> {{#each commonContentData}} {{#if (checkCondition fieldname 'Key')}} {{else}} {{#if (checkCondition fieldname 'Name')}} <h1> {{fieldvalue}}</h1>{{else}} <tr> <th class=fieldname-text>{{fieldname}}</th> <td>{{fieldvalue}}</td> </tr> {{/if}}{{/if}} {{/each}} </tbody> </table> </div> <div class=section> {{#each textAreaData}} <div> <h4 class=capitalize>{{fieldname}}</h4> <div> {{{fieldvalue}}} </div> </div>{{/each}} </div> <div class=section> <h4 class=border-bottom>Execution:</h4> <table class=table> <tr> <th></th> <th>Name</th> <th>Due Date</th> <th>Result</th> <th>Remarks</th> </tr> <tr> <td colspan=5>RUN ID : 1</td> </tr> <tr> <td>Installer/Executor</td> <td>{{installerExecutor}}</td> <td>{{dueDate}}</td> <td>{{result}}</td> <td>{{remarks}}</td> </tr> <tr> <td>Reviewer</td> <td>{{reviewer}}</td> <td></td> <td>Pending</td> <td></td> </tr> </table> </div> <div class=section> <h4 class=border-bottom>Tasks/Steps:</h4> {{#each groupedHdrData}} <h4>{{this.0.resourcetype}}</h4> <table class="taskStepsTable table"> <tr> {{#each this}} <th style="width: {{getColumnWidth fieldtype}}; padding: 5px;">{{fieldname}}</th> {{/each}} </tr> {{#each (formTaskDetails ../groupedDtlData this.0.crn)}} <tr> {{#each this}} <td style="width: {{getColumnWidth fieldtype}}; padding: 5px;">{{{fieldvalue}}}</td> {{/each}} </tr> {{#if this.0.taskWorkflow}} <tr> <td colspan={{arrayLen this}}> <table style="border-collapse: collapse; border: none;width: 100%;"> <tr> <td style="border: none;width: 30%;">Installer/Executor : <b>{{this.0.taskWorkflow.0.touser.fullname}}</b> Result : <b>{{this.0.taskWorkflow.0.assignee_status}}</b> </td> <td style="border: none;width: 70%;"> <table class=table style=width:100%> <tr> <th style="width: 20%;">Reviewer</th> <th style="width: 20%;">Result</th> <th style="width: 60%;">Remarks</th> </tr> {{#each this.0.taskWorkflow}} <tr> <td>{{touser.fullname}}</td> <td>{{workflow_status}}</td> <td>{{notes}}</td> </tr> {{/each}} </table> </td> </tr> </table> </td> </tr>{{/if}} {{/each}} </table>{{/each}} </div> <div class=section> <h4 class=border-bottom>General History:</h4> <table class=commentstable style=width:100%> <tr> <td>Changed By</td> <td>Published on</td> <td>Current</td> <td>Previous</td> </tr> {{#each history}} <tr> <td>{{createdby}}</td> <td>{{createddt}}</td> <td style=word-break:break-all>{{{new}}}</td> <td style=word-break:break-all>{{{old}}}</td> </tr> {{/each}} </table> </div> <div class=section> <h4 class=border-bottom>General Comments:</h4> {{#each comments}} <table class=commentstable> <tr> <td> Comment </td> <td> Provided By </td> <td> Provided Date </td> </tr> <tr> <td>{{comment}}</td> <td>{{createdby}}</td> <td>{{createddt}}</td> </tr> </table>{{/each}} <h4 class=border-bottom>Execution Comments:</h4> {{#each exe_comments}} <table class=commentstable> <tr> <td> Comment </td> <td> Provided By </td> <td> Provided Date </td> </tr> <tr> <td>{{comment}}</td> <td>{{createdby}}</td> <td>{{createddt}}</td> </tr> </table>{{/each}} </div> </body> </html>`;