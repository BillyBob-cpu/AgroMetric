import database as db

def init():
    print("Création des tables...")
    db.create_tables()
    print("Import des données CSV...")
    db.import_csv()
    print("Base PostgreSQL prête !")

if __name__ == '__main__':
    init()