export default `<html>

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
    <style>
        td {
            word-wrap: break-word;
            padding: 15px;
        }
        th{
            text-align: left !important;
        }
        .left{
            text-align: left !important;
        }
    </style>
</head>

<body>
    <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
        <tr>
            <td>Alert Name</td>
            <td>{{alertname}}</td> 
        </tr>
        <tr>
            <td>Alert Level</td>
            <td>{{alertlevel}}</td> 
        </tr>
            <tr>
                <td>Customer</td>
                <td>{{customername}}</td> 
            </tr>
            <tr>
                <td>Account</td>
                <td>{{accountname}}</td> 
            </tr>
            <tr>
                <td>Tag</td>
                <td>{{tagname}}</td> 
            </tr>
            <tr>
                <td>Tag Value</td>
                <td>{{tagvalue}}</td> 
            </tr>
            <tr>
                <td>{{tagvalue}}</td> 
            </tr>
            <tr class="top">
                <th class="left">Agent ID</th>
                <th class="left">Agent IP</th>
                <th class="left">Agent Name</th>
                <th class="left">Provider Name</th>
                <th class="left">Description</th>
                <th class="left">Fired Times</th>
                <th class="left">Location</th>
                <th class="left">Time</th>
                <th class="left">Groups</th>
                <th class="left">Message</th>
                <th class="left">Manager Name</th>
                <th class="left">Channel</th>
                <th class="left">Level</th>
            </tr>

            {{#each instance}}
            <tr>
                <td>{{_source.agent.ip}}</td>
                <td>{{_source.agent.id}}</td>
                <td>{{_source.agent.name}}</td>
                <td>{{checkPlatform _source 'providerName'}}</td>
                <td>{{_source.rule.description}}</td>
                <td>{{_source.rule.firedtimes}}</td>
                <td>{{_source.location}}</td>
                <td>{{_source.timestamp}}</td>
                <td>{{#each _source.rule.groups}}{{this}}{{/each}}</td>
                <td>{{checkPlatform _source 'data'}}</td>
                <td>{{_source.manager.name}}</td>
                <td>{{checkPlatform _source 'channel'}}</td>
                <td>{{checkPlatform _source 'level'}}</td>
            </tr>{{/each}}
        </table>
    </div>
</body>

</html>`;