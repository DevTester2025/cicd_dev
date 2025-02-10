#!/bin/bash
for i in "$@"
do
case $i in
    -DomainPassword=*|--DomainPassword=*)
    DOMAINPASSWORD="${i#*=}"
    ;;
    -DomainUser=*|--DomainUser=*)
    DOMAINUSER="${i#*=}"
    ;;
    -DomainName=*|--DomainName=*)
    DOMAINNAME="${i#*=}"
    ;;
    -ETSName=*|--ETSName=*)
    ETSNAME="${i#*=}"
    ;;
    -ETSPath=*|--ETSPath=*)
    ETSPATH="${i#*=}"
    ;;
    -languagePairPaths=*|--languagePairPaths=*)
    LANGUAGEPATHS="${i#*=}"
    ;;
    -LanguageName=*|--LanguageName=*)
    LANGNAME="${i#*=}"
    ;;
    -InstallMode=*|--InstallMode=*)
    MODE="${i#*=}"
    ;;
    -AdminUserName=*|--AdminUserName=*)
    ADMINUSERNAME="${i#*=}"
    ;;
    -AdminUserDisplayName=*|--AdminUserDisplayName=*)
    DISPLAYNAME="${i#*=}"
    ;;
    -AdminUserPassword=*|--AdminUserPassword=*)
    ADMINPASSWORD="${i#*=}"
    ;;
    -HostName=*|--HostName=*)
    HOSTNAME="${i#*=}"
    ;;
    -TLSMode=*|--TLSMode=*)
    TLSMODE="${i#*=}"
    ;;
esac
done
fdisk -l;
pvcreate /dev/vdb;
pvdisplay /dev/vdb;
vgs;
pvs;
df -h /;
vgextend centos /dev/vdb;
lvextend -L +39G /dev/mapper/centos-root;
df -hT /;
xfs_growfs /dev/mapper/centos-root;
yum install wget -y;
yum install unzip -y;
wget -O /etc/yum.repos.d/pbiso.repo https://repo.pbis.beyondtrust.com/yum/pbiso.repo;
yum install pbis-open -y;
hostnamectl set-hostname ${HOSTNAME};
/opt/pbis/bin/domainjoin-cli join ${DOMAINNAME} ${DOMAINUSER} ${DOMAINPASSWORD};
wget ftp://${ETSPATH};
unzip ${ETSNAME}.zip;
./${ETSNAME}/setup-linux-x64.run --mode unattended --prefix /opt/sdl/ets --install_mode ${MODE} --admin_user_username ${ADMINUSERNAME} --admin_user_display_name ${DISPLAYNAME} --admin_user_password ${ADMINPASSWORD} --tls_mode ${TLSMODE};
wget "ftp://${LANGUAGEPATHS}";
unzip ${LANGNAME}.zip;
./${LANGNAME}/setup-linux-x64.run --mode unattended;