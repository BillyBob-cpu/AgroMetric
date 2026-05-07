"""
init_db.py — Script d'initialisation de la base PostgreSQL.
À lancer une seule fois (ou après avoir supprimé les tables).

    python3 init_db.py
"""
import database as db


def init():
    print("Création des tables...")
    db.create_tables()
    print("Import des données CSV...")
    db.import_csv()
    print("Base PostgreSQL prête !")


if __name__ == '__main__':
    init()
