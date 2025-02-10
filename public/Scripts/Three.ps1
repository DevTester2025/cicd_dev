Function Log {
    param(
        [Parameter(Mandatory = $true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "3_checking_dotnet ------------------------------------------------"

$retry = 0;

Do {
    $version = (Get-ItemProperty "HKLM:SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full").version;
    if ($version -like "*4.8*") {
        write-host "Completed"
    }

    $retry = $retry + 1;

    if($retry -gt 8){
        Log "Dotnet installation not yet completed";
        write-host "Retry"
        break;
    }

    Log "Validating Dotnet installation $retry / 8";
    start-sleep -s 30;

}While ($true)

