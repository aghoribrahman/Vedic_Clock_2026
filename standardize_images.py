import os
from PIL import Image

def process_images():
    source_dir = 'assets/numbers'
    # We will process 0-9 and colon
    files = [f"{i}.png" for i in range(10)] + ['colon.png']
    
    target_canvas = (1024, 1536)
    
    # Target text size for digits
    target_digit_w = 880
    target_digit_h = 1380
    
    # Target text size for colon (keep it narrow)
    target_colon_w = 300
    target_colon_h = 1380

    for filename in files:
        filepath = os.path.join(source_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename}, not found.")
            continue
            
        img = Image.open(filepath).convert("RGBA")
        bbox = img.getbbox()
        
        if not bbox:
            print(f"{filename} is empty.")
            continue
            
        # Crop to the actual text content
        cropped = img.crop(bbox)
        
        # Decide target size based on if it's a digit or colon
        if filename == 'colon.png':
            tw, th = target_colon_w, target_colon_h
        else:
            tw, th = target_digit_w, target_digit_h
            
        # Resize text perfectly to the exact same size
        # Using LANCZOS for high quality down/upscaling
        resized = cropped.resize((tw, th), Image.Resampling.LANCZOS)
        
        # Create a new transparent canvas
        new_img = Image.new("RGBA", target_canvas, (0, 0, 0, 0))
        
        # Calculate position to center the resized text on the canvas
        paste_x = (target_canvas[0] - tw) // 2
        paste_y = (target_canvas[1] - th) // 2
        
        # Paste the text
        new_img.paste(resized, (paste_x, paste_y), resized)
        
        # Save back, overwriting the original
        new_img.save(filepath)
        print(f"Processed {filename}: canvas={target_canvas}, text_size=({tw}, {th})")

if __name__ == "__main__":
    process_images()
