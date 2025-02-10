"use strict";
export class Constants {
  REPORTS = {
    ENGINE: "handlebars",
    CURRENCY: "₹",
    TEMPLATE: {
      engine: "handlebars",
      recipe: "phantom-pdf",
      phantom: {
        format: "A4",
        orientation: "portrait",
        fittopage: true,
        margin: { top: "30px", left: "20px", right: "20px", bottom: "10px" },
      },
    },
    STYLES: {
      FIXED_LAYOUT: "table-layout: fixed;",
    },
  };
}
export const ReportConstants = new Constants();
