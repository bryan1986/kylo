#!/bin/bash

read -p "Are you sure you want to uninstall all Kylo components AND delete the thinkbig database? Type YES to confirm: " CONFIRM_DELETE

if [ "$CONFIRM_DELETE" == "YES" ] ; then

echo "Uninstalling all components that were installed from the RPM and setup-wizard"
echo "Uninstalling thinkbig applications with RPM uninstall"
/opt/thinkbig/remove-thinkbig-datalake-accelerator.sh
rm -rf /opt/thinkbig
mysql -e "drop database thinkbig;"
mysql -e "show databases;"
userdel thinkbig

echo "Uninstalling NiFi"
service nifi stop
chkconfig nifi off
rm -rf /opt/nifi
rm -rf /var/log/nifi
rm -f /etc/init.d/nifi
userdel nifi

echo "Uninstalling ActiveMQ"
service activemq stop
rm -f /etc/init.d/activemq
rm -f /etc/default/activemq
rm -rf /opt/activemq
userdel activemq

echo "Uninstalling elasticsearch"
rpm -e elasticsearch
rm -rf /var/lib/elasticsearch/

echo "Uninstalling /opt/java"
rm -rf /opt/java

echo "Uninstall complete. You should now be able to re-install the RPM and run the setup wizard to get a clean install"

else 
  echo "Exiting and skipping removal since you didn't say YES"
fi
