Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

[string] $_URL = 'http://localhost'
function CheckSiteURLStatus($_URL) {
    try {
        $request = [System.Net.WebRequest]::Create($_URL)
        $response = $request.getResponse()
        if ($response.StatusCode -eq "200") {
            write-host "Completed"
        }
    }
    catch {
        Log "Groupshare not installed."
    }
}
 
CheckSiteURLStatus $_URL