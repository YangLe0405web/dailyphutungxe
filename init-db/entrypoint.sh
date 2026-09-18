#!/bin/bash
sleep 20s
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Password123' -C -i /docker-entrypoint-initdb.d/init.sql