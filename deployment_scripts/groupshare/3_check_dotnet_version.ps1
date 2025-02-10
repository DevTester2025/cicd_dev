Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "3_checking_dotnet ------------------------------------------------"

(Get-ItemProperty "HKLM:SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full").version;