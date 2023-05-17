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
    cur.execute('DROP TABLE IF EXISTS lexicon;')
    cur.execute('CREATE TABLE lexicon (lemma TEXT, lemmacode TEXT, term TEXT, subfields JSON);')
    text_columns = ['reference', 'term', 'url', 'subfields']
    with open(os.path.join(PROJROOT, 'vocabulary', 'lexicon.tsv'), 'r') as f:
        reader = csv.DictReader(f, fieldnames=text_columns, delimiter='\t')
        cur.execute("""
            INSERT INTO lexicon (lemma, lemmacode, term, subfields)
            VALUES (?, ?, ?, ?)
            ;""",
            (None, None, '[Custom]', '["General", "Morphology", "Phonetics", "Phonology", "Semantics", "Syntax"]')
            )
        for row in reader:
            parsed = urlparse(row['url'])
            query_params = parse_qs(parsed.query)
            lemma = query_params.get('lemma')[0]
            lemmacode = query_params.get('lemmacode', [None])[0]
            term = row['term'] if not row['reference'] else row['reference'].removesuffix(': see')
            subfields = [f.capitalize() for f in row['subfields'].split('/')]
            cur.execute('INSERT INTO lexicon (lemma, lemmacode, term, subfields) VALUES (?, ?, ?, ?);',
                         (lemma, lemmacode, term, json.dumps(subfields)))
        conn.commit()


def vocabulary_tojson():
    # A unique id is needed to use JSX directly inside .map().
    res = cur.execute("""
        SELECT ROW_NUMBER() OVER (ORDER BY lower(term) ASC) AS "key",
         linglevel.value AS subfield, lemma, lemmacode, term
        FROM lexicon, json_each(subfields) AS linglevel
        ORDER BY lower(term) ASC;
        """)
    terms = res.fetchall()
    with open(os.path.join(PROJROOT, 'vocabulary', 'vocabulary.json'), 'w') as outfile:
        json.dump(terms, outfile, indent=2)


process_lexicon()
vocabulary_tojson()
