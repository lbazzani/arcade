// Track data for Baz Kart
// Defines track segments, decorations, and item boxes

export interface Decoration {
  type: 'tree' | 'rock' | 'barrier' | 'sign' | 'banner' | 'palm';
  side: 'left' | 'right' | 'both';
  offset: number; // Distance from road edge
}

export interface ItemBoxPosition {
  roadPosition: number; // -1 to 1 across road width
  active: boolean;
  respawnTimer: number;
}

export interface TrackSegment {
  curve: number;        // -1 to 1 (negative = left, positive = right)
  hill: number;         // -1 to 1 (negative = downhill, positive = uphill)
  length: number;       // Segment length in world units
  decorations: Decoration[];
  itemBoxes?: ItemBoxPosition[];
  checkpoint?: boolean; // For lap validation
}

export interface Track {
  name: string;
  segments: TrackSegment[];
  totalLength: number;
  laps: number;
  roadWidth: number;
  startPositions: number[]; // Track positions for each kart at start
}

// Helper to calculate total track length
const calculateTotalLength = (segments: TrackSegment[]): number => {
  return segments.reduce((sum, seg) => sum + seg.length, 0);
};

// Baz Beach Circuit - A fun beach-themed track
const BAZ_BEACH_SEGMENTS: TrackSegment[] = [
  // Start/Finish straight
  {
    curve: 0,
    hill: 0,
    length: 400,
    decorations: [
      { type: 'banner', side: 'both', offset: 2 },
      { type: 'palm', side: 'left', offset: 4 },
      { type: 'palm', side: 'right', offset: 4 },
    ],
    itemBoxes: [
      { roadPosition: -0.5, active: true, respawnTimer: 0 },
      { roadPosition: 0, active: true, respawnTimer: 0 },
      { roadPosition: 0.5, active: true, respawnTimer: 0 },
    ],
  },
  // Gentle right curve into beach section
  {
    curve: 0.4,
    hill: 0,
    length: 250,
    decorations: [
      { type: 'palm', side: 'right', offset: 3 },
      { type: 'rock', side: 'left', offset: 5 },
    ],
  },
  // Sharp left hairpin
  {
    curve: -0.8,
    hill: 0.1,
    length: 180,
    decorations: [
      { type: 'barrier', side: 'left', offset: 0.5 },
      { type: 'barrier', side: 'right', offset: 0.5 },
    ],
    checkpoint: true,
  },
  // Short straight with items
  {
    curve: 0,
    hill: -0.1,
    length: 200,
    decorations: [
      { type: 'palm', side: 'both', offset: 4 },
    ],
    itemBoxes: [
      { roadPosition: -0.3, active: true, respawnTimer: 0 },
      { roadPosition: 0.3, active: true, respawnTimer: 0 },
    ],
  },
  // S-curve section (right then left)
  {
    curve: 0.5,
    hill: 0,
    length: 150,
    decorations: [
      { type: 'rock', side: 'right', offset: 3 },
    ],
  },
  {
    curve: -0.5,
    hill: 0,
    length: 150,
    decorations: [
      { type: 'rock', side: 'left', offset: 3 },
    ],
  },
  // Long sweeping right curve
  {
    curve: 0.3,
    hill: 0,
    length: 300,
    decorations: [
      { type: 'palm', side: 'right', offset: 5 },
      { type: 'palm', side: 'right', offset: 6 },
    ],
    itemBoxes: [
      { roadPosition: 0, active: true, respawnTimer: 0 },
    ],
    checkpoint: true,
  },
  // Downhill into final section
  {
    curve: 0,
    hill: -0.3,
    length: 200,
    decorations: [
      { type: 'sign', side: 'right', offset: 2 },
    ],
  },
  // Final curve back to start
  {
    curve: 0.6,
    hill: 0.2,
    length: 220,
    decorations: [
      { type: 'barrier', side: 'right', offset: 0.5 },
      { type: 'banner', side: 'left', offset: 3 },
    ],
  },
];

export const BAZ_BEACH_TRACK: Track = {
  name: 'Baz Beach Circuit',
  segments: BAZ_BEACH_SEGMENTS,
  totalLength: calculateTotalLength(BAZ_BEACH_SEGMENTS),
  laps: 3,
  roadWidth: 1.0, // Normalized width
  startPositions: [50, 30, 10, -10, -30, -50], // Staggered start grid
};

// Get segment at a given track position
export const getSegmentAtPosition = (track: Track, position: number): { segment: TrackSegment; localPosition: number } => {
  let normalizedPos = position % track.totalLength;
  if (normalizedPos < 0) normalizedPos += track.totalLength;

  let accumulatedLength = 0;
  for (const segment of track.segments) {
    if (normalizedPos < accumulatedLength + segment.length) {
      return {
        segment,
        localPosition: normalizedPos - accumulatedLength,
      };
    }
    accumulatedLength += segment.length;
  }

  // Fallback to last segment
  return {
    segment: track.segments[track.segments.length - 1],
    localPosition: 0,
  };
};

// Get curve value at position (interpolated)
export const getCurveAtPosition = (track: Track, position: number): number => {
  const { segment, localPosition } = getSegmentAtPosition(track, position);

  // Get next segment for interpolation
  const nextPos = position + segment.length - localPosition;
  const { segment: nextSegment } = getSegmentAtPosition(track, nextPos);

  // Interpolate between current and next segment curve
  const t = localPosition / segment.length;
  return segment.curve * (1 - t) + nextSegment.curve * t * 0.5;
};

// Get hill value at position
export const getHillAtPosition = (track: Track, position: number): number => {
  const { segment } = getSegmentAtPosition(track, position);
  return segment.hill;
};

// Check if position is at a checkpoint
export const isCheckpoint = (track: Track, position: number): boolean => {
  const { segment, localPosition } = getSegmentAtPosition(track, position);
  return segment.checkpoint === true && localPosition < 50;
};

// Get all item boxes near a position
export const getItemBoxesNear = (
  track: Track,
  position: number,
  range: number
): { segmentIndex: number; box: ItemBoxPosition; trackPosition: number }[] => {
  const results: { segmentIndex: number; box: ItemBoxPosition; trackPosition: number }[] = [];

  let accumulatedLength = 0;
  track.segments.forEach((segment, segIndex) => {
    if (segment.itemBoxes) {
      const segmentCenter = accumulatedLength + segment.length / 2;
      if (Math.abs(segmentCenter - position) < range) {
        segment.itemBoxes.forEach(box => {
          results.push({
            segmentIndex: segIndex,
            box,
            trackPosition: segmentCenter,
          });
        });
      }
    }
    accumulatedLength += segment.length;
  });

  return results;
};

// Default track for the game
export const DEFAULT_TRACK = BAZ_BEACH_TRACK;
