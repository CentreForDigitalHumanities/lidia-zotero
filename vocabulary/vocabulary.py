import csv
import os
import pathlib
from urllib.parse import urlparse, parse_qs
import sqlite3
import json


PROJROOT = pathlib.Path(__file__).parents[1].resolve()

def dict_factory(cursor, row):
    fields = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(fields, row)}

conn = sqlite3.connect(os.path.join(PROJROOT, 'vocabulary', 'vocabulary.db'))
conn.row_factory = dict_factory
cur = conn.cursor()


def process_lexicon():   
    text_columns = ['reference', 'term', 'url', 'linglevels']
    parsed_rows = []
    parsed_rows.append({'lemma': None,
                        'lemmacode': None,
                        'term': '[Custom]',
                        'linglevels': ["All", "General", "Morphology", "Phonetics", "Phonology", "Semantics", "Syntax"]
                        })
    with open(os.path.join(PROJROOT, 'vocabulary', 'lexicon.tsv'), 'r') as f:
        reader = csv.DictReader(f, fieldnames=text_columns, delimiter='\t')
        for row in reader:
            parsed = urlparse(row['url'])
            query_params = parse_qs(parsed.query)
            lemma = query_params.get('lemma')[0]
            lemmacode = query_params.get('lemmacode', [None])[0]
            term = row['term'] if not row['reference'] else row['reference'].removesuffix(': see')
            linglevels = [f.capitalize() for f in row['linglevels'].split('/')]
            parsed_row = {'lemma': lemma, 'lemmacode': lemmacode, 'term': term, 'linglevels': linglevels}
            parsed_rows.append(parsed_row)
    
    return parsed_rows


def to_sqlite(rows):
    cur.execute('DROP TABLE IF EXISTS lexicon;')
    cur.execute('CREATE TABLE lexicon (lemma TEXT, lemmacode TEXT, term TEXT, linglevels JSON);')
    for row in rows:
        row['linglevels'] = json.dumps(row['linglevels'])
    cur.executemany('INSERT INTO lexicon (lemma, lemmacode, term, linglevels) VALUES (:lemma, :lemmacode, :term, :linglevels);', rows)
    conn.commit()
    conn.close()
    print("Wrote vocabulary.db")


def to_json(rows):
    with open(os.path.join(PROJROOT, 'vocabulary', 'vocabulary.json'), 'w') as outfile:
        json.dump(rows, outfile, indent=2)
    print("Wrote vocabulary.json")

rows = process_lexicon()
to_json(rows)
# to_sqlite(rows)
