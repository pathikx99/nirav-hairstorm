import numpy as np
from PIL import Image
import scipy.ndimage as ndimage

model_img = Image.open('frontend/public/avatar/avatar_front_model.jpg')
model_arr = np.array(model_img, dtype=np.float32) / 255.0
h, w, _ = model_arr.shape

# Color math
def srgb_to_lin(srgb):
    return np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)

def lin_to_oklab(lin):
    r, g, b = lin[:,:,0], lin[:,:,1], lin[:,:,2]
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_ = np.cbrt(np.maximum(1e-8, l))
    m_ = np.cbrt(np.maximum(1e-8, m))
    s_ = np.cbrt(np.maximum(1e-8, s))
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, a, b_

lin_model = srgb_to_lin(model_arr)
origL, origA, origB = lin_to_oklab(lin_model)
chroma = np.sqrt(origA**2 + origB**2)
y_coords, x_coords = np.mgrid[:h, :w]

# 1. ANATOMICAL EYEBALL APERTURE
d_left = ((x_coords - 397.0) / 21.0)**2 + ((y_coords - 350.0) / 8.0)**2
d_right = ((x_coords - 510.0) / 21.0)**2 + ((y_coords - 349.0) / 8.0)**2
in_eyeball_opening = (d_left <= 1.0) | (d_right <= 1.0)
is_sclera = in_eyeball_opening & (origL >= 0.48) & (chroma < 0.038)
is_iris = in_eyeball_opening & ~is_sclera

# 2. MASTER FEATURES PROTECT MASK
# Load previous protect to retain exact lip boundary
old_protect = np.array(Image.open('frontend/public/avatar/hair_front_features_protect.png'))
protect_master = np.zeros((h, w), dtype=np.uint8)

# Strictly copy the lips (y in 425..495, x in 400..505)
is_lip_zone = (y_coords >= 425) & (y_coords <= 495) & (x_coords >= 400) & (x_coords <= 505)
protect_master[is_lip_zone] = old_protect[is_lip_zone]
# Smooth lip edge slightly to prevent any single-pixel aliasing
lip_f = ndimage.gaussian_filter(protect_master.astype(np.float32), sigma=0.5)
protect_master = np.clip(lip_f, 0, 255).astype(np.uint8)

# 3. MASTER SKIN MASK
# Anatomical envelope:
# Hairline top: y >= 210
# Neck base: y <= 594 (until black collar)
# Left cheek: x >= 340 (curves from 360 at temple to 365 at cheek to 388 at jaw)
# Right cheek: x <= 560 (curves from 540 at temple to 535 at cheek to 512 at jaw)
# Condition for skin: warm undertone (origA > 0.015, origB > 0.010, origL > 0.16)
is_skin_dermis = (origA > 0.012) & (origB > 0.008) & (origL > 0.16)
in_bounds = (y_coords >= 205) & (y_coords <= 594) & (x_coords >= 335) & (x_coords <= 565)

raw_skin = np.where(in_bounds & is_skin_dermis, 1.0, 0.0)

# Collar junction feather (y in [580..594], x in [350..540])
is_collar = (y_coords >= 580) & (y_coords <= 595) & (x_coords >= 350) & (x_coords <= 540)
raw_skin[is_collar] *= np.clip((origL[is_collar] - 0.16) / 0.12, 0.0, 1.0)

# Exclude eyeball sclera and iris from skin mask (eyelids and tear ducts STAY IN SKIN MASK!)
raw_skin[is_sclera | is_iris] = 0.0

# Smooth the skin mask slightly to create seamless organic boundaries
skin_smooth = ndimage.gaussian_filter(raw_skin.astype(np.float32), sigma=1.0)
skin_master = (np.clip(skin_smooth, 0.0, 1.0) * 255.0).astype(np.uint8)

# Save to public/avatar and public/models
Image.fromarray(protect_master).save('frontend/public/avatar/hair_front_features_protect.png')
Image.fromarray(skin_master).save('frontend/public/avatar/hair_front_skin.png')
Image.fromarray(skin_master).save('frontend/public/models/hair_front_skin.png')

print('Master masks generated successfully:')
print('Features protect non-zero count:', np.count_nonzero(protect_master > 10))
print('Skin mask non-zero count:', np.count_nonzero(skin_master > 10))
print('Features protect eye region (340-370) count:', np.count_nonzero(protect_master[340:370, :] > 10))
