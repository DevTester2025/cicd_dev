export default `function currency(g) {
    if (g !== null) {
        var k = [];
        k[0] = "";
        k[1] = "One";
        k[2] = "Two";
        k[3] = "Three";
        k[4] = "Four";
        k[5] = "Five";
        k[6] = "Six";
        k[7] = "Seven";
        k[8] = "Eight";
        k[9] = "Nine";
        k[10] = "Ten";
        k[11] = "Eleven";
        k[12] = "Twelve";
        k[13] = "Thirteen";
        k[14] = "Fourteen";
        k[15] = "Fifteen";
        k[16] = "Sixteen";
        k[17] = "Seventeen";
        k[18] = "Eighteen";
        k[19] = "Nineteen";
        k[20] = "Twenty";
        k[30] = "Thirty";
        k[40] = "Forty";
        k[50] = "Fifty";
        k[60] = "Sixty";
        k[70] = "Seventy";
        k[80] = "Eighty";
        k[90] = "Ninety";
        g = g.toString();
        var h = g.split(".");
        var d = h[0].split(",").join("");
        var b = d.length;
        var l = "";
        if (b <= 9) {
            var c = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
            var a = new Array();
            for (var f = 0; f < b; f++) {
                a[f] = d.substr(f, 1)
            }
            for (f = 9 - b, e = 0; f < 9; f++, e++) {
                c[f] = a[e]
            }
            for (f = 0, e = 1; f < 9; f++, e++) {
                if (f == 0 || f == 2 || f == 4 || f == 7) {
                    if (c[f] == 1) {
                        c[e] = 10 + parseInt(c[e]);
                        c[f] = 0
                    }
                }
            }
            value = "";
            for (f = 0; f < 9; f++) {
                if (f == 0 || f == 2 || f == 4 || f == 7) {
                    value = c[f] * 10
                } else {
                    value = c[f]
                }
                if (value != 0) {
                    l += k[value] + " "
                }
                if ((f == 1 && value != 0) || (f == 0 && value != 0 && c[f + 1] == 0)) {
                    l += "Crores "
                }
                if ((f == 3 && value != 0) || (f == 2 && value != 0 && c[f + 1] == 0)) {
                    l += "Lakhs "
                }
                if ((f == 5 && value != 0) || (f == 4 && value != 0 && c[f + 1] == 0)) {
                    l += "Thousand "
                }
                if (f == 6 && value != 0 && (c[f + 1] != 0 && c[f + 2] != 0)) {
                    l += "Hundred and "
                } else {
                    if (f == 6 && value != 0) {
                        l += "Hundred "
                    }
                }
            }
            l = l.split("  ").join(" ")
        }
        return l
    }
}

function findEmpty(a) {
    if (a !== null && a !== "") {
        return a
    } else {
        return "-"
    }
}

function amountwithsymbol(c, a) {
    if (a !== null && a !== undefined) {
        var b = a.toString().split(".")[0].length > 3 ? a.toString().substring(0, a.toString().split(".")[0].length - 3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + a.toString().substring(a.toString().split(".")[0].length - 3) : a.toString();
        return c + " " + b
    } else {
        return 0;
    }
}

function tax(a, b, c) {
    if (b !== null && a) {
        let d = Math.ceil(b * c / 100);
        return a + ' ' + d / 2;
    } else {
        return ""
    }
}

function taxvalue(a) {
    if (a) {
        return a / 2 + "%"
    } else {
        return ""
    }
}

function arrayToString(v) {
    if (v) {
        return v.join(',');
    } else {
        return ""
    }
}

function booleanToString(v) {
    if (v == true) {
        return 'Yes';
    } else {
        return "No"
    }
}

function index(i) {
    return i + 1;
}
function checkPlatform(source, key) {
    if(source){
    if (source.data && source.data.win) {
        if (key == "data" && source.data.win.eventdata) {
            return source.data.win.eventdata[key];
        }
        if (key == "providerName" && source.data.win.system) {
            return source.data.win.system[key];
        }
        if (key == "channel" && source.data.win.system) {
            return source.data.win.system[key];
        }
        if (key == "level" && source.data.win.system) {
            return source.data.win.system[key];
        }
    } 
    else 
    if (source.data && source.data.sca && source.data.sca.check) {
        if (key != "providerName") {
            return source.data.sca.check.description;
        }
        if (key == "providerName") {
            return source.data.sca.check.command;
        }
    } 
    else if (source.full_log && key != "providerName") {
        return source.full_log
    }
    else {
        return "";
    }
    }
    else {
        return "";
    }
}

function stringify(obj) {
    // if (obj && typeof(obj)=="object") {
    //     return JSON.stringify(obj);
    // }
    // else{
        return "";
    // }
}
    
function arrayLen(arr) {
    if (arr && arr.length > 0) {
        return arr.length;
    } else {
        return 0
    }
}

function checkCondition(fname, fvalue) {
    if (fname == fvalue) {
        return true;
    } else {
        return false;
    }
}

function formTaskDetails(data, key) {
    if (data && key && data[key]) {
        return data[key]
    } else {
        return []
    }
}

function getColumnWidth(fieldtype) {
switch (fieldtype) {
        case 'AUTOGEN':
            return '10%';
        case 'Boolean':
            return '20%';
        case 'Date':
        case 'DateTime':
            return '20%';
        case 'Float':
        case 'Integer':
            return '20%';
        case 'REFERENCE':
        case 'Reference Asset':
            return '30%';
        case 'Select':
        case 'STATUS':
            return '35%';
        case 'Text':
            return '35%';
        case 'Textarea':
            return '40%';
        case 'URL':
            return '30%';
        default:
            return '15%';
    }
}
`;
