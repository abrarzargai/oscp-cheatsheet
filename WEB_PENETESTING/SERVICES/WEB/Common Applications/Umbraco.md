
content management systems store user credentials in some files or databases. Googling the term **Umbraco credentials location** helped me locate **Umbraco.sdf** file located under **App_data** folder. (if you found the dump or code of Umbaco website)

.sdf is SQL Server Compact DB. And it is viewable using SQL Server Management Studio or Visual Studio simple utility is enough to find some useful information in the .sdf file: strings

```bash
strings Umbraco.sdf | head
```