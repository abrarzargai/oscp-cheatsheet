


### <span style="color:#50FA7B">Configuration Files</span>

/etc/nginx/sites-enabled/default
/etc/apache2/sites-enabled
cat 000-default.conf | grep -Pv "^\s*#" | grep .
cat pandora.conf | grep -Pv "^\s*#" | grep .