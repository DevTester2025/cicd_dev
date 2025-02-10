
[string] $_URL = 'http://localhost/'
function CheckSiteURLStatus($_URL) {
    try {

        $request = [System.Net.WebRequest]::Create($_URL)
        $response = $request.getResponse();
        if ($response.StatusCode -eq "200") {
            write-host "Completed"
        }

    }
    catch {
        write-host "Error validating URL"
    }
}
 
CheckSiteURLStatus $_URL