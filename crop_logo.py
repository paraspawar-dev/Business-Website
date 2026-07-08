from PIL import Image

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = Image.default_action(im, bg)
    # diff = ImageChops.difference(im, bg)
    import ImageChops
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

try:
    from PIL import Image, ImageChops
    
    # 1. Trim the original logo
    img = Image.open('assets/logo.png').convert("RGBA")
    
    # Auto-crop white space
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    if bbox:
        img_cropped = img.crop(bbox)
        img_cropped.save('assets/logo.png')
        print("Cropped logo.png successfully.")
    else:
        img_cropped = img
        print("No cropping needed.")
        
    # 2. Make white background transparent for footer
    datas = img_cropped.getdata()
    newData = []
    # If pixel is close to white, make it transparent
    for item in datas:
        # Check if white-ish
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    
    img_transparent = Image.new("RGBA", img_cropped.size)
    img_transparent.putdata(newData)
    img_transparent.save('assets/logo-transparent.png', "PNG")
    print("Created logo-transparent.png successfully.")

except Exception as e:
    print(f"Error: {e}")
