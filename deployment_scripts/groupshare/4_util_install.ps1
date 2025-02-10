Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}
$ArchiveServer = "eclus1fs3\CloudMatiq";
Log "2_util_install ------------------------------------------------";
Start-Sleep -Seconds 60
set-executionpolicy bypass;
#$ArchiverServer = '$ArchiveServer\CloudMatiq';
Copy-Item -Path "\\$ArchiveServer\GroupShare\otp_win64_20.3.exe" -Destination "C:\" -Recurse | Wait-Job;
Copy-Item -Path "\\$ArchiveServer\GroupShare\rabbitmq-server-3.7.18.exe" -Destination "C:\" -Recurse | Wait-Job;
Copy-Item -Path "\\$ArchiveServer\GroupShare\SDL_Trados_GroupShare_2020_Service_Release_1.exe" -Destination "C:\" -Recurse | Wait-Job;

Start-Process -Wait 'C:\otp_win64_20.3.exe' /S;
Log "otp_win64_20 Installed ------------------------------------------------";

$proc = Start-Process "C:\rabbitmq-server-3.7.18.exe" '/S' -Wait:$false -PassThru;
Wait-Process -Id $proc.Id;

Log "rabbitmq-server-3.7.18 Installed ------------------------------------------------";
$ENV:Path += ";C:\Program Files\RabbitMQ Server\rabbitmq_server-3.7.18\sbin";
#Restart-Computer -Force

#Start-Process 'C:\SDL_Trados_GroupShare_2020_Service_Release_1.exe' '/S' -Wait:$false -PassThru;
#Log "Extract SDL_Trados_GroupShare_2020_Service_Release_1 ------------------------------------------------";