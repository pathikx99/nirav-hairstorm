"""
Unit tests for the UHCR Colour Science module.

Tests:
- CIELAB to CIELCh conversion
- Full CIEDE2000 implementation using published Sharma et al. (2005) reference pairs
- CIELAB validation helpers
- Neutralisation mapping
"""

import math
from decimal import Decimal

import pytest

from backend.app.universal_colour.colour_science import (
    NEUTRALISATION_MAP,
    ciede2000,
    cielab_to_cielch,
    lab_values_complete,
    validate_lab_values,
)
from backend.app.universal_colour.enums import (
    NeutralisationDirectionEnum,
    NeutralisationWarmthEnum,
)


class TestCielabToCielch:
    """Tests for cielab_to_cielch conversion."""

    def test_pure_achromatic(self):
        """Achromatic colour (a*=0, b*=0) has chroma C*=0."""
        l, c, h = cielab_to_cielch(50.0, 0.0, 0.0)
        assert l == 50.0
        assert c == 0.0
        assert h == 0.0

    def test_pure_positive_a(self):
        """Pure red (a* > 0, b* = 0) has hue angle ~ 0 degrees."""
        l, c, h = cielab_to_cielch(50.0, 20.0, 0.0)
        assert l == 50.0
        assert c == pytest.approx(20.0)
        assert h == pytest.approx(0.0)

    def test_pure_positive_b(self):
        """Pure yellow (a* = 0, b* > 0) has hue angle ~ 90 degrees."""
        l, c, h = cielab_to_cielch(70.0, 0.0, 30.0)
        assert l == 70.0
        assert c == pytest.approx(30.0)
        assert h == pytest.approx(90.0)

    def test_pure_negative_a(self):
        """Pure green (a* < 0, b* = 0) has hue angle ~ 180 degrees."""
        l, c, h = cielab_to_cielch(60.0, -25.0, 0.0)
        assert l == 60.0
        assert c == pytest.approx(25.0)
        assert h == pytest.approx(180.0)

    def test_pure_negative_b(self):
        """Pure blue (a* = 0, b* < 0) has hue angle ~ 270 degrees."""
        l, c, h = cielab_to_cielch(40.0, 0.0, -15.0)
        assert l == 40.0
        assert c == pytest.approx(15.0)
        assert h == pytest.approx(270.0)

    def test_arbitrary_quadrant_values(self):
        """Test points in each of the four quadrants."""
        # Q1: (+, +)
        _, c1, h1 = cielab_to_cielch(50.0, 10.0, 10.0)
        assert c1 == pytest.approx(math.sqrt(200))
        assert h1 == pytest.approx(45.0)

        # Q2: (-, +)
        _, c2, h2 = cielab_to_cielch(50.0, -10.0, 10.0)
        assert c2 == pytest.approx(math.sqrt(200))
        assert h2 == pytest.approx(135.0)

        # Q3: (-, -)
        _, c3, h3 = cielab_to_cielch(50.0, -10.0, -10.0)
        assert c3 == pytest.approx(math.sqrt(200))
        assert h3 == pytest.approx(225.0)

        # Q4: (+, -)
        _, c4, h4 = cielab_to_cielch(50.0, 10.0, -10.0)
        assert c4 == pytest.approx(math.sqrt(200))
        assert h4 == pytest.approx(315.0)


class TestCiede2000:
    """
    Tests for ciede2000 function.
    Uses reference pairs from Sharma et al. (2005) supplementary test data.
    """

    @pytest.mark.parametrize(
        "l1, a1, b1, l2, a2, b2, expected",
        [
            # Identity: colour compared to itself must have ΔE00 = 0
            (50.0, 2.6772, -79.7751, 50.0, 2.6772, -79.7751, 0.0),
            (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
            (100.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0),
            # Sharma et al. (2005) reference pairs
            (50.0, 2.6772, -79.7751, 50.0, 0.0, -82.7485, 2.0425),
            (50.0, 3.1571, -77.2803, 50.0, 0.0, -82.7485, 2.8615),
            (50.0, 2.8361, -74.0200, 50.0, 0.0, -82.7485, 3.4412),
            (50.0, -1.3802, -84.2814, 50.0, 0.0, -82.7485, 1.0000),
            (50.0, -1.1848, -84.8006, 50.0, 0.0, -82.7485, 1.0000),
            (50.0, -0.9009, -85.5211, 50.0, 0.0, -82.7485, 1.0000),
            (50.0, 0.0, 0.0, 50.0, -1.0, 2.0, 2.3669),
            (50.0, -1.0, 2.0, 50.0, 0.0, 0.0, 2.3669),
            (50.0, 2.49, -0.001, 50.0, -2.49, 0.0009, 7.1792),
            (50.0, 2.49, -0.001, 50.0, -2.49, 0.001, 7.1792),
            (50.0, 2.5, 0.0, 50.0, 0.0, -2.5, 4.3065),
            (50.0, 2.5, 0.0, 50.0, 0.0, 2.5, 4.3372),
            (60.0, 14.0, 18.0, 60.0, 14.0, 18.0, 0.0000),
            (30.0, 25.0, -10.0, 32.0, 22.0, -8.0, 2.3713),
        ],
    )
    def test_sharma_reference_pairs(self, l1, a1, b1, l2, a2, b2, expected):
        """Validate against official Sharma et al. (2005) published reference dataset."""
        delta_e = ciede2000(l1, a1, b1, l2, a2, b2)
        assert delta_e == pytest.approx(expected, abs=0.001)

    def test_symmetry(self):
        """ΔE₀₀(c1, c2) must equal ΔE₀₀(c2, c1)."""
        d1 = ciede2000(50.0, 2.6772, -79.7751, 50.0, 0.0, -82.7485)
        d2 = ciede2000(50.0, 0.0, -82.7485, 50.0, 2.6772, -79.7751)
        assert d1 == pytest.approx(d2, abs=1e-9)


class TestLabValidation:
    """Tests for validate_lab_values and lab_values_complete."""

    def test_valid_lab_values(self):
        assert validate_lab_values(50.0, 0.0, 0.0) is True
        assert validate_lab_values(0.0, -128.0, -128.0) is True
        assert validate_lab_values(100.0, 127.0, 127.0) is True
        assert validate_lab_values(Decimal("55.5"), Decimal("12.3"), Decimal("-4.2")) is True

    def test_invalid_lightness(self):
        assert validate_lab_values(-0.1, 0.0, 0.0) is False
        assert validate_lab_values(100.1, 0.0, 0.0) is False

    def test_invalid_chromatic_axes(self):
        assert validate_lab_values(50.0, -128.1, 0.0) is False
        assert validate_lab_values(50.0, 127.1, 0.0) is False
        assert validate_lab_values(50.0, 0.0, -128.1) is False
        assert validate_lab_values(50.0, 0.0, 127.1) is False

    def test_lab_values_complete(self):
        # All present
        assert lab_values_complete(50.0, 10.0, 20.0) is True
        # All None
        assert lab_values_complete(None, None, None) is True
        # Incomplete / partial
        assert lab_values_complete(50.0, None, 20.0) is False
        assert lab_values_complete(None, 10.0, 20.0) is False
        assert lab_values_complete(50.0, 10.0, None) is False
        assert lab_values_complete(50.0, None, None) is False


class TestNeutralisationMap:
    """Tests for the neutralisation taxonomy map."""

    def test_all_warmth_levels_mapped(self):
        for warmth in NeutralisationWarmthEnum:
            assert warmth in NEUTRALISATION_MAP
            assert isinstance(NEUTRALISATION_MAP[warmth], NeutralisationDirectionEnum)

    def test_specific_neutralisation_relationships(self):
        assert (
            NEUTRALISATION_MAP[NeutralisationWarmthEnum.RED] == NeutralisationDirectionEnum.GREEN
        )
        assert (
            NEUTRALISATION_MAP[NeutralisationWarmthEnum.RED_ORANGE]
            == NeutralisationDirectionEnum.GREEN_BLUE
        )
        assert (
            NEUTRALISATION_MAP[NeutralisationWarmthEnum.ORANGE] == NeutralisationDirectionEnum.BLUE
        )
        assert (
            NEUTRALISATION_MAP[NeutralisationWarmthEnum.ORANGE_YELLOW]
            == NeutralisationDirectionEnum.BLUE_VIOLET
        )
        assert (
            NEUTRALISATION_MAP[NeutralisationWarmthEnum.YELLOW]
            == NeutralisationDirectionEnum.VIOLET
        )
        assert (
            NEUTRALISATION_MAP[NeutralisationWarmthEnum.PALE_YELLOW]
            == NeutralisationDirectionEnum.PALE_VIOLET
        )
