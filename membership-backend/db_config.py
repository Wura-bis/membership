import pyodbc

def get_db_connection():
    conn_str = (
        r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
        r'DBQ=C:\Users\User\Documents\BISMembershipDatabase.accdb;'
    )
    conn = pyodbc.connect(conn_str)
    return conn
