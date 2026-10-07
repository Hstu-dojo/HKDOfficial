#!/usr/bin/env python3
import os
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SOURCE_LOGO = "public/kaizen.png"

def generate_logo_png():
    print("Generating public/logo.png (1024x1024)...")
    im = Image.open(SOURCE_LOGO).convert("RGBA")
    logo_1024 = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    logo_1024.save("public/logo.png", "PNG", optimize=True)
    print("Saved public/logo.png")

def generate_favicons():
    print("Generating favicons...")
    im = Image.open(SOURCE_LOGO).convert("RGBA")
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    
    # Save to src/app/favicon.ico
    im.save("src/app/favicon.ico", format="ICO", sizes=sizes)
    print("Saved src/app/favicon.ico")
    
    # Save to docs/img/favicon.ico if dir exists
    if os.path.exists("docs/img"):
        im.save("docs/img/favicon.ico", format="ICO", sizes=sizes)
        print("Saved docs/img/favicon.ico")

def generate_app_images():
    print("Generating PWA AppImages...")
    source = Image.open(SOURCE_LOGO).convert("RGBA")
    count = 0
    
    for root, _, files in os.walk("public/AppImages"):
        for f in files:
            if not f.endswith(".png"):
                continue
            path = os.path.join(root, f)
            with Image.open(path) as current_img:
                target_w, target_h = current_img.size
            
            if target_w == target_h:
                # Square icon
                resized = source.resize((target_w, target_h), Image.Resampling.LANCZOS)
                resized.save(path, "PNG", optimize=True)
            else:
                # Non-square icon (e.g. Wide or SplashScreen)
                bg = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
                # Fit emblem inside height with 80% padding
                emblem_size = int(target_h * 0.85)
                emblem = source.resize((emblem_size, emblem_size), Image.Resampling.LANCZOS)
                x_offset = (target_w - emblem_size) // 2
                y_offset = (target_h - emblem_size) // 2
                bg.paste(emblem, (x_offset, y_offset), emblem)
                bg.save(path, "PNG", optimize=True)
            count += 1
            
    print(f"Updated {count} icons in public/AppImages/")

def generate_og_images():
    print("Generating OpenGraph social preview images...")
    width, height = 1200, 630
    card = Image.new("RGBA", (width, height), (11, 15, 25, 255)) # Dark navy/slate #0B0F19
    
    # Add subtle radial glows in the background
    # Purple glow on top-left (#5e17eb with low alpha)
    glow_purple = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_gp = ImageDraw.Draw(glow_purple)
    draw_gp.ellipse([80, 40, 560, 520], fill=(94, 23, 235, 75))
    glow_purple = glow_purple.filter(ImageFilter.GaussianBlur(100))
    card = Image.alpha_composite(card, glow_purple)

    # Teal glow on right (#0097b2 with low alpha)
    glow_teal = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_gt = ImageDraw.Draw(glow_teal)
    draw_gt.ellipse([700, 150, 1150, 580], fill=(0, 151, 178, 55))
    glow_teal = glow_teal.filter(ImageFilter.GaussianBlur(90))
    card = Image.alpha_composite(card, glow_teal)

    # Draw border highlight
    draw = ImageDraw.Draw(card)
    draw.rectangle([0, 0, width-1, height-1], outline=(255, 255, 255, 20), width=1)
    
    # Place new Kaizen emblem on left
    source = Image.open(SOURCE_LOGO).convert("RGBA")
    logo_size = 460
    logo_resized = source.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    card.paste(logo_resized, (70, (height - logo_size) // 2), logo_resized)
    
    # Render typography on the right side using OpenSans
    font_bold = ImageFont.truetype("/usr/share/fonts/OpenSans/OpenSans-ExtraBold.ttf", 64)
    font_sub = ImageFont.truetype("/usr/share/fonts/OpenSans/OpenSans-SemiBold.ttf", 22)
    font_badge = ImageFont.truetype("/usr/share/fonts/OpenSans/OpenSans-Bold.ttf", 16)
    
    # Badge: "ESTD 2023 · TRADITIONAL SHITORYU KARATE"
    tx = 570
    draw.rounded_rectangle([tx, 145, tx + 420, 185], radius=20, fill=(94, 23, 235, 90), outline=(0, 151, 178, 200))
    draw.text((tx + 22, 154), "TRADITIONAL SHITORYU KARATE · ESTD 2023", font=font_badge, fill=(255, 255, 255, 240))
    
    # Title: KAIZEN KARATE ACADEMY
    draw.text((tx, 215), "KAIZEN", font=font_bold, fill=(255, 255, 255, 255))
    draw.text((tx, 290), "KARATE ACADEMY", font=font_bold, fill=(0, 151, 178, 255))
    
    # Subtitle / Tagline
    draw.text((tx, 385), "Mind & Body Excellence Through Disciplined Training", font=font_sub, fill=(226, 232, 240, 240))
    draw.text((tx, 425), "Courses · Workshops · Belt Tests · Championships", font=font_sub, fill=(148, 163, 184, 220))

    # Save PNG and JPG
    card.save("public/og-image.png", "PNG", optimize=True)
    card_rgb = card.convert("RGB")
    card_rgb.save("public/og-image.jpg", "JPEG", quality=95)
    print("Saved public/og-image.png and public/og-image.jpg")

def generate_svg_logos():
    print("Generating vector SVG logos...")
    # Downscale source emblem to 256x256 for crisp inclusion in SVG
    im = Image.open(SOURCE_LOGO).convert("RGBA")
    emblem = im.resize((256, 256), Image.Resampling.LANCZOS)
    buf = BytesIO()
    emblem.save(buf, format="PNG", optimize=True)
    b64_emblem = base64.b64encode(buf.getvalue()).decode("utf-8")
    
    # 1. Horizontal lockup for Light Mode (public/logo.svg)
    # ViewBox: 0 0 160 40, width: 160, height: 40
    # Left: Emblem circle (width: 38, height: 38, x: 1, y: 1)
    # Right: "KAIZEN" (#5E17EB) and "KARATE ACADEMY" (#0097B2)
    svg_light = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 160 40" width="160" height="40">
  <!-- Kaizen Circular Emblem -->
  <image href="data:image/png;base64,{b64_emblem}" x="1" y="1" width="38" height="38" preserveAspectRatio="xMidYMid meet" />
  
  <!-- Typography Lockup -->
  <text x="45" y="21" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" letter-spacing="1.5" fill="#5e17eb">KAIZEN</text>
  <text x="46" y="33" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="700" letter-spacing="1.8" fill="#0097b2">KARATE ACADEMY</text>
</svg>'''

    # 2. Horizontal lockup for Dark Mode (public/logo_dark.svg)
    svg_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 160 40" width="160" height="40">
  <!-- Kaizen Circular Emblem -->
  <image href="data:image/png;base64,{b64_emblem}" x="1" y="1" width="38" height="38" preserveAspectRatio="xMidYMid meet" />
  
  <!-- Typography Lockup -->
  <text x="45" y="21" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" letter-spacing="1.5" fill="#ffffff">KAIZEN</text>
  <text x="46" y="33" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="700" letter-spacing="1.8" fill="#38bdf8">KARATE ACADEMY</text>
</svg>'''

    # 3. Square badge SVG (public/logo-badge.svg)
    svg_badge = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="256" height="256">
  <image href="data:image/png;base64,{b64_emblem}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid meet" />
</svg>'''

    with open("public/logo.svg", "w") as f:
        f.write(svg_light)
    with open("public/logo_dark.svg", "w") as f:
        f.write(svg_dark)
    with open("public/logo-badge.svg", "w") as f:
        f.write(svg_badge)
    print("Saved public/logo.svg, public/logo_dark.svg, public/logo-badge.svg")

if __name__ == "__main__":
    generate_logo_png()
    generate_favicons()
    generate_app_images()
    generate_og_images()
    generate_svg_logos()
    print("All Kaizen branding assets generated successfully!")
