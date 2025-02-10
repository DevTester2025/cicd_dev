
[string] $_URL = 'https://localhost'
function CheckSiteURLStatus($_URL) {
    try {
        $request = [System.Net.WebRequest]::Create($_URL)
        $response = $request.getResponse();
        if ($response.StatusCode -eq "200") {
            write-host "true"
        }
        else {
            write-host "false" 
        }
    }
    catch {
        write-host "false"
    }
}
 
CheckSiteURLStatus $_URL