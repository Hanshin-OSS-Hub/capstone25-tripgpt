try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ModuleNotFoundError:
    # MySQL driver is installed per environment.
    pass
