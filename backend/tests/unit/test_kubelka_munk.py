"""Unit tests for the Kubelka-Munk Radiative Transfer Theory module."""

import pytest

from backend.app.universal_colour.kubelka_munk import (
    calculate_spectrum_ks,
    calculate_spectrum_reflectance,
    evaluate_metameric_shift,
    ks_to_reflectance,
    predict_mixture_cielab,
    predict_mixture_reflectance,
    reflectance_to_ks,
    spectral_to_xyz,
    xyz_to_cielab,
)


def test_reflectance_to_ks_and_inverse():
    """Verify reciprocal relation: ks_to_reflectance(reflectance_to_ks(r)) == r."""
    test_reflectances = [0.05, 0.15, 0.35, 0.50, 0.70, 0.90]
    for r in test_reflectances:
        ks = reflectance_to_ks(r)
        assert ks > 0.0
        r_rec = ks_to_reflectance(ks)
        assert r_rec == pytest.approx(r, rel=1e-4)


def test_reflectance_boundary_conditions():
    """Verify theoretical limits: R=1 -> K/S=0, K/S=0 -> R=1."""
    assert ks_to_reflectance(0.0) == 1.0
    ks_high = reflectance_to_ks(0.01)
    assert ks_high > 45.0  # (0.99)^2 / 0.02 = 49.005


def test_spectrum_ks_conversion():
    test_spectrum = [0.2, 0.4, 0.6, 0.8]
    ks_list = calculate_spectrum_ks(test_spectrum)
    assert len(ks_list) == len(test_spectrum)
    r_list = calculate_spectrum_reflectance(ks_list)
    for orig, rec in zip(test_spectrum, r_list, strict=False):
        assert rec == pytest.approx(orig, rel=1e-4)


def test_predict_mixture_darker_than_substrate():
    """Adding dye concentration to substrate must increase absorption (lower reflectance)."""
    r_sub = predict_mixture_reflectance(substrate_level=8, dye_fractions={})
    r_dyed = predict_mixture_reflectance(
        substrate_level=8,
        dye_fractions={"ASH": 0.5, "NATURAL": 0.5},
    )
    assert len(r_dyed) == 38
    # Dyed hair must have lower reflectance across wavelengths where dye absorbs
    for sub, dyed in zip(r_sub, r_dyed, strict=False):
        assert dyed <= sub + 1e-6


def test_spectral_to_xyz_and_cielab():
    """Standard white reflectance must yield L* close to 100 under D65."""
    white_refl = [1.0] * 38
    x, y, z = spectral_to_xyz(white_refl, illuminant="D65")
    assert y == pytest.approx(100.0, rel=1e-2)
    l, a, b = xyz_to_cielab(x, y, z, illuminant="D65")
    assert l == pytest.approx(100.0, abs=0.5)
    assert a == pytest.approx(0.0, abs=0.5)
    assert b == pytest.approx(0.0, abs=0.5)


def test_predict_mixture_cielab():
    """Predicting CIELAB on Level 7 with Gold dye should produce higher b* (yellow/warmth)."""
    l_nat, a_nat, b_nat = predict_mixture_cielab(
        substrate_level=7,
        dye_fractions={"NATURAL": 0.5},
        illuminant="D65",
    )
    l_gold, a_gold, b_gold = predict_mixture_cielab(
        substrate_level=7,
        dye_fractions={"GOLD": 0.8},
        illuminant="D65",
    )
    assert b_gold > b_nat, "Gold dye must increase yellowness (b*)"


def test_evaluate_metameric_shift():
    """Verify illuminant color shift calculation between D65 and Illuminant A."""
    refl = predict_mixture_reflectance(
        substrate_level=6,
        dye_fractions={"COPPER": 0.6, "GOLD": 0.4},
    )
    shift = evaluate_metameric_shift(refl, primary_illuminant="D65", secondary_illuminant="A")
    assert "delta_e00_metamerism" in shift
    assert shift["delta_e00_metamerism"] >= 0.0
