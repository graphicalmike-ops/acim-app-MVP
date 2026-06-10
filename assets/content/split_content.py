#!/usr/bin/env python3
"""Split acim-content.json into separate files per chapter/section."""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(BASE, 'acim-content.json')

with open(src, encoding='utf-8') as f:
    data = json.load(f)

# ── 1. Index ────────────────────────────────────────────────────────────────
with open(os.path.join(BASE, 'acim-index.json'), 'w', encoding='utf-8') as f:
    json.dump(data['index'], f, ensure_ascii=False, indent=2)
print("wrote acim-index.json")

# ── 2. Content array ─────────────────────────────────────────────────────────
content = [b for b in data['content'] if not b.get('_comment')]

# Partition into books at each book-heading
books: list[list] = []
current: list = []
for block in content:
    if block.get('type') == 'book-heading':
        if current:
            books.append(current)
        current = [block]
    else:
        current.append(block)
if current:
    books.append(current)

def write_json(path, blocks):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(blocks, f, ensure_ascii=False, indent=2)

theory_dir = os.path.join(BASE, 'theory')

for book_blocks in books:
    book_anchor = book_blocks[0].get('anchor', '')

    # ── Theory: split per chapter ──────────────────────────────────────────
    if book_anchor == 'theory':
        # First group = book-heading + prefacio chapter + intro section
        # Subsequent groups = each theory-chN chapter heading + its content
        groups: list[tuple[str, list]] = []
        current_key = 'theory-prefacio'
        current_group: list = []
        for block in book_blocks:
            anchor = block.get('anchor', '') or ''
            btype  = block.get('type', '')
            # A new chapter-heading whose anchor starts with "theory-ch" starts a new group
            if btype == 'chapter-heading' and anchor.startswith('theory-ch') and len(anchor) <= len('theory-ch99'):
                if current_group:
                    groups.append((current_key, current_group))
                current_key = anchor  # e.g. "theory-ch1"
                current_group = [block]
            else:
                current_group.append(block)
        if current_group:
            groups.append((current_key, current_group))

        for key, blocks in groups:
            path = os.path.join(theory_dir, f'{key}.json')
            write_json(path, blocks)
            print(f"wrote theory/{key}.json  ({len(blocks)} blocks)")

    # ── Workbook ──────────────────────────────────────────────────────────
    elif book_anchor == 'workbook':
        write_json(os.path.join(BASE, 'workbook.json'), book_blocks)
        print(f"wrote workbook.json  ({len(book_blocks)} blocks)")

    # ── mft + supplement → supplements.json (keep as separate entries) ────
    elif book_anchor in ('mft', 'supplement'):
        path = os.path.join(BASE, 'supplements.json')
        # Append to existing file if mft came first
        if os.path.exists(path):
            with open(path, encoding='utf-8') as f:
                existing = json.load(f)
            combined = existing + book_blocks
            write_json(path, combined)
            print(f"appended to supplements.json  (now {len(combined)} blocks)")
        else:
            write_json(path, book_blocks)
            print(f"wrote supplements.json  ({len(book_blocks)} blocks)")

print("Done.")
