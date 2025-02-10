Function Log {
    param(
        [Parameter(Mandatory = $true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "3_checking_dotnet ------------------------------------------------"

$version = (Get-ItemProperty "HKLM:SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full").version;
if ($version -like "*4.8*") {
    write-host "Completed"
}

Log "Validating Dotnet installation $retry / 8";
start-sleep -s 30;


