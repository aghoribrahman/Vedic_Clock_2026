import os
from PIL import Image

def adjust_images():
    source_dir = 'assets/numbers'
    
    # Scale multipliers based on visual inspection
    scales = {
        '0': 1.0,
        '1': 1.15,
        '2': 1.05,
        '3': 1.05,
        '4': 1.12,
        '5': 1.08,
        '6': 1.0,
        '7': 1.12,
        '8': 1.08,
        '9': 1.0,
        'colon': 1.0
    }
    
    target_canvas = (1024, 1536)
    
    for digit, scale in scales.items():
        if scale == 1.0:
            print(f"Skipping {digit}.png (no change needed)")
            continue
            
        filename = f"{digit}.png"
        filepath = os.path.join(source_dir, filename)
        if not os.path.exists(filepath):
            continue
            
        # Open the currently processed image
        img = Image.open(filepath).convert("RGBA")
        
        # Get its bounding box (it's currently centered with some empty space)
        bbox = img.getbbox()
        if not bbox:
            continue
            
        # Crop to the actual text content (currently 880x1380 for digits)
        cropped = img.crop(bbox)
        
        # Calculate new dimensions based on the scale multiplier
        # Since we're just applying a visual fix, we multiply its current bbox size
        curr_w = bbox[2] - bbox[0]
        curr_h = bbox[3] - bbox[1]
        
        new_w = int(curr_w * scale)
        new_h = int(curr_h * scale)
        
        print(f"Scaling {filename} by {scale}x: ({curr_w},{curr_h}) -> ({new_w},{new_h})")
        
        # Resize with high quality
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Create a new transparent canvas
        new_img = Image.new("RGBA", target_canvas, (0, 0, 0, 0))
        
        # Paste centered
        # It's okay if new_h > 1536, PIL will crop it (we assume the invisible pixels will be cropped)
        paste_x = (target_canvas[0] - new_w) // 2
        paste_y = (target_canvas[1] - new_h) // 2
        
        new_img.paste(resized, (paste_x, paste_y), resized)
        
        # Save back
        new_img.save(filepath)

if __name__ == "__main__":
    adjust_images()
