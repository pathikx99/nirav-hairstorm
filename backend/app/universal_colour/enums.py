"""
UHCR v1.0 — Universal Hair Colour Representation Enumerations.

All enumerations defined by the UHCR specification for classifying hair colour
attributes, measurement status, and assessment provenance.
"""

from enum import Enum, IntEnum


class UniversalLevel(IntEnum):
    """
    The International Colour Chart (ICC) universal depth levels.

    Levels 1–10 represent the lightness/darkness of hair from black (1) to
    the lightest possible blonde (10). These correspond directly to the
    industry-standard numbering system used across virtually all professional
    hair colour manufacturers worldwide.
    """

    BLACK = 1
    DARKEST_BROWN = 2
    DARK_BROWN = 3
    MEDIUM_BROWN = 4
    LIGHT_BROWN = 5
    DARK_BLONDE = 6
    BLONDE = 7
    LIGHT_BLONDE = 8
    VERY_LIGHT_BLONDE = 9
    EXTRA_LIGHT_BLONDE = 10


class ToneFamilyEnum(str, Enum):
    """
    Primary and secondary tone families as defined by the UHCR specification.

    Tone families describe the chromatic character (hue) of a hair colour
    independent of its depth level. The MIXED value is used when a shade
    contains a deliberate blend of tone families that cannot be assigned to
    a single category. UNKNOWN is used when tone information is absent.
    """

    NATURAL = "NATURAL"
    ASH = "ASH"
    BLUE = "BLUE"
    GREEN = "GREEN"
    VIOLET = "VIOLET"
    PEARL = "PEARL"
    BEIGE = "BEIGE"
    GOLD = "GOLD"
    YELLOW = "YELLOW"
    COPPER = "COPPER"
    ORANGE = "ORANGE"
    RED = "RED"
    MAHOGANY = "MAHOGANY"
    PINK = "PINK"
    MIXED = "MIXED"
    UNKNOWN = "UNKNOWN"


class ToneIntensityEnum(str, Enum):
    """
    Intensity modifier for the tone family.

    Describes how concentrated or vivid the chromatic character is within
    the assigned tone family. UNKNOWN is used when intensity data is not
    available.
    """

    UNKNOWN = "UNKNOWN"
    SOFT = "SOFT"
    STANDARD = "STANDARD"
    INTENSE = "INTENSE"
    EXTRA_INTENSE = "EXTRA_INTENSE"


class ColourFamilyEnum(str, Enum):
    """
    Product category classification for hair colour products.

    Categorises the colour product into its functional group, which affects
    formulation rules, mixing ratios, and expected lift/deposit behaviour.
    """

    NATURAL = "NATURAL"
    FASHION = "FASHION"
    SPECIAL_BLONDE = "SPECIAL_BLONDE"
    HIGH_LIFT = "HIGH_LIFT"
    PASTEL = "PASTEL"
    TONER = "TONER"
    GLOSS = "GLOSS"
    CORRECTOR = "CORRECTOR"
    SPECIAL_MIX = "SPECIAL_MIX"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class MeasurementStatusEnum(str, Enum):
    """
    Status of a CIELAB colour measurement.

    Indicates whether the measurement data is valid and usable for
    colour-critical calculations such as CIEDE2000 distance.
    """

    VALID = "VALID"
    PROVISIONAL = "PROVISIONAL"
    INVALID = "INVALID"
    NOT_AVAILABLE = "NOT_AVAILABLE"


class ClassificationStatusEnum(str, Enum):
    """
    How the UHCR classification was determined.

    Tracks the provenance of the level/tone assignment to distinguish
    algorithmic predictions from human or instrument confirmations.
    """

    PREDICTED = "PREDICTED"
    COLOURIST_CONFIRMED = "COLOURIST_CONFIRMED"
    INSTRUMENT_MEASURED = "INSTRUMENT_MEASURED"


class HairRegionEnum(str, Enum):
    """
    Physical regions of the hair strand for assessment purposes.

    Each region may have different existing colour, porosity, and condition
    characteristics that affect formulation decisions.
    """

    ROOTS = "ROOTS"
    MID_LENGTHS = "MID_LENGTHS"
    ENDS = "ENDS"
    OTHER = "OTHER"


class AssessmentProvenanceEnum(str, Enum):
    """
    How a hair region assessment was obtained.

    Similar to ClassificationStatusEnum but specific to individual
    region-level assessments during a hair analysis session.
    """

    PREDICTED = "PREDICTED"
    COLOURIST_CONFIRMED = "COLOURIST_CONFIRMED"
    INSTRUMENT_MEASURED = "INSTRUMENT_MEASURED"


class NeutralisationWarmthEnum(str, Enum):
    """
    Warm underlying pigments revealed during the lightening process.

    When natural or artificial hair colour is lifted, warm pigments are
    exposed in a predictable sequence. Each warmth level has a specific
    complementary neutralisation direction.
    """

    RED = "RED"
    RED_ORANGE = "RED_ORANGE"
    ORANGE = "ORANGE"
    ORANGE_YELLOW = "ORANGE_YELLOW"
    YELLOW = "YELLOW"
    PALE_YELLOW = "PALE_YELLOW"


class NeutralisationDirectionEnum(str, Enum):
    """
    Cool pigment directions used to neutralise exposed warmth.

    Each direction is the colour-wheel complement of the corresponding
    warmth pigment, used by colourists to cancel unwanted tones during
    formulation.
    """

    GREEN = "GREEN"
    GREEN_BLUE = "GREEN_BLUE"
    BLUE = "BLUE"
    BLUE_VIOLET = "BLUE_VIOLET"
    VIOLET = "VIOLET"
    PALE_VIOLET = "PALE_VIOLET"
