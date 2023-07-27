#!/usr/bin/python3
'''
This module takes the LIDIA lexicon (an Excel file) and converts it into
a JSON file, which will be read by the LIDIA Zotero extension
'''

import openpyxl
import json
from pathlib import Path

PROJROOT = Path(__file__).parents[1].resolve()


def get_rowdicts(worksheet: openpyxl.worksheet.worksheet.Worksheet):
    '''Use the first row for headers and return a list of dicts for every
    following row'''
    headers = []
    rowdicts = []
    for i, row in enumerate(worksheet.values):
        if i == 0:
            headers = row
        else:
            rowdict = {
                header: row[headerindex]
                for headerindex, header
                in enumerate(headers)
            }
            rowdicts.append(rowdict)
    return rowdicts


class LexiconProcessorException(Exception):
    pass


class LexiconProcesser():
    def process_lexicon(self, filepath: Path):
        '''Process LIDIA lexicon Excel file'''
        wb = openpyxl.load_workbook(filename=str(filepath))
        # First read the categories
        category_ws = wb['categories']
        category_rowdicts = get_rowdicts(category_ws)
        self.categories = {
            row['slug']: row['display'] for row in category_rowdicts
        }
        # Now create a dictionary with the slugs of the items without
        # parents as keys and lists of itself and its child items as values
        entry_ws = wb['entries']
        entry_rowdicts = get_rowdicts(entry_ws)
        # Check if there are no entries that share the same slug
        slugs = [x['slug'] for x in entry_rowdicts]
        slugs.sort()
        previous_slug = None
        for slug in slugs:
            if slug == previous_slug:
                raise LexiconProcessorException(
                    'Multiple entries found with slug "{}".'.format(slug)
                )
            previous_slug = slug
        # First add all items without parents
        entries_hierarchical: dict[str, list[dict]] = {
            x['slug']: [x] for x in entry_rowdicts if not x['parent']
        }
        entries_with_parent = [
            x for x in entry_rowdicts if x['parent']
        ]
        for entry in entries_with_parent:
            try:
                entries_hierarchical[entry['parent']].append(entry)
            except KeyError:
                print(
                    "Parent '{}' for '{}' not found. Skipping."
                    .format(entry['parent'], entry['slug'])
                )
        # Now compile the full sorted list
        self.entries = []
        for headslug in entries_hierarchical:
            entries_for_head = entries_hierarchical[headslug]
            # Add indentation to all subentries and apply selectable default
            # value (i.e. True)
            for entry in entries_for_head:
                if entry['parent']:
                    entry['display'] = '- ' + entry['display']
                if entry['selectable'] is None or entry['selectable'] == '':
                    entry['selectable'] = True
                if entry['selectable'] == '=FALSE()':
                    # For some reason we sometimes find FALSE as =FALSE()...
                    entry['selectable'] = False
            # Sort alphabetically
            # (this will cause the head entry to be put at the end, because
            # the other entries are preceded by a dash)
            entries_for_head.sort(key=lambda x: x['display'])
            # Move the head entry back to front
            head_entry = entries_for_head.pop(len(entries_for_head) - 1)
            entries_for_head.insert(0, head_entry)
            self.entries.extend(entries_for_head)
        self.success = True

    def write_json(self, filepath: Path):
        '''Write data to one JSON file with category dict and entry list'''
        data = {
            'categories': self.categories,
            'entries': self.entries
        }
        filepath.parent.mkdir(exist_ok=True, parents=True)
        with filepath.open('w') as f:
            json.dump(data, f, indent=2)


if __name__ == '__main__':
    processer = LexiconProcesser()
    try:
        processer.process_lexicon(PROJROOT / 'vocabulary' / 'lexicon.xlsx')
        processer.write_json(PROJROOT / 'content' / 'lexicon.json')
    except LexiconProcessorException as err:
        print('Could not finish processing because of error: {}'.format(err))
