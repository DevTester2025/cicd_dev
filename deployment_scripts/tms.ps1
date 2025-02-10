#ps1
NET USER sdladmin "SdlAbmin#12E!" /ADD
NET LOCALGROUP "administrators" "sdladmin" /add
ECHO Y | winrm quickconfig
winrm set winrm/config/service/Auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
winrm set winrm/config/winrs '@{MaxMemoryPerShellMB="1024"}'