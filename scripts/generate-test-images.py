#!/usr/bin/env python3
"""
Generate placeholder test images for membership application testing.
Creates ID document and photo placeholders for all 11 test data combos.
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Test data fixtures - one person per combo + spouses/children
TEST_PEOPLE = [
    # Full-Individual
    {'name': 'James Morrison', 'category': 'Full', 'type': 'Individual', 'doc_type': 'passport'},

    # Full-Family
    {'name': 'William Peterson', 'category': 'Full', 'type': 'Family', 'doc_type': 'passport'},
    {'name': 'Sarah Peterson', 'category': 'Full', 'type': 'Family', 'doc_type': 'passport'},
    {'name': 'Emma Peterson', 'category': 'Full', 'type': 'Family', 'doc_type': 'passport'},

    # Associate-Individual
    {'name': 'David Chen', 'category': 'Associate', 'type': 'Individual', 'doc_type': 'passport'},

    # Associate-Family
    {'name': 'Michael Thompson', 'category': 'Associate', 'type': 'Family', 'doc_type': 'passport'},
    {'name': 'Rebecca Thompson', 'category': 'Associate', 'type': 'Family', 'doc_type': 'passport'},

    # Affiliate-Individual
    {'name': 'Boitumelo Lekgotho', 'category': 'Affiliate', 'type': 'Individual', 'doc_type': 'omang'},

    # Affiliate-Family
    {'name': 'Kgosiemang Sekhosana', 'category': 'Affiliate', 'type': 'Family', 'doc_type': 'omang'},
    {'name': 'Naledi Sekhosana', 'category': 'Affiliate', 'type': 'Family', 'doc_type': 'omang'},

    # Diplomatic-Individual
    {'name': 'Jean-Pierre Dupont', 'category': 'Diplomatic', 'type': 'Individual', 'doc_type': 'passport'},

    # Diplomatic-Family
    {'name': 'Carlos Rodriguez', 'category': 'Diplomatic', 'type': 'Family', 'doc_type': 'passport'},
    {'name': 'Isabel Rodriguez', 'category': 'Diplomatic', 'type': 'Family', 'doc_type': 'passport'},

    # Temporary-Individual
    {'name': 'Patricia Anderson', 'category': 'Temporary', 'type': 'Individual', 'doc_type': 'passport'},

    # Community-Individual
    {'name': 'George Makgawe', 'category': 'Community', 'type': 'Individual', 'doc_type': 'omang'},

    # Community-Family
    {'name': 'Nelson Kabelo', 'category': 'Community', 'type': 'Family', 'doc_type': 'omang'},
    {'name': 'Ayanda Kabelo', 'category': 'Community', 'type': 'Family', 'doc_type': 'omang'},
]

def create_placeholder_image(width=600, height=400, text='', bg_color=(240, 240, 240)):
    """Create a simple placeholder image."""
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Draw border
    border_color = (100, 100, 100)
    draw.rectangle([(5, 5), (width-5, height-5)], outline=border_color, width=2)

    # Add text in center
    if text:
        text_y = height // 2 - 20
        try:
            # Try to use a default font
            draw.text((width//2, text_y), text, fill=(80, 80, 80), anchor='mm')
        except:
            # Fallback if font fails
            draw.text((width//2, text_y), text, fill=(80, 80, 80))

    return img

def create_id_document(name, doc_type='passport'):
    """Create ID document placeholder (landscape, like a real ID)."""
    # ID document size: 203x127mm at 96 DPI = ~768x480px (or similar ratio)
    width, height = 720, 450
    img = Image.new('RGB', (width, height), (230, 220, 200))
    draw = ImageDraw.Draw(img)

    # Draw border
    draw.rectangle([(10, 10), (width-10, height-10)], outline=(40, 40, 40), width=3)

    # Document title
    doc_label = f"{doc_type.upper()} - TEST DOCUMENT"
    draw.text((width//2, 50), doc_label, fill=(0, 0, 0), anchor='mm')

    # Name
    draw.text((width//2, height//2 - 30), f"Name: {name}", fill=(0, 0, 0), anchor='mm')

    # Placeholder for photo (left side)
    photo_y = height // 2 + 20
    draw.rectangle([(40, photo_y - 60), (180, photo_y + 60)], outline=(100, 100, 100), width=2)
    draw.text((110, photo_y), "PHOTO", fill=(150, 150, 150), anchor='mm')

    # Document info (right side)
    info_x = 280
    draw.text((info_x, photo_y - 40), "Document #: TEST-2026-001", fill=(60, 60, 60), anchor='lm')
    draw.text((info_x, photo_y), "Issue Date: 01 JAN 2024", fill=(60, 60, 60), anchor='lm')
    draw.text((info_x, photo_y + 40), "Expiry Date: 31 DEC 2034", fill=(60, 60, 60), anchor='lm')

    return img

def create_photo(name):
    """Create portrait photo placeholder (600x600, portrait orientation)."""
    width, height = 600, 600
    img = Image.new('RGB', (width, height), (200, 200, 200))
    draw = ImageDraw.Draw(img)

    # Draw face placeholder
    face_radius = 120
    face_x, face_y = width // 2, height // 2 - 50
    draw.ellipse(
        [(face_x - face_radius, face_y - face_radius),
         (face_x + face_radius, face_y + face_radius)],
        fill=(220, 180, 150),
        outline=(100, 100, 100),
        width=2
    )

    # Eyes
    eye_y = face_y - 40
    draw.ellipse([(face_x - 50, eye_y - 20), (face_x - 20, eye_y + 20)], fill=(50, 50, 50))
    draw.ellipse([(face_x + 20, eye_y - 20), (face_x + 50, eye_y + 20)], fill=(50, 50, 50))

    # Smile/mouth
    draw.arc([(face_x - 50, face_y), (face_x + 50, face_y + 60)], 0, 180, fill=(100, 100, 100), width=3)

    # Name below
    draw.text((width // 2, height - 80), name, fill=(0, 0, 0), anchor='mm')
    draw.text((width // 2, height - 30), "TEST PHOTO", fill=(100, 100, 100), anchor='mm')

    return img

def main():
    """Generate all test images."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    id_dir = os.path.join(base_dir, 'test-data', 'id-documents')
    photo_dir = os.path.join(base_dir, 'test-data', 'photos')

    os.makedirs(id_dir, exist_ok=True)
    os.makedirs(photo_dir, exist_ok=True)

    print(f"Generating test images in {base_dir}/test-data/")
    print()

    for person in TEST_PEOPLE:
        name = person['name']
        category = person['category']
        household = person['type']
        doc_type = person['doc_type']

        # Sanitize filename
        filename_base = f"{name.replace(' ', '_')}"

        # Generate ID document
        id_img = create_id_document(name, doc_type)
        id_path = os.path.join(id_dir, f"{filename_base}_{doc_type}.png")
        id_img.save(id_path, 'PNG')
        print(f"✓ Created: {os.path.relpath(id_path, base_dir)}")

        # Generate portrait photo
        photo_img = create_photo(name)
        photo_path = os.path.join(photo_dir, f"{filename_base}_photo.png")
        photo_img.save(photo_path, 'PNG')
        print(f"✓ Created: {os.path.relpath(photo_path, base_dir)}")

    print()
    print(f"✓ Generated {len(TEST_PEOPLE) * 2} test images successfully!")
    print()
    print("Test data ready for membership application testing.")
    print("- ID documents: test-data/id-documents/")
    print("- Photos: test-data/photos/")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("ERROR: Pillow (PIL) not installed.")
        print("Install with: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
