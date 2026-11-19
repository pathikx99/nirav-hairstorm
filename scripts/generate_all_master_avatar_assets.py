#!/usr/bin/env python3
"""
generate_all_master_avatar_assets.py
Master pipeline for generating 100% anatomically and optically accurate Nirav Hairstorm avatar assets.
Uses the new studio model photography:
- Front view: media_1794972994120_4a0ab06e.jpg
- Back view: media_1794972999650_61e2bdbf.jpg
"""

import os
import shutil
import cv2
import numpy as np
from PIL import Image
import scipy.ndimage as ndimage

BASE_DIR = "frontend/public/avatar"
os.makedirs(BASE_DIR, exist_ok=True)

# 1. Image Preprocessing & Rescaling to exact (896, 1200)
def process_and_save_model(src_path, dst_path, target_w=896, target_h=1200):
    im = Image.open(src_path)
    w, h = im.size
    target_ratio = target_w / target_h
    current_ratio = w / h
    
    if current_ratio > target_ratio:
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        im_cropped = im.crop((left, 0, left + new_w, h))
    else:
        new_h = int(round(w / target_ratio))
        top = (h - new_h) // 2
        im_cropped = im.crop((0, top, w, top + new_h))
    
    im_resized = im_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    im_resized.save(dst_path, quality=98)
    return np.array(im_resized)

front_src = "/home/lord-kratos/.gemini/antigravity/brain/37676d02-e6f7-4cac-801a-b8cfd83fd6aa/.user_uploaded/media_1794972994120_4a0ab06e.jpg"
back_src = "/home/lord-kratos/.gemini/antigravity/brain/37676d02-e6f7-4cac-801a-b8cfd83fd6aa/.user_uploaded/media_1794972999650_61e2bdbf.jpg"

front_model_path = os.path.join(BASE_DIR, "avatar_front_model.jpg")
back_model_path = os.path.join(BASE_DIR, "avatar_back_model.jpg")

front_rgb = process_and_save_model(front_src, front_model_path)
back_rgb = process_and_save_model(back_src, back_model_path)

h, w, _ = front_rgb.shape
y_coords, x_coords = np.mgrid[:h, :w].astype(np.float32)
print(f"Loaded master photos: {w}x{h}")

# Front BGR for OpenCV
front_bgr = cv2.cvtColor(front_rgb, cv2.COLOR_RGB2BGR)
back_bgr = cv2.cvtColor(back_rgb, cv2.COLOR_RGB2BGR)
gray_front = cv2.cvtColor(front_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
gray_back = cv2.cvtColor(back_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)

front_f = front_rgb.astype(np.float32) / 255.0
back_f = back_rgb.astype(np.float32) / 255.0

# 2. Eyeball Aperture & Eye Masks
dl = ((x_coords - 399.0) / 22.0)**2 + ((y_coords - 347.0) / 9.0)**2
dr = ((x_coords - 508.0) / 22.0)**2 + ((y_coords - 346.0) / 9.0)**2
in_eyeball_opening = (dl <= 1.0) | (dr <= 1.0)

# 3. Precision Features Protection (Lips)
# Vermilion border & lip core: y in [438..492], x in [410..490]
protect_master = np.zeros((h, w), dtype=np.uint8)
r_ch, g_ch, b_ch = front_f[:,:,0], front_f[:,:,1], front_f[:,:,2]
lip_metric = r_ch - (g_ch + b_ch) * 0.55
in_lip_box = (y_coords >= 438) & (y_coords <= 492) & (x_coords >= 408) & (x_coords <= 492)
lip_pixels = in_lip_box & (lip_metric > 0.07)
# Dilate slightly and smooth for anti-aliasing
lip_dilated = cv2.dilate(lip_pixels.astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
lip_smoothed = ndimage.gaussian_filter(lip_dilated.astype(np.float32), sigma=0.8)
protect_master = np.clip(lip_smoothed, 0, 255).astype(np.uint8)
Image.fromarray(protect_master).save(os.path.join(BASE_DIR, "hair_front_features_protect.png"))
print("Saved hair_front_features_protect.png")

# 4. Facial & Neck Dermal Mask (hair_front_skin.png)
# Strictly covers forehead, temples, cheeks, nose, chin, neck down to collar (y=597)
is_human_skin = (r_ch > 0.58) & (g_ch > 0.40) & (b_ch > 0.30) & (r_ch > g_ch) & (g_ch > b_ch) & ((r_ch - b_ch) > 0.09)
in_vertical_face = (y_coords >= 225) & (y_coords <= 597)
in_horiz_face = (x_coords >= 335) & (x_coords <= 565)
raw_skin = is_human_skin & in_vertical_face & in_horiz_face

# Exclude eyes from skin mask
raw_skin = raw_skin & ~in_eyeball_opening

# Smooth and fill gaps
skin_closed = cv2.morphologyEx(raw_skin.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
skin_smoothed = ndimage.gaussian_filter(skin_closed.astype(np.float32), sigma=1.0)
skin_master = (np.clip(skin_smoothed, 0.0, 1.0) * 255.0).astype(np.uint8)
Image.fromarray(skin_master).save(os.path.join(BASE_DIR, "hair_front_skin.png"))
print("Saved hair_front_skin.png")

# 5. Eyebrow Melanin Harmonization Mask (hair_front_eyebrows.png)
eyebrow_mask = np.zeros((h, w), dtype=np.uint8)
eb_left = (y_coords >= 285) & (y_coords <= 330) & (x_coords >= 350) & (x_coords <= 438) & \
          (front_rgb[:,:,0] < 155) & (front_rgb[:,:,1] < 120) & (front_rgb[:,:,2] < 105)
eb_right = (y_coords >= 285) & (y_coords <= 330) & (x_coords >= 462) & (x_coords <= 552) & \
           (front_rgb[:,:,0] < 155) & (front_rgb[:,:,1] < 120) & (front_rgb[:,:,2] < 105)
eyebrow_mask[eb_left | eb_right] = 255
eyebrow_mask = cv2.GaussianBlur(eyebrow_mask, (5, 5), 1.0)
Image.fromarray(eyebrow_mask).save(os.path.join(BASE_DIR, "hair_front_eyebrows.png"))
print("Saved hair_front_eyebrows.png")

# 6. Scalp Parting & Crown Dermal Map (hair_front_scalp.png)
dx_part = np.abs(x_coords - 448.0)
part_envelope = np.exp(-(dx_part**2) / (2.0 * 3.5**2)) * ((y_coords >= 135) & (y_coords <= 230)).astype(np.float32)
y_fade = np.clip((y_coords - 135.0) / 20.0, 0.0, 1.0) * np.clip((230.0 - y_coords) / 20.0, 0.0, 1.0)
scalp_map = np.clip(part_envelope * y_fade * 255.0, 0, 255).astype(np.uint8)
Image.fromarray(scalp_map).save(os.path.join(BASE_DIR, "hair_front_scalp.png"))
print("Saved hair_front_scalp.png")

# 7. Strand-Level Front Hair Alpha Matte (hair_front_alpha.png)
# Pure background and robe detection
is_bg_or_robe = (r_ch > 0.76) & (g_ch > 0.74) & (b_ch > 0.76) & (np.ptp(front_f, axis=2) < 0.055)
is_outer_bg = (y_coords < 580) & ((x_coords < 220) | (x_coords > 670)) & is_bg_or_robe
is_outer_robe = (y_coords >= 580) & ((x_coords < 145) | (x_coords > 745)) & is_bg_or_robe
is_center_robe = (y_coords >= 600) & (x_coords >= 405) & (x_coords <= 505) & is_bg_or_robe
is_bottom_robe = (y_coords >= 1060) & (x_coords >= 340) & (x_coords <= 560) & is_bg_or_robe
non_hair_f = is_outer_bg | is_outer_robe | is_center_robe | is_bottom_robe

bg_val_f = np.where(y_coords < 580, 220.0, 235.0)
alpha_front = np.clip((bg_val_f - gray_front) / 140.0, 0.0, 1.0)
alpha_front = np.power(alpha_front, 1.15)

# Enforce strict dermal immunity
alpha_front[skin_master > 5] = 0.0
alpha_front[protect_master > 5] = 0.0
alpha_front[non_hair_f] = 0.0

# Central hairline transition (y=220..235, x=380..520): gentle smooth transition
hairline_transition = (y_coords >= 220) & (y_coords <= 235) & (x_coords >= 380) & (x_coords <= 520)
alpha_front[hairline_transition] *= np.clip((235.0 - y_coords[hairline_transition]) / 15.0, 0.0, 1.0)

# Outside hair bounding envelope: zero
in_hair_front = (y_coords >= 95) & (y_coords <= 1070) & (x_coords >= 140) & (x_coords <= 750)
alpha_front[~in_hair_front] = 0.0

alpha_front_uint8 = (np.clip(alpha_front, 0.0, 1.0) * 255.0).astype(np.uint8)
Image.fromarray(alpha_front_uint8).save(os.path.join(BASE_DIR, "hair_front_alpha.png"))
print("Saved hair_front_alpha.png")

# 8. Follicular Emergence Map (hair_front_follicles.png)
follicle_map = np.zeros((h, w), dtype=np.uint8)
hairline_margin = (alpha_front_uint8 > 8) & (alpha_front_uint8 < 190) & (y_coords >= 220) & (y_coords <= 285) & (x_coords >= 340) & (x_coords <= 555)
np.random.seed(42)
follicular_noise = np.random.normal(0.0, 1.0, (h, w)).astype(np.float32)
follicular_smooth = ndimage.gaussian_filter(follicular_noise, sigma=[1.2, 1.2])
follicles = np.clip((follicular_smooth - 0.2) * 2.5, 0.0, 1.0)
follicle_mask_val = hairline_margin.astype(np.float32) * (0.45 + 0.55 * follicles)
follicle_map = np.clip(follicle_mask_val * 255.0, 0, 255).astype(np.uint8)
Image.fromarray(follicle_map).save(os.path.join(BASE_DIR, "hair_front_follicles.png"))
print("Saved hair_front_follicles.png")

# 9. Clean Decontaminated Background Plates
# Inpaint under hair outer translucent margins
print("Generating clean background plates...")
kernel_f = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
inpaint_f = cv2.dilate((alpha_front_uint8 > 10).astype(np.uint8) * 255, kernel_f)
# Protect face skin and robe from inpainting
inpaint_f[skin_master > 10] = 0
inpaint_f[protect_master > 10] = 0
clean_front_bgr = cv2.inpaint(front_bgr, inpaint_f, 9, cv2.INPAINT_TELEA)
cv2.imwrite(os.path.join(BASE_DIR, "hair_front_clean_bg.jpg"), clean_front_bgr, [cv2.IMWRITE_JPEG_QUALITY, 96])
print("Saved hair_front_clean_bg.jpg")

# 10. Front 3-Zone Map (hair_front_zones.png)
# R = Roots (y=95..320), G = Mid-lengths (y=280..750), B = Ends (y=680..1080)
zones_front = np.zeros((h, w, 3), dtype=np.uint8)
r_weight = np.clip((350.0 - y_coords) / 180.0, 0.0, 1.0)
b_weight = np.clip((y_coords - 650.0) / 250.0, 0.0, 1.0)
g_weight = np.clip(1.0 - np.abs(y_coords - 500.0) / 220.0, 0.0, 1.0)

# Normalize
sum_weights = r_weight + g_weight + b_weight + 1e-6
r_norm = r_weight / sum_weights
g_norm = g_weight / sum_weights
b_norm = b_weight / sum_weights

is_hair_f = alpha_front_uint8 > 0
zones_front[:, :, 0] = np.clip(r_norm * 255.0, 0, 255).astype(np.uint8) * is_hair_f
zones_front[:, :, 1] = np.clip(g_norm * 255.0, 0, 255).astype(np.uint8) * is_hair_f
zones_front[:, :, 2] = np.clip(b_norm * 255.0, 0, 255).astype(np.uint8) * is_hair_f

Image.fromarray(zones_front).save(os.path.join(BASE_DIR, "hair_front_zones.png"))
print("Saved hair_front_zones.png")

# 11. Front Marschner Tangent Flow Field (hair_front_flow.png)
# Tangent vector field follows hair flowing downward and cascading around the neck/chest
flow_front = np.zeros((h, w, 3), dtype=np.uint8)
dx = (x_coords - 448.0) / 300.0
wave_osc = np.sin(y_coords / 45.0) * 0.12
tx_f = np.clip(dx * 0.28 + wave_osc, -0.75, 0.75)
ty_f = np.sqrt(np.maximum(0.04, 1.0 - tx_f**2))
coherence_f = 0.85 + 0.10 * np.clip(1.0 - np.abs(dx), 0.0, 1.0)

flow_front[:, :, 0] = np.clip((tx_f + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
flow_front[:, :, 1] = np.clip(ty_f * 255.0, 0, 255).astype(np.uint8)
flow_front[:, :, 2] = np.clip(coherence_f * 255.0, 0, 255).astype(np.uint8)
Image.fromarray(flow_front).save(os.path.join(BASE_DIR, "hair_front_flow.png"))
print("Saved hair_front_flow.png")

# 12. Front Continuous Grey Strands Fiber Map (hair_front_grey_strands.png)
np.random.seed(101)
base_noise = np.random.uniform(0.0, 255.0, (h, w)).astype(np.float32)
# Anisotropic filter elongated along vertical flow direction:
grey_strands_f = ndimage.gaussian_filter(base_noise, sigma=[4.5, 0.7])
# Normalize to full 0..255 dynamic range
grey_strands_f = np.clip((grey_strands_f - grey_strands_f.mean()) / (grey_strands_f.std() + 1e-6) * 64.0 + 128.0, 0, 255).astype(np.uint8)
Image.fromarray(grey_strands_f).save(os.path.join(BASE_DIR, "hair_front_grey_strands.png"))
print("Saved hair_front_grey_strands.png")

# ==================== BACK VIEW ASSETS ====================
print("\nGenerating Back View Assets...")
r_b, g_b, b_b = back_f[:,:,0], back_f[:,:,1], back_f[:,:,2]
is_bg_or_robe_b = (r_b > 0.76) & (g_b > 0.74) & (b_b > 0.76) & (np.ptp(back_f, axis=2) < 0.055)
is_outer_bg_b = (y_coords < 580) & ((x_coords < 220) | (x_coords > 670)) & is_bg_or_robe_b
is_outer_robe_b = (y_coords >= 580) & ((x_coords < 190) | (x_coords > 700)) & is_bg_or_robe_b
is_bottom_robe_b = (y_coords >= 1130) & is_bg_or_robe_b
non_hair_b = is_outer_bg_b | is_outer_robe_b | is_bottom_robe_b

bg_val_b = np.where(y_coords < 580, 222.0, 235.0)
alpha_back = np.clip((bg_val_b - gray_back) / 140.0, 0.0, 1.0)
alpha_back = np.power(alpha_back, 1.15)
alpha_back[non_hair_b] = 0.0

in_hair_b = (y_coords >= 85) & (y_coords <= 1135) & (x_coords >= 190) & (x_coords <= 705)
alpha_back[~in_hair_b] = 0.0
alpha_back_uint8 = (np.clip(alpha_back, 0.0, 1.0) * 255.0).astype(np.uint8)

Image.fromarray(alpha_back_uint8).save(os.path.join(BASE_DIR, "hair_back_alpha.png"))
print("Saved hair_back_alpha.png")

# Back Clean Plate
kernel_b = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
inpaint_b = cv2.dilate((alpha_back_uint8 > 10).astype(np.uint8) * 255, kernel_b)
clean_back_bgr = cv2.inpaint(back_bgr, inpaint_b, 11, cv2.INPAINT_TELEA)
cv2.imwrite(os.path.join(BASE_DIR, "hair_back_clean_bg.jpg"), clean_back_bgr, [cv2.IMWRITE_JPEG_QUALITY, 96])
print("Saved hair_back_clean_bg.jpg")

# Back 3-Zones
zones_back = np.zeros((h, w, 3), dtype=np.uint8)
r_weight_b = np.clip((380.0 - y_coords) / 200.0, 0.0, 1.0)
b_weight_b = np.clip((y_coords - 750.0) / 250.0, 0.0, 1.0)
g_weight_b = np.clip(1.0 - np.abs(y_coords - 550.0) / 240.0, 0.0, 1.0)
sum_w_b = r_weight_b + g_weight_b + b_weight_b + 1e-6
is_hair_b = alpha_back_uint8 > 0
zones_back[:, :, 0] = np.clip((r_weight_b / sum_w_b) * 255.0, 0, 255).astype(np.uint8) * is_hair_b
zones_back[:, :, 1] = np.clip((g_weight_b / sum_w_b) * 255.0, 0, 255).astype(np.uint8) * is_hair_b
zones_back[:, :, 2] = np.clip((b_weight_b / sum_w_b) * 255.0, 0, 255).astype(np.uint8) * is_hair_b

Image.fromarray(zones_back).save(os.path.join(BASE_DIR, "hair_back_zones.png"))
print("Saved hair_back_zones.png")

# Back Flow
flow_back = np.zeros((h, w, 3), dtype=np.uint8)
dx_b = (x_coords - 448.0) / 280.0
wave_osc_b = np.sin(y_coords / 40.0) * 0.10
tx_b = np.clip(dx_b * 0.22 + wave_osc_b, -0.65, 0.65)
ty_b = np.sqrt(np.maximum(0.04, 1.0 - tx_b**2))
coherence_b = 0.88 + 0.08 * np.clip(1.0 - np.abs(dx_b), 0.0, 1.0)
flow_back[:, :, 0] = np.clip((tx_b + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
flow_back[:, :, 1] = np.clip(ty_b * 255.0, 0, 255).astype(np.uint8)
flow_back[:, :, 2] = np.clip(coherence_b * 255.0, 0, 255).astype(np.uint8)
Image.fromarray(flow_back).save(os.path.join(BASE_DIR, "hair_back_flow.png"))
print("Saved hair_back_flow.png")

# Back Grey Strands
np.random.seed(102)
base_noise_b = np.random.uniform(0.0, 255.0, (h, w)).astype(np.float32)
grey_strands_b = ndimage.gaussian_filter(base_noise_b, sigma=[4.5, 0.7])
grey_strands_b = np.clip((grey_strands_b - grey_strands_b.mean()) / (grey_strands_b.std() + 1e-6) * 64.0 + 128.0, 0, 255).astype(np.uint8)
Image.fromarray(grey_strands_b).save(os.path.join(BASE_DIR, "hair_back_grey_strands.png"))
print("Saved hair_back_grey_strands.png")

# ==================== PROPAGATE TO ARCHETYPES ====================
print("\nPropagating assets to all 4 universal hair archetypes...")
archetypes = ["straight", "wavy", "curly", "coily"]

for arch in archetypes:
    arch_dir = os.path.join(BASE_DIR, "archetypes", arch)
    os.makedirs(arch_dir, exist_ok=True)
    
    # Common shared assets
    for fname in [
        "avatar_front_model.jpg",
        "avatar_back_model.jpg",
        "hair_front_clean_bg.jpg",
        "hair_back_clean_bg.jpg",
        "hair_front_skin.png",
        "hair_front_features_protect.png",
        "hair_front_zones.png",
        "hair_back_zones.png",
        "hair_front_eyebrows.png",
        "hair_front_scalp.png",
        "hair_front_follicles.png",
        "hair_front_grey_strands.png",
        "hair_back_grey_strands.png",
    ]:
        shutil.copyfile(os.path.join(BASE_DIR, fname), os.path.join(arch_dir, fname))
    
    if arch == "straight":
        f_straight = flow_front.copy()
        tx = (flow_front[:, :, 0].astype(np.float32) / 255.0) * 2.0 - 1.0
        tx_str = ndimage.gaussian_filter(tx * 0.35, sigma=[4.0, 2.0])
        ty_str = np.sqrt(np.maximum(0.02, 1.0 - tx_str**2))
        coh_str = np.clip((flow_front[:, :, 2].astype(np.float32) / 255.0) * 1.25 + 0.10, 0.0, 1.0)
        f_straight[:, :, 0] = np.clip((tx_str + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        f_straight[:, :, 1] = np.clip(ty_str * 255.0, 0, 255).astype(np.uint8)
        f_straight[:, :, 2] = np.clip(coh_str * 255.0, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_front_flow.png"), cv2.cvtColor(f_straight, cv2.COLOR_RGB2BGR))
        
        b_straight = flow_back.copy()
        tx_b = (flow_back[:, :, 0].astype(np.float32) / 255.0) * 2.0 - 1.0
        tx_b_str = ndimage.gaussian_filter(tx_b * 0.30, sigma=[4.0, 2.0])
        ty_b_str = np.sqrt(np.maximum(0.02, 1.0 - tx_b_str**2))
        coh_b_str = np.clip((flow_back[:, :, 2].astype(np.float32) / 255.0) * 1.25 + 0.10, 0.0, 1.0)
        b_straight[:, :, 0] = np.clip((tx_b_str + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        b_straight[:, :, 1] = np.clip(ty_b_str * 255.0, 0, 255).astype(np.uint8)
        b_straight[:, :, 2] = np.clip(coh_b_str * 255.0, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_flow.png"), cv2.cvtColor(b_straight, cv2.COLOR_RGB2BGR))
        
        cv2.imwrite(os.path.join(arch_dir, "hair_front_alpha.png"), alpha_front_uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_alpha.png"), alpha_back_uint8)

    elif arch == "wavy":
        cv2.imwrite(os.path.join(arch_dir, "hair_front_flow.png"), cv2.cvtColor(flow_front, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(arch_dir, "hair_back_flow.png"), cv2.cvtColor(flow_back, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(arch_dir, "hair_front_alpha.png"), alpha_front_uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_alpha.png"), alpha_back_uint8)

    elif arch == "curly":
        pitch = 30.0
        helix_phase = 2.0 * np.pi * (y_coords / pitch) + x_coords * 0.035
        f_curly = flow_front.copy()
        tx_c = ((flow_front[:, :, 0].astype(np.float32) / 255.0) * 2.0 - 1.0) * 0.65 + np.sin(helix_phase) * 0.38
        ty_c = np.sqrt(np.maximum(0.04, 1.0 - np.clip(tx_c, -0.95, 0.95)**2))
        coh_c = np.clip((flow_front[:, :, 2].astype(np.float32) / 255.0) * (0.80 + 0.35 * (0.5 + 0.5 * np.cos(helix_phase))), 0.0, 1.0)
        f_curly[:, :, 0] = np.clip((tx_c + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        f_curly[:, :, 1] = np.clip(ty_c * 255.0, 0, 255).astype(np.uint8)
        f_curly[:, :, 2] = np.clip(coh_c * 255.0, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_front_flow.png"), cv2.cvtColor(f_curly, cv2.COLOR_RGB2BGR))
        
        b_curly = flow_back.copy()
        tx_b_c = ((flow_back[:, :, 0].astype(np.float32) / 255.0) * 2.0 - 1.0) * 0.65 + np.sin(helix_phase) * 0.38
        ty_b_c = np.sqrt(np.maximum(0.04, 1.0 - np.clip(tx_b_c, -0.95, 0.95)**2))
        coh_b_c = np.clip((flow_back[:, :, 2].astype(np.float32) / 255.0) * (0.80 + 0.35 * (0.5 + 0.5 * np.cos(helix_phase))), 0.0, 1.0)
        b_curly[:, :, 0] = np.clip((tx_b_c + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        b_curly[:, :, 1] = np.clip(ty_b_c * 255.0, 0, 255).astype(np.uint8)
        b_curly[:, :, 2] = np.clip(coh_b_c * 255.0, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_flow.png"), cv2.cvtColor(b_curly, cv2.COLOR_RGB2BGR))
        
        curly_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        a_f_c = cv2.dilate(alpha_front_uint8, curly_k)
        a_f_c[skin_master > 5] = 0
        a_b_c = cv2.dilate(alpha_back_uint8, curly_k)
        cv2.imwrite(os.path.join(arch_dir, "hair_front_alpha.png"), a_f_c)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_alpha.png"), a_b_c)

    elif arch == "coily":
        pitch_y = 10.0
        pitch_x = 7.5
        phase_coil = 2.0 * np.pi * (y_coords / pitch_y)
        phase_trans = 2.0 * np.pi * (x_coords / pitch_x)
        coil_tx = np.sin(phase_coil) * 0.50 + np.cos(phase_trans) * 0.20
        f_coily = flow_front.copy()
        tx_coily = ((flow_front[:, :, 0].astype(np.float32) / 255.0) * 2.0 - 1.0) * 0.45 + coil_tx
        ty_coily = np.sqrt(np.maximum(0.04, 1.0 - np.clip(tx_coily, -0.95, 0.95)**2))
        coh_coily = np.clip((flow_front[:, :, 2].astype(np.float32) / 255.0) * 0.75 + 0.15 * (np.sin(phase_coil) * np.sin(phase_trans)), 0.10, 0.95)
        f_coily[:, :, 0] = np.clip((tx_coily + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        f_coily[:, :, 1] = np.clip(ty_coily * 255.0, 0, 255).astype(np.uint8)
        f_coily[:, :, 2] = np.clip(coh_coily * 255.0, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_front_flow.png"), cv2.cvtColor(f_coily, cv2.COLOR_RGB2BGR))
        
        b_coily = flow_back.copy()
        tx_b_coily = ((flow_back[:, :, 0].astype(np.float32) / 255.0) * 2.0 - 1.0) * 0.45 + coil_tx
        ty_b_coily = np.sqrt(np.maximum(0.04, 1.0 - np.clip(tx_b_coily, -0.95, 0.95)**2))
        coh_b_coily = np.clip((flow_back[:, :, 2].astype(np.float32) / 255.0) * 0.75 + 0.15 * (np.sin(phase_coil) * np.sin(phase_trans)), 0.10, 0.95)
        b_coily[:, :, 0] = np.clip((tx_b_coily + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        b_coily[:, :, 1] = np.clip(ty_b_coily * 255.0, 0, 255).astype(np.uint8)
        b_coily[:, :, 2] = np.clip(coh_b_coily * 255.0, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_flow.png"), cv2.cvtColor(b_coily, cv2.COLOR_RGB2BGR))
        
        coily_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (8, 8))
        a_f_coil = cv2.dilate(alpha_front_uint8, coily_k)
        a_f_coil[skin_master > 5] = 0
        a_b_coil = cv2.dilate(alpha_back_uint8, coily_k)
        cv2.imwrite(os.path.join(arch_dir, "hair_front_alpha.png"), a_f_coil)
        cv2.imwrite(os.path.join(arch_dir, "hair_back_alpha.png"), a_b_coil)

    print(f"Propagated archetype: {arch.upper()}")

print("\nALL MASTER AVATAR ASSETS GENERATED AND PROPAGATED SUCCESSFULLY!")
