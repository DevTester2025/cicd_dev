Function Log {
    param(
        [Parameter(Mandatory = $true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

[string] $_URL = 'https://localhost'
function CheckSiteURLStatus($_URL) {
    try {
        $request = [System.Net.WebRequest]::Create($_URL)
        $response = $request.getResponse();
        if ($response.StatusCode -eq "200") {
            write-host "Completed"
        }else{
            Log "Not installed yet.";
        }
    }
    catch {
        Log "Error in validating URL"
    }
}
 
CheckSiteURLStatus $_URL