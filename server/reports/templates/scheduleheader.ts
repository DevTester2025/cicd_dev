export default `<html>

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
    <style>
        .invoice {
            max-width: 840px;
            margin: auto;
            line-height: 20px;
            font-family: Helvetica, Arial, Sans-Serif
        }

        .title {
            color: #f44336
        }

        .logo {
            vertical-align: middle;
            display: inline
        }

        .maindata {
            display: inline-block;
            padding-left: 15px
        }

        .invoice table {
            width: 100%;
            line-height: inherit;
            color: #333;
            font-size: 13px
        }

        .invoice table td {
            padding: 5px
        }

        .invoice .subtitle {
            font-size: 25px;
            padding-bottom: 5px
        }

        .invoice .invtitle {
            font-size: 20px
        }

        .align-right {
            text-align: right
        }

        .align-left {
            text-align: left
        }

        .p-t-20 {
            padding-top: 20px
        }

        .p-t-4 {
            padding-top: 4em
        }

        .align-center {
            text-align: center
        }

        .listtable {
            border-collapse: collapse
        }

        .listtable td {
            border: 1px solid #999
        }

        .listtable tr td:nth-child(5) {
            width: 12%!important
        }

        .listtable tr td:nth-child(3) {
            width: 12%!important
        }

        .listtable tr td:nth-child(4) {
            width: 10%!important
        }

        .listtable tr td:nth-child(1) {
            width: 6%!important
        }

        .listtable th {
            border: 1px solid #999;
            padding: 5px
        }

        .listtable .nolinebottom {
            border-bottom-color: #fff
        }

        .listtable .amtinword {
            padding: 20px
        }

        .listtable .nolineleft {
            border-left-color: #fff
        }

        .listtable .nolineright {
            border-right-color: #fff
        }

        .wrap {
            word-wrap: break-word;
            width: 30%
        }

        .invoice .tblborder table {
            border-collapse: collapse
        }

        .invoice .tblborder table td {
            border: 1px solid #999
        }

        .titlrow {
            background-color: #0C8E29;
        }

        .headercolor {
            background-color: #FFF033;
        }
    </style>
</head>

<body>
    <div class=invoice>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th>Title</th>
                <th>Starts at</th>
                <th>Ends at</th>
                <th>Status</th>
                {{#each headers}}
                <th class="align-left">{{this}} Status</th>
                <th class="align-left">{{this}} Log</th>
                {{/each}}
            </tr>
            {{#each list}}
            <tr>
                <td>{{title}}</td>
                <td>{{execution_start}}</td>
                <td>{{execution_end}}</td>
                <td>{{status}}</td>
                {{#each lifecycle}}
                <td>{{status}}</td>
                <td>{{message}}</td>
                {{/each}}
            </tr>
            {{/each}}
        </table>
    </div>
</body>

</html>`;
