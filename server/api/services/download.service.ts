
const client = require('@jsreport/nodejs-client')(`${process.env.JSREPORT_URL}`)


export class DownloadService {
  constructor() { }

  generateFile(datas, template, cb) {
    try {
      return client
        .render({
          template: template,
          data: datas,
        })
        .then(async (resp: any) => {
          let content = { content: resp.content } as any;
          const bodyBuffer = await resp.body();
          cb({ content: bodyBuffer });
        })
        .catch((error: Error) => {
          console.log(error);
          cb(error);
        });
    } catch (e) {
      console.log(e);
      cb(e);
    }
  }
}
export default new DownloadService();
