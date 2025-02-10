#!/bin/bash

sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
sed -i 's/# PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
sed -i 's/# PasswordAuthentication yes/PasswordAuthentication yes/g' /etc/ssh/sshd_config
systemctl enable sshd.service
systemctl start sshd.service
systemctl status sshd.service
sudo service sshd restart

grep sudo /etc/group
grep cmadmin /etc/group 
grep cmadmin /etc/passwd
adduser cmadmin
echo csdm#2020 | passwd cmadmin --stdin
echo csdm#2020 | passwd root --stdin
usermod -aG wheel cmadmin
usermod -aG root cmadmin