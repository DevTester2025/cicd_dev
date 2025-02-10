const jsreport = require('jsreport')();
import { customValidation } from "../../common/validation/customValidation";
export class DownloadService {
    constructor() {}
    generatePdf(req: any, res: any){
        jsreport.render({
            template: {
              content: '<h1>Hello world</h1>',
              engine: 'handlebars',
              recipe: 'chrome-pdf'
            }
          }).then((out)  => {
            out.stream.pipe(res);
          }).catch((e) => {
            customValidation.generateAppError(e, {}, res, req);
          });
    }
}
export default new DownloadService();