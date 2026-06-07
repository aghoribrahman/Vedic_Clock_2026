import os
from PIL import Image, ImageDraw

# Create an empty image for the colon
canvas_w, canvas_h = 400, 1536
img = Image.new("RGBA", (canvas_w, canvas_h), (0,0,0,0))

# Load a golden image to steal texture from
texture = Image.open("assets/numbers/1.png").convert("RGBA")

# Create a mask for two circles
mask = Image.new("L", (canvas_w, canvas_h), 0)
draw = ImageDraw.Draw(mask)
r = 110
cx = canvas_w // 2
# Position the two dots
cy1 = int(canvas_h * 0.35)
cy2 = int(canvas_h * 0.65)
draw.ellipse((cx - r, cy1 - r, cx + r, cy1 + r), fill=255)
draw.ellipse((cx - r, cy2 - r, cx + r, cy2 + r), fill=255)

# Steal texture from the center of 1.png
# We will just copy a patch of texture and paste it using the mask
texture_cropped = texture.crop((
    texture.width//2 - canvas_w//2, 
    0, 
    texture.width//2 + canvas_w//2, 
    canvas_h
))

img.paste(texture_cropped, (0, 0), mask)
img.save("assets/numbers/colon.png")

