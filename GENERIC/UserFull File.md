


### Configuration FIles 

/etc/nginx/sites-enabled/default
/etc/apache2/sites-enabled
cat 000-default.conf | grep -Pv "^\s*#" | grep .
cat pandora.conf | grep -Pv "^\s*#" | grep .